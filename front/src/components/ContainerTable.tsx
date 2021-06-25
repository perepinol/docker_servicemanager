import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, makeStyles, Slider, Table, TableBody, TableCell, TableHead, TableRow, Tooltip, Typography, TypographyProps } from '@material-ui/core';
import { Assignment, Delete, Loop, Pause, PlayArrow, Stop, Error } from '@material-ui/icons';
import React, { Fragment, useEffect } from 'react';
import { useContainers, useLogs } from '../hooks';
import { Container, ContainerState, ContainerStateSetter } from '../types';

const T = (props: TypographyProps) => <Typography variant='body1' {...props}>{props.children}</Typography>;

const statusIcons: { [key in ContainerState]: JSX.Element } = {
  'processing': <Tooltip title='Processing'><Loop /></Tooltip>,
  'running': <Tooltip title='Running'><PlayArrow /></Tooltip>,
  'paused': <Tooltip title='Paused'><Pause /></Tooltip>,
  'stopped': <Tooltip title='Stopped'><Stop /></Tooltip>,
  'error': <Tooltip title='Error'><Error /></Tooltip>
};

const useStyles = makeStyles(theme => ({
  running: {
    backgroundColor: theme.palette.success.light
  },
  stopped: {
    backgroundColor: theme.palette.warning.light
  },
  error: {
    backgroundColor: theme.palette.error.light
  },
  processing: {
    backgroundColor: theme.palette.action.disabledBackground
  },
  paused: {
    backgroundColor: theme.palette.info.light
  },
  row: {
    '& > div': {
      padding: '1em',
      display: 'flex',
      alignItems: 'center'
    }
  },
  head: {
    '& p': {
      fontWeight: 'bold'
    }
  }
}));

const ContainerRow = ({
  container,
  updating,
  onChange,
  onDelete,
  setLogs
}: {
  container: Container;
  updating: boolean;
  onChange: (state: ContainerStateSetter) => void,
  onDelete: () => void,
  setLogs: (id: string) => void;
}) => {
  const classes = useStyles();
  const disabled = container.status === 'processing';

  return <Grid container className={`${classes[container.status]} ${classes.row}`}>
    <Grid item md={1} xs={2}>{statusIcons[container.status]}</Grid>
    <Grid item md={4} xs={4}><T noWrap>{container.id}</T></Grid>
    <Grid item md={1} xs={2}><T noWrap>{container.name}</T></Grid>
    <Grid item md={2} xs={4}>
      <Grid container spacing={1}>
        {
          Object.keys(container.ports).length === 0
            ? <Grid item><T>No ports mapped</T></Grid>
            : Object.entries(container.ports).map(([containerPort, hostPorts]) => <Grid item xs={12} key={`${container.id}-${containerPort}`}>
              <T>{`Container: ${containerPort}`}</T>
              <div style={{ padding: '0 0 0 1.5em' }}>{hostPorts.map(port => <T key={`${container.id}-${containerPort}-${port}`}>{`Host: ${port}`}</T>)}</div>
            </Grid>)
        }
      </Grid>
    </Grid>
    <Grid item md={3} xs={10}>
      <Grid container spacing={1} justify='space-between'>
        <Grid item>
          <Tooltip title={'Logs'}><span>
            <IconButton color="secondary" onClick={() => setLogs(container.id)}><Assignment /></IconButton>
          </span></Tooltip>
        </Grid>
        <Grid item>
          {
            container.status === 'paused'
              ? <Tooltip title='Resume'><span>
                <IconButton color="primary" onClick={() => onChange('resume')} disabled={disabled}><PlayArrow /></IconButton>
              </span></Tooltip>
              : <Tooltip title='Pause'><span>
                <IconButton color="primary" disabled={disabled || container.status !== 'running'} onClick={() => onChange('pause')}><Pause /></IconButton>
              </span></Tooltip>
          }
        </Grid>
        <Grid item>
          {
            container.status !== 'stopped' && container.status !== 'error'
              ? <Tooltip title='Stop'><span>
                <IconButton color="primary" onClick={() => onChange('stop')} disabled={disabled}><Stop /></IconButton>
              </span></Tooltip>
              : <Tooltip title='Start'><span>
                <IconButton color="primary" disabled={disabled} onClick={() => onChange('start')}><PlayArrow /></IconButton>
              </span></Tooltip>
          }
        </Grid>
        <Grid item>
          <Tooltip title='Delete'><span>
            <IconButton
              color="secondary"
              onClick={onDelete}
              disabled={disabled || (container.status !== 'stopped' && container.status !== 'error')}
            >
              <Delete />
            </IconButton>
          </span></Tooltip>
        </Grid>
      </Grid>
    </Grid>
    <Grid item xs={2} md={1}>
      {updating && <CircularProgress />}
    </Grid>
  </Grid>;
};

export const ContainerTable = () => {
  const classes = useStyles();
  const containerState = useContainers(null);
  const time_offset = 0;
  const logs = useLogs(null, time_offset);

  useEffect(() => {
    containerState.refresh();
    const id = setInterval(containerState.refresh, 2000);
    return () => clearInterval(id);
  }, []);

  return <Grid container spacing={1}>
    <Grid item xs={12}>
      <Grid container className={`${classes.row} ${classes.head}`}>
        <Grid item md={1} xs={2}></Grid>
        <Grid item md={4} xs={4}><T>Id</T></Grid>
        <Grid item md={1} xs={2}><T>Name</T></Grid>
        <Grid item md={2} xs={4}><T>Mapped ports</T></Grid>
      </Grid>
    </Grid>
    {containerState.containerList.map(container => <Grid item xs={12} key={container.id}>
      <ContainerRow
        container={container}
        updating={containerState.containerUpdate.includes(container.id)}
        onChange={state => containerState.changeContainerState(container.id, state)}
        onDelete={() => containerState.deleteContainer(container.id)}
        setLogs={logs.setContainerId}
      />
    </Grid>)}
    <Dialog onClose={() => logs.setContainerId(undefined)} open={!!logs.containerId} fullWidth maxWidth='xl'>
      <DialogTitle >Logs: {containerState.containerList.find(c => c.id === logs.containerId)?.name}</DialogTitle>
      <DialogContent>{logs.logs.map((entry, i) => <p key={i}>{entry}</p>)}</DialogContent>
      <DialogActions style={{ padding: '1em' }}>
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
  </Grid>;
};