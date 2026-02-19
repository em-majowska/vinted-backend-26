const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

const isAuthenticated = require('../middlewares/isAuthenticated');
const convertToBase64 = require('../utils/convertToBase64');
// const uploadPictures = require('../middlewares/uploadPictures');
const Offer = require('../models/Offer');
const { default: mongoose } = require('mongoose');

router.post(
  '/offer/publish',
  isAuthenticated,
  fileUpload(),
  // uploadPictures,
  async (req, res) => {
    try {
      const newOffer = new Offer({
        product_name: req.body.name,
        product_description: req.body.description,
        product_price: req.body.price,
        product_details: [
          { brand: req.body.brand },
          { size: req.body.size },
          { color: req.body.color },
          { condition: req.body.condition },
          { city: req.body.city },
        ],
        // pour l'instant j'utilise un objet pour que c'est bien de type Object
        product_image: {},

        // Postman montre "owner": "6995e904efd98c0d936a5477"
        owner: req.user._id,
      });

      // no need since new Document already creates en Id
      // await newOffer.save();

      //Upload pictures with ID path
      if (req.files !== null) {
        const picture = await cloudinary.uploader.upload(
          convertToBase64(req.files.pictures),
          { folder: `vinted/offers/${newOffer._id}` },
        );

        newOffer.product_image = picture;
      }

      await newOffer.save();

      await newOffer.populate('owner', 'email account');

      res.status(201).json({
        message: 'Offer successfully created',
        data: newOffer,
      });
    } catch (error) {
      res
        .status(error.status || 400)
        .json({ message: error.message || 'Internal server error' });
    }
  },
);

router.put(
  '/offer/modify/:id',
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id))
        throw res.status(400).json({ message: 'Invalid id' });

      const offer = await Offer.findByIdAndUpdate(
        req.params.id,
        {
          product_name: req.body.name,
          product_description: req.body.description,
          product_price: req.body.price,
          product_details: [
            { brand: req.body.brand },
            { size: req.body.size },
            { color: req.body.color },
            { condition: req.body.condition },
            { city: req.body.city },
          ],
        },
        { new: true },
      );

      if (!offer) throw res.status(400).json({ message: 'Offer not found' });

      if (req.files) {
        offer.product_image = await cloudinary.uploader.upload(
          convertToBase64(req.files.pictures),
          { folder: `vinted/offers/${offer._id}` },
        );

        await offer.save();
      }

      console.log('2 => ', offer);

      res
        .status(200)
        .json({ message: 'Offer successfully modified', data: offer });
    } catch (error) {
      res
        .status(error.status || 400)
        .json({ message: error.message || 'Internal server error' });
    }
  },
);

module.exports = router;
