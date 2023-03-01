var express = require("express");
var router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { googleAuthVerify } = require("../lib/leaseLibrary");

require("../models/connection");
const User = require("../models/users");
const Surf = require("../models/surfs");

/**
 * @name POST: users/signup
 * @desc Route serving signup form.
 * @param {{firstname: String, lastname: String, username: String, email: String, password: String}}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */

router.post("/signup", async (req, res) => {
  const {
    authMethod,
    googleCredentialResponse,
    // firstname,
    // lastname,
    // username,
    // email,
    // password,
  } = req.body;

  // error handling
  if (!authMethod) {
    return res.json({ result: false, error: "authMethod field is required" });
  } else if (authMethod !== "classic" || authMethod !== "googleConnect") {
    console.error("Unknown auth method");
    return res.json({ result: false, error: "Unknown authentication method" });
  }

  // auth method handling logic : two branches
  // 1. googleConnect
  // 2. classic
  if (authMethod === "googleConnect") {
    try {
      const { isTokenValid, firstname, lastname, username, email } =
        googleAuthVerify(googleCredentialResponse);

      // res.json({ result: true, ...response });
    } catch (error) {
      return res.json({ result: false, error });
    }

    // console.log(googleAuthVerify().catch(console.error));
    // res.json({ result: true, ...response });
  } else if (authMethod === "classic") {
    const { firstname, lastname, username, email, password } = req.body;

    if (!firstname || !lastname || !username || !email || !password) {
      return res.json({ result: false, error: "Missing or empty fields" });
    }
  }

  // We have all the necessary data, now let's check if user has not already been registered
  User.findOne({ username: username }).then((data) => {
    if (data === null) {
      const token = uid2(32);
      const newUser = new User({
        firstname,
        lastname,
        username,
        email,
        password:
          authMethod === "classic" ? bcrypt.hashSync(password, 10) : null,
        token,
        favorites: [],
      });

      newUser.save().then(() => {
        res.json({
          result: true,
          authMethod, // to handle lougout method on the frontend TODO: add it on redux
          token,
          firstname,
          lastname,
          username,
          email,
          favorites,
        });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: "User already exists" });
    }
  });
});

/**
 * @name POST: users/signin
 * @desc Route serving signin form.
 * @param {{email: String, password: String}}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */
router.post("/signin", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({
    email: email,
  })
    .populate("favorites")
    .then((data) => {
      if (!data) {
        res.json({ result: false, error: "User not found" });
        return;
      } else if (bcrypt.compareSync(password, data.password)) {
        res.json({
          result: true,
          token: data.token,
          email,
          firstname: data.firstname,
          lastname: data.lastname,
          username: data.username,
          favorites: data.favorites,
        });
      } else {
        res.json({ result: false, error: "Wrong password." });
      }
    });
});

router.post("/gverify", async (req, res) => {
  const token = req.body.token;
  if (!token) {
    res.json({ result: false, error: "Token is missing" });
  }

  const response = await googleAuthVerify(token);
  // console.log(googleAuthVerify().catch(console.error));
  res.json({ result: true, ...response });
});

module.exports = router;
