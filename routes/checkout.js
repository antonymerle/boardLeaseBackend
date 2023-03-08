var express = require("express");
var router = express.Router();

const { verifyJWT, dateRangeSplitter } = require("../lib/leaseLibrary");

const stripe = require("stripe")(
  "sk_test_51Mizz2HUwd3Z4pQXMuv1iEoXTfkqPJS7hNXPdYdJzSL4tnPur1iHmNqPDcBpHMTXOdrnqiuJDD6FWzSPTxGAiINT00kBGAz2Lr"
);

router.post("/", async (req, res) => {
  console.log(req.body);

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: "T-shirt",
          },
          unit_amount: req.body.totalPrice,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: "http://localhost:3000",
    cancel_url: "http://localhost:3000",
  });

  res.redirect(303, session.url);
});

module.exports = router;
