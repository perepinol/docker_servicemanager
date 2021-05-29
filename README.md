# servicemanager

A simple Falcon + React tool for container management.

## Basics

It consists of a [Falcon](https://falcon.readthedocs.io/en/stable/index.html) API that provides information on available containers and their status.

Data is extracted through the host's Docker daemon, which is mounted into this container. The same method is used for management capabilities.
Mount the volume to `/var/run/docker.sock`.

To be able to manage a service with the *servicemanager*, just run the container with label "managed=true".

## cAdvisor integration

*servicemanager* can use data from cAdvisor to plot CPU and memory performance graphs in the frontend. To enable,
set the variable `CADVISOR_URL` to an instance of [google/cadvisor](https://github.com/google/cadvisor).

Note that when cAdvisor is disabled, frontend will still send performance requests to backend.

## Authentication

Optionally, this service can be secured with JSON Web Tokens (JWT).
Generation and validation can be handled with [perepinol/ldap-jwt](https://github.com/perepinol/ldap-jwt), or other
services that provide JWT validation (not tested).

If `LDAPJWT_URL` is set, authentication will be enabled. In that case, `ADMIN_GID` can be used to
restrict access to a certain group.

## Environment variables

| Variable | Type | Example | Description |
| -------- | ---- | ------- | ----------- |
| `CADVISOR_URL` | string (URL) | http://cadvisor/ | URL of a cAdvisor instance. If present, enables cAdvisor performance display. |
| `LDAPJWT_URL` | string (URL) | http://ldap-jwt:8080 | URL of a JWT generation and validation service. If present, enables JWT authentication. |
| `ADMIN_GUID` (optional) | int | 10000 | If present, restricts access to only users of the group with given ID. |