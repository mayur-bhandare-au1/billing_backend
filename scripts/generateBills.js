const cron = require('node-cron');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' }); 

const Customer = require('../models/Customer');
const Subscription = require('../models/Subscription');
const Bill = require('../models/Bill');
const Plan = require('../models/Plan');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for Bill Generation Script');
    } catch (err) {
        console.error(`MongoDB Connection Error for Bill Generation Script: ${err.message}`);
        process.exit(1); // Exit process if DB connection fails
    }
};

const generateMonthlyBills = async () => {
    await connectDB(); // Ensure DB is connected for the script execution

    console.log(`[${new Date().toLocaleString()}] Running monthly bill generation...`);
    const today = new Date();
    // Set billMonth to the first day of the current month
    const billMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const dueDateDay = parseInt(process.env.BILL_DUE_DATE_DAY || '10', 10);
    const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDateDay);

    try {
        // Find all active subscriptions
        const activeSubscriptions = await Subscription.find({ isActive: true })
            .populate('customer')
            .populate('plan');

        for (const subscription of activeSubscriptions) {
            const customer = subscription.customer;
            const plan = subscription.plan;

            // Skip if customer or plan is not found, or if customer is inactive
            if (!customer || !plan || !customer.isActive) {
                console.warn(`Skipping bill for invalid/inactive customer or plan: Customer ID: ${subscription.customer}, Plan ID: ${subscription.plan}`);
                continue;
            }

            // Check if a bill for this month already exists for this customer and subscription
            const existingBill = await Bill.findOne({
                customer: customer._id,
                subscription: subscription._id,
                billMonth: billMonth
            });

            if (existingBill) {
                console.log(`Bill already exists for customer ${customer.name} (Invoice: ${existingBill.invoiceNumber}) for ${billMonth.toLocaleDateString()}. Skipping.`);
                continue;
            }

            // Calculate previous balance from the most recent previous bill
            const previousBill = await Bill.findOne({
                customer: customer._id,
                subscription: subscription._id,
                billMonth: { $lt: billMonth }, // Bills from previous months
                status: { $in: ['generated', 'partially_paid', 'overdue'] } // Only consider non-fully paid bills
            }).sort({ billMonth: -1 }); // Get the latest one

            let previousBalance = 0;
            if (previousBill) {
                const outstandingAmount = previousBill.currentBalance - previousBill.paidAmount;
                if (outstandingAmount > 0) {
                    previousBalance = outstandingAmount;
                    console.log(`Customer ${customer.name} has previous balance of Rs. ${previousBalance.toFixed(2)} from invoice ${previousBill.invoiceNumber}`);
                }
            }

            const totalAmount = plan.price; // Base amount for the current month
            const currentBalance = totalAmount + previousBalance;

            // Generate a unique invoice number
            const invoiceNumber = `INV-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}-${customer._id.toString().substring(0, 5)}-${Math.floor(100 + Math.random() * 900)}`;

            const newBill = new Bill({
                customer: customer._id,
                subscription: subscription._id,
                billMonth: billMonth,
                dueDate: dueDate,
                totalAmount: totalAmount,
                previousBalance: previousBalance,
                currentBalance: currentBalance,
                invoiceNumber: invoiceNumber,
                status: 'generated'
            });

            await newBill.save();
            console.log(`Generated bill for ${customer.name} (Plan: ${plan.name}). Invoice: ${invoiceNumber}. Total Due: Rs. ${currentBalance.toFixed(2)}.`);

            // Optional: Send SMS notification about new bill
            // const billDue = (currentBalance - newBill.paidAmount).toFixed(2);
            // await sendSMS(customer.phone, `Dear ${customer.name}, your bill for ${billMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} is Rs. ${billDue}. Due Date: ${dueDate.toLocaleDateString('en-IN')}. Invoice No: ${invoiceNumber}.`);
        }
        console.log(`[${new Date().toLocaleString()}] Monthly bill generation complete.`);
    } catch (error) {
        console.error(`[${new Date().toLocaleString()}] Error generating bills:`, error);
    } finally {
        // Disconnect from DB after the task is done
        if (mongoose.connection.readyState === 1) { // Check if connected
            await mongoose.disconnect();
            console.log('MongoDB Disconnected after Bill Generation Script');
        }
    }
};

module.exports = generateMonthlyBills;