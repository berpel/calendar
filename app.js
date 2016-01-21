/*
 * Module dependencies
 */
var express = require('express')
  , stylus = require('stylus')
  , nib = require('nib')
  , moment = require('moment')
  , bodyParser = require('body-parser')
  , parser = require('./helpers/parser')
  , mongoose = require('mongoose')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , cookieParser = require('cookie-parser')
  , session = require('express-session');

//var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect('mongodb://localhost/calendar'); // connect to our database
var User = require('./app/models/user');

var Day = require('./app/models/day');
var Item = require('./app/models/item');

/*var user = new User;
user.local.email = 'swervogm@gmail.com';
user.local.password = user.generateHash('123456');

user.save(function(err, user) {
  if (err) return console.error(err);
  console.dir(user);
});*/
//console.log(User);

require('./config/passport')(passport); // pass passport for configuration

//--------

var app = express()

// set up our express application
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json())

// required for passport
app.use(session({ secret: 'c4lendarface' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions

//app.use(flash()); // use connect-flash for flash messages stored in session

/*var auth = function(req, res, next) {
  if (!req.isAuthenticated())
    res.send(401); 
  else 
    next(); 
};*/


function compile(str, path) {
  return stylus(str)
    .set('filename', path)
    .use(nib())
}
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
//app.use(express.logger('dev'))
app.use(stylus.middleware(
  { src: __dirname + '/public'
  , compile: compile
  }
))
app.use(express.static(__dirname + '/public'))

app.get('/', function(req, res) {
  res.render('index')
})

app.post('/login', passport.authenticate('local'), function(req, res) {
  console.log(req.user);
  res.send(req.user);
});

app.post('/signup', passport.authenticate('local-signup', function(req, res) {
  console.log('wer are here!!!')
  //successRedirect : '/profile', // redirect to the secure profile section
  //failureRedirect : '/signup', // redirect back to the signup page if there is an error
  //failureFlash : true // allow flash messages
}));

app.get('/template/:template', function(req, res) {
  console.log(req.params.template);
  res.render('templates/'+req.params.template);
})

app.get('/views/:view', function(req, res) {
  console.log(req.params.view);
  res.render(req.params.view);
})

app.post('/api/data', function(req, res) {
  
  console.log(req.body)

  parser.parse(req.body.text, function(data){
    console.log("date lookup format")
    console.log(new Date(moment(req.body.date)))
    // save data here
    Day.findOne( { date: new Date(moment(req.body.date))}, function (err, day) {
      if (day) {
        console.log('day found');
      } else {
        day = new Day({date: new Date(moment(req.body.date))})
        day.save(function(err) {
          console.log('day created');
        });
      }
      console.log(day);

      item = new Item(data);
      item.day = day;
      item.save(function(err){
        console.log('item created');
        console.log(item);
      });

      day.items.push(item);
      day.save(function(err){
        console.log('day resaved');
      });

    });

    res.send(data);  
  });
 
})

app.post('/api/item', function(req, res){

})

app.get('/api/data', function(req, res) {
  var data = [];

  /*var weather = [
    {
      icon: 'sunny',
      high: 
    }
  ]*/

  for (var i = 0; i < 7; i++) {
    var date = moment().add('days', i); 
    var day = {
      date: {
        original: date.format('YYYY-MM-DD'),
        day_of_month: date.format('Do'),
        day_of_week: date.format('dddd'),
        month: date.format('MMMM')
      },
      weather: {},
      items: []
    };

    data.push(day);
  }

  Day.find({ date: {"$gte": new Date(moment().format('YYYY-MM-DD')), "$lt": new Date(moment().add('days', 7).format('YYYY-MM-DD'))}}).populate('items').exec(function(err, days) {
    //console.log('Find date range results: ');
    console.log(days);
    days.forEach(function(day) {
      d1 = moment(day.date).format('YYYY-MM-DD');
      data.forEach(function(d2){
        //console.log(d2);
        //console.log(d1 + ' == ' + d2.date.original);
        if (d1 == d2.date.original) {
          //console.log('match!');
          d2.items = day.items;
        }
      })
    })
    //console.log(data);
    //console.log('===== days =====');
    //console.log(days);
    res.send(data);
  })

})

app.listen(3000)