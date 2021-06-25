import { useState, useEffect } from 'react';
import moment from 'moment';

import { getStats } from '../client';
import { shortest } from "../utils";
import {
  PerformanceData,
  MetricName,
  ChartHookData,
  KeyState,
  GoogleChartsData,
  ApexChartsData
} from '../types';

const fillArray = <T>(arr: T[] = [], fill: T, l: number): T[] => {
  return arr.concat(Array.from(Array(l - arr.length).keys()).map(() => fill));
};

const compareLists = (list1: number[], list2: number[]): number => {
  let i = 0;
  while (i < list1.length && i < list2.length) {
    if (list1[i] !== list2[i]) {
      return list2[i] - list1[i];
    }
    i += 1;
  }
  return list2.length - list1.length;
};

export const useChart = (token: string | null): ChartHookData => {
  const [data, setData] = useState<PerformanceData>({});
  const [keyState, setKeyState] = useState<KeyState>({});

  const updateKeyState = () => {
    const newKeyState = { ...keyState };
    Object.keys(data).filter(id => !Object.keys(keyState).includes(id))
      .forEach(id => {
        newKeyState[id] = { CPU: true, memory: true };
      });
    setKeyState(newKeyState);
  };

  const changeState = (container: string) => (key: MetricName, newState: boolean) => setKeyState(prev => ({
    ...prev,
    [container]: {
      ...prev[container],
      [key]: newState
    }
  }));

  const refresh = () => getStats(token)
    .then(stats => {
      setData(stats);
    })
    .catch(err => {
      console.log(err);
    });

  const asGoogleChartData = (): GoogleChartsData => {
    if (Object.keys(data).length === 0 || !Object.values(keyState).some(obj => Object.values(obj).reduce((x, y) => x || y))) {
      return [['time', ''], [0, 0]];
    }

    const format = 'HH:mm:ss';
    const headers: string[] = [];
    const dataObj: { [key: string]: (number | null)[]; } = {};

    // Make a data object with timestamp as keys and the rest of values as should appear in the chart
    Object.entries(data).forEach(([id, item]) => {
      if (!Object.keys(keyState).includes(id)) return;
      const includedKeys = Object.entries(keyState[id]).filter(entry => entry[1]).map(entry => entry[0]) as MetricName[];
      item.stats.forEach(stat => {
        const timestamp = moment(stat.timestamp).format(format);
        dataObj[timestamp] = fillArray(dataObj[timestamp], null, headers.length)
          .concat(includedKeys.map(key => stat[key] * 100));
      });
      headers.push(...includedKeys.map(key => shortest(item.aliases) + ' - ' + key));
    });

    // Fill rows that are not complete
    for (const ts in dataObj) {
      dataObj[ts] = fillArray(dataObj[ts], null, headers.length);
    }

    // Add the timestamps to the list
    const gcdata = Object.entries(dataObj).map(([ts, items]) => {
      const time = moment(ts, format);
      return [[time.hour(), time.minute(), time.second(), 0], ...items];
    });

    const headerRow = [{ type: 'timeofday', label: 'time' }, ...headers];
    return [headerRow, ...gcdata.sort((dp1, dp2) => compareLists(dp1[0] as number[], dp2[0] as number[]))];
  };

  const asApexChartsData = (): ApexChartsData => Object.entries(data)
    .map(([id, container]) => {
      if (!Object.keys(keyState).includes(id)) return [];
      const includedKeys = Object.entries(keyState[id]).filter(entry => entry[1]).map(entry => entry[0]) as MetricName[];
      return includedKeys.map(key => ({
        name: shortest(container.aliases) + ' - ' + key,
        data: container.stats.map(stat => ({
          x: moment(stat.timestamp).unix() * 1000,
          y: stat[key] * 100
        }))
      }));
    })
    .reduce((accum, curr) => [...accum, ...curr], [] as ApexChartsData);

  useEffect(updateKeyState, [data]);

  return {
    data,
    keyState,
    setKeyState,

    refresh,
    asGoogleChartData,
    asApexChartsData,
    changeState
  };
};