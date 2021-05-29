import { useState, useEffect } from 'react';
import { getLogs } from '../client';

interface LogHookData {
  logs: string[],
  logsOpen: boolean,
  setLogsOpen: (open: boolean) => void,
  since: number,
  until: number,
  setFilters: (since: number, until: number) => void,
  logsLoading: boolean
}

const DEFAULT_SINCE = -5 * 60;

export const useLogs = (token: string | null, id: string, time_offset: number): LogHookData => {
  const [logs, setLogs] = useState<string[]>([]);
  const [logsOpen, setLogsOpen] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [since, setSince] = useState(DEFAULT_SINCE < time_offset ? time_offset : DEFAULT_SINCE);
  const [until, setUntil] = useState(0);

  const refresh = () => {
    setLogsLoading(true);
    getLogs(token, id, since, until)
      .then(logs => {
        setLogs(logs);
        setLogsLoading(false);
      })
      .catch(() => setLogs(['Error fetching logs']));
  };

  useEffect(() => {
    if (logsOpen) {
      refresh();
      const interval = setInterval(refresh, 1000);
      return () => clearInterval(interval);
    }
  }, [logsOpen, since, until]);

  return {
    logs,

    logsOpen,
    setLogsOpen,

    since,
    until,
    setFilters: (since, until) => { setSince(since); setUntil(until); },

    logsLoading
  };
};