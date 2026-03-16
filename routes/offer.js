const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");

const isAuthenticated = require("../middlewares/isAuthenticated");
const uploadPictures = require("../services/uploadPictures");
const Offer = require("../models/Offer");
const mongoose = require("mongoose");

// Create an offer
router.post(
  "/offer/publish",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    const data = req.body;
    //Upload pictures with ID path
    const pictures = await uploadPictures(req.files, data);

    try {
      const newOffer = new Offer({
        product_name:
          data.title && data.title.length > 100
            ? res.status(400).json({
                message:
                  "Title is too long. Shorten it to maximum 100 characters",
              })
            : data.title,
        product_description:
          data.description && data.description.length > 500
            ? res.status(400).json({
                message:
                  "Description is too long. Shorten it to maximum 500 characters",
              })
            : data.description,
        product_price:
          data.price && data.price > 1000
            ? res.status(400).json({
                message: "Price is too high. Lower it to maximum 1 000 €",
              })
            : data.price,
        product_details: [
          { MARQUE: data.brand || "autre" },
          { TAIILE: data.size && data.size },
          { ÉTAT: data.condition && data.condition },
          { COULEUR: data.color && data.color },
          { EMPLACEMENT: data.city && data.city },
          { "MODES DE PAIEMENT": data.payment && data.payment },
        ],
        product_pictures: !pictures || !pictures.length ? [] : pictures,
        product_image: !pictures || !pictures.length ? {} : pictures[0],

        owner: req.user._id,
      });

      await newOffer.populate("owner", "email account");
      await newOffer.save();
      res.status(201).json({
        message: "Offer successfully created",
        data: newOffer,
      });
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || "Internal server error" });
    }
  },
);

// Modify offer
router.put(
  "/offer/modify/:id",
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id))
        throw res.status(400).json({ message: "Invalid id" });

      const data = req.body;
      const updateData = {};

      // check if user wants to modify text data
      if (data) {
        // update product basic information if they exist
        if (data.name) updateData.product_name = data.name;
        if (data.description) updateData.product_description = data.description;
        if (data.price) updateData.product_price = data.price;

        // update product_details if any of the keys exist
        if (
          data.brand ||
          data.size ||
          data.condition ||
          data.color ||
          data.city ||
          data.payment
        ) {
          updateData.product_details = [];
          if (data.brand)
            updateData.product_details.push({ MARQUE: data.brand });
          if (data.size) updateData.product_details.push({ TAILLE: data.size });
          if (data.condition)
            updateData.product_details.push({ ÉTAT: data.condition });
          if (data.color)
            updateData.product_details.push({ COULEUR: data.color });
          if (data.city)
            updateData.product_details.push({ EMPLACEMENT: data.city });
          if (data.payment)
            updateData.product_details.push({
              "MODES DE PAIEMENT": data.payment,
            });
          if (data.brand) update;
        }
      }

      // update pictures if provided
      const pictures = await uploadPictures(req.files, data);
      updateData.product_image =
        !pictures || pictures.length ? {} : pictures[0];

      updateData.product_pictures =
        !pictures || !pictures.length ? [] : pictures;

      // pass updated data to DB
      const offer = await Offer.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
      });

      if (!offer) throw res.status(400).json({ message: "Offer not found" });

      res
        .status(200)
        .json({ message: "Offer successfully modified", data: offer });
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || "Internal server error" });
    }
  },
);

// Delete offer
router.delete("/offer/:id", isAuthenticated, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      throw res.status(400).json({ message: "Invalid id" });
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) throw res.status(404).json({ message: "Offer not found" });

    res.status(200).json({ message: "Offer successfully deleted" });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

// Search and filter offers
router.get("/offers", async (req, res) => {
  try {
    const filters = {};
    const sortFilters = {};
    const limitFilters = 15;
    // Each page shows 15 items. If no page selected, it defaults to 1 (0 skipped items).
    const skipFilters = limitFilters * (Number(req.query.page) - 1) || 0;

    if (req.query.title)
      filters.product_name = new RegExp(`${req.query.title}`, "i");

    if (req.query.priceMin || req.query.priceMax) {
      filters.product_price = {};
      if (req.query.priceMin)
        filters.product_price["$gte"] = Number(req.query.priceMin);
      if (req.query.priceMax)
        filters.product_price["$lte"] = Number(req.query.priceMax);
    }
    if (req.query.sort === "price-asc") {
      sortFilters.product_price = "asc";
    } else if (req.query.sort === "price-desc") {
      sortFilters.product_price = "desc";
    }

    const offers = await Offer.find(filters)
      .sort(sortFilters)
      .limit(limitFilters)
      .skip(skipFilters)
      .populate("owner", "account");

    const count = await Offer.countDocuments(filters);
    // console.log(offers);

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

// Search offer by id
router.get("/offer/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      throw res.status(400).json({ message: "Invalid id" });

    const offer = await Offer.findById(req.params.id).populate(
      "owner",
      "account",
    );
    if (!offer) throw res.status(404).json({ message: "Item not found" });

    res.status(200).json(offer);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
