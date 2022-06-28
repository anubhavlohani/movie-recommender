const input = document.getElementById("input");
const matchList = document.getElementById("autocomplete");
const posters = document.getElementsByClassName("poster-image");

// Search movies and filter it
const searchMovies = async currentInput => {
    const res = await fetch("movies.json");
    const parsed_json = await res.json();
    const movies = parsed_json.movies;
    
    // Get matches for current input
    let matches = movies.filter(movie => {
        const regex = new RegExp(`^${currentInput}`, 'gi');
        return movie.name.match(regex);
    })

    if (currentInput.length === 0) {
        matches = [];
        matchList.innerHTML = "";
    }
    
    outputHTML(matches);
};

// Show results in HTML
const outputHTML = matches => {
    if (matches.length > 0) {
        // .map() returns an array
        const html = matches.map(match => `
            <div class="autocomplete-items"><a>${match.name}</a></div>
        `).join('');
        
        matchList.innerHTML = html;

        for (let i = 0; i < matchList.childNodes.length; i++) {
            const div = matchList.childNodes[i];
            div.addEventListener("click", (e) => {
                input.value = e.target.textContent;
            })
        }
    }
    else {
        matchList.innerHTML = "";
    }
};

for (let i = 0; i < posters.length; i++) {
    const poster = posters[i];
    poster.addEventListener("click", (e) => {
        input.value = e.target.alt;
        document.getElementsByClassName("btn")[0].click();
    })
};

input.addEventListener("input", () => {
    searchMovies(input.value);
});

document.addEventListener("click", () => {
    matchList.innerHTML = "";
});