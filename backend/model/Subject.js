const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: false // Unique within semester only
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Semester",
    required: true
  },
  pdfs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "PDF"
  }]
});

module.exports = mongoose.model("Subject", subjectSchema);
