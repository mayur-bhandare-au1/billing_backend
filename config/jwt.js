// This file is less critical if using .env directly in authController.
// Keeping it here for structural consistency.
module.exports = {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpire: process.env.JWT_EXPIRE
};