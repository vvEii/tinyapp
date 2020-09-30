const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

//mock URL info
const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};
//mock user info
const users = {
  userRandomID: {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur',
  },
  user2RandomID: {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk',
  },
};

//helper function to generate a random 6 digits string
const generateRandomString = function () {
  return Math.random().toString(20).substr(2, 6);
};

//helper function to check if an email is already exist in the users object
const isEmailExist = function (email) {
  for (const user of Object.keys(users)) {
    if (users[user].email === email) {
      return true;
    }
  }
  return false;
};

//register
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (email && password && !isEmailExist(email)) {
    const id = generateRandomString();
    const user = {
      id,
      email: req.body.email,
      password: req.body.password,
    };
    users[id] = user;
    res.cookie('user_id', id).redirect('/urls');
  } else if (isEmailExist(email)) {
    res.statusCode = 400;
    res.send('The email is aleardy exist!');
  } else {
    res.statusCode = 400;
    res.send('The email or password is empty');
  }
});
//logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id').redirect('/register');
});

//login
app.post('/login', (req, res) => {
  const username = req.body.username;
  res.cookie('username', username).redirect('/urls');
});

//delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});
//edit URL
app.post('/urls/:shortURL/edit', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL;
  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});
//create new URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userId = req.cookies.user_id;
  urlDatabase[shortURL] = longURL;
  const user = users[userId];
  const templateVars = {
    shortURL,
    longURL,
    user,
  };
  res.render('urls_show', templateVars);
});

//read one specific URL pair
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (shortURL in urlDatabase) {
    const longURL = urlDatabase[shortURL];
    res.redirect(longURL);
  } else {
    res.send('URL is not found!');
  }
});

//register page
app.get('/register', (req, res) => {
  res.render('urls_register');
});

app.get('/urls/new', (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    user,
  };
  res.render('urls_new', templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    user,
  };
  res.render('urls_show', templateVars);
});

//home page
app.get('/urls', (req, res) => {
  const userId = req.cookies.user_id;
  if (userId) {
    const templateVars = {
      urls: urlDatabase,
      user: users[req.cookies.user_id],
    };
    res.render('urls_index', templateVars);
  } else {
    res.statusCode = 400;
    res.send('Please login in.');
  }
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
//404 page
app.get('*', (req, res) => {
  res.statusCode = 404;
  res.render('404page');
});
//404 page
app.post('*', (req, res) => {
  res.statusCode = 404;
  res.render('404page');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}! `);
});
