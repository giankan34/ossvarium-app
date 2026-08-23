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

        <div class="archive-record-header">
            <span>✦</span>
            <span>VERIFIED ARCHIVE RELIC</span>
            <span>✦</span>
        </div>

        <div class="archive-record">

            <div class="archive-cover">
                <img
                    src="${relic.cover}"
                    alt="${relic.artist} — ${relic.release}"
                >
            </div>

            <div class="archive-details">

                <div class="archive-label">
                    OFFICIAL OSSVARIUM RECORD
                </div>

                <h2>${relic.artist}</h2>

                <h3>${relic.release}</h3>

                <div class="archive-meta">

                    <p>
                        <span>RELIC ID</span>
                        <strong>${relic.relicId}</strong>
                    </p>

                    <p>
                        <span>YEAR</span>
                        <strong>${relic.year}</strong>
                    </p>

                    <p>
                        <span>ORIGIN</span>
                        <strong>${relic.country}</strong>
                    </p>

                    <p>
                        <span>CLASSIFICATION</span>
                        <strong>${relic.genre}</strong>
                    </p>

                </div>

            </div>

            <div class="verified-seal">
                <span>OSSVARIUM</span>
                <strong>VERIFIED</strong>
                <span>ARCHIVE</span>
            </div>

        </div>

        <div class="archive-confirmation">
            This relic is registered within the OSSVARIUM Archive.
        </div>

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