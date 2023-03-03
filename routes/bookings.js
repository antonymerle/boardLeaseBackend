var express = require("express");
var router = express.Router();

const { verifyJWT } = require("../lib/leaseLibrary");

require("../models/connection");
const User = require("../models/users");
const Surf = require("../models/surfs");

/**
 * @name POST: /bookings
 * @desc Route serving the booking action from a tenant.
 * @param {{
 * startDate: Date,
 * endDate: Date,
 * surfId: String,
 * placeName: String,
 * totalPrice: Number,
 * ownerId: String,
 * tenantId: String,
 * isPaid: Boolean,
 * transactionId: String,
 * paymentMode: String }}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */
router.post("/", verifyJWT, (req, res) => {
  const user = req.user;
  console.log(user);
  const { email } = req.user;

  if (
    !req.body.startDate ||
    !req.body.endDate ||
    !req.body.surfId ||
    !req.body.placeName ||
    !req.body.ownerId ||
    !req.body.tenantId ||
    !req.body.isPaid ||
    !req.body.transactionId ||
    !req.body.paymentMode
  ) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  const {
    startDate,
    endDate,
    surfId,
    placeName,
    ownerId,
    tenantId,
    isPaid,
    transactionId,
    paymentMode,
  } = req.body;

  Surf.findById(surfId).then((surf) => console.log(surf));

  /*
  la route booking :
    1. authentifie le tenant via le JWT - DONE
    2. identifie le surf depuis fullfilledBooking (state redux)
    3. vérifie que le surf est bien disponible aux dates demandées
    4. vérifie que le paiement est bien réalisé
    5. retire la plage de réservation des disponibilités du surf qui a été réservé
    6. remplit le document booking tel que décrit dans le schéma BDD
  */
});

module.exports = router;
