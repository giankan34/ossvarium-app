let ossvariumCatalogCachePromise = null;

async function loadOssvariumCatalog(forceRefresh = false) {
    if (!forceRefresh && ossvariumCatalogCachePromise) {
        return ossvariumCatalogCachePromise;
    }

    ossvariumCatalogCachePromise = (async () => {
        const staticResponse = await fetch("./data/releases.json");
        const staticReleases = await staticResponse.json();

        let approvedReleases = [];

        try {
            const approvedResponse = await fetch("/api/approved-relics");

            if (!approvedResponse.ok) {
                throw new Error("Approved relics API unavailable");
            }

            const approvedResult = await approvedResponse.json();

            if (!approvedResponse.ok) {
                throw new Error(
                    approvedResult.error || "Failed to load approved relics"
                );
            }

            approvedReleases = (approvedResult.relics || []).map(item => ({
                id: item.id,
                relicId: item.relic_id,
                creatorPiUid: item.creator_pi_uid ?? "",    
                artist: item.artist,
                release: item.release_title,
                country: item.country ?? "",
                genre: item.genre ?? "",
                year: item.release_year ?? "",
                description: item.description ?? "",
                bio: item.bio ?? "",
                cover: (item.artist && item.artist.toLowerCase() === "abominy") 
    ? "./images/abominy-cover.jpg" 
    : (item.cover ?? ""),

                            artistImage: (item.artist && item.artist.toLowerCase() === "sunken monolith")
                ? "./images/sunken-monolith-logo.png"
                : (item.artist_image ?? ""),
            banner: (item.artist && item.artist.toLowerCase() === "sunken monolith")
                ? "./images/sunken-monolith-banner.png"
                : (item.banner ?? ""),

                price: item.price_eur ?? 0,
                priceEur: item.price_eur ?? 0,
                pricePi: item.price_pi ?? 0,
                supporters: item.supporters ?? 0,
                links: item.links ?? {},
                publicEmail: item.publicEmail ?? "",
                tracks: item.tracks ?? [],
                similar: item.similar_artists ?? [],
                status: item.status
            }));

        } catch (error) {
            console.error("OSSVARIUM approved catalog error:", error);
        }

        return [
            ...staticReleases,
            ...approvedReleases
        ];
    })();

    return ossvariumCatalogCachePromise;
}
