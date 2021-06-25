import React from 'react';
import {
  Grid,
  Paper,
  Typography
} from '@material-ui/core';

import { PerformanceChart } from './PerformanceChart';
import { ContainerTable } from './ContainerTable';

interface AdminProps {
  token: string | null;
}

export const AdminPanel = (props: AdminProps): JSX.Element => {
  return <Grid container direction='column' wrap='nowrap' style={{ padding: '1em' }} spacing={2}>
    <Grid item>
      <Paper elevation={2} style={{ padding: '1em', borderRadius: '1em' }}>
        <Grid container>
          <Grid item xs={12}>
            <Typography variant='h4'>Containers</Typography>
            <Typography variant='subtitle1'>To manage a container, add to its labels 'managed=true'.</Typography>
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
            <PerformanceChart token={props.token} />
          </Grid>
        </Grid>
      </Paper>
    </Grid>
  </Grid>;
};