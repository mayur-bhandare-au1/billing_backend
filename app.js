const express = require('express');
const morgan = require('morgan'); 
const cors = require('cors'); 
const errorHandler = require('./utils/errorHandler');


require('dotenv').config({ path: './.env' });

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const customerRoutes = require('./routes/customer');
const planRoutes = require('./routes/plan');
const subscriptionRoutes = require('./routes/subscription');
const billRoutes = require('./routes/bill');
const paymentRoutes = require('./routes/payment');
const reportRoutes = require('./routes/report');


const app = express();

// Middleware
app.use(express.json()); // Body parser for JSON payloads
app.use(morgan('dev')); 
app.use(cors()); 


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);

// Start route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to the Cable Billing API' });
});



app.use(errorHandler);

module.exports = app;