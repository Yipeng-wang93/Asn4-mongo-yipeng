const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MovieSchema = new Schema({
    Movie_ID: { type: Number, required: true, unique: true },
    Title: { type: String, required: true },
    Year: Number,
    Rated: String,
    Released: String,
    Runtime: String,
    Genre: String,
    Director: String,
    Writer: String,
    Actors: String,
    Plot: String,
    Language: String,
    Country: String,
    Awards: String,
    Poster: String,
    "Ratings.Source": String,
    "Ratings.Value": String,
    Metascore: String,
    imdbRating: Number,
    imdbVotes: String,
    imdbID: String,
    Type: String,
    DVD: String,
    BoxOffice: String,
    Production: String,
    Website: String,
    Response: Boolean
});

module.exports = mongoose.model('Movie', MovieSchema);