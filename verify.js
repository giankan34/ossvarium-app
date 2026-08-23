const relicInput = document.getElementById("relicInput");
const verifyBtn = document.getElementById("verifyBtn");
const verifyResult = document.getElementById("verifyResult");

verifyBtn.addEventListener("click", async () => {

    const relicId = relicInput.value
        .trim()
        .toUpperCase();

    if (!relicId) {

        verifyResult.innerHTML =
            "<p>ENTER A RELIC ID.</p>";

        return;
    }

    try {

        const response = await fetch("data/releases.json");

        if (!response.ok) {
            throw new Error("Archive data unavailable");
        }

        const releases = await response.json();

        const relic = releases.find(
            item =>
                item.relicId &&
                item.relicId.toUpperCase() === relicId
        );

        if (!relic) {

            verifyResult.innerHTML = `
                <div class="verification-failed">

                    <h2>RELIC NOT FOUND</h2>

                    <p>
                        No Archive record exists
                        for ${relicId}.
                    </p>

                </div>
            `;

            return;
        }

        verifyResult.innerHTML = `
            <div class="verification-success">

                <div class="verification-status">
                    ✦ VERIFIED ARCHIVE RELIC ✦
                </div>

                <h2>${relic.artist}</h2>

                <h3>${relic.release}</h3>

                <p><strong>RELIC ID:</strong> ${relic.relicId}</p>
                <p><strong>YEAR:</strong> ${relic.year}</p>
                <p><strong>COUNTRY:</strong> ${relic.country}</p>
                <p><strong>CLASSIFICATION:</strong> ${relic.genre}</p>

            </div>
        `;

    } catch (error) {

        console.error(error);

        verifyResult.innerHTML = `
            <div class="verification-failed">

                <h2>ARCHIVE UNAVAILABLE</h2>

                <p>
                    The Archive record could not be accessed.
                </p>

            </div>
        `;

    }

});