const BookInstance = require('../models/bookinstance');
const Book = require('../models/book');
const mongoose = require('mongoose');
const async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all BookInstances.
exports.bookinstance_list = (req, res) => {
    BookInstance.find()
    .populate('book')
    .exec((err, list_bookinstances) => {
        if (err) { return next(err); }
        // Successful, so render
        res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list: list_bookinstances });
    });    
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id);
    BookInstance.findById(id)
    .populate('book')
    .exec((err, bookinstance) => {
        if (err) { return next(err); }
        if (bookinstance==null) { // No results.
            let err = new Error('Book copy not found');
            err.status = 404;
            return next(err);
            }
        // Successful, so render.
        res.render('bookinstance_detail', { title: 'Book:', bookinstance:  bookinstance});
    });
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = (req, res) => {
    Book.find({},'title')
    .exec( (err, books) => {
        if (err) { return next(err); }
        // Successful, so render.
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list:books});
    });
    
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [

    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance(
            { 
                book: req.body.book,
                imprint: req.body.imprint,
                status: req.body.status,
                due_back: req.body.due_back
           });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
            .exec( (err, books) => {
                if (err) { return next(err); }
                // Successful, so render.
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            bookinstance.save( (err) => {
                if (err) { return next(err); }
                // Successful - redirect to new record.
                res.redirect(`/catalog/bookinstance/${bookinstance._id}`);
            });
        }
    }
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = (req, res) => {
    async.parallel({
        bookinstance: (callback) => {
            BookInstance.findById(req.params.id).exec(callback)
        },
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            res.redirect('/catalog/bookinstances');
        }
        // Successful, so render.
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: results.bookinstance } );
    });
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = (req, res, next) => {
    async.parallel({
        bookinstance: (callback) => {
            BookInstance.findById(req.body.bookinstanceid).exec(callback)
        },
    }, (err, results) => {
        if (err) { return next(err); }
        // Success
        if (results.bookinstance.length > 0) {
            // Books has genres. Render in same way as for GET route.
            res.render('bookinstance_delete', { title: 'Delete Instance', bookinstance: results.bookinstance } );
            return;
        }
        else {
            // Author has no books. Delete object and redirect to the list of authors.
            BookInstance.findByIdAndRemove(req.body.bookinstanceid,  deleteBookinstance = (err) => {
                if (err) { return next(err); }
                // Success - go to genres list
                res.redirect('/catalog/bookinstances')
            })
        }
    });
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = (req, res) => {
    // Get book, authors and genres for form.
    async.parallel({
        bookinstance: (callback) => {
            BookInstance.findById(req.params.id).populate('book_list').exec(callback);
        },
        book_list: (callback) => {
            Book.find(callback);
        },
    }, (err, results) => {
        if (err) { return next(err); }
        if (results.bookinstance==null) { // No results.
            let err = new Error('Bookinstance not found');
            err.status = 404;
            return next(err);
        }
        // Success.
        console.log(results.bookinstance)
        res.render('bookinstance_form', { title: 'Update Book Instance', book_list:results.book_list, bookinstance: results.bookinstance  });
    });
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
   
    // Validate fields.
    body('book', 'Book must be specified').isLength({ min: 1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min: 1 }).trim(),
    body('due_back', 'Invalid date').optional({ checkFalsy: true }).isISO8601(),
    
    // Sanitize fields.
    sanitizeBody('book').trim().escape(),
    sanitizeBody('imprint').trim().escape(),
    sanitizeBody('status').trim().escape(),
    sanitizeBody('due_back').toDate(),
    
    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        // Create a BookInstance object with escaped and trimmed data.
        const bookinstance = new BookInstance(
        { 
            book: req.body.book,
            imprint: req.body.imprint,
            status: req.body.status,
            due_back: req.body.due_back,
            _id:req.params.id
        });

        if (!errors.isEmpty()) {
            // There are errors. Render form again with sanitized values and error messages.
            Book.find({},'title')
            .exec( (err, books) => {
                if (err) { return next(err); }
                // Successful, so render.
                res.render('bookinstance_form', { title: 'Create BookInstance', book_list : books, selected_book : bookinstance.book._id , errors: errors.array(), bookinstance:bookinstance });
            });
            return;
        }
        else {
            // Data from form is valid.
            BookInstance.findByIdAndUpdate(req.params.id, bookinstance, {},  (err,thebookinstance) => {
                if (err) { return next(err); }
                // Successful - redirect to book detail page.
                res.redirect(`/catalog/bookinstances`);
            });
        }
    }
];
