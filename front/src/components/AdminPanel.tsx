import React, { useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography
} from '@material-ui/core';

import {
  useChart,
  useContainers
} from '../hooks';
import { PerformanceChart } from './PerformanceChart';
import { ContainerTable } from './ContainerTable';

interface AdminProps {
  token: string | null;
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

  return <Grid container direction='column' wrap='nowrap' style={{ padding: '1em' }} spacing={2}>
    <Grid item>
      <Paper elevation={2} style={{ padding: '1em', borderRadius: '1em' }}>
        <Grid container>
          <Grid item xs={12}>
            <Typography variant='h4'>Managed containers</Typography>
          </Grid>
          <Grid item xs={12}>
            <ContainerTable />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
    <Grid item>
      <Paper elevation={2} style={{ padding: '1em', borderRadius: '1em' }}>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <Typography variant='h4'>Performance</Typography>
          </Grid>
          <Grid item xs={12}>
            <PerformanceChart token={props.token} chartState={chartState} />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  </Grid>;
};