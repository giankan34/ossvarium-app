const releaseContainer =
document.getElementById(
    "releaseContainer"
);

async function loadReleases(){

    try{

        const response =
        await fetch(
            './data/releases.json'
        );

        const releases =
        await response.json();

        releases.forEach(
        (release,index)=>{

            const card =
            document.createElement(
                "div"
            );

            card.className =
            "release-card";

            const unlocked =
            isUnlocked(index);

            const badgeClass =
            release.locked
            ? (
                unlocked
                ? "badge-unlocked"
                : "badge-premium"
            )
            : "badge-free";

            const badgeText =
            release.locked
            ? (
                unlocked
                ? "UNLOCKED"
                : `🔒 ${release.price} TEST PI`
            )
            : "FREE DEMO";

            card.innerHTML = `

                <div class="release-title">
                    ${release.release}
                </div>

                <div class="release-artist">
                    ${release.artist}
                </div>

                <div class="release-desc">
                    ${release.description}
                </div>

                <div class="release-desc">
                    ${release.genre}
                    •
                    ${release.year}
                </div>

                <div
                id="badge-${index}"
                class="badge ${badgeClass}">

                    ${badgeText}

                </div>

                ${
                    release.locked &&
                    !unlocked
                    ?
                    `
                    <button
                    class="btn btn-main"
                    onclick="openUnlock(${index})">

                    UNLOCK RELEASE

                    </button>
                    `
                    :
                    ''
                }

                <div
                id="unlock-${index}"
                class="unlock-box">

                    <button
                    class="btn btn-main"
                    onclick="triggerPiPayment(${index})">

                    PAY WITH TEST PI

                    </button>

                    <div
                    id="payment-${index}"
                    class="payment-status">

                    </div>

                </div>

                <div
                id="player-${index}"
                class="bandcamp-frame"
                style="
                display:
                ${
                    release.locked &&
                    !unlocked
                    ? "none"
                    : "block"
                };
                ">

                    ${
                        release.audio
                        ?
                        `
                        <audio
                        controls
                        style="
                        width:100%;
                        margin-top:10px;
                        ">

                            <source
                            src="${release.audio}"
                            type="audio/mpeg">

                        </audio>
                        `
                        :
                        ''
                    }

                    ${
                        release.bandcamp
                        ?
                        `
                        <iframe
                        style="height:120px;margin-top:15px;"
                        src="${release.bandcamp}"
                        seamless>
                        </iframe>
                        `
                        :
                        ''
                    }

                </div>

            `;

            releaseContainer.appendChild(
                card
            );

        });

    }catch(error){

        console.error(error);

    }

}

loadReleases();
