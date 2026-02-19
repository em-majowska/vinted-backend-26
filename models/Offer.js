const mongoose = require('mongoose');

const Offer = new mongoose.model('Offer', {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: Object,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

module.exports = Offer;
