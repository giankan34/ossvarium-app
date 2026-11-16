module.exports = async function handler(req, res) {
    if (req.method !== "GET") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    res.setHeader("Cache-Control", "public, s-maxage=120, stale-while-revalidate=300");

    let piEur = null;

    try {
        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=pi-network&vs_currencies=eur",
            { headers: { "User-Agent": "OSSVARIUM/1.0" }, signal: AbortSignal.timeout(4000) }
        );

        if (response.ok) {
            const data = await response.json();
            const rate = data?.["pi-network"]?.eur;
            if (rate && !isNaN(rate)) {
                piEur = Number(rate);
            }
        }
    } catch (e) {
        console.warn("CoinGecko rate fetch failed, trying Kraken fallback:", e.message);
    }

    if (!piEur) {
        try {
            const kRes = await fetch("https://api.kraken.com/0/public/Ticker?pair=PIEUR", {
                headers: { "User-Agent": "OSSVARIUM/1.0" },
                signal: AbortSignal.timeout(4000)
            });

            if (kRes.ok) {
                const kData = await kRes.json();
                const lastTrade = kData?.result?.PIEUR?.c?.[0];
                if (lastTrade && !isNaN(lastTrade)) {
                    piEur = Number(lastTrade);
                }
            }
        } catch (e) {
            console.warn("Kraken rate fetch failed:", e.message);
        }
    }

    if (!piEur || isNaN(piEur)) {
        return res.status(500).json({
            error: "Failed to load Pi rate"
        });
    }

    return res.status(200).json({
        success: true,
        piEur: piEur
    });
};
