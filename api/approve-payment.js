const axios = require('axios');
const PI_API_KEY = "g4h2yhzvzddsyprqwyjp5a6rekwqaznwlhwwuh1pjgu9kyb89jyofm7yhxourwyu";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'POST') {
        try {
            const { paymentId } = req.body;
            if (!paymentId) return res.status(400).json({ error: "Missing paymentId" });

            const response = await axios.post(
                `https://api.minepi.com/v2/payments/${paymentId}/approve`,
                {},
                { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
            );
            return res.status(200).json(response.data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    return res.status(405).send('Method Not Allowed');
};
