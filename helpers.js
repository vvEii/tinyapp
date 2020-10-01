//helper function to check if an email is already exist in the database,
//return the user if the email existed, otherwise return undefined
const getUserByEmail = function (email, database) {
  for (const user of Object.keys(database)) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

//helper function to generate a random 6 digits string
const generateRandomString = function () {
  return Math.random().toString(20).substr(2, 6);
};

//helper function to return urls that owned by the userId provied
const urlsForUser = function (userId, urlDatabase) {
  let urlsOwnedByUser = {};
  for (const url of Object.keys(urlDatabase)) {
    if (urlDatabase[url].userID === userId) {
      urlsOwnedByUser[url] = {
        longURL: urlDatabase[url].longURL,
        userID: urlDatabase[url].userID,
      };
    }
  }
  return urlsOwnedByUser;
};
module.exports = { getUserByEmail, urlsForUser, generateRandomString };
