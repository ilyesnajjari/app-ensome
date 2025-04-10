const express = require('express');
const Enqueteur = require('../models/Enqueteur');
const router = express.Router();

router.post('/enqueteur/register', async (req, res) => {
    const { name, password, post } = req.body;  // Include post in the request body
    try {
        const existingUser = await Enqueteur.findOne({ name });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const newEnqueteur = new Enqueteur({
            name,
            password,
            enquete: 'Aucune sélectionnée',
            status: 'En attente',
            time: '0min',
            Dpause: '',
            Fpause: '',
            post: '',
            nbPauses: 0
        });

        await newEnqueteur.save();
        res.status(201).json({ success: true, message: 'Enqueteur created successfully', enqueteur: newEnqueteur });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});



router.put('/enqueteur/post/:name', async (req, res) => {
    try {
        const { post } = req.body;
        const enqueteur = await Enqueteur.findOneAndUpdate(
            { name: req.params.name },
            { post },
            { new: true }
        );
        if (!enqueteur) {
            return res.status(404).json({ message: 'Enqueteur not found' });
        }
        res.json({ message: 'Post updated', enqueteur });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/enqueteur', async (req, res) => {
    try {
        const enqueteurs = await Enqueteur.find({});
        res.json(enqueteurs);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/enqueteur/status/:name', async (req, res) => {
    try {
        const { status } = req.body;
        const enqueteur = await Enqueteur.findOneAndUpdate({ name: req.params.name }, { status }, { new: true });
        if (!enqueteur) {
            return res.status(404).json({ message: 'Enqueteur not found' });
        }
        res.json({ message: 'Status updated', enqueteur });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/enqueteur/time/:name', async (req, res) => {
    try {
        const { time, Dpause, Fpause } = req.body;
        const enqueteur = await Enqueteur.findOne({ name: req.params.name });
        if (!enqueteur) {
            return res.status(404).json({ message: 'Enqueteur not found' });
        }
        enqueteur.time = time;
        enqueteur.Dpause = Dpause;
        enqueteur.Fpause = Fpause;
        enqueteur.nbPauses += 1;  // Increment the number of pauses
        await enqueteur.save();
        res.json({ message: 'Time and number of pauses updated', enqueteur });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Route to update the enquête of an enquêteur for the current user
router.put('/enqueteur/enquete/:enquete', async (req, res) => {
    try {
        const { enquete } = req.params;
        const { newEnquete } = req.body;
        const updatedEnqueteur = await Enqueteur.findOneAndUpdate(
            { enquete },
            { enquete: newEnquete },
            { new: true }
        );
        if (!updatedEnqueteur) {
            return res.status(404).send('Enqueteur not found');
        }
        res.json(updatedEnqueteur);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.put('/update-status', async (req, res) => {
    try {
        const enqueteurs = await Enqueteur.find();
        const currentDate = new Date().toLocaleDateString();

        const updatedEnqueteurs = await Promise.all(enqueteurs.map(async (enqueteur) => {
            const user = await User.findOne({ name: enqueteur.name });
            if (user) {
                const loginDate = new Date(user.Hlogin).toLocaleDateString();
                if (loginDate !== currentDate) {
                    enqueteur.status = 'Absent';
                    enqueteur.nbPauses = 0;  // Reset nbPauses
                    await enqueteur.save();
                }
            }
            return enqueteur;
        }));

        res.status(200).json(updatedEnqueteurs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/enqueteur/dpause/:name', async (req, res) => {
    try {
        const { Dpause } = req.body;
        const enqueteur = await Enqueteur.findOneAndUpdate(
            { name: req.params.name },
            { Dpause },
            { new: true }
        );
        if (!enqueteur) {
            return res.status(404).json({ message: 'Enqueteur not found' });
        }
        res.json({ message: 'Dpause updated', enqueteur });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.delete('/enqueteur/:name', async (req, res) => {
    console.log(`DELETE /enqueteur/${req.params.name} called`);
    try {
        const enqueteur = await Enqueteur.findOneAndDelete({ name: req.params.name });
        if (!enqueteur) {
            console.log(`Enqueteur with name ${req.params.name} not found`);
            return res.status(404).send('Enqueteur not found');
        }
        console.log(`Enqueteur with name ${req.params.name} deleted successfully`);
        res.send('Enqueteur deleted successfully');
    } catch (error) {
        console.error('Error deleting enqueteur:', error);
        res.status(500).send('Server error');
    }
});

router.get('/enqueteur/:name', async (req, res) => {
    try {
        const enqueteur = await Enqueteur.findOne({ name: req.params.name });
        if (!enqueteur) {
            return res.status(404).json({ message: 'Enqueteur not found' });
        }
        res.json(enqueteur);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});
router.put('/enqueteur/reset-pauses/:name', async (req, res) => {
    try {
        const enqueteur = await Enqueteur.findOne({ name: req.params.name });
        if (!enqueteur) {
            return res.status(404).json({ message: 'Enqueteur not found' });
        }
        enqueteur.nbPauses = 0;
        await enqueteur.save();
        res.json({ message: 'NbPauses reset to zero', enqueteur });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
