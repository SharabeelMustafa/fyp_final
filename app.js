var createError = require('http-errors');
var cookieParser = require('cookie-parser');
//var logger = require('morgan');
const express = require('express');
const path = require('path');
const session = require('express-session');




const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const AdminRouter = require('./routes/admin');
const studentRouter = require('./routes/student');
const studentAPI = require('./API/StudentAPI');

const app = express();

// Middleware

app.use(express.urlencoded({ extended: false }));
app.use(express.json());


// Middleware to check if admin is logged in

function checkAdminSession(req, res, next) {
  if (!req.session.isAdmin) {
    return res.redirect('/admin/login');
  }
  next();
}


app.use(session({
  secret: '@abc',
  resave: false,
  saveUninitialized: false
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static('./public'));


// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

app.use('/ind', indexRouter);
app.use('/users', usersRouter);
app.use('/',studentRouter);
app.use('/',AdminRouter);
app.use('/StudentAPI',studentAPI);


//catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});



module.exports = app;
