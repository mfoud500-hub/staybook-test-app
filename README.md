# StayBook - Booking Test App

A simple hotel-booking-style web application built for software testing practice.
Includes signup, login, email/password validation, and a protected home page.

## Features

- Sign up with email and password
- Password validation: minimum 8 characters, uppercase, lowercase, number, special character
- Email format validation
- Duplicate email detection on signup
- Login with error messages for wrong email/password
- Session-based authentication
- Protected home page (redirects to login if not authenticated)
- SQLite database to store users (passwords are hashed with bcrypt)

## Requirements

- Node.js installed (version 16 or higher recommended)

## How to run locally

1. Open a terminal in this project folder.
2. Install dependencies:
   npm install
3. Start the server:
   npm start
4. Open your browser and go to:
   http://localhost:3000

The database file (users.db) will be created automatically the first time you run the app.

## Project structure

- server.js - main application logic (routes, validation, database)
- views/ - EJS templates (index, signup, login, home)
- public/style.css - styling
- package.json - dependencies

## Suggested test cases

- Sign up with a valid email and strong password (should succeed)
- Sign up with an invalid email format, e.g. "test@test" (should fail)
- Sign up with a password missing an uppercase letter (should fail)
- Sign up with a password missing a special character (should fail)
- Sign up with a password shorter than 8 characters (should fail)
- Sign up twice with the same email (should fail the second time)
- Log in with correct credentials (should succeed and redirect to /home)
- Log in with wrong password (should show an error, not log in)
- Log in with an email that was never registered (should show an error)
- Try to visit /home directly without logging in (should redirect to /login)
- Log out, then try the browser back button (should not show the home page)
