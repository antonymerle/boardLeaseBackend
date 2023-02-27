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
    place:{ type: mongoose.Schema.Types.ObjectId, ref: 'places' },
    availabilities: [dateSchema],
});

const Surf = mongoose.model('surfs', surfSchema);

module.exports = Surf;