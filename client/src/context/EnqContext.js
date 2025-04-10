import React, { createContext, useState, useEffect } from 'react';

export const EnqContext = createContext();

export const EnqProvider = ({ children }) => {
    const [enqueteurs, setEnqueteurs] = useState([]);

    useEffect(() => {
        const fetchEnqueteurs = async () => {
            console.log('fetchEnqueteurs called');
            try {
                const response = await fetch('/api/enq/enqueteur');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();
                try {
                    const data = JSON.parse(text);
                    console.log('Fetched data:', data);
                    if (Array.isArray(data) && data.length > 0) {
                        setEnqueteurs(data);
                    } else {
                        console.error('Data des enquêteurs invalide.');
                    }
                } catch (err) {
                    console.error('Error parsing JSON:', err, 'Response text:', text);
                }
            } catch (err) {
                console.error('Error fetching enqueteurs:', err);
            }
        };
        fetchEnqueteurs();
    }, []);

    const updateTime = async (enqueteurName, newTime, Dpause, Fpause) => {
        try {
            const response = await fetch(`/api/enq/enqueteur/time/${enqueteurName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ time: newTime , Dpause, Fpause}),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const updatedEnqueteur = await response.json();
            setEnqueteurs((prevEnqueteurs) =>
                prevEnqueteurs.map((enq) =>
                    enq.name === enqueteurName ? updatedEnqueteur : enq
                )
            );
            return updatedEnqueteur;
        } catch (err) {
            console.error('Error updating time:', err);
            throw err;
        }
    };

    const updateDpause = async (enqueteurName, Dpause) => {
        try {
            const response = await fetch(`/api/enq/enqueteur/dpause/${enqueteurName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Dpause }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const updatedEnqueteur = await response.json();
            setEnqueteurs((prevEnqueteurs) =>
                prevEnqueteurs.map((enq) =>
                    enq.name === enqueteurName ? updatedEnqueteur : enq
                )
            );
            return updatedEnqueteur;
        } catch (err) {
            console.error('Error updating Dpause:', err);
            throw err;
        }
    };

    return (
        <EnqContext.Provider value={{ enqueteurs, setEnqueteurs, updateTime, updateDpause }}>
            {children}
        </EnqContext.Provider>
    );
};

