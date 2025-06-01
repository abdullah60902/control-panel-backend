const mongoose = require("mongoose");

const carePlanningSchema = new mongoose.Schema({
  client: { type: String, required: true },
  planType: { type: String, required: true },
  creationDate: { type: Date, required: true },
  reviewDate: { type: Date, required: true },
  carePlanDetails: { type: String, required: true }
});

module.exports = mongoose.model("CarePlanning", carePlanningSchema);
