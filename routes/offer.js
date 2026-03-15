const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;

const isAuthenticated = require("../middlewares/isAuthenticated");
const convertToBase64 = require("../utils/convertToBase64");
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
          data.name.length > 50
            ? res.status(400).json({
                message:
                  "Title is too long. Shorten it to maximum 50 characters",
              })
            : data.name,
        product_description:
          data.description.length > 500
            ? res.status(400).json({
                message:
                  "Description is too long. Shorten it to maximum 500 characters",
              })
            : data.description,
        product_price:
          data.price > 100000
            ? res.status(400).json({
                message: "Price is too high. Lower it to maximum 100000€",
              })
            : data.price,
        product_details: [
          { MARQUE: data.brand || "autre" },
          data.size && { TAIILE: data.size },
          data.condition && { ÉTAT: data.condition },
          data.color && { COULEUR: data.color },
          data.city && { EMPLACEMENT: data.city },
          data.payment && { "MODES DE PAIEMENT": data.payment },
        ],
        product_image: !pictures || !pictures.length ? {} : pictures,

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
      const pictures = await uploadPictures(req.files, data);
      // todo finish check and add swap pictures
      const offer = await Offer.findByIdAndUpdate(
        req.params.id,
        {
          product_name: req.body.name && req.body.name,
          product_description: req.body.description && req.body.description,
          product_price: req.body.price && req.body.price,
          product_details: [
            { MARQUE: req.body.brand && req.body.brand },
            { TAILLE: req.body.size && req.body.size },
            { ÉTAT: req.body.condition && req.body.condition },
            { COULEUR: req.body.color && req.body.color },
            { EMPLACEMENT: req.body.city && req.body.city },
            { "MODES DE PAIEMENT": data.payment && req.body.payment },
          ],
          product_image: !pictures || !pictures.length ? {} : pictures,
        },
        { new: true },
      );

      if (!offer) throw res.status(400).json({ message: "Offer not found" });

      // if (req.files) {
      //   offer.product_image = await cloudinary.uploader.upload(
      //     convertToBase64(req.files.pictures),
      //     { folder: `vinted/offers/${offer._id}` },
      //   );

      //   await offer.save();
      // }

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
      sort.product_price = "asc";
    } else if (req.query.sort === "price-desc") {
      sort.product_price = "desc";
    }

    const offers = await Offer.find(filters)
      .sort(sortFilters)
      // .select("product_name product_price")
      .limit(limitFilters)
      .skip(skipFilters)
      .populate("owner", "account");

    const count = await Offer.countDocuments(filters);

    res.status(200).json({ count: count, offers: offers });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

// Search offer by id
router.get("/offers/:id", async (req, res) => {
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
