import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter as Router } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { EnqProvider } from "./context/EnqContext";

ReactDOM.render(
    <Router>
        <UserProvider>
            <EnqProvider>
                <App />
            </EnqProvider>
        </UserProvider>
    </Router>,
    document.getElementById('root')
);