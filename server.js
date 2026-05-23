const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
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

app.post('/approve-payment', async (req, res) => {
    try {
        const { paymentId } = req.body;
        console.log("Λήψη αιτήματος έγκρισης για Payment ID:", paymentId);
        
        const response = await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
            headers: { 'Authorization': `Key ${PI_API_KEY}` }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Σφάλμα στην έγκριση:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/complete-payment', async (req, res) => {
    try {
        const { paymentId, txid } = req.body;
        console.log("Λήψη αιτήματος ολοκλήρωσης. TXID:", txid);
        
        const response = await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, { txid }, {
            headers: { 'Authorization': `Key ${PI_API_KEY}` }
        });
        
        res.json(response.data);
    } catch (error) {
        console.error("Σφάλμα στην ολοκλήρωση:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// Αυτό χρειάζεται το Vercel για να μην βγάζει Internal Server Error
module.exports = app;
