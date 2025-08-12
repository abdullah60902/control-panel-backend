const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  fullName: {
    type: String,
    required: true
  },
  
  age: {
    type: Number,
    required: true
  },
  roomNumber: {
    type: String,
    required: true
  },
  careType: {
    type: String,
    required: true
  },
  admissionDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Client", clientSchema);
