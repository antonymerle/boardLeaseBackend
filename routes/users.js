var express = require("express");
var router = express.Router();
const uid2 = require("uid2");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");

require("../models/connection");
const User = require("../models/users");
const Surf = require("../models/surfs");

/**
 * @name POST: users/signup
 * @desc Route serving signup form.
 * @param {{firstname: String, lastname: String, username: String, email: String, password: String}}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */

router.post("/signup", (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;
  if (!firstname || !lastname || !username || !email || !password) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  // Check if the user has not already been registered
  User.findOne({ username: username }).then((data) => {
    if (data === null) {
      const token = uid2(32);
      const newUser = new User({
        firstname,
        lastname,
        username,
        email,
        password: bcrypt.hashSync(password, 10),
        token,
        favorites: [],
        // TODO : create empty favorites array;
      });

      newUser.save().then(() => {
        res.json({
          result: true,
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

  async function googleAuthVerify() {
    const client = new OAuth2Client(process.env.CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    console.log(payload);

    const userid = payload["sub"];
    console.log(userid);

    // https://developers.google.com/identity/gsi/web/reference/js-reference?hl=fr#CredentialResponse
    /*
     * Les champs email, email_verified et hd vous permettent de déterminer si Google héberge une adresse e-mail et fait autorité pour celle-ci.
     * Dans les cas où Google fait autorité, l'utilisateur est connu pour être le titulaire légitime du compte.
     * Cas dans lesquels Google fait autorité:
     * 1. email comporte un suffixe @gmail.com : il s'agit d'un compte Gmail.
     * 2. email_verified est défini sur "true" et que hd est défini (il s'agit d'un compte G Suite).
     */
    // cas 1
    const isTokenValid = payload.email.split("@")[1] === "gmail.com";

    return {
      isTokenValid,
      firstname: payload.given_name,
      lastname: payload.family_name,
      username: payload.given_name + payload.family_name,
      email: payload.email,
    };
  }
  const response = await googleAuthVerify();
  console.log(googleAuthVerify().catch(console.error));
  res.json({ result: true, ...response });
});

module.exports = router;
