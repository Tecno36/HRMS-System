import React, { useEffect } from 'react';
import { BrowserRouter, Route, Switch, Redirect, useHistory, useLocation } from 'react-router-dom';
import { IonApp, useIonToast, setupIonicReact } from '@ionic/react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { initPushNotifications, syncFcmToken } from './services/fcmService';
import './index.css'; 

import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import SetMpin from './pages/Auth/SetMpin';

import Dashboard from './pages/Menu/Dashboard';
import Profile from './pages/Menu/Profile';
import Attendance from './pages/Menu/Attendance';
import ApplyLeave from './pages/Menu/ApplyLeave';
import MainLayout from './layouts/MainLayout';

import Settings from './pages/Navbar/Settings';
import MyLeaves from './pages/Navbar/MyLeaves';
import axios from './services/axios';

setupIonicReact();

const PrivateRoute = ({ component: Component, ...rest }) => (
  <Route 
    {...rest} 
    render={props => 
      localStorage.getItem('token') ? (
        <Component {...props} />
      ) : (
        <Redirect to="/login" />
      )
    } 
  />
);

function AppController() {
  const history = useHistory();
  const location = useLocation();
  const [present] = useIonToast();

  useEffect(() => {
    let lastTimeBackPress = 0;
    const timePeriodToExit = 2000;

    const backButtonListener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const path = location.pathname;
      
      if (path === '/dashboard' || path === '/login') {
        if (new Date().getTime() - lastTimeBackPress < timePeriodToExit) {
          CapacitorApp.exitApp();
        } else {
          present({
            message: 'Press back again to exit',
            duration: 2000,
            position: 'bottom',
            color: 'light'
          });
          lastTimeBackPress = new Date().getTime();
        }
      } else {
        history.goBack();
      }
    });

    // ॲप स्टेट मॅनेजमेंट (बॅकग्राउंड/फोरग्राउंड)
    const appStateListener = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        // App परत फोरग्राउंडला आल्यावर FCM टोकन सिंक करणे
        syncFcmToken();
      }
    });

    return () => {
      backButtonListener.remove();
      appStateListener.remove();
    };
  }, [history, location.pathname, present]);

  useEffect(() => {
    initPushNotifications(present, history);
  }, [history, present]);

  return (
    <Switch>
      <Route 
        exact 
        path="/login" 
        render={() => localStorage.getItem('token') ? <Redirect to="/dashboard" /> : <Login />} 
      />
      <Route exact path="/forgot-password" component={ForgotPassword} />
      <Route exact path="/set-mpin" component={SetMpin} />
      
      <Route exact path="/">
        <Redirect to="/login" />
      </Route>
      
      <Route>
        <MainLayout>
          <Switch>
            <PrivateRoute exact path="/dashboard" component={Dashboard} />
            <PrivateRoute exact path="/profile" component={Profile} />
            <PrivateRoute exact path="/attendance" component={Attendance} />
            <PrivateRoute exact path="/apply-leave" component={ApplyLeave} />
            <PrivateRoute exact path="/settings" component={Settings} />
            <PrivateRoute exact path="/my-leaves" component={MyLeaves} />
            <Redirect to="/dashboard" />
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <IonApp>
      <BrowserRouter>
        <AppController />
      </BrowserRouter>
    </IonApp>
  );
}