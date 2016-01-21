// app/models/calendar.js
// load the things we need
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// define the schema for our user model
var calendarSchema = Schema({

  days: [{type: Schema.ObjectId, ref: 'Day'}],

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Calendar', calendarSchema);