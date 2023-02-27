const mongoose = require('mongoose');

const surfSchema = mongoose.Schema({
	owner: String,
	type: String,
	level: String,
	name: String,
	dayPrice: Number,
    pictures: [String],
    place:{ type: mongoose.Schema.Types.ObjectId, ref: 'places' },
    availabilities: [dateRange],
});

const dateRange = mongoose.Schema({
    startDate: Date,
    endDate: Date,
});

const Surf = mongoose.model('surfs', surfSchema);

module.exports = Surf;