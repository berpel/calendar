// app/models/item.js
// load the things we need
var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

// define the schema for our user model
var itemSchema = Schema({

  day: [{type: Schema.ObjectId, ref: 'Day'}],
  //create_by: {type: Schema.ObjectId, ref: 'User'},
  original: String,
  icons: [String],
  text: String,
  type: String,
  background: String,
  article: {
    image: String,
    url: String,
    title: String
  }
 

});

// create the model for users and expose it to our app
module.exports = mongoose.model('Item', itemSchema);