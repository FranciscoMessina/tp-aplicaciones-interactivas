var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var ProductSchema = new mongoose.Schema({
    name: String,
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    image: String,
    description: String,
    price: Number,
    available: Boolean
});

ProductSchema.plugin(mongoosePaginate);

const Product = mongoose.model('Product', ProductSchema);

module.exports = Product;