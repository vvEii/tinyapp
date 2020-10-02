//bug create new URL -> submit -> click the shortURL -> URL is not found -> click back using browser -> accidently created one new shortURL
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

const {
  getUserByEmail,
  urlsForUser,
  generateRandomString,
} = require('./helpers');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    name: 'session',
    keys: ['key1', 'key2'],
  })
);
app.use(methodOverride('_method'));

//mock URL info
const urlDatabase = {
  b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'aJ48lW' },
  i3BoGr: { longURL: 'https://www.google.ca', userID: 'aJ48lW' },
};
//mock users info
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

//helper function to compare if password is equal. It assumes the email passed in is already exist in the users obejct
const isPasswordEqual = function (email, password) {
  for (const user of Object.keys(users)) {
    if (
      users[user].email === email &&
      bcrypt.compareSync(password, users[user].password)
    ) {
      return true;
    }
  }
  return false;
};

//register
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = getUserByEmail(email, users);
  if (email && password && !user) {
    const userID = generateRandomString();
    const user = {
      id: userID,
      email: req.body.email,
      password: hashedPassword,
    };
    users[userID] = user;
    req.session.user_id = userID;
    res.redirect('/urls');
  } else if (user) {
    res.statusCode = 400;
    res.send('The email is aleardy exist!');
  } else {
    res.statusCode = 400;
    res.send('The email or password is empty');
  }
});
//logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

//login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = getUserByEmail(email, users);
  if (!user) {
    res.statusCode = 403;
    res.send('The email is not found');
    return;
  }
  if (!isPasswordEqual(email, password)) {
    res.statusCode = 403;
    res.send('The password is not right');
    return;
  }
  const userId = user.id;
  req.session.user_id = userId;
  res.redirect('/urls');
});

//delete URL
app.delete('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("You can't delete usrls that are not belong to you!");
  }
});
//update URL
app.put('/urls/:shortURL', (req, res) => {
  const userID = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === userID) {
    const longURL = req.body.longURL;
    urlDatabase[shortURL].longURL = longURL;
    res.redirect('/urls');
  } else {
    res.send("You can't edit urls that are not belong to you!");
  }
});
//create new URL
app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  const longURL = req.body.longURL;
  const userID = req.session.user_id;
  urlDatabase[shortURL] = {
    longURL,
    userID,
  };
  const user = users[userID];
  const templateVars = {
    shortURL,
    longURL,
    userID,
    user,
  };
  res.render('urls_show', templateVars);
});

//redirect to longURL
app.get('/u/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  if (shortURL in urlDatabase) {
    const longURL = urlDatabase[shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.send('URL is not found!');
  }
});

//login page
app.get('/login', (req, res) => {
  const templateVars = {
    user: undefined,
  };
  res.render('urls_login', templateVars);
});

//register page
app.get('/register', (req, res) => {
  const templateVars = {
    user: undefined,
  };
  res.render('urls_register', templateVars);
});

//create new url
app.get('/urls/new', (req, res) => {
  const userId = req.session.user_id;
  if (!userId) {
    res.redirect('/login');
    return;
  }
  const user = users[userId];
  const templateVars = {
    user,
  };
  res.render('urls_new', templateVars);
});

//edit URL
app.get('/urls/:shortURL', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const shortURL = req.params.shortURL;
  if (!urlDatabase[shortURL]) {
    res.send('The URL for the given ID does not exist!');
    return;
  }
  if (!userId) {
    res.send('Please login to access the short URL');
    return;
  }
  if (urlDatabase[shortURL].userID === userId) {
    const templateVars = {
      shortURL,
      longURL: urlDatabase[req.params.shortURL].longURL,
      user,
    };
    res.render('urls_show', templateVars);
  } else {
    res.send("You don't have the access to this URL");
  }
});

//home page
app.get('/urls', (req, res) => {
  const userId = req.session.user_id;
  const urls = urlsForUser(userId, urlDatabase);
  const templateVars = {
    urls,
    user: users[userId],
  };
  res.render('urls_index', templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});
//home page redirect to /urls if the user has login, otherwise redirect to the login page.
app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
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
  console.log(`TinyApp listening on port ${PORT}! `);
});
