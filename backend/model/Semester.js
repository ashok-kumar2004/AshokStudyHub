require('dotenv').config();
const mongoose = require("mongoose");

const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true // e.g., "Semester1"
  },
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }]
});

module.exports = mongoose.model("Semester", semesterSchema);
