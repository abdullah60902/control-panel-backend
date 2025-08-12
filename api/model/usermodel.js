const mongoose = require("mongoose");
const client = require("./client");
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
    enum: ['Admin', 'Staff', 'Client'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  clients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  }]
});

module.exports = model("User", userSchema);
