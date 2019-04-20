import React, { Component } from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import SendBird from 'sendbird';
import SendBirdWidget from './js/widget';
import TokenManager from './resources/tokenManager'

import 'antd/dist/antd.css';  // or 'antd/dist/antd.less'
import './App.less';

// Components
import Login from './components/login';
import Dashboard from './components/dashboard';
import Channels from './components/channels';
import Users from './components/users';
import Settings from './components/settings';

class App extends Component {

  componentWillMount() {
    window.SendBird = SendBird;
  }

  render() {
    return (
      <BrowserRouter>
        <div style={{ height: '100%' }}>
          <Route exact path="/" component={Login} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/channels" component={Channels} />
          <Route path="/users" component={Users} />
          <Route path="/settings" component={Settings} />
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
