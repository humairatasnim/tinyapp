const generateRandomString = () => {
  return Math.random().toString(16).slice(2, 8);
};

const getUserByEmail = (email, database) => {
  let user;
  for (const key in database) {
    if (database[key].email === email) {
      user = database[key];
    }
  }
  return user;
};

const urlsForUser = (id, database) => {
  let filteredURLs = {};
  for (const key in database) {
    if (database[key].userID === id) {
      filteredURLs[key] = database[key];
    }
  }
  return filteredURLs;
};

module.exports = { generateRandomString, getUserByEmail, urlsForUser };