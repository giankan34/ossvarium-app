function loginWithPi(){

    const screen =
    document.getElementById(
        "screenText"
    );

    screen.innerText =
    "PI LOGIN COMING SOON";

}
const searchInput =
document.getElementById(
    "searchInput"
);

if(searchInput){

searchInput.addEventListener(
"input",
async function(){

const query =
this.value.toLowerCase();

const resultsBox =
document.getElementById(
"searchResults"
);

if(query.length < 2){

resultsBox.innerHTML = "";

return;

}

const response =
await fetch(
"./data/releases.json"
);

const releases =
await response.json();

const matches =
releases.filter(item =>

item.artist
.toLowerCase()
.includes(query)

||

item.release
.toLowerCase()
.includes(query)

);

resultsBox.innerHTML =

matches.map((item,index)=>`

<a
href="release.html?id=${index}"
class="search-card">

    <img
    src="${item.cover}"
    class="search-cover">

    <div>

        <div class="search-title">

            ${item.artist}

        </div>

        <div class="search-meta">

            ${item.release}
            •
            ${item.genre}

        </div>

    </div>

</a>

`).join("");

});

}
