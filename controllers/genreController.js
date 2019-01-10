const Genre = require('../models/genre');
const Book = require('../models/book');
const async = require('async');
const mongoose = require('mongoose');

const { body, validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = (req, res) => {
    Genre.find()
    .sort([['name', 'ascending']])
    .exec((err, genre_list) => {
      if (err) { return next(err); }
      //Successful, so render
      res.render('genre_list', { title: 'Genre List', genre_list });
    });
};

// Display detail page for a specific Genre.
exports.genre_detail = (req, res, next) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    async.parallel({
        genre: (callback) => {
            Genre.findById(id)
              .exec(callback);
        },

        genre_books: (callback) => {
          Book.find({ 'genre': id })
          .exec(callback);
        },

    }, (err, results) => {
        if (err) { return next(err); }
        if (results.genre === null) { // No results.
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Display Genre create form on GET.
exports.genre_create_get = (req, res) => {
    res.render('genre_form', { title: 'Create Genre' });
};

// Handle Genre create on POST.
exports.genre_create_post =  [
   
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        const genre = new Genre(
            { name: req.body.name }
        );  
  
        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
            return;
        } else {
            // Data from form is valid.
            // Check if Genre with same name already exists.
            Genre.findOne({ 'name': req.body.name })
            .exec( (err, found_genre) => {
                if (err) { return next(err); }

                if (found_genre) {
                // Genre exists, redirect to its detail page.
                res.redirect(`/catalog/genre/${found_genre._id}`);
                }
                else {

                    genre.save((err) => {
                        if (err) { return next(err); }
                        // Genre saved. Redirect to genre detail page.
                        res.redirect(`/catalog/genre/${genre._id}`);
                    });
    
                }
    
            });
        }
    }
];

// Display Genre delete form on POST.
exports.genre_delete_post = (req, res) => {
    async.parallel({
        genre: (callback) => {
          Genre.findById(req.body.genreid).exec(callback)
        },
        genre_books: (callback) => {
          Book.find({ 'genre': req.body.genreid }).exec(callback)
        },
    }, (err, results) => {
        if (err) { return next(err); }
        // Success
        if (results.genre_books.length > 0) {
            // Books has genres. Render in same way as for GET route.
            res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            Genre.findByIdAndRemove(req.body.genreid,  deleteGenre = (err) => {
                if (err) { return next(err); }
                // Success - go to genres list
                res.redirect('/catalog/genres')
            })
        }
    });
};

// Handle Genre delete on GET.
exports.genre_delete_get = (req, res) => {
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback)
        },
        genre_books: (callback) => {
            Book.find({ 'genre': req.params.id }).exec(callback)
        },
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            res.redirect('/catalog/genres');
        }
        // Successful, so render.
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Display Genre update form on GET.
exports.genre_update_get = (req, res) => {
    // Get book, authors and genres for form.
    async.parallel({
        genre: (callback) => {
            Genre.findById(req.params.id).exec(callback)
        },
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.genre==null) { // No results.
            let err = new Error('Genre not found');
            err.status = 404;
            return next(err);
        }

        // Success.
        // Mark our selected genres as checked.
        
        res.render('genre_form', { title: 'Update Genre', genre: results.genre });
    });
};

// Handle Genre update on POST.
exports.genre_update_post = [
    // Validate fields.
    body('name').isLength({ min: 1 }).trim().withMessage('Name must be specified.')
        .isAlphanumeric().withMessage('Name has non-alphanumeric characters.'),
    // Sanitize fields.
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values/errors messages.
            res.render('genre_form', { title: 'Update Genre', genre: req.body, errors: errors.array() });
            return;
        }
        else {
            // Data from form is valid.
            const genre = new Genre({
                name: req.body.name,
                _id:req.params.id
            })

            Genre.findByIdAndUpdate(req.params.id, genre, {},  (err,thegenre) => {
                if (err) { return next(err); }
                // Successful - redirect to book detail page.
                res.redirect(`/catalog/genre/${thegenre._id}`);
            });
        }
    }
];
