import React, { useEffect } from 'react';
import moment from 'moment';
import {
  Grid,
  Switch,
  FormControlLabel,
  CircularProgress,
  Button,
  Box,
  Dialog,
  DialogContent,
  Typography,
  IconButton,
  Slider,
  makeStyles,
  withStyles
} from '@material-ui/core';
import MuiDialogTitle from '@material-ui/core/DialogTitle';
import MuiDialogActions, { DialogActionsProps } from '@material-ui/core/DialogActions';
import {
  Assignment,
  Delete,
  Pause,
  PlayArrow,
  Stop,
  Close
} from '@material-ui/icons';
import { Chart } from 'react-google-charts';

import {
  useChart,
  useContainers,
  useLogs
} from '../hooks';
import { joinBooleanObjects, shortest } from '../utils';
import {
  Container,
  MetricName,
  MetricState,
  ContainerStateSetter,
  ChartHookData,
  PerformanceStats
} from '../types';

const useStyles = makeStyles(theme => ({
  container: {
    'margin-left': '1%'
  },
  page: {
    'margin-bottom': '2%',
    backgroundColor: theme.palette.background.default
  },
  last: {
    flexGrow: 1
  },
  item: {
    'margin-right': '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  text: {
    'margin-right': '20px'
  },
  graph: {
    'display': 'flex',
    'align-items': 'center'
  },
  filters: {
    'padding-left': '1%'
  },
  subitem: {
    'margin-left': '10%'
  }
}));

interface ItemFilterProps {
  state: MetricState,
  name: string,
  changeState: (key: MetricName, checked: boolean) => void;
  currentData: PerformanceStats
}

