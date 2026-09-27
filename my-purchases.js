document.addEventListener("DOMContentLoaded", async () => {
    const purchasesContainer =
        document.getElementById("purchasesContainer");

    try {
        const scopes = ["username"];

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