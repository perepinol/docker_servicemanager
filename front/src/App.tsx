import React from 'react';
import {
  AdminPanel
} from './components';

function App(): JSX.Element {
  return <AdminPanel token={sessionStorage.getItem("token")} />;
}

export default App;
