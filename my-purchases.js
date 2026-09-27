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

purchasesContainer.innerHTML = `
    <p>
        PURCHASES FOUND:
        <strong>
            ${Array.isArray(result.purchases)
                ? result.purchases.length
                : 0}
        </strong>
    </p>
`;

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