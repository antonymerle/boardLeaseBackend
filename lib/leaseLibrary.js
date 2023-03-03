const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const secretKey = process.env.JWT_SECRET;

/**
 * @name haversineDistance
 * @function
 * @memberof module:lib/leaseLibrary
 * @desc Calculate distance between two geographic coordinates in km or miles
 * @param {Array<Number>} coordinatesSet1
 * @param {Array<Number>} coordinatesSet2
 * @returns {Boolean}
 */

const haversineDistance = ([lat1, lon1], [lat2, lon2], isMiles = false) => {
  const toRadian = (angle) => (Math.PI / 180) * angle;
  const distance = (a, b) => (Math.PI / 180) * (a - b);
  const RADIUS_OF_EARTH_IN_KM = 6371;

  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);

  lat1 = toRadian(lat1);
  lat2 = toRadian(lat2);

  // Haversine Formula
  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  let finalDistance = RADIUS_OF_EARTH_IN_KM * c;

  if (isMiles) {
    finalDistance /= 1.60934;
  }

  return Math.floor(finalDistance * 100) / 100;
};

/**
 * @name dateRangeOverlaps
 * @function
 * @memberof module:lib/leaseLibrary
 * @desc Checks if two date ranges objects overlaps: {startDate1, endDate1} vs {startDate2, endDate2}
 * @param {{startDate: Date, endDate: Date}} dateRange1 - first date range
 * @param {{startDate: Date, endDate: Date}}  dateRange2 - second date range
 * @returns {Boolean}
 */

const dateRangeOverlaps = (dateRange1, dateRange2) => {
  console.log(dateRange1, dateRange2);
  dateRange1.startDate = new Date(dateRange1.startDate).getTime();
  dateRange1.endDate = new Date(dateRange1.endDate).getTime();

  dateRange2.startDate = new Date(dateRange2.startDate).getTime();
  dateRange2.endDate = new Date(dateRange2.endDate).getTime();

  if (
    dateRange1.startDate <= dateRange2.startDate &&
    dateRange2.startDate <= dateRange1.endDate
  )
    return true; // dateRange2 starts in dateRange1
  if (
    dateRange1.startDate <= dateRange2.endDate &&
    dateRange2.endDate <= dateRange1.endDate
  )
    return true; // dateRange2 ends in dateRange1
  if (
    dateRange2.startDate < dateRange1.startDate &&
    dateRange1.endDate < dateRange2.endDate
  )
    return true; // dateRange2 includes dateRange1
  return false;
};

/**
 * @name googleAuthVerify
 * @async
 * @function
 * @memberof module:lib/leaseLibrary
 * @desc Validate a google connect token and return extracted user info
 * @param {Object} google token contained in credentialResponse.credential
 * @returns {{isTokenValid: Boolean, firstname: String, lastname: String, username: String, email: String}}
 */

const googleAuthVerify = async (googleToken) => {
  const client = new OAuth2Client(process.env.CLIENT_ID);
  const ticket = await client.verifyIdToken({
    idToken: googleToken,
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
};

const verifyJWT = (req, res, next) => {
  // Get the token from the request headers
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Verify the token using the secret key
  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Add the decoded user object to the request object for future use
    req.user = decoded;

    next();
  });
};
/**
 * @name dateRangeSplitter
 * @function
 * @memberof module:lib/leaseLibrary
 * @desc used to deduct a reservation period from a broader availability period and split it in two remaining lesser parts.
 * @desc takes a dateRangeToSplit, extract from it the dateRangeToWithdraw and returns two lesser dateRanges in an array
 * @param {{startDate: Date, endDate: Date}} dateRangeToSplit - date range to split
 * @param {{startDate: Date, endDate: Date}}  dateRangeToWithdraw - date range to substract from dateRangeToSplit
 * @returns {Boolean}
 */

const dateRangeSplitter = (dateRangeToSplit, dateRangeToWithdraw) => {
  if (
    !dateRangeToSplit.starDate ||
    !dateRangeToSplit.endDate ||
    !dateRangeToWithdraw.starDate ||
    !dateRangeToWithdraw.endDate
  )
    return null;

  const DAY_IN_MS = 1000 * 60 * 60 * 24;
  let newStartRange1 = {
    startDate: dateRangeToSplit.starDate,
    endDate: new Date(
      new Date(dateRangeToWithdraw.starDate).getTime() - DAY_IN_MS
    ),
  };
  let newStartRange2 = {
    startDate: new Date(
      new Date(dateRangeToWithdraw.endDate).getTime() + DAY_IN_MS
    ),
    endDate: dateRangeToSplit.endDate,
  };

  return [newStartRange1, newStartRange2];
};

module.exports = {
  haversineDistance,
  dateRangeOverlaps,
  googleAuthVerify,
  verifyJWT,
  dateRangeSplitter,
};
