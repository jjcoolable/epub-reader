// app.js
const express = require('express');
const multer = require('multer');
const ejs = require('ejs');
const path = require('path');
const fs = require('fs').promises;
const { JSDOM } = require('jsdom');
const ePub = require('epubjs');
const { createObjectURL } = require('blob-util');

const pool = require('./db');

const app = express();

// Set EJS as view engine
app.set('view engine', 'ejs');
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

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
