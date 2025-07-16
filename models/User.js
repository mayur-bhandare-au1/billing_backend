const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false // Do not return password in queries by default
    },
    role: {
        type: String,
        enum: ['admin', 'collection_agent'],
        required: [true, 'Role is required']
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        unique: true,
        sparse: true, // Allows multiple documents to have null or missing email, but unique for non-null values
        match: [/.+@.+\..+/, 'Please use a valid email address']
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        match: [/^\d{10}$/, 'Please use a valid 10-digit phone number']
    },
    isActive: {
        type: Boolean,
        default: true
    },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);