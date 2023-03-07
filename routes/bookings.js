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
 * totalPrice: Number,
 * isPaid: Boolean,
 * transactionId: String,
 * paymentMode: String }}
 * @returns {{result: Boolean, token: String | null, error: String | null}}
 */
router.post("/", verifyJWT, async (req, res) => {
  /*
  la route booking :
    1. authentifie le tenant via le JWT - DONE
    2. identifie le surf depuis fullfilledBooking (state redux) - TODO Frontend
    3. vérifie que le surf est bien disponible aux dates demandées - DONE
    4. vérifie que le paiement est bien réalisé - TODO Frontend
    5. retire / transforme la plage de réservation des disponibilités du surf qui a été réservé - DONE
    6. remplit le document booking tel que décrit dans le schéma BDD - DONE
  */

  const { email } = req.user;
  if (!email) return res.json({ result: false, error: "User token missing." });

  const tenant = await User.findOne({ email });
  console.log(tenant);

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
    totalPrice,
    isPaid,
    transactionId, // later from frontend if time to do it
    paymentMode, // later from frontend if time to do it
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
      // check if empty array or if array with null inside (then, we have to delete the dateRange because it is has been fully reservated)
      if (dateRangeSplit.length === 0) {
        return res.json({
          result: false,
          error: "Wrong tenant dateRange request.",
        });
      }

      // 3. now we recreate a new state : an updated array of availabilities for the requested surf

      // 3.1. removing matching dateRange from the surf current availabilities and
      const surfRemainingDateRanges = surf.availabilities.filter(
        (dr, i) => i !== availableDateRangeIndex
      );
      console.log({ InitialAvailabilities: surf.availabilities });
      console.log({ surfRemainingDateRanges });

      // 3.2. replacing it with one or two lesser dateRanges (or with nothing if dateRange fully reservated)

      const newSurfAvailabilities = [
        ...surfRemainingDateRanges,
        ...dateRangeSplit,
      ]
        .filter((availability) => availability !== null) // case dateRangeSplit is containing one null element, we have to remove it
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      console.log({ newSurfAvailabilities });

      // 3.3 We have an updated array of availabilities to update the surf and create a new booking document
      Surf.findByIdAndUpdate(surfId, {
        availabilities: newSurfAvailabilities,
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
});

/**
 * @name GET: /bookings
 * @desc Route returning bookings for a tenant.
 * @returns {[Object]}
 */
router.get("/", verifyJWT, async (req, res) => {
  const { email } = req.user;
  if (!email) return res.json({ result: false, error: "User token missing." });

  const tenant = await User.findOne({ email });
  console.log(tenant);

  try {
    const tenantBookings = await Booking.find({ tenant: tenant._id })
      .populate("owner")
      .populate("surf");
    // console.log({ tenantBookings });
    const tenantBookingsFiltered = tenantBookings.map((tenantBooking) => {
      return {
        owner: tenantBooking.owner.firstname,
        surfName: tenantBooking.surf.name,
        surfType: tenantBooking.surf.type,
        startDate: tenantBooking.startDate,
        endDate: tenantBooking.endDate,
      };
    });
    // console.log({ tenantBookingsFiltered });

    res.json({ result: true, data: tenantBookingsFiltered });
  } catch (error) {
    console.log(error);
    res.json({ result: false, error });
  }
});

module.exports = router;
