const Bill = require('../models/Bill');
const Customer = require('../models/Customer');
const Plan = require('../models/Plan');
const sendSMS = require('../utils/sendSMS');
const sendWhatsapp = require('../utils/sendWhatsapp');
const generateInvoicePDF = require('../utils/generateInvoicePDF');

// @desc    Get bills for a specific customer
exports.getCustomerBills = async (req, res, next) => {
    try {
        const bills = await Bill.find({ customer: req.params.customerId })
            .populate('subscription')
            .sort({ billMonth: -1 }); // Latest bill first
        res.status(200).json(bills);
    } catch (error) {
        next(error);
    }
};

// @desc    Get a single bill by ID
exports.getBillById = async (req, res, next) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('customer', 'name phone address area stbNumber')
            .populate({
                path: 'subscription',
                populate: {
                    path: 'plan',
                    select: 'name description' // Select specific fields from plan
                }
            });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        res.status(200).json(bill);
    } catch (error) {
        next(error);
    }
};

// @desc    Send invoice via SMS, WhatsApp
exports.sendInvoice = async (req, res, next) => {
    const { method } = req.body; // 'sms' or 'whatsapp'

    try {
        const bill = await Bill.findById(req.params.id)
            .populate('customer', 'name phone')
            .populate({
                path: 'subscription',
                populate: { path: 'plan', select: 'name' }
            });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        if (!bill.customer) {
            return res.status(404).json({ message: 'Customer associated with bill not found' });
        }

        const customerPhone = bill.customer.phone;
        const customerName = bill.customer.name;
        const planName = bill.subscription?.plan?.name || 'N/A';
        const currentBalance = (bill.currentBalance - bill.paidAmount).toFixed(2);
        const dueDate = bill.dueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

        const message = `Dear ${customerName},\nYour bill for ${planName} (Invoice No: ${bill.invoiceNumber}) is Rs. ${currentBalance}. Due Date: ${dueDate}. Thank you!`;

        let success = false;
        if (method === 'sms') {
            success = await sendSMS(customerPhone, message);
        } else if (method === 'whatsapp') {
            success = await sendWhatsapp(customerPhone, message); // This is a placeholder for real WhatsApp API
        } else {
            return res.status(400).json({ message: 'Invalid method specified. Use "sms" or "whatsapp".' });
        }

        if (success) {
            res.status(200).json({ message: `Invoice sent via ${method} successfully.` });
        } else {
            res.status(500).json({ message: `Failed to send invoice via ${method}.` });
        }

    } catch (error) {
        next(error);
    }
};

exports.generateInvoicePdf = async (req, res, next) => {
    try {
        const bill = await Bill.findById(req.params.id)
            .populate('customer', 'name phone address area stbNumber')
            .populate({
                path: 'subscription',
                populate: {
                    path: 'plan',
                    select: 'name description'
                }
            });

        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        if (!bill.customer || !bill.subscription || !bill.subscription.plan) {
             return res.status(404).json({ message: 'Associated customer, subscription, or plan details missing for this bill.' });
        }

        const pdfBuffer = generateInvoicePDF(bill, bill.customer, bill.subscription.plan);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${bill.invoiceNumber}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        next(error);
    }
};

// @desc    Get overview of all bills
exports.getAllBills = async (req, res, next) => {
    try {
        const bills = await Bill.find({})
            .populate('customer', 'name phone area')
            .sort({ billMonth: -1 });
        res.status(200).json(bills);
    } catch (error) {
        next(error);
    }
};