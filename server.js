const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Σερβίρισμα των στατικών αρχείων (index.html, validation-key.txt κλπ) από τον φάκελό σου
app.use(express.static(path.join(__dirname)));

// Εδώ βάζεις το δικό σου API Key από το Pi Developer Portal
const PI_API_KEY = "σου έχω στείλει το key σου, αν δεν το έχεις βάλει άφησέ το έτσι για δοκιμή"; 

// Αρχική σελίδα - Εμφάνιση του index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
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
        console.error("Σφάλma στην ολοκλήρωση:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log('=== Ο ΠΥΡΑΥΛΟΣ ΕΚΤΟΞΕΥΘΗΚΕ ===');
    console.log(`Server running on port ${PORT}`);
});