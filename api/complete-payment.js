const axios = require("axios");

module.exports = async (req, res) => {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
        return res.status(400).json({
            error: "Missing paymentId or txid"
        });
    }

    try {

        const response = await axios.post(
            `https://api.minepi.com/v2/payments/${paymentId}/complete`,
            {
                txid: txid
            },
            {
                headers: {
                    Authorization: `Key ${process.env.PI_API_KEY}`
                }
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {

        console.error(
            "Pi complete payment error:",
            error.response?.data || error.message
        );

        return res.status(
            error.response?.status || 500
        ).json({
            error: "Payment completion failed",
            details: error.response?.data || error.message
        });
    }
};