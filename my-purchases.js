Pi.init({
    version: "2.0"
});

document.addEventListener("DOMContentLoaded", () => {
    const purchasesContainer =
        document.getElementById("purchasesContainer");

    const connectButton =
        document.getElementById("connectButton");

    connectButton.addEventListener(
        "click",
        async function () {

            connectButton.disabled = true;
            connectButton.textContent = "π CONNECTING...";

            try {
        const scopes = ["username", "wallet_address"];

        const auth = await Pi.authenticate(
            scopes,
            function (payment) {
                console.log(
                    "Incomplete payment found:",
                    payment
                );
            }
        );

        const response = await fetch(
            "/api/my-purchases",
            {
                headers: {
                    Authorization:
                        `Bearer ${auth.accessToken}`
                }
            }
        );

        const result = await response.json();

        connectButton.textContent = "π PI ACCOUNT CONNECTED";

const purchases =
    Array.isArray(result.purchases)
        ? result.purchases
        : [];

if (purchases.length === 0) {
    purchasesContainer.innerHTML =
        "<p>NO PURCHASES YET.</p>";
} else {
    purchasesContainer.innerHTML =
        purchases.map(purchase => {

            const amountPi =
                Number(
                    purchase.amount_pi || 0
                ).toFixed(4);

            const date =
                purchase.created_at
                    ? new Date(
                        purchase.created_at
                    ).toLocaleDateString()
                    : "-";

            return `
                <div class="purchase-card">
                    <h2>
                        ${purchase.track_title || "UNKNOWN TRACK"}
                    </h2>

                    <p>
                        ${purchase.relic_id || ""}
                    </p>

                    <p>
                        PAID:
                        <strong>${amountPi} Pi</strong>
                    </p>

                    <p>
                        PURCHASED:
                        <strong>${date}</strong>
                    </p>
                </div>
            `;
        }).join("");
}
        console.log(
            "MY PURCHASES:",
            result
        );

    } catch (error) {
        console.error(
            "Could not load purchases:",
            error
        );

        purchasesContainer.innerHTML =
            "<p>COULD NOT LOAD YOUR PURCHASES.</p>";
    }

    });

});