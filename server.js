const app = require('./app');
const connectDB = require('./config/db'); // Import the database connection function
const cron = require('node-cron'); // For scheduling
const generateBills = require('./scripts/generateBills');

// Connect to MongoDB
try {
    connectDB();
    console.log('Database connected successfully');
} catch (error) {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1); // Exit the process with failure
}
//generateBills();
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    const billGenerationDay = parseInt(process.env.BILL_GENERATION_DAY || '1', 10);
    const cronSchedule = `0 2 ${billGenerationDay} * *`; // for 1st of month

    console.log(`Scheduling monthly bill generation for ${billGenerationDay}st of every month at 2:00 AM.`);

    cron.schedule(cronSchedule, async () => {
        console.log(`Running scheduled bill generation job at ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);
        await generateBills();
    }, {
        timezone: "Asia/Kolkata" 
    });

    // Run bill generation once on server start (FOR TESTING (UNCOMMENT IN DEV))
    if (process.env.NODE_ENV === 'development' && process.env.RUN_BILL_ON_START === 'true') {
         console.log('Running bill generation on server start (development mode).');
         generateBills();
     }

});

process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    //exit process
    server.close(() => process.exit(1));
});