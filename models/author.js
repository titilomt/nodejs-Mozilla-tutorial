const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const moment = require('moment');

const AuthorSchema = new Schema(
  {
    first_name: {type: String, required: true, max: 100},
    family_name: {type: String, required: true, max: 100},
    date_of_birth: {type: Date},
    date_of_death: {type: Date},
  }
);

// Virtual for author's full name
AuthorSchema
.virtual('name')
.get(() => {
  return this.family_name + ', ' + this.first_name;
});

// Virtual for author's lifespan
AuthorSchema
.virtual('lifespan')
.get(() => {
  return (moment(this.date_of_death).format('MMMM Do, YYYY') - (moment(this.date_of_birth).format('MMMM Do, YYYY') )).toString();
});

// Virtual for author's URL
AuthorSchema
.virtual('url')
.get(() => {
  return '/catalog/author/' + this._id;
});

//Export model
module.exports = mongoose.model('Author', AuthorSchema);
