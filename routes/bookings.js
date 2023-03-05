var express = require("express");
var router = express.Router();

const { verifyJWT, dateRangeSplitter } = require("../lib/leaseLibrary");

require("../models/connection");
const User = require("../models/users");
const Surf = require("../models/surfs");
const Booking = require("../models/bookings");

const { checkAvailabibility } = require("../lib/leaseLibrary");
const uid2 = require("uid2"); // generate fake transaction ID;

/**
 * @name POST: /bookings
 * @desc Route serving the booking action from a tenant.
 * @param {{
 * surfId: String,
 * startDate: Date,
 * endDate: Date,
 * placeName: String,
 * totalPrice: Number,
 * isPaid: Boolean,
 * transactionId: String,
 * paymentMode: String }}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */
router.post("/", verifyJWT, async (req, res) => {
  const user = req.user;
  // console.log(user);
  const { email } = req.user; // TODO : check if something to do with user document : get tenantID

  const tenant = await User.findOne({ email });
  console.log(tenant);

  // To minimize exposure to frontend :
  // DONE : get tenantID from token
  // DONE : get ownerID from surf
  if (
    !req.body.surfId ||
    !req.body.startDate ||
    !req.body.endDate ||
    !req.body.placeName ||
    !req.body.totalPrice ||
    !req.body.isPaid ||
    !req.body.transactionId ||
    !req.body.paymentMode
  ) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  const {
    startDate,
    endDate,
    surfId,
    placeName,
    totalPrice,
    isPaid,
    transactionId,
    paymentMode,
  } = req.body;

  try {
    const surf = await Surf.findById(surfId);
    console.log({ surf });
    // 1. check if tenant's dateRange matches with any of the surf availabilities
    const availableDateRangeIndex = checkAvailabibility(surf.availabilities, {
      startDate,
      endDate,
    });
    console.log({ availableDateRangeIndex });

    // 2. found matching dateRange we need to substract from
    if (availableDateRangeIndex >= 0) {
      // deduct reservation dateRange from the matching availabily dateRange
      // The result is one or two lesser dateRange(s) within boundaries of matching availability
      const dateRangeSplit = dateRangeSplitter(
        surf.availabilities[availableDateRangeIndex],
        {
          startDate,
          endDate,
        }
      );
      // TODO check if empty array or if array with null inside (then, we have to delete the dateRange because it is has been fully reservated)
      // 3. now we recreate a new state : an updated array of availabilities for the requested surf

      // 3.1. removing matching dateRange from the surf current availabilities and
      const surfRemainingDateRanges = surf.availabilities.filter(
        (dr, i) => i !== availableDateRangeIndex
      );
      console.log({ InitialAvailabilities: surf.availabilities });
      console.log({ surfRemainingDateRanges });

      // 3.2. replacing it with one or two lesser dateRanges
      const newAvailabilities = [
        ...surfRemainingDateRanges,
        ...dateRangeSplit,
      ].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      console.log({ newAvailabilities });

      // 3.3 We have an updated array of availabilities to query DB with
      Surf.findByIdAndUpdate(surfId, {
        availabilities: newAvailabilities,
      })
        .then(() => Surf.findById(surfId))
        .then((updatedSurf) => {
          const transactionId = uid2(32);
          const newBooking = new Booking({
            tenant: tenant._id,
            owner: updatedSurf.owner,
            placeName: updatedSurf.placeName,
            latitude: updatedSurf.latitude,
            longitude: updatedSurf.longitude,
            surf: surfId,
            startDate,
            endDate,
            transactionId,
            paymentDate: Date.now(),
            paymentMode: "creditCard",
            paymentAmount: totalPrice,
            isPaid,
          });

          newBooking.save().then(() =>
            Booking.findOne({ transactionId }).then((transactionDocument) => {
              return res.json({ result: true, data: transactionDocument });
            })
          );
        });
    }
  } catch (error) {
    console.log(error);
    return res.json({ result: false, error });
  }

  // TODO : what happens if the dateRange is bigger

  /*
  la route booking :
    1. authentifie le tenant via le JWT - DONE
    2. identifie le surf depuis fullfilledBooking (state redux) - TODO Frontend
    3. vérifie que le surf est bien disponible aux dates demandées - DONE
    4. vérifie que le paiement est bien réalisé - TODO Frontend
    5. retire la plage de réservation des disponibilités du surf qui a été réservé - DONE
    6. remplit le document booking tel que décrit dans le schéma BDD - DONE
  */
  // res.json({ result: false, error: "Something went wrong." });
  console.log("END");
});

module.exports = router;
