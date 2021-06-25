import json
import os
from calendar import timegm
from datetime import datetime, timedelta

import falcon
from docker.errors import NotFound, APIError
from falcon_cors import CORS
from requests import get, post
from requests.exceptions import ConnectionError
import docker

LDAP_URL = os.getenv('LDAPJWT_URL')
LDAP_URL = LDAP_URL.rstrip('/') if LDAP_URL else None
CADVISOR_URL = os.getenv('CADVISOR_URL')
CADVISOR_URL = CADVISOR_URL.rstrip('/') if CADVISOR_URL else None
ADMIN_GID = os.getenv('ADMIN_GID')


def nanosecond_delta(start, end):
    def nanoseconds(ts):
        whole, decimal = ts.split(".")
        decimal = decimal[:-1]  # Remove final Z
        seconds = timegm(
            datetime.strptime(whole, "%Y-%m-%dT%H:%M:%S").timetuple()
        ) + float("0." + decimal)
        return seconds * 10 ** 9

    return nanoseconds(end) - nanoseconds(start)


class Performance(object):

    @staticmethod
    def generate_error(errorlist):
        return json.dumps({
            'errors': errorlist
        })

    @staticmethod
    def parse_cadvisor(j):
        result = {}
        for key, value in j.items():
            stats = value['stats']
            result[key] = {
                'aliases': [alias for alias in value['aliases'] if key not in alias],
                'stats': [{
                    'timestamp': stats[i]['timestamp'],
                    'CPU':
                        (stats[i]['cpu']['usage']['total'] - stats[i - 1]['cpu']['usage']['total']) /
                        nanosecond_delta(stats[i - 1]['timestamp'], stats[i]['timestamp']) /
                        len(stats[i]['cpu']['usage']['per_cpu_usage']),
                    'Memory': stats[i]['memory']['usage'] / value['spec']['memory']['limit']
                } for i in range(1, len(value['stats']))]
            }
        return result

    def on_get(self, req, resp):
        if not CADVISOR_URL:
            resp.body = json.dumps([])
            return
        res = get(CADVISOR_URL + '/api/v1.3/docker')
        if res.status_code != 200:
            resp.status = falcon.HTTP_502
            resp.body = Performance.generate_error(['Could not get metrics from cAdvisor'])

        resp.body = json.dumps(Performance.parse_cadvisor(res.json()))


class ContainerResource(object):
    _docker = docker.from_env()

    def on_get(self, req, resp):
        resp.media = ContainerResource.as_json()

    def on_get_logs(self, req, resp, cont_id):
        container = ContainerResource.get_or_raise(cont_id)
        since_param = req.get_param_as_int('since', min_value=0)
        until_param = req.get_param_as_int('until', min_value=0)
        since = datetime.now() - timedelta(seconds=since_param) if since_param else None
        until = datetime.now() - timedelta(seconds=until_param) if until_param else None
        resp.media = container.logs(timestamps=True, since=since, until=until).decode('utf-8').strip().split('\n')

    def on_post_status(self, req, resp, cont_id, command):
        container = ContainerResource.get_or_raise(cont_id)
        try:
            if command == 'start':
                container.start()
            elif command == 'stop':
                container.stop()
            elif command == 'pause':
                container.pause()
            elif command == 'resume':
                container.unpause()
            else:
                raise falcon.HTTPNotFound()
        except APIError as e:
            raise falcon.HTTPInternalServerError('Error querying Docker daemon', e.__str__())

    def on_delete_cont(self, req, resp, cont_id):
        container = ContainerResource.get_or_raise(cont_id)
        if ContainerResource.get_status(container) not in ['stopped', 'error']:
            raise falcon.HTTPPreconditionFailed('Container is not stopped')
        try:
            container.remove()
        except APIError as e:
            raise falcon.HTTPInternalServerError('Error querying Docker daemon', e.__str__())

    @staticmethod
    def get_or_raise(name):
        try:
            container = ContainerResource._docker.containers.get(name)
        except NotFound:
            raise falcon.HTTPNotFound()
        labels = container.attrs['Config']['Labels']
        if 'managed' in labels and labels['managed']:
            return container
        raise falcon.HTTPNotFound()

    @staticmethod
    def get_status(container):
        if container.status in ['restarting', 'removing']:
            return 'processing'
        if container.status == 'created' or \
                (container.status == 'exited' and container.attrs['State']['ExitCode'] == 0):
            return 'stopped'
        if container.status in ['dead', 'exited']:
            return 'error'
        else:
            return container.status

    @staticmethod
    def as_json():
        def parse_ports(port_obj):
            result = {}
            for containerPort, hostPortList in port_obj.items():
                if hostPortList:
                    result[containerPort] = [port['HostPort'] for port in hostPortList]
            return result

        return [{
            'id': container.id,
            'id_short': container.short_id,
            'name': container.name,
            'status': ContainerResource.get_status(container),
            'ports': parse_ports(container.attrs['NetworkSettings']['Ports']),
            'start_time': int(datetime.fromisoformat(container.attrs['Created'][:19]).timestamp())
        } for container in ContainerResource._docker.containers.list(all=True, filters={'label': 'managed=true'})]


class JWTMiddleware(object):
    def process_request(self, req, resp):
        if req.method == 'OPTIONS':
            return

        if not req.auth or not req.auth.startswith('Bearer ') or len(req.auth) < 8:
            raise falcon.HTTPMissingHeader('Authorization')

        token = req.auth[7:]
        try:
            res = post(LDAP_URL + '/verify', json={'token': token})
        except ConnectionError:
            raise falcon.HTTPInternalServerError('JWT verification request failed')

        if res.status_code != 200:
            raise falcon.HTTPUnauthorized('Validation failed with %d' % res.status_code, res.text)

        user = res.json()
        if ADMIN_GID and user['gid'] != ADMIN_GID:
            raise falcon.HTTPUnauthorized('User is not administrator')

        req.context = user


api = falcon.API(middleware=[
    CORS(
        allow_all_origins=True,
        allow_methods_list=['GET', 'OPTIONS', 'POST'],
        allow_headers_list=['authorization', 'content-type']
    ).middleware
    ] + (JWTMiddleware() if LDAP_URL else [])
)
containerResource = ContainerResource()
api.add_route('/performance', Performance())
api.add_route('/containers/{cont_id}/{command}/', containerResource, suffix='status')  # POST status
api.add_route('/containers/{cont_id}/logs', containerResource, suffix='logs')  # GET logs
api.add_route('/containers/{cont_id}/', containerResource, suffix='cont')  # DELETE
api.add_route('/containers', containerResource)  # GET
