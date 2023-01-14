const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers.js');

////////////////////////////////////////////////////////////
// Configuration
////////////////////////////////////////////////////////////

const app = express();
const PORT = 8080;

// configure view engine
app.set("view engine", "ejs");

////////////////////////////////////////////////////////////
// Middleware
////////////////////////////////////////////////////////////

app.use(cookieSession({
  name: 'session',
  keys: ['light', 'house', 'labs'],
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: true }));

////////////////////////////////////////////////////////////
// Database
////////////////////////////////////////////////////////////

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
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

////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////

// GET /
app.get("/", (req, res) => {
  const user = users[req.session["user_id"]];
  if (user) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// GET /login
app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];
  if (user) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: user };
    res.render("login", templateVars);
  }
});

// POST /login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, users);
 
  // Return error message if email doesn't exist
  if (!user) {
    return res.status(403).send("User does not exist.");
  }

  // Return error message if passwords don't match
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Incorrect password. Please try again.");
  }
  
  // Set cookie and redirect
  req.session["user_id"] = user.id;
  res.redirect('/urls');
});

// GET /register
app.get("/register", (req, res) => {
  const user = users[req.session["user_id"]];
  if (user) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: user };
    res.render("register", templateVars);
  }
});

// POST /register
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Return error message if email or password are empty
  if (email === '' || password === '') {
    return res.status(400).send('Please fill both email and password fields.');
  }

  // Return error message if email already exists
  if (getUserByEmail(email, users)) {
    return res.status(400).send('Email already exists. Please try a different email.');
  }

  // Create a new user
  const id = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = { id: id, email: email, password: hashedPassword };
  users[id] = user;

  // Set cookie and redirect
  req.session["user_id"] = id;
  res.redirect('/urls');
});

// POST /logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// GET /urls
app.get("/urls", (req, res) => {
  const user = users[req.session["user_id"]];

  // Return error message if the user is not logged in
  if (!user) {
    return res.status(400).send('You are not logged in. Please log in or register to continue.');
  }

  const urls = urlsForUser(user.id);
  const templateVars = { urls: urls, user: user };
  res.render("urls_index", templateVars);
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  const user = users[req.session["user_id"]];

  // Redirect if the user is not logged in
  if (!user) {
    res.redirect("/login");
  }

  const templateVars = { user: user };
  res.render("urls_new", templateVars);

});

// POST /urls
app.post("/urls", (req, res) => {
  const user = users[req.session["user_id"]];

  // Return error message if the user is not logged in
  if (!user) {
    return res.status(400).send('Unable to shorten URL since you are not logged in.');
  }

  // Creates new URL and redirects
  const id = generateRandomString();
  urlDatabase[id] = { longURL: req.body.longURL, userID: user.id };
  res.redirect(`/urls/${id}`);
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {

  // Return error message if id does not exist
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.status(400).send('Sorry, this URL does not exist.');
  }
  
  const user = users[req.session["user_id"]];
  
  // Return error message if the user is not logged in
  if (!user) {
    return res.status(400).send('You are not logged in.');
  }
  
  const urls = urlsForUser(user.id);
  const url = urls[req.params.id];
  
  // Return error message if the user does not own the URL
  if (!url) {
    return res.status(400).send('You do not have permission to perform this action.');
  }

  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: user };
  res.render("urls_show", templateVars);
});

// POST /urls/:id
app.post("/urls/:id", (req, res) => {

  // Return error message if id does not exist
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.status(400).send('Sorry, this URL does not exist.');
  }
  
  const user = users[req.session["user_id"]];
  
  // Return error message if the user is not logged in
  if (!user) {
    return res.status(400).send('You are not logged in.');
  }
  
  const urls = urlsForUser(user.id);
  const url = urls[req.params.id];
  
  // Return error message if the user does not own the URL
  if (!url) {
    return res.status(400).send('You do not have permission to perform this action.');
  }

  // Update URL and redirect
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls');
});

// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {

  // Return error message if id does not exist
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.status(400).send('Sorry, this URL does not exist.');
  }
  
  const user = users[req.session["user_id"]];
  
  // Return error message if the user is not logged in
  if (!user) {
    return res.status(400).send('You are not logged in.');
  }
  
  const urls = urlsForUser(user.id);
  const url = urls[req.params.id];
  
  // Return error message if the user does not own the URL
  if (!url) {
    return res.status(400).send('You do not have permission to perform this action.');
  }

  // Delete URL and redirect
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// GET /u/:id
app.get("/u/:id", (req, res) => {

  // Return error message if URL for the given ID does not exist
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.status(400).send('Sorry, this URL does not exist.');
  }

  // Redirect to corresponding long URL
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});