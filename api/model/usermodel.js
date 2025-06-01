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
    enum: ['Admin', 'Staff', 'Client'],
    required: true
  },
  password: {
    type: String,
    required: true
  }
});

module.exports = model("User", userSchema);
