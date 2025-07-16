const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bill',
        required: true
    },
    amountPaid: {
        type: Number,
        required: true,
        min: 0
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'online', 'card', 'upi', 'other'],
        required: true
    },
    receivedBy: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    transactionId: { // For online payments
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);