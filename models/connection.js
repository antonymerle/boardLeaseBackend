const mongoose = require("mongoose");

const dbName = "boardLease";
const connectionString = process.env.CONNECTION_STRING + dbName;

mongoose
  .connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Database connected"))
  .catch((error) => console.error(error));
