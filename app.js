const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors'); 
const errorHandler = require('./utils/errorHandler');


require('dotenv').config({ path: './.env' });


const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON payloads
app.use(morgan('dev')); 
app.use(cors()); 



// Start route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Cable Billing API' });
});


module.exports = app;