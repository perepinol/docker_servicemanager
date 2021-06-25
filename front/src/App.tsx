import MomentUtils from '@date-io/moment';
import { Box, createMuiTheme, MuiThemeProvider } from '@material-ui/core';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import React from 'react';
import {
  AdminPanel
} from './components';

const theme = createMuiTheme({
  palette: {
    background: {
      default: '#ECD8C7',
      paper: '#FAFAFA'
    },
    success: {
      main: '#48CA3A',
      light: '#79EE6C'
    }
  }
});

function App(): JSX.Element {
  return <MuiThemeProvider theme={theme}>
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <Box style={{ width: '100vw', height: '100vh', overflow: 'hidden scroll', backgroundColor: theme.palette.background.default }}>
        <AdminPanel token={sessionStorage.getItem("token")} />
      </Box>
    </MuiPickersUtilsProvider>
  </MuiThemeProvider>;
}

export default App;
