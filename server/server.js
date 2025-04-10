//Server
require('dotenv').config({ path: __dirname+'/.env' });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MONGO_URI } = require('./config');
const authRoutes = require('./routes/auth');
const enquetRoutes = require('./routes/enquet');
const surveyRoutes = require('./routes/survey');
//const dataRoutes = require('./routes/data-analyse');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', authRoutes);
app.use('/api/enq', enquetRoutes);
app.use('/api', surveyRoutes);

// Database Connection
mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,

})
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.log(err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
