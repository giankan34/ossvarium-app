async function loadOssvariumCatalog() {

    const response =
        await fetch("./data/releases.json");

    const staticReleases =
        await response.json();

    const approvedSubmissions =
        JSON.parse(
            localStorage.getItem(
                "ossvariumApprovedSubmissions"
            ) || "[]"
        );

    const approvedReleases =
        approvedSubmissions.map(item => ({

            ...item,

            price:
                item.price ??
                item.pricePi ??
                "",

            supporters:
                item.supporters ??
                0,

            description:
                item.description ??
                "",

            bio:
                item.bio ??
                "",

            tracks:
                item.tracks ??
                [],

            artistImage:
                item.artistImage ??
                "",

            banner:
                item.banner ??
                "",

            links:
                item.links ?? {
                    bandcamp: item.bandcamp ?? "",
                    spotify: item.spotify ?? "",
                    youtube: item.youtube ?? "",
                    website: item.website ?? "",
                    merch: item.merch ?? "",
                    instagram: item.instagram ?? "",
                    facebook: item.facebook ?? ""
                },

            similar:
                item.similar ??
                []

        }));

    return [
        ...staticReleases,
        ...approvedReleases
    ];
}