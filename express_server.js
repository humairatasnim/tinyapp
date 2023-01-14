const express = require("express");
const cookieParser = require('cookie-parser');

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

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

////////////////////////////////////////////////////////////
// Database
////////////////////////////////////////////////////////////

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

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
    password: "123",
    // password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

////////////////////////////////////////////////////////////
// Helpers
////////////////////////////////////////////////////////////

const generateRandomString = () => {
  return Math.random().toString(16).slice(2, 8);
};

const getUserByEmail = (email) => {
  for (const userId in users) {
    if (users[userId].email === email) {
      return users[userId];
    }
  }
  return null;
};

const urlsForUser = (id) => {
  let filteredURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      filteredURLs[url] = urlDatabase[url];
    }
  }
  return filteredURLs;
};

////////////////////////////////////////////////////////////
// Routes
////////////////////////////////////////////////////////////

// GET /
app.get("/", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

// GET /login
app.get("/login", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    const user = users[req.cookies.user_id];
    const templateVars = { user: user };
    res.render("login", templateVars);
  }
});

// POST /login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email);
 
  // Catch users not registered
  if (!user) {
    return res.status(403).send("User does not exist.");
  }

  // Check if passwords match
  if (user.password !== password) {
    return res.status(403).send("Incorrect password. Please try again.");
  }
  
  res.cookie('user_id', user.id);
  res.redirect('/urls');
});

// GET /register
app.get("/register", (req, res) => {
  if (req.cookies.user_id) {
    res.redirect('/urls');
  } else {
    const user = users[req.cookies.user_id];
    const templateVars = { user: user };
    res.render("register", templateVars);
  }
});

// POST /register
app.post("/register", (req, res) => {
  const { email, password } = req.body;

  // Catch users trying to use blank email or passwords
  if (email === '' || password === '') {
    return res.status(400).send('Please fill both email and password fields.');
  }

  // Catch users already in database
  if (getUserByEmail(email)) {
    return res.status(400).send('Email already exists. Please try a different email.');
  }

  const id = generateRandomString();
  const user = { id, email, password };
  users[id] = user;
  res.cookie('user_id', id);
  res.redirect('/urls');
});

// POST /logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

// GET /urls
app.get("/urls", (req, res) => {
  if (req.cookies.user_id) {
    const user = users[req.cookies.user_id];
    const urls = urlsForUser(user.id);
    const templateVars = { urls: urls, user: user };
    res.render("urls_index", templateVars);
  } else {
    res.send("<html><body>You are not logged in. Please log in or register to continue.</body></html>\n");
  }
});

// GET /urls/new
app.get("/urls/new", (req, res) => {
  if (req.cookies.user_id) {
    const user = users[req.cookies.user_id];
    const templateVars = { user: user };
    res.render("urls_new", templateVars);
  } else {
    res.render("login");
  }
});

// POST /urls
app.post("/urls", (req, res) => {
  if (req.cookies.user_id) {
    let id = generateRandomString();
    urlDatabase[id].longURL = req.body.longURL;
    res.redirect(`/urls/${id}`);
  } else {
    res.send("<html><body>Unable to shorten URL since you are not logged in.</body></html>\n");
  }
});

// GET /urls/:id
app.get("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
  const urls = urlsForUser(user.id);
  if (Object.keys(urls).includes(req.params.id)) {
    const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id].longURL, user: user };
    res.render("urls_show", templateVars);
  } else {
    res.send("<html><body>You do not have access to this page.</body></html>\n");
  }
});

// POST /urls/:id
app.post("/urls/:id", (req, res) => {

  // Return error message if id does not exist
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.send("<html><body>Sorry, we do not have this URL in our database.</body></html>\n");
  }
  
  const user = users[req.cookies.user_id];
  
  // Return error message if the user is not logged in
  if (!user) {
    return res.send("<html><body>User is not logged in.</body></html>\n");
  }
  
  const urls = urlsForUser(user.id);
  const url = urls[req.params.id];
  
  // Return error message if the user does not own the URL
  if (!url) {
    return res.send("<html><body>Unauthorized access - URL does not belong to current user.</body></html>\n");
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect('/urls');
});

// POST /urls/:id/delete
app.post("/urls/:id/delete", (req, res) => {

  // Return error message if id does not exist
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.send("<html><body>Sorry, we do not have this URL in our database.</body></html>\n");
  }
  
  const user = users[req.cookies.user_id];
  
  // Return error message if the user is not logged in
  if (!user) {
    return res.send("<html><body>User is not logged in.</body></html>\n");
  }
  
  const urls = urlsForUser(user.id);
  const url = urls[req.params.id];
  
  // Return error message if the user does not own the URL
  if (!url) {
    return res.send("<html><body>Unauthorized access - URL does not belong to current user.</body></html>\n");
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// GET /u/:id
app.get("/u/:id", (req, res) => {
  if (!Object.keys(urlDatabase).includes(req.params.id)) {
    return res.send("<html><body>Sorry, we do not have this URL in our database.</body></html>\n");
  } else {
    const longURL = urlDatabase[req.params.id].longURL;
    res.redirect(longURL);
  }
});

////////////////////////////////////////////////////////////
// Listener
////////////////////////////////////////////////////////////

app.listen(PORT, () => {
  console.log(`App is running on port ${PORT}`);
});