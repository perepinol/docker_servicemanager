import moment, { Moment } from 'moment';
import {
  JWTData,
  Container,
  PerformanceData,
  ContainerStateSetter
} from './types';

// These are relative to properly work with <base> in the HTML
const LDAP_URL = 'api/ldap';
const PERFORMANCE_URL = 'api/performance';
const MANAGER_URL = 'api/containers';

export const login = (username: string, password: string): Promise<string> => fetch(LDAP_URL + '/authenticate', {
  method: 'POST',
  body: JSON.stringify({ username, password })
})
  .then(response => response.json())
  .then(json => json.token)
  .catch(() => '');

export const decodeToken = (token: string): Promise<JWTData> => fetch(LDAP_URL + '/verify', {
  method: 'POST',
  body: JSON.stringify({
    token
  })
})
  .then(response => response.json());

export const getStats = (token: string | null): Promise<PerformanceData> => fetch(PERFORMANCE_URL, {
  headers: token ? {
    'Authorization': 'Bearer ' + token
  } : undefined
})
  .then(response => response.json());

export const getContainers = (token: string | null): Promise<Container[]> => fetch(MANAGER_URL, {
  headers: token ? {
    'Authorization': 'Bearer ' + token
  } : undefined
})
  .then(response => response.json());

/*export const getStats = (): Promise<PerformanceData> => Promise.resolve({
  'name': {
    aliases: ['nameblabla'],
    stats: [{
      timestamp: '2021-05-29T16:06:59',
      CPU: 1,
      memory: 0.5
    }]
  },
  'name2': {
    aliases: ['nameblabla2'],
    stats: [{
      timestamp: '2021-05-29T16:06:59',
      CPU: 0.8,
      memory: 0.6
    }]
  }
});

export const getContainers = (): Promise<Container[]> => Promise.resolve([{
  id: '1',
  id_short: '1',
  name: 'test',
  status: 'processing',
  start_time: 10,
  ports: { '1': ['1', '3'], '2': ['2'] }
}, {
  id: '2',
  id_short: '2',
  name: 'test',
  status: 'running',
  start_time: 10,
  ports: {}
}, {
  id: '3',
  id_short: '3',
  name: 'test',
  status: 'stopped',
  start_time: 10,
  ports: {}
}, {
  id: '4',
  id_short: '4',
  name: 'test',
  status: 'error',
  start_time: 10,
  ports: {}
}, {
  id: '5',
  id_short: '5',
  name: 'test',
  status: 'paused',
  start_time: 10,
  ports: {}
}]);*/

export const setContainerState = (
  token: string | null,
  id: string,
  state: ContainerStateSetter
): Promise<Response> => fetch(MANAGER_URL + `/${id}/${state}`, {
  method: 'POST',
  headers: token ? {
    'Authorization': 'Bearer ' + token
  } : undefined
});

export const deleteCont = (token: string | null, id: string): Promise<Response> => fetch(MANAGER_URL + '/' + id, {
  headers: token ? {
    'Authorization': 'Bearer ' + token
  } : undefined,
  method: 'DELETE'
});

export const getLogs = (token: string | null, id: string, since?: Moment, until?: Moment): Promise<string[]> => {
  let filters = '';
  if (since !== undefined) {
    filters += `since=${moment().diff(since, 's')}`;
  }
  if (until !== undefined) {
    filters += `${filters ? '&' : ''}until=${moment().diff(until, 's')}`;
  }
  return fetch(MANAGER_URL + `/${id}/logs?${filters}`, {
    headers: token ? {
      'Authorization': 'Bearer ' + token
    } : undefined,
  })
    .then(response => response.json());
};