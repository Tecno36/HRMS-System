import { BrowserRouter, Route, Switch, Redirect } from 'react-router-dom';
import './index.css'; 

import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import SetMpin from './pages/Auth/SetMpin';

import Dashboard from './pages/Menu/Dashboard';
import Profile from './pages/Menu/Profile';
import Attendance from './pages/Menu/Attendance';
import ApplyLeave from './pages/Menu/ApplyLeave';
import MainLayout from './layouts/MainLayout';

export default function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route exact path="/login" component={Login} />
        <Route exact path="/forgot-password" component={ForgotPassword} />
        <Route exact path="/set-mpin" component={SetMpin} />
        
        <Route exact path="/">
          <Redirect to="/login" />
        </Route>
        
        <Route>
          <MainLayout>
            <Switch>
              <Route exact path="/dashboard" component={Dashboard} />
              <Route exact path="/profile" component={Profile} />
              <Route exact path="/attendance" component={Attendance} />
              <Route exact path="/apply-leave" component={ApplyLeave} />
            </Switch>
          </MainLayout>
        </Route>
      </Switch>
    </BrowserRouter>
  );
}