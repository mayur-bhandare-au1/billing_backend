const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

exports.registerUser = async (req, res, next) => {
    const { username, password, name, role, email, phone } = req.body;

    if (!username || !password || !name || !role) {
        return res.status(400).json({ message: 'Please enter all required fields' });
    }

    if (!['admin', 'collection_agent'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role specified' });
    }
     //console.log('Registering user:', { username, email, phone,role });
    try {
        const userExists = await User.findOne({ 
            $or: [
                { username }, 
                { email: email || null }, 
                { phone: phone || null }
            ],
            role
        });
       // console.log('User exists:', userExists);
        if (userExists) {
            return res.status(400).json({ message: 'User with this username, email or phone already exists' });
        }

        const user = await User.create({
            username,
            password,
            name,
            role,
            email,
            phone,
        });

        res.status(201).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};

exports.loginUser = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Please enter username and password' });
    }

    try {
        // Find user by username
        const user = await User.findOne({ username }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ message: 'User account is deactivated' });
        }

        res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            token: generateToken(user._id),
        });
    } catch (error) {
        next(error);
    }
};


exports.getMe = async (req, res, next) => {
    // req.user is fetch by authMiddleware
    if (!req.user) {
        return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(req.user);
};