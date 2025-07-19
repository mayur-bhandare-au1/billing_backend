const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the stack trace for debugging
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Server Error';

    
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: errors.join(', ') });
    }
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue);
        return res.status(400).json({ message: `Duplicate field value: ${field}` });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({ message: `Resource not found with id of ${err.value}` });
    }
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Not authorized, token expired' });
    }
    if (err.name === 'MulterError') { // File upload errors
        return res.status(400).json({ message: `File upload error: ${err.message}` });
    }

    res.status(statusCode).json({
        message: message,
        // stack in dev only, not in production
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;