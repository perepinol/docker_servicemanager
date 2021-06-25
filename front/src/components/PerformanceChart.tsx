import React from 'react';
import { Card, CardContent, CardHeader, FormControlLabel, Grid, makeStyles, Switch, Typography, useTheme } from '@material-ui/core';
import { Chart } from 'react-google-charts';

import { ChartHookData, MetricName, MetricState, PerformanceStats } from '../types';
import { joinBooleanObjects, shortest } from '../utils';

const useStyles = makeStyles(theme => ({
  card: {
    backgroundColor: theme.palette.background.default,
    padding: '0.5em 0.5em'
  }
}));

const uppercaseFirst = (text: string) => text.slice(0, 1).toUpperCase() + text.slice(1);

interface ItemFilterProps {
  state: MetricState,
  name: string,
  changeState: (key: MetricName, checked: boolean) => void;
  currentData: PerformanceStats;
}

const FilterItem = (props: ItemFilterProps) => {
  const classes = useStyles();
  return <Card className={classes.card}>
    <CardHeader
      title={<FormControlLabel
        control={<Switch
          checked={Object.values(props.state).reduce((x, y) => x || y)}
          name={props.name}
          onChange={event => {
            Object.keys(props.state).forEach(state => props.changeState(state as MetricName, event.target.checked));
          }}
        />}
        label={<Typography variant='body1' style={{ fontWeight: 'bold' }}>{props.name}</Typography>}
      />}
      style={{ padding: 0 }}
    />
    <CardContent style={{ padding: '0 0 0 1.5em' }}>
      <Grid container direction='column' wrap='nowrap'>
        {Object.entries(props.state).map(([metricName, value]) =>
          <Grid item key={metricName}>
            <FormControlLabel
              control={<Switch
                checked={value}
                name={metricName}
                size={'small'}
                onChange={event => props.changeState(metricName as MetricName, event.target.checked)}
              />}
              label={uppercaseFirst(metricName) + ': ' + (props.currentData[metricName as MetricName] * 100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%'}
            />
          </Grid>
        )}
      </Grid>
    </CardContent>
  </Card>;
};

interface PerformanceChartProps {
  chartState: ChartHookData,
  token: string | null;
}

export const PerformanceChart = (props: PerformanceChartProps) => {
  const availableProps: { [key: string]: boolean; } = Object
    .values(props.chartState.keyState)
    .reduce((a, b) => joinBooleanObjects(a, Object(b), (p1, p2) => p1 || p2), {});
  const theme = useTheme();

  return <Grid container spacing={2}>
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
          backgroundColor: theme.palette.background.paper
        }}
      />
    </Grid>
    <Grid item xs={12}>
      <Grid container spacing={1}>
        <Grid item xs={12}>
          <Typography variant='h5'>Filters</Typography>
        </Grid>
        <Grid item xs={12}>
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
              label={uppercaseFirst(prop)}
            />)
          }
        </Grid>
        {Object.entries(props.chartState.keyState).map(([id, state]) =>
          Object.keys(props.chartState.data).includes(id) &&
          props.chartState.data[id].stats.length > 0 &&
          <Grid item key={id}>
            <FilterItem
              name={shortest(props.chartState.data[id].aliases)}
              state={state}
              changeState={props.chartState.changeState(id)}
              currentData={props.chartState.data[id].stats[props.chartState.data[id].stats.length - 1]}
            />
          </Grid>
        )}
      </Grid>
    </Grid>
  </Grid>;
};