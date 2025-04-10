
//survey
const express = require('express');
const router = express.Router();
const Enquete = require('../models/Enquete');

// Route pour obtenir toutes les enquêtes
router.get('/surveys', async (req, res) => {
    try {
        const surveys = await Enquete.find({});
        res.json(surveys);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});


// Endpoint to create a new survey
router.post('/surveys', async (req, res) => {
    const { name, active } = req.body;
    try {
        const newSurvey = new Enquete({ name, active });
        await newSurvey.save();
        res.status(201).json(newSurvey);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Endpoint to delete a survey by name
router.delete('/surveys/:name', async (req, res) => {
    try {
        const survey = await Enquete.findOneAndDelete({ name: req.params.name });
        if (!survey) {
            return res.status(404).send('Survey not found');
        }
        res.send('Survey deleted successfully');
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


// Endpoint to update survey active status by name
router.patch('/surveys/:name', async (req, res) => {
    const { active } = req.body;
    try {
        const survey = await Enquete.findOneAndUpdate({ name: req.params.name }, { active }, { new: true });
        if (!survey) {
            return res.status(404).send('Survey not found');
        }
        res.json(survey);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
