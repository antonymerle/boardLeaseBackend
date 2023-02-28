const mongoose = require("mongoose");

const dateRange = mongoose.Schema({
  startDate: Date,
  endDate: Date,
});

const surfSchema = mongoose.Schema({
  owner: String,
  type: String,
  level: String,
  name: String,
  dayPrice: Number,
  pictures: [String],
  placeName: String,
  latitude: Number,
  longitude: Number,
  availabilities: [dateRange],
});

const Surf = mongoose.model("surfs", surfSchema);

module.exports = Surf;
