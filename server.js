const axios = require('axios');
const fs = require('fs');
const path = require('path');

const PI_API_KEY = "Xnjsidd7p8g1wfxlyhtrr3bm7ctmkf4lprvusgxjahllilko7030uqiptcjurymr";

module.exports = async (req, res) => {
    // Ρύθμιση CORS Headers για το Pi Network
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Διαχείριση Preflight αιτημάτων (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, url } = req;

    // 1. Αρχική Σελίδα (GET /)
    if (method === 'GET' && (url === '/' || url === '/index.html')) {
        const filePath = path.join(process.cwd(), 'index.html');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(fileContent);
    }

    // 2. Validation Key (GET /validation-key.txt)
    if (method === 'GET' && url.includes('validation-key.txt')) {
        const filePath = path.join(process.cwd(), 'validation-key.txt');
        const fileContent = fs.readFileSync(filePath, 'utf8');
        res.setHeader('Content-Type', 'text/plain');
        return res.status(200).send(fileContent);
    }

    // 3. ΕΓΚΡΙΣΗ ΠΛΗΡΩΜΗΣ (POST /approve-payment)
    if (method === 'POST' && url.includes('approve-payment')) {
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

    // 4. ΟΛΟΚΛΗΡΩΣΗ ΠΛΗΡΩΜΗΣ (POST /complete-payment)
    if (method === 'POST' && url.includes('complete-payment')) {
        try {
            const { paymentId, txid } = req.body;
            if (!paymentId || !txid) return res.status(400).json({ error: "Missing paymentId or txid" });

            const response = await axios.post(
                `https://api.minepi.com/v2/payments/${paymentId}/complete`,
                { txid },
                { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
            );
            return res.status(200).json(response.data);
        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    // Αν χτυπήσει σε άλλη διαδρομή
    return res.status(404).send('Not Found');
};
