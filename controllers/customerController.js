const Customer = require('../models/Customer');
const cloudinary = require('cloudinary').v2;

// @desc    Create a new customer
exports.createCustomer = async (req, res, next) => {
    const { name, address, area, phone, email, stbNumber } = req.body;

    // Basic validation
    if (!name || !address || !area || !phone) {
        return res.status(400).json({ message: 'Please enter all required customer details' });
    }

    try {
        const customerExists = await Customer.findOne({ $or: [{ phone }, { email, email: { $ne: null } }, { stbNumber, stbNumber: { $ne: null } }] });
        if (customerExists) {
            return res.status(400).json({ message: 'Customer with this phone, email or STB number already exists' });
        }

        const customer = await Customer.create({
            name,
            address,
            area,
            phone,
            email,
            stbNumber,
        });

        res.status(201).json({
            message: 'Customer created successfully',
            customer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Upload customer document (ID proof or Address proof)
exports.uploadCustomerDocument = async (req, res, next) => {
    const { documentType } = req.body; // 'idProof' or 'addressProof'

    if (!documentType || !['idProof', 'addressProof'].includes(documentType)) {
        return res.status(400).json({ message: 'Invalid document type. Must be "idProof" or "addressProof".' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            // If customer not found, delete the uploaded file from Cloudinary
            if (req.file.public_id) {
                await cloudinary.uploader.destroy(req.file.public_id);
            }
            return res.status(404).json({ message: 'Customer not found' });
        }

        const documentField = documentType === 'idProof' ? 'documentIdProof' : 'documentAddressProof';

        // Delete old document from Cloudinary if it exists
        if (customer[documentField] && customer[documentField].public_id) {
            await cloudinary.uploader.destroy(customer[documentField].public_id);
        }

        // Update customer document fields
        customer[documentField] = {
            url: req.file.path, 
            public_id: req.file.filename, 
            verified: false // Reset verification status on new upload
        };

        await customer.save();

        res.status(200).json({
            message: `${documentType} uploaded successfully`,
            document: customer[documentField]
        });

    } catch (error) {
        // If an error occurs during save or lookup, ensure file is deleted from Cloudinary
        if (req.file && req.file.public_id) {
            await cloudinary.uploader.destroy(req.file.public_id);
        }
        next(error);
    }
};
// @desc    Verify customer document (ID proof or Address proof)
exports.verifyCustomerDocument = async (req, res, next) => {
    const { documentType, verified } = req.body; // documentType: 'idProof' or 'addressProof'

    if (!documentType || !['idProof', 'addressProof'].includes(documentType)) {
        return res.status(400).json({ message: 'Invalid document type. Must be "idProof" or "addressProof".' });
    }
    if (typeof verified !== 'boolean') {
        return res.status(400).json({ message: 'Verification status must be a boolean.' });
    }

    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const documentField = documentType === 'idProof' ? 'documentIdProof' : 'documentAddressProof';

        if (!customer[documentField] || !customer[documentField].url) {
            return res.status(404).json({ message: `No ${documentType} found for this customer.` });
        }

        customer[documentField].verified = verified;
        await customer.save();

        res.status(200).json({
            message: `${documentType} verification status updated to ${verified}`,
            document: customer[documentField]
        });

    } catch (error) {
        next(error);
    }
};

// @desc    Get all customers
exports.getAllCustomers = async (req, res, next) => {
    try {
        const query = {};
        if (req.query.area) {
            query.area = req.query.area; // Filter by area
        }
        if (req.query.isActive) {
            query.isActive = req.query.isActive === 'true';
        }

        const customers = await Customer.find(query);
        res.status(200).json(customers);
    } catch (error) {
        next(error);
    }
};

// @desc    Get customer by ID
exports.getCustomerById = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }
        res.status(200).json(customer);
    } catch (error) {
        next(error);
    }
};

// @desc    Update customer details
exports.updateCustomer = async (req, res, next) => {
    const { name, address, area, phone, email, stbNumber } = req.body;
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        // Check for uniqueness on updated fields if they are being changed
        if (phone && phone !== customer.phone) {
            const existing = await Customer.findOne({ phone });
            if (existing) return res.status(400).json({ message: 'Phone number already in use' });
        }
        if (email && email !== customer.email) {
            const existing = await Customer.findOne({ email });
            if (existing) return res.status(400).json({ message: 'Email already in use' });
        }
        if (stbNumber && stbNumber !== customer.stbNumber) {
            const existing = await Customer.findOne({ stbNumber });
            if (existing) return res.status(400).json({ message: 'STB Number already in use' });
        }

        Object.assign(customer, { name, address, area, phone, email, stbNumber });
        await customer.save();

        res.status(200).json({
            message: 'Customer updated successfully',
            customer
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle customer STB status (active/inactive)
exports.toggleStbStatus = async (req, res, next) => {
    const { isActive } = req.body; // Expects boolean true/false

    if (typeof isActive !== 'boolean') {
        return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    try {
        const customer = await Customer.findById(req.params.id);

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        customer.isActive = isActive;
        await customer.save();

        res.status(200).json({
            message: `Customer STB status set to ${isActive ? 'Active' : 'Deactivated'}`,
            customer: {
                _id: customer._id,
                name: customer.name,
                stbNumber: customer.stbNumber,
                isActive: customer.isActive
            }
        });
    } catch (error) {
        next(error);
    }
};


exports.deleteCustomer = async (req, res, next) => {
    try {
        const customer = await Customer.findById(req.params.id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        
        if (customer.documentIdProof && customer.documentIdProof.public_id) {
            await cloudinary.uploader.destroy(customer.documentIdProof.public_id);
        }
        if (customer.documentAddressProof && customer.documentAddressProof.public_id) {
            await cloudinary.uploader.destroy(customer.documentAddressProof.public_id);
        }

        await customer.deleteOne();
        res.status(200).json({ message: 'Customer removed successfully' });
    } catch (error) {
        next(error);
    }
};