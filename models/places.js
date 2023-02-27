const placeSchema = mongoose.Schema({
    latitude: Number,
    longitude: Number,
    name: String,
});

const Place = mongoose.model('places', placeSchema);