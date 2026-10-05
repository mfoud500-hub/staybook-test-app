const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// ---------- Database setup ----------
const db = new sqlite3.Database('./users.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
});

// ---------- Middleware ----------
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'test-app-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

function requireLogin(req, res, next) {
  if (!req.session.userEmail) {
    return res.redirect('/login');
  }
  next();
}

// ---------- Validation helpers ----------
function isValidEmail(email) {
  // basic email format check: something@something.something
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    errors.push('Password must contain at least one special character (e.g. ! @ # $ %).');
  }
  return errors;
}

// ---------- Routes ----------

// Home / landing
app.get('/', (req, res) => {
  res.render('index', { userEmail: req.session.userEmail || null });
});

// --- Signup ---
app.get('/signup', (req, res) => {
  res.render('signup', { errors: [], oldEmail: '' });
});

app.post('/signup', (req, res) => {
  const { email, password, confirmPassword } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Please enter a valid email address (e.g. name@example.com).');
  }

  const passwordErrors = validatePassword(password);
  errors.push(...passwordErrors);

  if (password !== confirmPassword) {
    errors.push('Password and confirmation password do not match.');
  }

  if (errors.length > 0) {
    return res.render('signup', { errors, oldEmail: email || '' });
  }

  // Check if email already exists
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
    if (row) {
      return res.render('signup', {
        errors: ['An account with this email already exists.'],
        oldEmail: email
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword], function (err) {
      if (err) {
        return res.render('signup', { errors: ['Something went wrong. Please try again.'], oldEmail: email });
      }
      req.session.userEmail = email;
      res.redirect('/home');
    });
  });
});

// --- Login ---
app.get('/login', (req, res) => {
  res.render('login', { errors: [], oldEmail: '' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || !isValidEmail(email)) {
    errors.push('Please enter a valid email address.');
  }
  if (!password) {
    errors.push('Please enter your password.');
  }

  if (errors.length > 0) {
    return res.render('login', { errors, oldEmail: email || '' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (!user) {
      return res.render('login', { errors: ['Incorrect email or password.'], oldEmail: email });
    }

    const match = bcrypt.compareSync(password, user.password);
    if (!match) {
      return res.render('login', { errors: ['Incorrect email or password.'], oldEmail: email });
    }

    req.session.userEmail = user.email;
    res.redirect('/home');
  });
});

// --- Home (protected) ---
app.get('/home', requireLogin, (req, res) => {
  res.render('home', { userEmail: req.session.userEmail });
});

// --- Logout ---
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
