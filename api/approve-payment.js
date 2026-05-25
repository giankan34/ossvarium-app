const axios = require('axios');
const PI_API_KEY = "0576dd14a3bb49a6ac8833182fc1340522e2482bc223ab661b3c6f1bc28fdd4c06f7e80124436c0d98b3bc24a0b80d7e7d7bf80a9db3a106d8b17a999e5388ae
";

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
