const mongoose = require('mongoose');

const dateSchema = mongoose.Schema({
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
    availabilities: [dateSchema],
    deposit: Number,
    rating: Number,
});

const Surf = mongoose.model("surfs", surfSchema);

module.exports = Surf;
