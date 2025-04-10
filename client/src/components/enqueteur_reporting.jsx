import React, {useEffect, useRef, useState} from 'react';
import axios from 'axios';
import {format} from 'date-fns';
import {useHistory} from 'react-router-dom';
import '../enqueteur_reporting.css';

const DataTable = () => {
    const [aggregationLevel, setAggregationLevel] = useState('individual');
    const [data, setData] = useState(() => JSON.parse(localStorage.getItem('data')) || {});
    const [users, setUsers] = useState([]);
    const [enqueteurs, setEnqueteurs] = useState([]);
    const [surveys, setSurveys] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const history = useHistory();
    const timers = useRef({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersResponse = await axios.get('http://localhost:5000/api/users');
                const enqueteursResponse = await axios.get('http://localhost:5000/api/enq/enqueteur');
                const surveysResponse = await axios.get('http://localhost:5000/api/surveys');
                setUsers(usersResponse.data.filter(user => user.type === 'enqueteur'));
                setEnqueteurs(enqueteursResponse.data);
                setSurveys(surveysResponse.data);
                console.log('Fetched users:', usersResponse.data);
                console.log('Fetched enqueteurs:', enqueteursResponse.data);
                console.log('Fetched surveys:', surveysResponse.data);
            } catch (error) {
                console.error('Error fetching data', error);
                setErrorMessage('Error fetching data');
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        users.forEach(user => {
            const key = `${user.name}-${aggregationLevel}`;
            if (!data[key]) {
                setData(prevData => ({
                    ...prevData,
                    [key]: {}
                }));
            }
        });
    }, [users, aggregationLevel, data]);

    useEffect(() => {
        localStorage.setItem('data', JSON.stringify(data));
    }, [data]);

    useEffect(() => {
        users.forEach(user => {
            const selectedEnqueteurDetails = enqueteurs.find(enqueteur => enqueteur.name === user.name);

            if (selectedEnqueteurDetails) {
                if (selectedEnqueteurDetails.status === 'En attente') {
                    startTimer('waiting', user.name);
                    stopTimer('pause', user.name);
                } else if (selectedEnqueteurDetails.status === 'En pause') {
                    startTimer('pause', user.name);
                    stopTimer('waiting', user.name);
                } else {
                    stopTimer('waiting', user.name);
                    stopTimer('pause', user.name);
                }
            }
        });
    }, [users, enqueteurs]);

    const startTimer = (type, user) => {
        if (!timers.current[user]) {
            timers.current[user] = {};
        }

        if (!timers.current[user][type]) {
            timers.current[user][type] = setInterval(() => {
                setData(prevData => {
                    const key = `${user}-${aggregationLevel}`;
                    const date = format(new Date(), 'yyyy-MM-dd');
                    const currentData = prevData[key] || {};
                    const currentDateData = currentData[date] || {};
                    const updatedDateData = {
                        ...currentDateData,
                        [`${type}Time`]: (currentDateData[`${type}Time`] || 0) + 1
                    };
                    return {
                        ...prevData,
                        [key]: {
                            ...currentData,
                            [date]: updatedDateData
                        }
                    };
                });
            }, 60000); // Increment every minute
        }
    };

    const stopTimer = (type, user) => {
        if (timers.current[user] && timers.current[user][type]) {
            clearInterval(timers.current[user][type]);
            timers.current[user][type] = null;
        }
    };

    const formatTime = (dateTimeString) => {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return '';
        return format(date, 'HH:mm:ss');
    };

    const handleReturnToDashboard = () => {
        history.push('/dashboard');
    };

    const renderSurveyTableBody = () => {
        return surveys.map((survey, index) => {
            const selectedEnqueteurs = enqueteurs
                .filter(enqueteur => enqueteur.enquete === survey.name)
                .map(enqueteur => enqueteur.name)
                .join(', ');

            return (
                <tr key={index}>
                    <td>{survey.name}</td>
                    <td>{survey.active ? 'True' : 'False'}</td>
                    <td>{selectedEnqueteurs}</td>
                </tr>
            );
        });
    };

    const renderIndividualTableBody = (user) => {
        const key = `${user.name}-${aggregationLevel}`;

        if (!data[key]) {
            return null;
        }

        const selectedUserDetails = users.find(u => u.name === user.name);
        const selectedEnqueteurDetails = enqueteurs.find(enqueteur => enqueteur.name === selectedUserDetails?.name);

        if (!selectedUserDetails || !selectedEnqueteurDetails) {
            console.log('No details found for the selected user or enqueteur.');
            return null;
        }

        const currentDate = format(new Date(), 'yyyy-MM-dd');
        const currentDateData = data[key][currentDate] || {};
        const isConnected = selectedUserDetails.Hlogout && new Date(selectedUserDetails.Hlogout) > new Date(selectedUserDetails.Hlogin);

        return (
            <tr key={currentDate}>
                <td>{currentDate}</td>
                <td>{formatTime(selectedUserDetails.Hlogin)}</td>
                <td>{formatTime(selectedUserDetails.Hlogout)}</td>
                <td>{selectedEnqueteurDetails.time}</td>
                <td>{selectedEnqueteurDetails.Dpause}</td>
                <td>{selectedEnqueteurDetails.Fpause}</td>
                <td>{selectedEnqueteurDetails.post}</td>
                <td>{selectedEnqueteurDetails.nbPauses}</td>
                <td>{isConnected ? 'Déconnecté' : 'Connecté'}</td>
            </tr>
        );
    };

    const handleAggregationChange = (event) => {
        const newAggregationLevel = event.target.value;
        if (newAggregationLevel !== aggregationLevel) {
            setAggregationLevel(newAggregationLevel);
        }
    };

    return (
        <div className="dataTableContainer">
            <button className="return-button" onClick={handleReturnToDashboard}>Retourner au Dashboard</button>
            <select className="aggregation-select" value={aggregationLevel} onChange={handleAggregationChange}>
                <option value="individual">Individual</option>
                <option value="survey">Survey</option>
            </select>
            {aggregationLevel === 'survey' && (
                <table className="dataTable">
                    <thead>
                    <tr>
                        <th>Nom de l'enquête</th>
                        <th>Active</th>
                        <th>Enquêteurs</th>
                    </tr>
                    </thead>
                    <tbody>
                    {renderSurveyTableBody()}
                    </tbody>
                </table>
            )}
            {aggregationLevel === 'individual' && users.map(user => (
                <div key={user.name}>
                    <h2>{user.name}</h2>
                    <table className="dataTable">
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Heure du dernier login</th>
                            <th>Heure du dernier logout</th>
                            <th>Durée de la dernière pause</th>
                            <th>Début de la dernière pause</th>
                            <th>Fin de la dernière pause</th>
                            <th>Poste de l'enquêteur</th>
                            <th>Nombre de pauses</th>
                            <th>Statut de l'enquêteur</th>
                        </tr>
                        </thead>
                        <tbody>
                        {renderIndividualTableBody(user)}
                        </tbody>
                    </table>
                </div>
            ))}
            {errorMessage && <div className="error-message">{errorMessage}</div>}
        </div>
    );
};

export default DataTable;
