import React, { useContext, useEffect } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Enqueteur from './components/enqueteur';
import { UserContext } from './context/UserContext';
import EnqueteurReporting from './components/enqueteur_reporting';
import DataAnalyse from './components/DataAnalyse';

function App() {
  const history = useHistory();
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.type === 'administrateur') {
        history.push('/dashboard');
      } else if (storedUser.type === 'enqueteur') {
        history.push('/enqueteur');
      }
    }
  }, [history, setUser]);

  return (
    <div>
      <Switch>
        <Route exact path="/" component={Login} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/enqueteur" component={Enqueteur} />
        <Route path="/enqueteur_reporting" component={EnqueteurReporting} />
        <Route path="/data-analyse" component={DataAnalyse} />
      </Switch>
    </div>
  );
}

export default App;
