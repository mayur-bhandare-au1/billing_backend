const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const axios = require('axios');

// @desc    Record a payment for a bill
exports.recordPayment = async (req, res, next) => {
    const { billId, amountPaid, paymentMethod, transactionId } = req.body;

    if (!billId || !amountPaid || !paymentMethod) {
        return res.status(400).json({ message: 'Bill ID, amount paid, and payment method are required' });
    }
    if (typeof amountPaid !== 'number' || amountPaid <= 0) {
        return res.status(400).json({ message: 'Amount paid must be a positive number' });
    }

    try {
        const bill = await Bill.findById(billId);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        // Check if the bill is already fully paid or an invalid state
        if (bill.status === 'paid' && (bill.currentBalance - bill.paidAmount <= 0)) {
            return res.status(400).json({ message: 'This bill is already fully paid.' });
        }

        const customer = await Customer.findById(bill.customer);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found for this bill' });
        }

        // Create new payment record
        const payment = new Payment({
            customer: bill.customer,
            bill: bill._id,
            amountPaid: amountPaid,
            paymentMethod,
            transactionId,
            receivedBy: req.user._id 
        });

        await payment.save();

        // Update the Bill document
        bill.paidAmount += amountPaid;

        // The pre-save hook in Bill model will handle status update
        await bill.save();

        res.status(200).json({
            message: 'Payment recorded successfully',
            payment,
            updatedBill: {
                _id: bill._id,
                status: bill.status,
                paidAmount: bill.paidAmount,
                currentBalance: bill.currentBalance,
                remainingDue: (bill.currentBalance - bill.paidAmount).toFixed(2)
            }
        });
        // Send WhatsApp notification

        const whatsappMessage = `Dear ${customer.name},\n\nThank you for your payment of ₹${amountPaid.toFixed(2)} towards your bill (Invoice: ${bill.invoiceNumber}). Your remaining balance is ₹${(bill.currentBalance - bill.paidAmount).toFixed(2)}.\n\nRegards,\nCable Billing Team`;

        try {
            await axios.post('https://api.whatsapp.com/send', {
            phone: customer.phone, // Customer's phone number
            message: whatsappMessage
            });
            console.log('WhatsApp notification sent successfully');
        } catch (error) {
            console.error('Failed to send WhatsApp notification:', error.message);
        }
    } catch (error) {
        next(error);
    }
};

// @desc    Get all payments (for reporting)
exports.getAllPayments = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.customerId) query.customer = req.query.customerId;
        if (req.query.paymentMethod) query.paymentMethod = req.query.paymentMethod;
        if (req.query.startDate || req.query.endDate) {
            query.paymentDate = {};
            if (req.query.startDate) query.paymentDate.$gte = new Date(req.query.startDate);
            if (req.query.endDate) query.paymentDate.$lte = new Date(req.query.endDate);
        }

        const payments = await Payment.find(query)
            .populate('customer', 'name phone area')
            .populate('bill', 'invoiceNumber billMonth totalAmount currentBalance status')
            .populate('receivedBy', 'name role')
            .sort({ paymentDate: -1 });

        res.status(200).json(payments);
    } catch (error) {
        next(error);
    }
};