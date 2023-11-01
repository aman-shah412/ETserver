const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    Name: {
        type: String,
    },
    Vertical: {
        type: String,
    },
})

const Project = mongoose.model("PROJECT", projectSchema)

module.exports = Project;
