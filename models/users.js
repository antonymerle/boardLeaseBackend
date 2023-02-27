const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  firstname: String,
  lastname: String,
  username: String,
  email: String,
  password: String,
  token: String,
  DOB: Date,
  address: addressSchema,
  phone: String,
  profilepic: String,
  favorites: { type: mongoose.Schema.Types.ObjectId, ref: "surfs" },
});

const addressSchema = mongoose.Schema({
  number: Number,
  addressLine: String,
  zipCode: Number,
  city: String,
});

const User = mongoose.model("users", userSchema);

module.exports = User;
