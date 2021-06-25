import moment from 'moment';
import { Moment } from 'moment';
import { useState, useEffect } from 'react';
import { getLogs } from '../client';

interface LogHookData {
  logs: string[],
  containerId?: string,
  setContainerId: (id?: string) => void,
  since?: Moment,
  until?: Moment,
  setFilters: (obj: { since?: Moment, until?: Moment; }) => void,
  logsLoading: boolean;
}

export const useLogs = (token: string | null): LogHookData => {
  const [logs, setLogs] = useState<string[]>([]);
  const [containerId, setContainerId] = useState<string>();
  const [logsLoading, setLogsLoading] = useState(false);
  const [since, setSince] = useState<Moment | undefined>(moment().subtract(1, 'h'));
  const [until, setUntil] = useState<Moment>();

  const refresh = () => {
    if (!containerId) return;
    setLogsLoading(true);
    getLogs(token, containerId, since, until)
      .then(logs => {
        setLogs(logs);
        setLogsLoading(false);
      })
      .catch(e => setLogs(['Error fetching logs: ' + e]));
  };

  useEffect(() => {
    if (containerId) {
      refresh();
      const interval = setInterval(refresh, 5000);
      return () => clearInterval(interval);
    }
  }, [containerId, since, until]);

  const setFilters = ({ since: newSince, until: newUntil }: { since?: Moment, until?: Moment; }) => {
    if (newUntil) setUntil(newUntil.isBefore(moment()) ? newUntil : moment());
    if (newSince) setSince(newSince.isBefore(newUntil ?? until) ? newSince : (newUntil ?? until));
  };

  return {
    logs,

    containerId,
    setContainerId,

    since,
    until,
    setFilters,

    logsLoading
  };
};