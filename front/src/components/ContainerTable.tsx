import { Button, CircularProgress, Grid, makeStyles, Table, TableBody, TableCell, TableHead, TableRow, Typography, TypographyProps } from '@material-ui/core';
import { Assignment, Delete, Pause, PlayArrow, Stop } from '@material-ui/icons';
import React, { Fragment, useEffect } from 'react';
import { useContainers, useLogs } from '../hooks';
import { Container, ContainerStateSetter } from '../types';

const T = (props: TypographyProps) => <Typography variant='body1'>{props.children}</Typography>;

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
  buttonCell: {
    '& > div': {
      display: 'flex',
      justifyContent: 'center'
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

  return <TableRow className={classes[container.status]} style={{ margin: '5px 0' }}>
    <TableCell><T>{container.id}</T></TableCell>
    <TableCell><T>{container.name}</T></TableCell>
    <TableCell><T>{container.status}</T></TableCell>
    <TableCell>
      {
        Object.keys(container.ports).length === 0
          ? <T>No ports mapped</T>
          : Object.entries(container.ports).map(([containerPort, hostPorts]) => <ul key={`${container.id}-${containerPort}`}>
            <li>{`Container port: ${containerPort}`}</li>
            <ul>{hostPorts.map(port => <li key={`${container.id}-${containerPort}-${port}`}>{`Host port: ${port}`}</li>)}</ul>
          </ul>)
      }
    </TableCell>
    <TableCell>
      <Grid container spacing={1} style={{ width: 'unset', justifyContent: 'end' }} className={classes.buttonCell}>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Assignment />}
            onClick={() => setLogs(container.id)}
          >
            Logs
          </Button>
        </Grid>
        <Grid item xs={2}>
          {
            container.status === 'paused'
              ? <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                onClick={() => onChange('resume')}
                disabled={disabled}
              >
                Resume
          </Button>
              : <Button
                variant="contained"
                color="primary"
                startIcon={<Pause />}
                disabled={disabled || container.status !== 'running'}
                onClick={() => onChange('pause')}
              >
                Pause
          </Button>
          }
        </Grid>
        <Grid item xs={2}>
          {
            container.status !== 'stopped' && container.status !== 'error'
              ? <Button
                variant="contained"
                color="primary"
                startIcon={<Stop />}
                onClick={() => onChange('stop')}
                disabled={disabled}
              >
                Stop
          </Button>
              : <Button
                variant="contained"
                color="primary"
                startIcon={<PlayArrow />}
                disabled={disabled}
                onClick={() => onChange('start')}
              >
                Start
          </Button>
          }
        </Grid>
        <Grid item xs={2}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Delete />}
            onClick={onDelete}
            disabled={disabled || (container.status !== 'stopped' && container.status !== 'error')}
          >
            Delete
          </Button>
        </Grid>
      </Grid>
    </TableCell>
    <TableCell>{updating && <CircularProgress />}</TableCell>
  </TableRow>;
};

export const ContainerTable = () => {
  const containerState = useContainers(null);
  const time_offset = 0;
  const logs = useLogs(null, time_offset);

  useEffect(() => {
    containerState.refresh();
    const id = setInterval(containerState.refresh, 2000);
    return () => clearInterval(id);
  }, []);

  return <Table>
    <TableHead>
      <TableCell><T>Id</T></TableCell>
      <TableCell><T>Name</T></TableCell>
      <TableCell><T>Status</T></TableCell>
      <TableCell><T>Mapped ports</T></TableCell>
      <TableCell />
      <TableCell />
    </TableHead>
    <TableBody>
      {containerState.containerList.map(container => <ContainerRow
        key={container.id}
        container={container}
        updating={containerState.containerUpdate.includes(container.id)}
        onChange={state => containerState.changeContainerState(container.id, state)}
        onDelete={() => containerState.deleteContainer(container.id)}
        setLogs={logs.setLogs}
      />)}
    </TableBody>
  </Table>;
};

/*
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
*/