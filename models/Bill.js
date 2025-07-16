const mongoose = require('mongoose');

const BillSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    subscription: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subscription',
        required: true
    },
    billMonth: { 
        type: Date,
        required: true
    },
    dueDate: {
        type: Date,
        required: true
    },
    totalAmount: { 
        type: Number,
        required: true
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    previousBalance: { 
        type: Number,
        default: 0
    },
    currentBalance: { // totalAmount + previousBalance
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['generated', 'partially_paid', 'paid', 'overdue'],
        default: 'generated'
    },
    invoiceNumber: {
        type: String,
        unique: true,
        required: true
    },
    
    payments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    }]
}, { timestamps: true });

// Pre-save hook to update status based on paidAmount vs currentBalance
BillSchema.pre('save', function(next) {
    if (this.isModified('paidAmount') || this.isModified('currentBalance')) {
        const remaining = this.currentBalance - this.paidAmount;
        if (remaining <= 0) {
            this.status = 'paid';
        } else if (this.paidAmount > 0 && remaining > 0) {
            this.status = 'partially_paid';
        } else if (this.paidAmount === 0 && new Date() > this.dueDate) {
            this.status = 'overdue';
        } else {
            this.status = 'generated';
        }
    }
    next();
});

module.exports = mongoose.model('Bill', BillSchema);