import React, { useContext, useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useHistory } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { EnqContext } from "../context/EnqContext";
import '../Enqueteur.css';

const Enqueteur = () => {
  const history = useHistory();
  const { user, setUser } = useContext(UserContext);
  const { enqueteurs, updateTime, updateDpause } = useContext(EnqContext);
  const [enqueteur, setEnqueteur] = useState(null);
  const [isOnPause, setIsOnPause] = useState(false);
  const [pauseRecords, setPauseRecords] = useState([]);
  const [isPauseTooLong, setIsPauseTooLong] = useState(false);
  const [activeEnquetes, setActiveEnquetes] = useState([]);
  const [selectedEnquete, setSelectedEnquete] = useState('');
  const [tempEnquete, setTempEnquete] = useState('');
  const [post, setPost] = useState('');
  const [tempPost, setTempPost] = useState('');

  useEffect(() => {
    if (!user) {
      history.push('/');
    } else {
      const matchedEnqueteur = enqueteurs.find(e => e.name === user.name);
      if (matchedEnqueteur) {
        setEnqueteur(matchedEnqueteur);
        const savedPauseRecords = JSON.parse(localStorage.getItem(`pauseRecords_${matchedEnqueteur.name}`));
        if (savedPauseRecords) {
          setPauseRecords(filterPauseRecords(savedPauseRecords));
        }
        const savedEnquete = localStorage.getItem(`selectedEnquete_${matchedEnqueteur.enquete}`);
        if (savedEnquete) {
          setSelectedEnquete(savedEnquete);
          setTempEnquete(savedEnquete);
        }
        const savedPost = localStorage.getItem(`selectedPost_${matchedEnqueteur.name}`);
        if (savedPost) {
          setPost(savedPost);
          setTempPost(savedPost);
        }
        checkLoginDate(user.Hlogin, matchedEnqueteur.name);
      }
    }
  }, [enqueteurs, user, history]);

  useEffect(() => {
    if (isOnPause) {
      const timeout = setTimeout(() => {
        setIsPauseTooLong(true);
      }, 600000);
      return () => clearTimeout(timeout);
    }
  }, [isOnPause]);

  useEffect(() => {
    const fetchActiveEnquetes = async () => {
      try {
        const response = await axios.get('/api/surveys');
        const activeEnquetes = response.data.filter(enquete => enquete.active === true);
        setActiveEnquetes(activeEnquetes);
      } catch (err) {
        console.error('Error fetching active enquetes', err);
      }
    };
    fetchActiveEnquetes();
  }, []);

  const clearPauseHistory = () => {
    setPauseRecords([]);
    localStorage.removeItem(`pauseRecords_${enqueteur.name}`);
  };

  const filterPauseRecords = (records) => {
    const today = new Date().toLocaleDateString();
    return records.filter(record => record.date === today);
  };

  const updateStatus = async (status) => {
    if (!enqueteur) return;
    try {
      await fetch(`/api/enq/enqueteur/status/${enqueteur.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const checkLoginDate = async (Hlogin, enqueteurName) => {
    const loginDate = new Date(Hlogin).toLocaleDateString();
    const currentDate = new Date().toLocaleDateString();
    console.log(`Checking login date for ${enqueteurName}: loginDate=${loginDate}, currentDate=${currentDate}`);
    if (loginDate !== currentDate) {
      console.log(`Login dates do not match. Updating status to 'Absent' and resetting nbPauses for ${enqueteurName}`);
      await updateStatus('Absent');
    }
  };



  const handleLogout = async () => {
    localStorage.removeItem('user');
    setUser(null);
    await axios.post('http://localhost:5000/api/auth/logout', { name: user.name });
    history.push('/');
  };

  const togglePause = async () => {
    if (!enqueteur || enqueteur.name !== user.name) {
      console.log("Enquêteur non trouvé ou ne correspondant pas à l'utilisateur.");
      return;
    }
    if (!isOnPause) {
      const pauseStart = Date.now();
      const pauseDate = new Date(pauseStart).toLocaleDateString();
      const Dpause = new Date(pauseStart).toLocaleTimeString();
      setIsOnPause(true);
      setPauseRecords([...pauseRecords, { start: pauseStart, end: null, date: pauseDate }]);
      await updateStatus('En pause');
      await updateDpause(enqueteur.name, Dpause);
    } else {
      const pauseEnd = Date.now();
      setIsOnPause(false);
      const updatedRecords = [...pauseRecords];
      updatedRecords[updatedRecords.length - 1].end = pauseEnd;
      setPauseRecords(updatedRecords);
      localStorage.setItem(`pauseRecords_${enqueteur.name}`, JSON.stringify(updatedRecords));
      setIsPauseTooLong(false);

      const pauseDurationMs = pauseEnd - updatedRecords[updatedRecords.length - 1].start;
      const formattedDuration = formatDuration(pauseDurationMs);
      const Dpause = new Date(updatedRecords[updatedRecords.length - 1].start).toLocaleTimeString();
      const Fpause = new Date(pauseEnd).toLocaleTimeString();
      await updateStatus('En attente');
      await updateTime(enqueteur.name, formattedDuration, Dpause, Fpause);

    }
  };

  const formatTime = (time) => {
    return new Date(time).toLocaleTimeString();
  };

  const formatDuration = (duration) => {
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    if (hours > 0) {
      return `${hours}h${minutes}min${seconds}s`;
    } else if (minutes > 0) {
      return `0h${minutes}min${seconds}s`;
    } else {
      return `0h0min${seconds}s`;
    }
  };

  const handleDismissPauseAlert = () => {
    setIsPauseTooLong(false);
  };

  const handleEnqueteChange = (e) => {
    setTempEnquete(e.target.value);
  };

  const handleEnqueteSave = async () => {
    if (!enqueteur) {
      console.error('Enqueteur is not defined');
      return;
    }

    try {
      const response = await axios.put(`/api/enq/enqueteur/enquete/${enqueteur.enquete}`, { newEnquete: tempEnquete });

      const updatedEnqueteur = response.data;

      setEnqueteur(updatedEnqueteur);
      setSelectedEnquete(tempEnquete);
      localStorage.setItem(`selectedEnquete_${enqueteur.enquete}`, tempEnquete);
    } catch (err) {
      console.error('Error updating enquete:', err.message || err);
    }
  };

  const handlePostChange = (e) => {
    setTempPost(e.target.value);
  };

  const handlePostSave = async () => {
    if (!enqueteur) {
      console.error('Enqueteur is not defined');
      return;
    }

    const url = `http://localhost:5000/api/enq/enqueteur/post/${enqueteur.name}`;

    try {
      const response = await axios.put(url, { post: tempPost });

      if (response.status === 200) {
        const updatedEnqueteur = response.data.enqueteur;
        setEnqueteur(updatedEnqueteur);
        setPost(tempPost);
        localStorage.setItem(`selectedPost_${enqueteur.name}`, tempPost);
      } else {
        console.error('Unexpected response status:', response.status);
      }
    } catch (err) {
      console.error('Error updating post:', err.message || err);
    }
  };

  if (!enqueteur) {
    return (
        <div>
          <h2>Chargement des données de l'enquêteur...</h2>
          <button onClick={handleLogout}>Déconnexion</button>
        </div>
    );
  }

  return (
      <div className="container" style={{ backgroundColor: isPauseTooLong ? 'red' : 'white', color: isPauseTooLong ? 'black' : 'inherit', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {isPauseTooLong ? (
            <div className="pause-alert" style={{ textAlign: 'center', padding: '50px' }}>
              <h1>PAUSE TROP LONGUE</h1>
              <button onClick={handleDismissPauseAlert} style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: 'white', color: 'red', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>OK</button>
            </div>
        ) : (
            <div>
              <button className={'logout-button'} onClick={handleLogout}>Déconnexion</button>
              <div className="top-left">
                {user && (
                    <div>
                      <h2>Bienvenue {user.name} sur votre dashboard d'enquêteur !</h2>
                      <div>
                        <label>Enquête en cours:</label>
                        <select value={tempEnquete} onChange={handleEnqueteChange}>
                          <option value="">Select Enquête</option>
                          {activeEnquetes.map((enquete) => (
                              <option key={enquete.name} value={enquete.name}>
                                {enquete.name}
                              </option>
                          ))}
                        </select>
                        <button onClick={handleEnqueteSave}>OK</button>
                      </div>
                      <p>Enquête sélectionnée: {selectedEnquete ? selectedEnquete : "Aucune enquête sélectionnée"}</p>
                      <div>
                        <label>Poste:</label>
                        <select value={tempPost} onChange={handlePostChange}>
                          <option value="">Select Poste</option>
                          {Array.from({ length: 32 }, (_, i) => `T${i + 1}`).map(post => (
                              <option key={post} value={post}>
                                {post}
                              </option>
                          ))}
                        </select>
                        <button onClick={handlePostSave}>OK</button>
                      </div>
                      <p>Poste sélectionné: {post ? post : "Aucun poste sélectionné"}</p>
                    </div>
                )}
              </div>
              <div className="center-content">
                <button className='pause-button' onClick={togglePause}>{isOnPause ? 'Revenir de pause' : 'Partir en pause'}</button>
                {pauseRecords.length > 0 && (
                    <div>
                      <h3>Historique des pauses</h3>
                      <table>
                        <thead>
                        <tr>
                          <th>Date</th>
                          <th>Début de pause</th>
                          <th>Fin de pause</th>
                          <th>Durée</th>
                        </tr>
                        </thead>
                        <tbody>
                        {pauseRecords.map((record, index) => (
                            <tr key={index}>
                              <td>{record.date}</td>
                              <td>{formatTime(record.start)}</td>
                              <td>{record.end ? formatTime(record.end) : 'En cours'}</td>
                              <td>{record.end ? formatDuration(record.end - record.start) : 'En cours'}</td>
                            </tr>
                        ))}
                        </tbody>
                      </table>
                    </div>
                )}
              </div>
            </div>
        )}
      </div>
  );
};

export default Enqueteur;