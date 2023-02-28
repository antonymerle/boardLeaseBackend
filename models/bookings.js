const mongoose = require("mongoose");

const bookingSchema = mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  surf: { type: mongoose.Schema.Types.ObjectId, ref: "surfs" },
  startDate: Date,
  endDate: Date,
  transactionId: String,
  paymentDate: Date,
  paymentMode: String,
  paymentAmount: Number,
  isPaid: Boolean,
});

const Booking = mongoose.model("bookings", bookingSchema);

module.exports = Booking;
