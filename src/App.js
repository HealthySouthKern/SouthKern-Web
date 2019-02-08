import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';

import 'antd/dist/antd.css';  // or 'antd/dist/antd.less'
import './App.less';

// Components
import Login from './components/login';
import Dashboard from './components/dashboard';
import Channels from './components/channels';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div style={{ height: '100%' }}>
          <Route exact path="/" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/channels" component={Channels} />
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
