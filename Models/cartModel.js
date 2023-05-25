const mongoose = require('mongoose')

// Schema user
const cartSchema = mongoose.Schema({
    email: String,
    category: String,
    image: String,
    price: String,
    idProduct: String
})

const cartModel = mongoose.model('cart', cartSchema)

module.exports = cartModel 