module.exports = async function handler(req, res) {

    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=eur"
        );

        if (!response.ok) {
            throw new Error(
                "Failed to fetch Pi rate"
            );
        }

        const data =
            await response.json();

        const piEur =
            data?.["pi-network"]?.eur;

        if (!piEur) {
            throw new Error(
                "Pi EUR rate unavailable"
            );
        }

        return res.status(200).json({
            success: true,
            piEur: piEur
        });

    } catch (error) {

        console.error(
            "OSSVARIUM Pi rate error:",
            error
        );

        return res.status(500).json({
            error: "Failed to load Pi rate"
        });
    }
};