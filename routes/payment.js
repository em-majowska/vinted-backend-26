const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/payment", async (req, res) => {
  try {
    const intent = await stripe.paymentIntents.create({
      amount: req.body.amount,
      currency: "eur",
    });

    res.status(200).json({ client_secret: intent.client_secret });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
