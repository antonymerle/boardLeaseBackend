require("dotenv").config();
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var surfsRouter = require("./routes/surfs");
var placesRouter = require("./routes/places");
var bookingsRouter = require("./routes/bookings");

var app = express();

require("./models/connection");
const fileUpload = require("express-fileupload");
app.use(fileUpload());

const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/surfs", surfsRouter);
app.use("/places", placesRouter);
app.use("/bookings", bookingsRouter);

module.exports = app;
