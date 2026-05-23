const axios = require('axios');

const PI_API_KEY = "Xnjsidd7p8g1wfxlyhtrr3bm7ctmkf4lprvusgxjahllilko7030uqiptcjurymr";

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { method, url } = req;

    // ΕΓΚΡΙΣΗ ΠΛΗΡΩΜΗΣ (POST /api/server?endpoint=approve)
    if (method === 'POST' && url.includes('endpoint=approve')) {
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

    // ΟΛΟΚΛΗΡΩΣΗ ΠΛΗΡΩΜΗΣ (POST /api/server?endpoint=complete)
    if (method === 'POST' && url.includes('endpoint=complete')) {
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

    return res.status(404).send('Not Found');
};
