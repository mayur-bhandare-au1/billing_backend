const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Address is required'],
        trim: true
    },
    area: { 
        type: String,
        required: [true, 'Area is required'],
        trim: true
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        match: [/^\d{10}$/, 'Please use a valid 10-digit phone number']
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
        match: [/.+@.+\..+/, 'Please use a valid email address']
    },
    stbNumber: { // Set-top box number
        type: String,
        unique: true,
        sparse: true,
        trim: true
    },
    documentIdProof: {
        url: String,
        public_id: String, // Cloudinary public ID 
        verified: {
            type: Boolean,
            default: false
        }
    },
    documentAddressProof: {
        url: String,
        public_id: String,
        verified: {
            type: Boolean,
            default: false
        }
    },
    isActive: { // For deactivating customer connection (STB status)
        type: Boolean,
        default: true
    },
}, { timestamps: true });

module.exports = mongoose.model('Customer', CustomerSchema);