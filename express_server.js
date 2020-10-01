const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

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

//helper function to compare if password is equal. It assumes the email passed in is already exist in the users obejct
const isPasswordEqual = function (email, password) {
  for (const user of Object.keys(users)) {
    if (users[user].email === email && bcrypt.compareSync(password, users[user].password)) {
      return true;
    }
  }
  return false;
};

//helper function to return urls that owned by the userId provied
const urlsForUser = function (userId) {
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

//register
app.post('/register', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password,10);
  if (email && password && !isEmailExist(email)) {
    const userID = generateRandomString();
    const user = {
      id: userID,
      email: req.body.email,
      password: hashedPassword,
    };
    console.log(user);
    users[userID] = user;
    res.cookie('user_id', userID).redirect('/urls');
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
  res.clearCookie('user_id').redirect('/urls');
});

//login
app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (!isEmailExist(email)) {
    res.statusCode = 403;
    res.send('The email is not found');
    return;
  }
  if (!isPasswordEqual(email, password)) {
    res.statusCode = 403;
    res.send('The password is not right');
    return;
  }
  let userId;
  for (const user of Object.keys(users)) {
    if (users[user].email === email) {
      userId = users[user].id;
      break;
    }
  }
  res.cookie('user_id', userId).redirect('/urls');
});

//delete URL
app.post('/urls/:shortURL/delete', (req, res) => {
  const userID = req.cookies.user_id;
  const shortURL = req.params.shortURL;
  if (urlDatabase[shortURL].userID === userID) {
    delete urlDatabase[shortURL];
    res.redirect('/urls');
  } else {
    res.send("You can't delete usrls that are not belong to you!");
  }
});
//update URL
app.post('/urls/:shortURL/edit', (req, res) => {
  const userID = req.cookies.user_id;
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
  const userID = req.cookies.user_id;
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

//read one specific URL pair
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
  const userId = req.cookies.user_id;
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
  const userId = req.cookies.user_id;
  const user = users[userId];
  const templateVars = {
    shortURL: req.params.shortURL,
    longURL: urlDatabase[req.params.shortURL].longURL,
    user,
  };
  res.render('urls_show', templateVars);
});

//home page
app.get('/urls', (req, res) => {
  const userId = req.cookies.user_id;
  const urls = urlsForUser(userId);
  const templateVars = {
    urls,
    user: users[userId],
  };
  res.render('urls_index', templateVars);
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
  console.log(`TinyApp listening on port ${PORT}! `);
});
