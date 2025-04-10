import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { EnqContext } from '../context/EnqContext';
import '../Dashboard.css';

const Dashboard = () => {
    const history = useHistory();
    const { user, setUser } = useContext(UserContext);
    const { enqueteurs, setEnqueteurs } = useContext(EnqContext);
    const [newUser, setNewUser] = useState({ name: '', password: '', type: 'enqueteur' });
    const [creatingAccount, setCreatingAccount] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showUserComboBox, setShowUserComboBox] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedUserName, setSelectedUserName] = useState('');

    const [newEnquete, setNewEnquete] = useState({ name: '', active: true });
    const [enquetes, setEnquetes] = useState([]);
    const [selectedEnqueteName, setSelectedEnqueteName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                //setEnqueteurs(response.data);
                // gestion absences
                const responseEnqueteurs = await axios.get('http://localhost:5000/api/enq/enqueteur');
                const enqueteursData = responseEnqueteurs.data;
                const responseUsers = await axios.get('http://localhost:5000/api/users');
                const usersData = responseUsers.data;

                const updatedEnqueteurs = enqueteursData.map(enqueteur => {
                    const user = usersData.find(u => u.name === enqueteur.name);
                    if (user) {
                        const currentDate = new Date();
                        const loginDate = new Date(user.Hlogin);
                        if (loginDate.toDateString() !== currentDate.toDateString()) {
                            enqueteur.status = 'Absent';
                        }
                    }
                    return enqueteur;
                });

                setEnqueteurs(updatedEnqueteurs);
                setUsers(usersData);
            } catch (error) {
                console.error('Error fetching enqueteurs', error);
                setErrorMessage('Error fetching enqueteurs');
                setTimeout(() => setErrorMessage(''), 3000);
            }
        };
        fetchData();
        fetchUsers();
        fetchEnquetes();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [setEnqueteurs]);

    const fetchUsers = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/users');
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users', error);
            setErrorMessage('Error fetching users');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const fetchEnquetes = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/surveys');
            console.log('Fetched enquetes:', response.data);
            setEnquetes(response.data);
        } catch (error) {
            console.error('Error fetching enquetes', error);
            setErrorMessage(`Error fetching enquetes: ${error.message}`);
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        history.push('/');
    };

    const getStatusClass = (status, time) => {
        let timeInMinutes = 0;
        if (time.includes('h')) {
            timeInMinutes = parseFloat(time.replace('h', '.')) * 60;
        } else if (time.includes('min')) {
            timeInMinutes = parseFloat(time.replace('min', ''));
        } else if (time.includes('sec')) {
            timeInMinutes = parseFloat(time.replace('sec', '')) / 60;
        } else {
            setErrorMessage("The string did not match the expected pattern.");
            setTimeout(() => setErrorMessage(''), 3000);
            return '';
        }

        switch (status) {
            case 'Absent':
                return 'status-absent';
            case 'En attente':
                return timeInMinutes > 1 ? 'status-attente-long' : 'status-en-attente';
            case 'En communication':
                return timeInMinutes > 10 ? 'status-communication-long' : 'status-en-communication';
            case 'En pause':
                return 'status-en-pause';
            default:
                return '';
        }
    };

    const handleDeleteUser = async () => {
        try {
            // Delete the user from the User collection
            await axios.delete(`http://localhost:5000/api/users/${selectedUserName}`);

            // Delete the user from the Enqueteur collection
            await axios.delete(`http://localhost:5000/api/enq/enqueteur/${selectedUserName}`);

            // Update the state to remove the user from the users list
            setUsers(users.filter(user => user.name !== selectedUserName));
            setSelectedUserName('');
            setSuccessMessage('User and Enqueteur (if applicable) deleted successfully');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting user and/or enqueteur', error);
            setErrorMessage('Error deleting user and/or enqueteur');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newUser.name || !newUser.password) {
            setErrorMessage("All fields are required.");
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            const userResponse = await axios.post('http://localhost:5000/api/auth/register', newUser);
            if (userResponse.data.success) {
                if (newUser.type === 'enqueteur') {
                    const enqueteurResponse = await axios.post('http://localhost:5000/api/enq/enqueteur/register', {
                        name: newUser.name,
                        password: newUser.password, // Ensure password is sent here
                        enquete: 'Aucune sélectionnée',
                        status: 'Absent',
                        time: '0h0min0s',
                        Dpause: '',
                        Fpause: '',
                        nbPauses: 0
                    });

                    if (enqueteurResponse.data.success) {
                        setCreatingAccount(false);
                        setNewUser({ name: '', password: '', type: 'enqueteur' });
                        setSuccessMessage('User and Enqueteur created successfully!');
                        setErrorMessage('');
                        fetchUsers();

                        setTimeout(() => setSuccessMessage(''), 3000);
                    } else {
                        throw new Error(enqueteurResponse.data.message);
                    }
                } else {
                    setCreatingAccount(false);
                    setNewUser({ name: '', password: '', type: 'enqueteur' });
                    setSuccessMessage('User created successfully!');
                    setErrorMessage('');
                    fetchUsers();

                    setTimeout(() => setSuccessMessage(''), 3000);
                }
            } else {
                throw new Error(userResponse.data.message);
            }
        } catch (error) {
            console.error('Error creating account', error);
            setErrorMessage('An error occurred while creating the account.');
            setSuccessMessage('');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };



    const handleGoToReporting = () => {
        history.push('/enqueteur_reporting');
    };

    const handleAddEnquete = async () => {
        if (!newEnquete.name) {
            setErrorMessage('Enquête name is required.');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/surveys', newEnquete);
            setEnquetes([...enquetes, response.data]);
            setNewEnquete({ name: '', active: true });
            setSuccessMessage('Enquête added successfully!');
            setErrorMessage('');

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error adding enquete', error);
            setErrorMessage('Error adding enquete');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleDeleteEnquete = async () => {
        try {
            await axios.delete(`http://localhost:5000/api/surveys/${selectedEnqueteName}`);
            setEnquetes(enquetes.filter(enquete => enquete.name !== selectedEnqueteName));
            setSelectedEnqueteName('');
            setSuccessMessage('Enquête deleted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error deleting enquete', error);
            setErrorMessage('Error deleting enquete');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleToggleEnqueteActive = async () => {
        const enquete = enquetes.find(e => e.name === selectedEnqueteName);
        if (!enquete) {
            setErrorMessage('Enquête not found');
            setTimeout(() => setErrorMessage(''), 3000);
            return;
        }

        try {
            await axios.patch(`http://localhost:5000/api/surveys/${selectedEnqueteName}`, { active: !enquete.active });
            setEnquetes(enquetes.map(e =>
                e.name === selectedEnqueteName ? { ...e, active: !e.active } : e
            ));
            setSuccessMessage('Enquête status updated successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error('Error updating enquete', error);
            setErrorMessage('Error updating enquete');
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleNavigateNewPage = () => {
        history.push('/data-analyse');
    };

    return (
        <div>
            {user && (
                <div>
                    <h2>Bienvenue {user.name} sur votre dashboard !</h2>
                    <div className="button-container">
                        <div>
                            <button className="create-account-button"
                                    onClick={() => setCreatingAccount(!creatingAccount)}>
                                Créer un utilisateur
                            </button>
                        </div>
                        <div style={{ marginLeft: '10px' }}>
                            <button className="logout-button" onClick={handleLogout}>Déconnexion</button>
                        </div>
                    </div>
                    {creatingAccount && (
                        <form onSubmit={handleSubmit}>
                            <label>
                                Nom d'utilisateur:
                                <input type="text" value={newUser.name}
                                       onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                            </label>
                            <label>
                                Mot de passe:
                                <input type="password" value={newUser.password}
                                       onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                            </label>
                            <label>
                                Type:
                                <select value={newUser.type}
                                        onChange={(e) => setNewUser({ ...newUser, type: e.target.value })}>
                                    <option value="enqueteur">Enquêteur</option>
                                    <option value="administrateur">Administrateur</option>
                                </select>
                            </label>
                            <button type="submit">Créer</button>
                        </form>
                    )}
                    {successMessage && (
                        <div className="success-message">
                            {successMessage}
                        </div>
                    )}
                    {errorMessage && (
                        <div className="error-message">
                            {errorMessage}
                        </div>
                    )}

                    <div>
                        <button
                            className="delete-button"
                            onClick={() => setShowUserComboBox(!showUserComboBox)}
                        >
                            {showUserComboBox ? 'Cacher les utilisateurs' : 'Afficher les utilisateurs'}
                        </button>
                        {showUserComboBox && (
                            <div style={{marginTop: '20px'}}>
                                <select
                                    value={selectedUserName}
                                    onChange={(e) => setSelectedUserName(e.target.value)}
                                >
                                    <option value="">Sélectionner un utilisateur</option>
                                    {users.map(user => (
                                        <option key={user.name} value={user.name}>
                                            {user.name}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleDeleteUser}
                                    disabled={!selectedUserName}
                                    style={{marginLeft: '10px'}}
                                >
                                    Supprimer utilisateur
                                </button>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3>Gérer les enquêtes</h3>
                        <div style={{marginTop: '20px'}}>
                            <input
                                type="text"
                                placeholder="Nouvelle enquête"
                                value={newEnquete.name}
                                onChange={(e) => setNewEnquete({...newEnquete, name: e.target.value})}
                            />
                            <label>
                                Active:
                                <input
                                    type="checkbox"
                                    checked={newEnquete.active}
                                    onChange={(e) => setNewEnquete({...newEnquete, active: e.target.checked})}
                                />
                            </label>
                            <button onClick={handleAddEnquete}>Ajouter une enquête</button>
                        </div>
                        <div>
                            <h4>Liste des enquêtes</h4>
                            <ul>
                                {enquetes.map(enquete => (
                                    <li key={enquete.name}>
                                        {enquete.name} - {enquete.active ? 'Active' : 'Inactive'}
                                    </li>
                                ))}
                            </ul>
                            <div style={{marginTop: '20px'}}>
                                <select
                                    value={selectedEnqueteName}
                                    onChange={(e) => setSelectedEnqueteName(e.target.value)}
                                >
                                    <option value="">Sélectionner une enquête</option>
                                    {enquetes.map(enquete => (
                                        <option key={enquete.name} value={enquete.name}>
                                            {enquete.name} - {enquete.active ? 'Active' : 'Inactive'}
                                        </option>
                                    ))}
                                </select>
                                <button onClick={handleToggleEnqueteActive} disabled={!selectedEnqueteName}>
                                    {selectedEnqueteName && enquetes.find(e => e.name === selectedEnqueteName)?.active ? 'Désactiver' : 'Activer'}
                                </button>
                                <button onClick={handleDeleteEnquete} disabled={!selectedEnqueteName}
                                        style={{marginLeft: '10px'}}>
                                    Supprimer enquête
                                </button>
                            </div>
                        </div>

                        <table>
                            <thead>
                            <tr>
                                <th>Télé-enquêteur</th>
                                <th>Statut</th>
                                <th>depuis ...</th>
                                <th>sur</th>
                            </tr>
                            </thead>
                            <tbody>
                            {enqueteurs.map((enqueteur, index) => (
                                <tr key={index}>
                                    <td>{enqueteur.name}</td>
                                    <td className={getStatusClass(enqueteur.status, enqueteur.time)}>{enqueteur.status}</td>
                                    <td>{enqueteur.status === 'En pause' ? enqueteur.Dpause : enqueteur.status === 'En attente' ? enqueteur.Fpause : ''}</td>                                    <td>{enqueteur.enquete}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        <div style={{marginLeft: '10px'}}>
                            <button className="reporting-button" onClick={handleGoToReporting}>Reporting</button>
                        </div>

                    </div>

                    {/* New button for redirection */}

                </div>
            )}
        </div>
    );
};

export default Dashboard;
