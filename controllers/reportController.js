const Customer = require('../models/Customer');
const Bill = require('../models/Bill');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

// @desc    Get Customer Summary Report
exports.getCustomerSummary = async (req, res, next) => {
    try {
        const totalCustomers = await Customer.countDocuments();
        const activeCustomers = await Customer.countDocuments({ isActive: true });
        const inactiveCustomers = totalCustomers - activeCustomers;

        // Area-wise customer count
        const customersByArea = await Customer.aggregate([
            { $group: { _id: '$area', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Area-wise active subscription count
        const subscriptionsByArea = await Subscription.aggregate([
            { $match: { isActive: true } },
            {
                $lookup: {
                    from: 'customers', // The collection name for Customer model
                    localField: 'customer',
                    foreignField: '_id',
                    as: 'customerDetails'
                }
            },
            { $unwind: '$customerDetails' },
            { $group: { _id: '$customerDetails.area', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);


        res.status(200).json({
            totalCustomers,
            activeCustomers,
            inactiveCustomers,
            customersByArea,
            subscriptionsByArea // Area wise active subscriptions
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Collection Summary Report
exports.getCollectionSummary = async (req, res, next) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999); // End of today

        const targetMonth = parseInt(req.query.month) || (new Date()).getMonth() + 1; // Month is 1-indexed
        const targetYear = parseInt(req.query.year) || (new Date()).getFullYear();

        const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
        const endOfMonth = new Date(targetYear, targetMonth, 0); 

        // Today's Collection
        const todaysCollectionResult = await Payment.aggregate([
            { $match: { paymentDate: { $gte: today, $lte: endOfToday } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amountPaid' },
                    cash: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] } },
                    online: { $sum: { $cond: [{ $ne: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] } }
                }
            }
        ]);
        const todaysCollection = todaysCollectionResult[0] || { total: 0, cash: 0, online: 0 };


        // Monthly Collection
        const monthlyCollectionResult = await Payment.aggregate([
            { $match: { paymentDate: { $gte: startOfMonth, $lte: endOfMonth } } },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$amountPaid' },
                    cash: { $sum: { $cond: [{ $eq: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] } },
                    online: { $sum: { $cond: [{ $ne: ['$paymentMethod', 'cash'] }, '$amountPaid', 0] } }
                }
            }
        ]);
        const monthlyCollection = monthlyCollectionResult[0] || { total: 0, cash: 0, online: 0 };

        // Pending Amount (sum of (currentBalance - paidAmount) for all non-paid bills)
        const pendingBillsResult = await Bill.aggregate([
            { $match: { status: { $in: ['generated', 'partially_paid', 'overdue'] } } },
            {
                $project: {
                    _id: 0,
                    remaining: { $subtract: ['$currentBalance', '$paidAmount'] }
                }
            },
            { $group: { _id: null, totalPendingAmount: { $sum: '$remaining' } } }
        ]);
        const totalPendingAmount = pendingBillsResult[0] ? pendingBillsResult[0].totalPendingAmount : 0;


        res.status(200).json({
            today: {
                totalCollection: todaysCollection.total,
                offlineCollection: todaysCollection.cash,
                onlineCollection: todaysCollection.online
            },
            month: {
                targetMonth: targetMonth,
                targetYear: targetYear,
                totalCollection: monthlyCollection.total,
                offlineCollection: monthlyCollection.cash,
                onlineCollection: monthlyCollection.online
            },
            totalPendingAmount: totalPendingAmount
        });
    } catch (error) {
        next(error);
    }
};