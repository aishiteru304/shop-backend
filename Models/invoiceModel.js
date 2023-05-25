const mongoose = require('mongoose')

// Schema invoice
const invoiceSchema = mongoose.Schema({
    totalPrice: String,
    itemList: Array,
    name: String,
    address: String,
    phone: String
})

const invoiceModel = mongoose.model('invoice', invoiceSchema)

module.exports = invoiceModel 