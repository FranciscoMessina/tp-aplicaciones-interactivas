var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var CategorySchema = new mongoose.Schema({
    name: String
});

CategorySchema.plugin(mongoosePaginate);

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;