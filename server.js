const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

// Ρύθμιση CORS για να δέχεται αιτήματα από το Pi Network χωρίς περιορισμούς
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Σερβίρισμα των στατικών αρχείων
app.use(express.static(path.join(__dirname)));

// Το επίσημο Server API Key σου
const PI_API_KEY = "Xnjsidd7p8g1wfxlyhtrr3bm7ctmkf4lprvusgxjahllilko7030uqiptcjurymr"; 

// Αρχική σελίδα
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint για το validation key
app.get('/validation-key.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'validation-key.txt'));
});

// ΕΓΚΡΙΣΗ ΠΛΗΡΩΜΗΣ
app.post('/approve-payment', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) {
            return res.status(400).json({ error: "Missing paymentId" });
        }
        
        console.log("Έγκριση πληρωμής για ID:", paymentId);
        
        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`, 
            {}, 
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        
        return res.json(response.data);
    } catch (error) {
        console.error("Σφάλμα στην έγκριση:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: error.message });
    }
});

// ΟΛΟΚΛΗΡΩΣΗ ΠΛΗΡΩΜΗΣ
app.post('/complete-payment', async (req, res) => {
    try {
        const { paymentId, txid } = req.body;
        if (!paymentId || !txid) {
            return res.status(400).json({ error: "Missing paymentId or txid" });
        }
        
        console.log("Ολοκλήρωση πληρωμής. TXID:", txid);
        
        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`, 
            { txid }, 
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        
        return res.json(response.data);
    } catch (error) {
        console.error("Σφάλμα στην ολοκλήρωση:", error.response ? error.response.data : error.message);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = app;
