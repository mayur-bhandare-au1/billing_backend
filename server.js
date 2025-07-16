const app = require('./app'); // Import the configured Express app
const connectDB = require('./config/db'); // Import DB connection function
const cron = require('node-cron'); // For scheduling

// Connect to MongoDB
try {
    connectDB();
    console.log('Database connected successfully');
} catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1); // Exit the process with failure
}

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

});

process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    //exit process
    server.close(() => process.exit(1));
});