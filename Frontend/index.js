const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const axios = require("axios");
require("dotenv").config()

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, "public")));

const tmdb_url = "https://api.themoviedb.org/3/movie/";
const image_base_url = "https://image.tmdb.org/t/p/original";
const youtube_search_url = "https://www.googleapis.com/youtube/v3/search";
const cast_base_url = "https://api.themoviedb.org/3/person/";

const flask_url = process.env.FLASK_URL;
const tmdb_api_key = process.env.TMDB_API_KEY;
const youtube_api_key = process.env.YOUTUBE_API_KEY;


// server elements

app.get("/", (req, res) => {
    res.render("home", {movieNotFound: false});
});


app.post("/", async (req, res) => {
    try {
        var userInput = req.body.movie_title;
        userInput = userInput.toLowerCase();
        var movieIds = [];
        var movieTitles = [];
        var posterRequests = [];
        var moviePosters = [];
        
        // getting searched movie details and recommendations from Flask API
        var url = flask_url + userInput;
        var flaskRes = await axios.get(url);
        var movieDetails = flaskRes.data.movie_details;
        var recommendations = flaskRes.data.recommendations;
        for (let i = 0; i < recommendations.length; i++) {
            const element = recommendations[i];
            movieIds.push(element.id);
            movieTitles.push(element.title);
            posterRequests.push(axios.get(tmdb_url + element.id + "/images?api_key=" + tmdb_api_key));
        }

        // getting movie posters from TMDB API
        var posterResponses = await axios.all(posterRequests);
        for (let i = 0; i < posterResponses.length; i++) {
            const element = posterResponses[i].data.posters;
            for (let j = 0; j < element.length; j++) {
                const poster = element[j];
                if (poster.iso_639_1 == "en" && poster.height <= 1500) {
                    moviePosters.push(image_base_url + poster.file_path);
                    break;
                }
            }
        }

        // getting poster for searched movie
        var searchedMovieResponse = await axios.get(tmdb_url + movieDetails.movie_id + "/images?api_key=" + tmdb_api_key);
        var searchedMoviePosters = searchedMovieResponse.data.posters;
        for (let i = 0; i < searchedMoviePosters.length; i++) {
            const element = searchedMoviePosters[i];
            if (element.iso_639_1 == "en" && element.height <= 1500) {
                movieDetails.poster = image_base_url + element.file_path;
                break;
            }
        }

        // getting cast images for searched movie
        var castRequests = [];
        var castImages = [];
        for (let i = 0; i < movieDetails.cast_ids.length; i++) {
            const person_id = movieDetails.cast_ids[i];
            castRequests.push(axios.get(cast_base_url + person_id + "/images?api_key=" + tmdb_api_key));
        }
        var castResponses = await axios.all(castRequests);
        for (let i = 0; i < castResponses.length; i++) {
            const element = castResponses[i].data;
            castImages.push(image_base_url + element.profiles[0].file_path);
        }
        movieDetails.castImages = castImages;

        // getting youtube videoId for searched movie trailer
        var youtubeApiUrl = `${youtube_search_url}?key=${youtube_api_key}&data=snipper&type=video&maxResults=1&q=`;
        var searchedMovieResponse = await axios.get(youtubeApiUrl + movieDetails.title + movieDetails.year + " trailer");
        movieDetails.videoId = searchedMovieResponse.data.items[0].id.videoId;

        for (let i = 0; i < recommendations.length; i++) {
            const element = recommendations[i];
            recommendations[i] = element.title;
        }

        res.render("results", {movieDetails: movieDetails, moviePosters: moviePosters, recommendations: recommendations});
    }
    catch (error) {
        res.render("home", {movieNotFound: true});
    }
});


app.listen(port, () => {
    console.log(`Server started on port ${port}`);
})