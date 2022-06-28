import numpy as np


def get_set(s):
    return set(s.split("|"))

def cmn_tags_len(x, y, col_name):
    return len(get_set(x[col_name]).intersection(get_set(y[col_name])))

def get_movie_index(df, movie_title):
    x = df[df["original_title"] == movie_title]
    if len(x) != 0:
        return x.index[0]
    else:
        return None

def get_recommendations(df, movie_title, n=10):
    movie_idx = get_movie_index(df, movie_title)
    if movie_idx == None:
        print("No movie called {} found".format(movie_title))
        return
    scores = np.zeros(len(df))
    x = df.iloc[movie_idx]
    for i in range(len(df)):
        y = df.iloc[i]
        cmn_director = 1 if y["director"] == x["director"] else 0
        tags_score = 0.5*cmn_tags_len(x, y, "keywords") + 0.3*cmn_tags_len(x, y, "genres") + 0.2*cmn_tags_len(x, y, "cast") + 2*cmn_director
        rating_diff = -np.abs(x["vote_average"] - df.iloc[i]["vote_average"])
        scores[i] = round(tags_score + 0.1*rating_diff, 2)
    top_n_indices = np.argpartition(scores, -n)[-n:]
    recommendations = []
    for idx in top_n_indices:
        item = {
            "score": scores[idx],
            "id": str(df["id"].iloc[idx]),
            "title": df["original_title"].iloc[idx]
        }
        recommendations.append(item)
    recommendations = sorted(recommendations, key=lambda d: d["score"], reverse=True)
    # slicing to remove searched movie
    return recommendations[1:]