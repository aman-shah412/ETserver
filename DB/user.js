const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    Name: {
        type: String,
    },
    Email: {
        type: String,
    },
    Type: {
        type: String,
    },
    Password: {
        type: String,
    },
    Status: {
        type: String,
    }
})

const User = mongoose.model("USER", userSchema)

module.exports = User;