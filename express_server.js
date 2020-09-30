const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

const generateRandomString = function () {
  return Math.random().toString(20).substr(2, 6);
};

const urlDatabase = {
  b2xVn2: 'http://www.lighthouselabs.ca',
  '9sm5xK': 'http://www.google.com',
};
//logout
app.post('/logout', (req,res) => {
  res.clearCookie('username').redirect('/urls');
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
  const username = req.cookies.username;
  urlDatabase[shortURL] = longURL;
  const templateVars = {
    shortURL,
    longURL,
    username
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
app.get('/register',(req,res) => {
  res.render('urls_register');
});

app.get('/urls/new', (req, res) => {
  const username = req.cookies.username;
  const templateVars = {
    username
  };
  res.render('urls_new',templateVars);
});

app.get('/urls/:shortURL', (req, res) => {
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies.username
  };
  res.render('urls_show', templateVars);
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username:req.cookies.username };
  res.render('urls_index', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
//404 page
app.get('*', (req, res) => {
  res.statusCode = 404;
  res.render("404page");
});
//404 page
app.post('*', (req, res) => {
  res.statusCode = 404;
  res.render("404page");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}! `);
});
