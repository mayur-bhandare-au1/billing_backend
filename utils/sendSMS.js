const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const sendSMS = async (phoneNumber, message) => {
    // Basic validation
    if (!phoneNumber || !message) {
        console.error("SMS Error: Phone number or message missing.");
        return false;
    }
    if (!process.env.MSG91_API_KEY || !process.env.SMS_SENDER_ID) {
        console.error("SM0S Error: MSG91_API_KEY or SMS_SENDER_ID is not configured in .env");
        return false;
    }

    try {
        // --- Example using Msg91 API v5 ---
        const url = 'https://api.msg91.com/api/v5/flow/'; // Flow ID based API is preferred
        const flowId = '687a6936d6fc05280772f642'; 

        const response = await axios.post(url, {
            flow_id: flowId,
            sender: process.env.SMS_SENDER_ID,
            mobiles: `91${phoneNumber}`, // Ensure correct country code prefix
            // Map parameters according to your Msg91 Flow's variables
            // Example: "VAR1": "Value1", "VAR2": "Value2"
            // For a simple text message, you might have a single variable like "message"
            VAR1: message // Assuming your flow has a variable named VAR1 for the message content
        }, {
            headers: {
                'authkey': process.env.MSG91_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.type === 'success') {
            console.log('SMS sent successfully via Msg91:', response.data);
            return true;
        } else {
            console.error('Msg91 SMS Send Failed:', response.data);
            return false;
        }

    } catch (error) {
        console.error('Error sending SMS via Msg91:', error.response ? error.response.data : error.message);
        return false;
    }
};

module.exports = sendSMS;