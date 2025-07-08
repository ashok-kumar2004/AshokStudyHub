const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema({
  title: String,
  gridFsFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  uploadedAt: {
    type: Date, 
    default: Date.now
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject"
  }
});

module.exports = mongoose.model("PDF", pdfSchema);
