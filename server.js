const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const PI_API_KEY = "Xnjsidd7p8g1wfxlyhtrr3bm7ctmkf4lprvusgxjahllilko7030uqiptcjurymr"; 

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/validation-key.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'validation-key.txt'));
});

app.post('/approve-payment', async (req, res) => {
    try {
        const { paymentId } = req.body;
        console.log("Έγκριση πληρωμής για ID:", paymentId);
        
        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/approve`, 
            {}, 
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        
        return res.json(response.data);
    } catch (error) {
        console.error("Σφάλμα στην έγκριση:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

app.post('/complete-payment', async (req, res) => {
    try {
        const { paymentId, txid } = req.body;
        console.log("Ολοκλήρωση πληρωμής. TXID:", txid);
        
        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`, 
            { txid }, 
            { headers: { 'Authorization': `Key ${PI_API_KEY}` } }
        );
        
        return res.json(response.data);
    } catch (error) {
        console.error("Σφάλμα στην ολοκλήρωση:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = app;
