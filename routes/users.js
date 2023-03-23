var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const { googleAuthVerify } = require("../lib/leaseLibrary");
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;
const { verifyJWT } = require("../lib/leaseLibrary");

require("../models/connection");
const User = require("../models/users");

/**
 * @name POST: users/signup
 * @desc Route serving signup form.
 * @param {{firstname: String, lastname: String, username: String, email: String, password: String}}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */

router.post("/signup", async (req, res) => {
  const { authMethod, googleCredentialResponse } = req.body;

  // top level user data variables
  // we will assign them later, depending on the auth method
  let firstname,
    lastname,
    username,
    email,
    password = null;

  // error handling
  if (!authMethod) {
    return res.json({ result: false, error: "authMethod field is required" });
  } else if (authMethod !== "classic" && authMethod !== "googleConnect") {
    console.error("Unknown auth method");
    return res.json({ result: false, error: "Unknown authentication method" });
  }

  // auth method handling logic : two branches
  // 1. googleConnect
  // 2. classic
  if (authMethod === "googleConnect") {
    console.log(googleCredentialResponse);

    const dataFromGoogleToken = await googleAuthVerify(
      googleCredentialResponse
    );

    const isTokenValid = dataFromGoogleToken.isTokenValid;

    if (!isTokenValid)
      return res.json({
        result: false,
        error: "google connect failed to authenticate user",
      });

    firstname = dataFromGoogleToken.firstname;
    lastname = dataFromGoogleToken.lastname;
    username = dataFromGoogleToken.username;
    email = dataFromGoogleToken.email;
  } else if (authMethod === "classic") {
    firstname = req.body.firstname;
    lastname = req.body.lastname;
    username = req.body.username;
    email = req.body.email;
    password = req.body.password;

    if (!firstname || !lastname || !username || !email || !password) {
      return res.json({ result: false, error: "Missing or empty fields" });
    }
  }

  // We have all the necessary data, now let's check if user has not already been registered
  User.findOne({ email }).then((data) => {
    if (data === null) {
      // a plain object is needed for jwt.sign() method
      const newUser = {
        authMethod,
        firstname,
        lastname,
        username,
        email,
        favorites: [],
      };

      const jwtToken = jwt.sign(newUser, secretKey, { expiresIn: "1y" });

      const newUserDocument = new User({
        authMethod,
        firstname,
        lastname,
        username,
        email,
        password:
          authMethod === "classic" ? bcrypt.hashSync(password, 10) : null,
        favorites: [],
      });
      newUserDocument.save().then(() => {
        res.json({ jwtToken });
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
 * @param {{authMethod: String, googleCredentialResponse: {{Object} | null}, email: String | null, password: String | null}}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */
router.post("/signin", async (req, res) => {
  const { authMethod, googleCredentialResponse } = req.body;
  console.log(req.user);

  // top level user data variables
  // we will assign them later, depending on the auth method
  let email,
    password = null;

  // error handling
  if (!authMethod) {
    return res.json({ result: false, error: "authMethod field is required" });
  } else if (authMethod !== "classic" && authMethod !== "googleConnect") {
    console.error("Unknown auth method");
    return res.json({ result: false, error: "Unknown authentication method" });
  }

  // auth method handling logic : two branches
  // 1. googleConnect
  // 2. classic

  if (authMethod === "googleConnect") {
    console.log(googleCredentialResponse);

    const dataFromGoogleToken = await googleAuthVerify(
      googleCredentialResponse
    );

    const isTokenValid = dataFromGoogleToken.isTokenValid;

    email = dataFromGoogleToken.email;

    if (!isTokenValid)
      return res.json({
        result: false,
        error: "google connect failed to authenticate user",
      });
  } else if (authMethod === "classic") {
    email = req.body.email;
    password = req.body.password;
    console.log({ email, password });

    if (!email || !password) {
      return res.json({ result: false, error: "Missing or empty fields" });
    }
  }

  // We have all the necessary data, now let's check if user is in DB
  User.findOne({
    email: email,
  })
    .populate("favorites")
    .then((data) => {
      console.log(data);

      if (!data) {
        res.json({ result: false, error: "User not found" });
        return;
      } else if (
        // no need for password check if user is google authenticated
        (authMethod === "classic" &&
          bcrypt.compareSync(password, data.password)) ||
        authMethod === "googleConnect"
      ) {
        const loggedUser = {
          authMethod,
          email,
          firstname: data.firstname,
          lastname: data.lastname,
          username: data.username,
          favorites: data.favorites, // to handle lougout method on the frontend TODO: add it on redux
        };

        const jwtToken = jwt.sign(loggedUser, secretKey, { expiresIn: "1y" });
        res.json({ jwtToken });
      } else {
        res.json({ result: false, error: "Wrong password." });
      }
    });
});

/**
 * @name PUT: users
 * @desc Route serving profile page to modify the user personal informations.
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */

router.put("/", verifyJWT, (req, res) => {
  const { firstname, lastname, username, email } = req.body;
  if (!firstname && !lastname && !username && !email) {
    return res.json({ result: false, error: "Missing or empty fields." });
  }

  const user = req.user;
  console.log(user);

  User.updateOne(
    { email: req.user.email },
    { firstname, lastname, username, email }
  ).then(() => {
    User.findOne({ email }).then((data) => {
      if (data) {
        console.log({ data });

        res.json({
          result: true,
          newFirstname: data.firstname,
          newLastname: data.lastname,
          newUsername: data.username,
          newEmail: data.email,
        });
      } else {
        res.json({ result: false, error: "Update failure" });
      }
    });
  });
});

module.exports = router;
