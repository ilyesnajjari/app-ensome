//Enquete
const mongoose = require('mongoose');

const enqueteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    }
});

const Enquete = mongoose.model('Enquete', enqueteSchema);

module.exports = Enquete;
