// app/models/day.js
// load the things we need
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// define the schema for our user model
var daySchema = Schema({

  date: Date,
  //calendar: [{type: Schema.ObjectId, ref: 'Calendar'}],
  items: [{type: Schema.ObjectId, ref: 'Item'}]

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Day', daySchema);