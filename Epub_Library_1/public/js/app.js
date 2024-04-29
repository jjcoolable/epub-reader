var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var www = require('./bin/www');
const ejs = require('ejs');
const fs = require('fs').promises;
const { JSDOM } = require('jsdom');
const ePub = require('epubjs');
const { createObjectURL } = require('blob-util');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Multer configuration for file upload
const upload = multer({
  dest: 'uploads/',
  fileFilter: (req, file, cb) => {
    if (!file.originalname.match(/\.(epub)$/)) {
      return cb(new Error('Please upload an EPUB file'));
    }
    cb(null, true);
  },
});

//app.use('/', indexRouter);

// Home route
app.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books');
    res.render('index', { books: rows });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

//app.use('/users', usersRouter);

// Upload route
app.post('/upload', upload.single('epubFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }
    const { originalname, filename } = req.file;
    console.log('Uploaded file:', originalname);

    // Read the EPUB file
    const epubData = await fs.readFile(`uploads/${filename}`);
    console.log('File read:', originalname);

    // Create book object using epubjs.Reader()
    const dom = new JSDOM();
    const window = dom.window;
    global.window = window;
    global.document = window.document;

    const book = new ePub.Book();
    console.log('Created book object1:');
    await book.open(epubData);
    console.log('Created book object:', book);

    // Extract metadata
    const { title, author, description } = book.package.metadata;
    console.log('Extracted metadata:', title, author, description);

    // Insert into database
    await pool.query('INSERT INTO books (title, author, description, file_name) VALUES (?, ?, ?, ?)', [title, author, description, originalname]);
    console.log('Inserted into database');

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// View book route
app.get('/book/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).send('Book not found');
    }
    
    const book = ePub();
    const epubData = await fs.readFile(`uploads/${rows[0].file_name}`);
    await book.open(epubData);
    const toc = await book.getToc();

    res.render('book', { book: rows[0], toc });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
