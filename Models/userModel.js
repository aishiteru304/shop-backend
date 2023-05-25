const mongoose = require('mongoose')

// Schema user
const userSchema = mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    password: String,
    image: String
})

const userModel = mongoose.model('user', userSchema)

module.exports = userModel 