const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

/**
 * Urls
 */

app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { user: user };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let id = generateRandomString();
  urlDatabase[id] = req.body.longURL;
  res.redirect(`/urls/${id}`);
});

/**
 * Urls/Id
 */

app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id], user: user };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

/**
 * Register
 */

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  
  // Catch users trying to use blank email or passwords
  if (req.body.email === '' || req.body.password === '') {
    return res.status(400).send('Please fill both email and password fields.');
  }

  // Catch users already in database
  if (getUserByEmail(req.body.email)) {
    return res.status(400).send('Email already exists. Please try a different email.');
  }

  const id = generateRandomString();
  const { email, password } = req.body;
  const user = { id, email, password };
  users[id] = user;
  res.cookie('user_id', id);
  res.redirect(`/urls`);
});

/**
 * Login
 */

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {

  const user = getUserByEmail(req.body.email);
 
  // Catch users not registered
  if (user === null) {
    return res.status(403).send('Email not found.');
  }

  // Check if passwords match
  if (user.password !== req.body.password) {
    return res.status(403).send('Incorrect password.');
  }
  
  res.cookie('user_id', user.id);
  res.redirect(`/urls`);
});

/**
 * Logout
 */

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

let generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

const getUserByEmail = function(email) {
  for (const item in users) {
    if (users[item].email === email) {
      return users[item];
    }
  }
  return null;
};