const FilterItem = (props: ItemFilterProps) => {
  const styles = useStyles();
  return <Grid item xs={12}>
    <FormControlLabel
      control={<Switch
        checked={Object.values(props.state).reduce((x, y) => x || y)}
        name={props.name}
        onChange={event => {
          Object.keys(props.state).forEach(state => props.changeState(state as MetricName, event.target.checked));
        }}
      />}
      label={props.name}
    />
    {Object.entries(props.state).map(([metricName, value]) =>
      <Grid item xs={12} className={styles.subitem} key={metricName}>
        <FormControlLabel
          control={<Switch
            checked={value}
            name={metricName}
            size={'small'}
            onChange={event => props.changeState(metricName as MetricName, event.target.checked)}
          />}
          label={metricName + ': ' + (props.currentData[metricName as MetricName] * 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%'}
        />
      </Grid>
    )}
  </Grid>;
};

interface PerformanceChartProps {
  chartState: ChartHookData,
  token: string | null
}

const PerformanceChart = (props: PerformanceChartProps) => {
  const styles = useStyles();
  const availableProps: {[key: string]: boolean} = Object
    .values(props.chartState.keyState)
    .reduce((a, b) => joinBooleanObjects(a, Object(b), (p1, p2) => p1 || p2), {});
  return <Grid container>
    <Grid item xs={10} className={styles.graph}>
      <Grid item xs={12}>
        <Chart
          chartType='LineChart'
          data={props.chartState.asGoogleChartData()}
          options={{
            height: 500,
            hAxis: {
              title: 'time'
            },
            vAxis: {
              title: 'Usage %'
            },
            legend: 'bottom',
            interpolateNulls: true,
            backgroundColor: '#eeeeee'
          }}
        />
      </Grid>
    </Grid>
    <Grid item xs={2} className={styles.filters}>
      <h3>Filters</h3>
      {
        Object.entries(availableProps).map(([prop, value]) => <FormControlLabel
          key={prop}
          control={<Switch
            checked={value}
            name={prop}
            onChange={event => {
              for (const container in props.chartState.keyState) {
                props.chartState.changeState(container)(prop as MetricName, event.target.checked);
              }
            }}
          />}
          label={prop}
        />)
      }
      {Object.entries(props.chartState.keyState).map(([id, state]) =>
        Object.keys(props.chartState.data).includes(id) &&
        props.chartState.data[id].stats.length > 0 &&
        <FilterItem
          key={id}
          name={shortest(props.chartState.data[id].aliases)}
          state={state}
          changeState={props.chartState.changeState(id)}
          currentData={props.chartState.data[id].stats[props.chartState.data[id].stats.length - 1]}
        />
      )}
    </Grid>
  </Grid>;
};

const DialogTitle = withStyles((theme) => ({
  closeButton: {
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1)
  }
}))((props: {
  onClose: () => void,
  classes: { closeButton: string },
  children: string | string[]
}) => {
  return <MuiDialogTitle>
    <Typography variant='h6'>{props.children}</Typography>
    <IconButton onClick={props.onClose} className={props.classes.closeButton}>
      <Close />
    </IconButton>
  </MuiDialogTitle>;
});

const DialogActions = (props: DialogActionsProps) => {
  const styles = makeStyles({
    root: {
      margin: '5%'
    }
  })();
  return <MuiDialogActions className={styles.root}>
    {props.children}
  </MuiDialogActions>;
};

interface ContainerProps extends Container {
  token: string | null,
  updating: boolean,
  onChange: (state: ContainerStateSetter) => void,
  onDelete: () => void
}

const ContainerComponent = (props: ContainerProps) => {
  const disabled = props.status === 'processing';
  const time_offset = props.start_time - moment().unix();
  const logs = useLogs(props.token, props.id, time_offset);

  const styles = useStyles();
  const colors = {
    running: 'success.main',
    stopped: 'warning.main',
    error: 'error.main',
    processing: 'text.disabled',
    paused: 'info.main'
  };
  return <Box bgcolor={colors[props.status]} border={1} style={{ display: 'flex', paddingLeft: '2%' }}>
    <Grid item className={styles.text}>
      <h3>{props.name}</h3>
      <p>Id: {props.id}</p>
      <p>Status: <b>{props.status}</b></p>
      <p style={{ marginBottom: 0 }}>Ports:</p>
      {
        Object.keys(props.ports).length === 0
          ? <p style={{ marginLeft: '2%', marginTop: 0 }}>No ports mapped</p>
          : Object.entries(props.ports).map(([contPort, hostPorts]) => <ul style={{ marginTop: 0 }}>
            <li>Container port: {contPort}</li>
            <ul>{hostPorts.map(hostPort => <li>Host port: {hostPort}</li>)}</ul>
          </ul>)
      }
    </Grid>
    <Grid item className={styles.item}>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<Assignment />}
        onClick={() => logs.setLogsOpen(true)}
      >
        Logs
      </Button>
      <Dialog onClose={() => logs.setLogsOpen(false)} open={logs.logsOpen}>
        <DialogTitle onClose={() => logs.setLogsOpen(false)}>Logs: {props.name}</DialogTitle>
        <DialogContent>{logs.logs.map((entry, i) => <p key={i}>{entry}</p>)}</DialogContent>
        <DialogActions>
          <Slider
            value={[logs.since, logs.until]}
            min={time_offset}
            max={0}
            valueLabelDisplay='auto'
            onChangeCommitted={(_, value: number | number[]) => {
              const values = value as [number, number];
              logs.setFilters(...values);
            }}
            getAriaValueText={(value) => {
              if (value === 0) return 'Now';
              return value.toString();
            }}
          />
        </DialogActions>
      </Dialog>
    </Grid>
    <Grid item className={styles.item}>
      {
        props.status === 'paused'
          ? <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            onClick={() => props.onChange('resume')}
            disabled={disabled}
          >
            Resume
          </Button>
          : <Button
            variant="contained"
            color="primary"
            startIcon={<Pause />}
            disabled={disabled || props.status !== 'running'}
            onClick={() => props.onChange('pause')}
          >
            Pause
          </Button>
      }
    </Grid>
    <Grid item className={styles.item}>
      {
        props.status !== 'stopped' && props.status !== 'error'
          ? <Button
            variant="contained"
            color="primary"
            startIcon={<Stop />}
            onClick={() => props.onChange('stop')}
            disabled={disabled}
          >
            Stop
          </Button>
          : <Button
            variant="contained"
            color="primary"
            startIcon={<PlayArrow />}
            disabled={disabled}
            onClick={() => props.onChange('start')}
          >
            Start
          </Button>
      }
    </Grid>
    <Grid item className={styles.item}>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<Delete />}
        onClick={props.onDelete}
        disabled={disabled || props.status !== 'stopped'}
      >
        Delete
      </Button>
    </Grid>
    <Grid item className={styles.item}>
      {props.updating && <CircularProgress />}
    </Grid>
    <Grid item className={styles.last}>

    </Grid>
  </Box>;
};

interface AdminProps {
  token: string | null
}

export const AdminPanel = (props: AdminProps): JSX.Element => {
  const chartState = useChart(props.token);
  const containerState = useContainers(props.token);
  useEffect(() => {
    const refresh = () => {
      chartState.refresh();
      containerState.refresh();
    };
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  const styles = useStyles();
  return <Grid container className={styles.page}>
    <Grid item xs={12}>
      <Grid item xs={12}>
        <h1>Performance</h1>
      </Grid>
      <Grid item xs={12}>
        <PerformanceChart token={props.token} chartState={chartState} />
      </Grid>
    </Grid>
    <Grid item xs={12}>
      <Grid item xs={12}>
        <h1>Managed containers</h1>
      </Grid>
      <Grid item xs={12} className={styles.container}>
        {
          containerState.containerList.length === 0 && <p>No containers available</p>
        }
        {
          containerState.containerList.map(container => <ContainerComponent
            key={container.id}
            {...container}
            token={props.token}
            updating={containerState.containerUpdate.includes(container.id)}
            onChange={containerState.changeContainerState(container.id)}
            onDelete={() => containerState.deleteContainer(container.id)}
          />)
        }
      </Grid>
    </Grid>
  </Grid>;
};