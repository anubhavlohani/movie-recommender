import numpy as np
import pandas as pd
from flask import Flask
from logic import get_recommendations, get_movie_index
import difflib

data = pd.read_csv("final.csv")
data = data.fillna(value="")


app = Flask(__name__)
app.app_context().push()


@app.route("/", methods=["GET"])
def home():
    return "I see you've found this api 🦄. Welcome 🦚"

@app.route("/movie-names", methods=["GET"])
def movie_names():
    movie_names = data["original_title"].to_numpy().tolist()
    return {"movies": movie_names}


@app.route("/<movie_title>", methods=["GET"])
def search(movie_title):
    movie_title = movie_title.title()
    movie_exists = True
    if (get_movie_index(data, movie_title) is None):
        title_matches = difflib.get_close_matches(movie_title, data["original_title"], n=1)
        if len(title_matches) == 0:
            movie_exists = False
            movie_title = ""
        else:
            movie_title = title_matches[0]
    
    recommendations = []
    movie_details = {}
    if movie_title != "":
        recommendations = get_recommendations(data, movie_title, n=11)
    if len(recommendations) != 0:
        movie_idx = get_movie_index(data, movie_title)
        movie_details = {
            "movie_id": str(data["id"].iloc[get_movie_index(data, movie_title)]),
            "title": movie_title,
            "description": data["overview"].iloc[movie_idx],
            "director": data["director"].iloc[movie_idx],
            "year": str(data["year_of_release"].iloc[movie_idx]),
            "cast": data["cast"].iloc[movie_idx].split("|"),
            "cast_ids": data["cast_ids"].iloc[movie_idx].split("|"),
            "characters": data["characters"].iloc[movie_idx].split("|")
        }
    response_json = {"movie_exists": movie_exists, "movie_details":movie_details, "recommendations": recommendations}
    return response_json

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=8080,
        debug=True
    )