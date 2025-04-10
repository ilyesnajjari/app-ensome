const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    type: { 
        type: String, 
        required: true },
    Hlogin: { type: Date, default: null },
    Hlogout: { type: Date, default: null }
});

const User = mongoose.model('User', UserSchema);
module.exports = User;