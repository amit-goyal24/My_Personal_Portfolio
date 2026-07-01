const path = require('path');
const fs = require('fs');

let db = null;
let useFallback = false;
const fallbackFilePath = path.join(__dirname, 'contact_submissions.json');

try {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'contact_submissions.db');
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Could not connect to SQLite database. Falling back to JSON file storage.', err);
      useFallback = true;
    } else {
      console.log('Connected to SQLite database: contact_submissions.db');
      db.run(`
        CREATE TABLE IF NOT EXISTS submissions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('Failed to create submissions table. Falling back to JSON file storage.', err);
          useFallback = true;
        }
      });
    }
  });
} catch (e) {
  console.warn('SQLite3 module failed to load. Falling back to JSON file storage.', e);
  useFallback = true;
}

function saveSubmission(data, callback) {
  const { name, email, subject, message } = data;
  if (!name || !email || !subject || !message) {
    return callback(new Error('All fields are required.'));
  }

  if (useFallback) {
    saveToJSON(data, callback);
  } else {
    const query = `INSERT INTO submissions (name, email, subject, message) VALUES (?, ?, ?, ?)`;
    db.run(query, [name, email, subject, message], function(err) {
      if (err) {
        console.error('SQLite insert error, attempting JSON fallback', err);
        saveToJSON(data, callback);
      } else {
        callback(null, this.lastID);
      }
    });
  }
}

function saveToJSON(data, callback) {
  try {
    let submissions = [];
    if (fs.existsSync(fallbackFilePath)) {
      const content = fs.readFileSync(fallbackFilePath, 'utf8');
      submissions = JSON.parse(content || '[]');
    }
    const newRecord = {
      id: submissions.length + 1,
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
      created_at: new Date().toISOString()
    };
    submissions.push(newRecord);
    fs.writeFileSync(fallbackFilePath, JSON.stringify(submissions, null, 2), 'utf8');
    console.log('Saved submission to fallback JSON file successfully.');
    callback(null, newRecord.id);
  } catch (err) {
    console.error('JSON fallback save error', err);
    callback(err);
  }
}

module.exports = {
  saveSubmission
};
