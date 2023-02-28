const mongoose = require('mongoose');

const dateSchema = mongoose.Schema({
    startDate: Date,
    endDate: Date,
});

const surfSchema = mongoose.Schema({
	owner: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
	type: String,
	level: String,
	name: String,
	dayPrice: Number,
    pictures: [String],
    placeName: String,
    latitude: Number,
    longitude: Number,
    availabilities: [dateSchema],
});

const Surf = mongoose.model("surfs", surfSchema);

module.exports = Surf;
