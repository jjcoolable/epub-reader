// db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'BeetleJuice96',
  database: 'epub_library',
  connectionLimit: 10,
});

module.exports = pool;