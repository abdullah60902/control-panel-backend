const mongoose = require("mongoose");
const { model } = mongoose;

const userSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Staff', 'Client', 'External'], // 👈 Added External
    required: true
  },
  password: {
    type: String,
    required: true
  },
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  }],
  hr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Hr",
  },
  mustChangePassword: {
    type: Boolean,
    default: false,
  },
  allowedPages: [String], // 👈 for checkboxes (page access)
});

module.exports = model("User", userSchema);
