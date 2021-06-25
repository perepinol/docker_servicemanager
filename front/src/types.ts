export type ContainerState = 'processing' | 'running' | 'stopped' | 'error' | 'paused';
export type ContainerStateSetter = 'start' | 'stop' | 'pause' | 'resume';

export type MetricName = 'CPU' | 'memory';
type Metrics = {
  [key in MetricName]: number;
};
export type MetricState = {
  [key in MetricName]: boolean;
};
export type KeyState = { [key: string]: MetricState; };

export interface JWTData {
  exp: number,
  iat: unknown,
  user_name: string,
  full_name: string,
  gid: number;
}

export interface Container {
  id: string,
  id_short: string,
  name: string,
  status: ContainerState,
  start_time: number,
  ports: { [key: string]: string[]; };
}

export interface PerformanceStats extends Metrics {
  timestamp: string;
}

export interface PerformanceContainer {
  aliases: string[],
  stats: PerformanceStats[];
}

export type PerformanceData = { [key: string]: PerformanceContainer; };

export type GoogleChartsData = (({ type: string, label: string; } | string)[] | (number | number[] | null)[])[];

export interface ChartHookData {
  data: PerformanceData,
  keyState: KeyState,
  setKeyState: (keyState: KeyState) => void,

  refresh: () => void,
  asGoogleChartData: () => GoogleChartsData,
  changeState: (container: string) => (key: MetricName, newState: boolean) => void;
}