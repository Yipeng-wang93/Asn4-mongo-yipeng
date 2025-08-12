const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');
const exphbs = require('express-handlebars');
const path = require('path');
require('dotenv').config();
const app = express();
const database = require('./config/database');
const port = process.env.PORT || 8000;

// Handlebars setup
app.engine('handlebars', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    extname: '.handlebars',
    helpers: {
        json: function(context) {
            return JSON.stringify(context, null, 2);
        }
    }
}));
app.set('view engine', 'handlebars');
app.set('views', path.join(__dirname, 'views'));
// Middleware
app.use(bodyParser.urlencoded({'extended':'true'}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(database.url)
    .then(() => console.log('MongoDB Connected to MovieDB'))
    .catch(err => console.log('Database connection error:', err));

const Movie = require('./models/movie');

// HTML Routes for UI
app.get('/', (req, res) => {
    res.render('home', { title: 'Movie Database Management System' });
});

app.get('/movies/all', async (req, res) => {
    try {
        const movies = await Movie.find().limit(20).lean();
        res.render('moviesList', { 
            title: 'All Movies',
            movies: movies 
        });
    } catch(err) {
        res.render('error', { 
            title: 'Error',
            message: 'Error fetching movies',
            error: err.message 
        });
    }
});

app.get('/movies/search', (req, res) => {
    res.render('searchMovie', { title: 'Search Movie' });
});

app.get('/movies/add', (req, res) => {
    res.render('addMovie', { title: 'Add New Movie' });
});

app.get('/movies/update/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id).lean();
        if (!movie) {
            return res.render('error', { 
                title: 'Error',
                message: 'Movie not found' 
            });
        }
        res.render('updateMovie', { 
            title: 'Update Movie',
            movie: movie 
        });
    } catch(err) {
        res.render('error', { 
            title: 'Error',
            message: 'Error fetching movie',
            error: err.message 
        });
    }
});

// API Routes

// Get movie by Movie_ID
app.get('/api/movies/movieid/:movie_id', async (req, res) => {
    try {
        const movie = await Movie.findOne({ Movie_ID: req.params.movie_id });
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        res.json({
            success: true,
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching movie',
            error: err.message
        });
    }
});

// Get movie by title
app.get('/api/movies/title/:title', async (req, res) => {
    try {
        const movie = await Movie.findOne({ 
            Title: new RegExp(req.params.title, 'i') 
        });
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        res.json({
            success: true,
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching movie',
            error: err.message
        });
    }
});

// Get movie by MongoDB _id
app.get('/api/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findById(req.params.id);
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        res.json({
            success: true,
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching movie',
            error: err.message
        });
    }
});

// Get all movies
app.get('/api/movies', async (req, res) => {
    try {
        const movies = await Movie.find().limit(50);
        res.json({
            success: true,
            count: movies.length,
            data: movies
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error fetching movies',
            error: err.message
        });
    }
});

// Create new movie with validation
app.post('/api/movies', [
    body('Movie_ID').isNumeric().withMessage('Movie_ID must be a number'),
    body('Title').notEmpty().withMessage('Title is required'),
    body('Year').optional().isNumeric().withMessage('Year must be a number'),
    body('imdbRating').optional().isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    try {
        const existingMovie = await Movie.findOne({ Movie_ID: req.body.Movie_ID });
        if (existingMovie) {
            return res.status(400).json({
                success: false,
                message: 'Movie with this Movie_ID already exists'
            });
        }

        const movie = await Movie.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Movie created successfully',
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error creating movie',
            error: err.message
        });
    }
});

// Update movie by _id
app.put('/api/movies/:id', [
    body('Title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('Released').optional().notEmpty().withMessage('Released date cannot be empty')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ 
            success: false,
            errors: errors.array() 
        });
    }

    try {
        const movie = await Movie.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Movie updated successfully',
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error updating movie',
            error: err.message
        });
    }
});

// Update movie by Movie_ID
app.put('/api/movies/movieid/:movie_id', async (req, res) => {
    try {
        const movie = await Movie.findOneAndUpdate(
            { Movie_ID: req.params.movie_id },
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Movie updated successfully',
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error updating movie',
            error: err.message
        });
    }
});

// Delete movie by _id
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const movie = await Movie.findByIdAndDelete(req.params.id);
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Movie deleted successfully',
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error deleting movie',
            error: err.message
        });
    }
});

// Delete movie by Movie_ID
app.delete('/api/movies/movieid/:movie_id', async (req, res) => {
    try {
        const movie = await Movie.findOneAndDelete({ Movie_ID: req.params.movie_id });
        
        if (!movie) {
            return res.status(404).json({
                success: false,
                message: 'Movie not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Movie deleted successfully',
            data: movie
        });
    } catch(err) {
        res.status(500).json({
            success: false,
            message: 'Error deleting movie',
            error: err.message
        });
    }
});

// Form submission routes
app.post('/movies/add', async (req, res) => {
    try {
        const movie = await Movie.create(req.body);
        res.redirect('/movies/all');
    } catch(err) {
        res.render('error', { 
            title: 'Error',
            message: 'Error adding movie',
            error: err.message 
        });
    }
});

app.post('/movies/update/:id', async (req, res) => {
    try {
        await Movie.findByIdAndUpdate(req.params.id, req.body);
        res.redirect('/movies/all');
    } catch(err) {
        res.render('error', { 
            title: 'Error',
            message: 'Error updating movie',
            error: err.message 
        });
    }
});

app.post('/movies/search', async (req, res) => {
    try {
        let movie;
        if (req.body.searchType === 'id') {
            movie = await Movie.findById(req.body.searchValue).lean();
        } else if (req.body.searchType === 'movieId') {
            movie = await Movie.findOne({ Movie_ID: req.body.searchValue }).lean();
        } else if (req.body.searchType === 'title') {
            movie = await Movie.findOne({ 
                Title: new RegExp(req.body.searchValue, 'i') 
            }).lean();
        }
        
        if (!movie) {
            return res.render('searchMovie', { 
                title: 'Search Movie',
                error: 'Movie not found' 
            });
        }
        
        res.render('movieDetail', { 
            title: movie.Title,
            movie: movie 
        });
    } catch(err) {
        res.render('error', { 
            title: 'Error',
            message: 'Error searching movie',
            error: err.message 
        });
    }
});

app.listen(port);
console.log("App listening on port : " + port);