const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find({}).select('-password'); // Exclude passwords
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

exports.getUserById = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};


exports.updateUser = async (req, res, next) => {
    const { name, email, phone, role, isActive, password } = req.body;
    let updateFields = { name, email, phone, role, isActive };

    // Prevent non-admins from changing role or isActive status of others
    if (req.user.role !== 'admin' && req.user._id.toString() !== req.params.id) {
        return res.status(403).json({ message: 'Not authorized to update other user accounts' });
    }

    // Only admin can change role or isActive status
    if (req.user.role !== 'admin') {
        delete updateFields.role;
        delete updateFields.isActive;
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        
        if (password) {
            const salt = await bcrypt.genSalt(10);
            updateFields.password = await bcrypt.hash(password, salt);
        }

        
        Object.keys(updateFields).forEach(key => {
            if (updateFields[key] !== undefined) { // Only update if value is provided
                user[key] = updateFields[key];
            }
        });

        await user.save(); 

        res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            role: user.role,
            email: user.email,
            phone: user.phone,
            isActive: user.isActive,
            message: 'User updated successfully'
        });
    } catch (error) {
        next(error);
    }
};

exports.toggleUserActiveStatus = async (req, res, next) => {
    const { isActive } = req.body; 

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Prevent admin from deactivating themselves
        if (req.user._id.toString() === req.params.id && isActive === false) {
            return res.status(400).json({ message: 'Cannot deactivate your own account' });
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            _id: user._id,
            name: user.name,
            username: user.username,
            isActive: user.isActive,
            message: `User account ${isActive ? 'activated' : 'deactivated'} successfully`
        });
    } catch (error) {
        next(error);
    }
};


exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // admin cant delete itself
        if (req.user._id.toString() === req.params.id) {
            return res.status(400).json({ message: 'Cannot delete your own account' });
        }

        await user.deleteOne(); 

        res.status(200).json({ message: 'User removed successfully' });
    } catch (error) {
        next(error);
    }
};