const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const enqueteurSchema = new mongoose.Schema({
    name: { type: String, required: true },
    enquete: { type: String },
    password: {
        type: String,
        required: true,
    },
    status: { type: String },
    time: { type: String  },
    Dpause: { type: String },
    Fpause: { type: String },
    post: { type: String },
    nbPauses: { type: Number } // Default number of pauses
});

const Enqueteur = mongoose.model('Enqueteur', enqueteurSchema);

module.exports = Enqueteur;
