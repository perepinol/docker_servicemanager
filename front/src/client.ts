import {
  JWTData,
  Container,
  PerformanceData,
  ContainerStateSetter
} from './types';

const LDAP_URL = '/api/ldap';
const PERFORMANCE_URL = '/api/performance';
const MANAGER_URL = '/api/containermanager';

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

export const setContainerState = (
  token: string | null,
  id: string,
  state: ContainerStateSetter
): Promise<Response> => fetch(MANAGER_URL + '/' + id + '/' + state, {
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

export const getLogs = (token: string | null, id: string, since: number, until: number): Promise<string[]> => {
  return fetch(MANAGER_URL + '/' + id + '/logs', {
    headers: token ? {
      'Authorization': 'Bearer ' + token
    } : undefined,
    body: JSON.stringify({ since: since < 0 ? -since : undefined, until: until < 0 ? -until : undefined })
  })
    .then(response => response.json());
};