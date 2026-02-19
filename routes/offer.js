const express = require('express');
const router = express.Router();
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

const isAuthenticated = require('../middlewares/isAuthenticated');
const convertToBase64 = require('../utils/convertToBase64');
const uploadPictures = require('../services/uploadPictures');
const Offer = require('../models/Offer');
const { default: mongoose } = require('mongoose');

// Create an offer
router.post(
  '/offer/publish',
  isAuthenticated,
  fileUpload(),
  async (req, res) => {
    //Upload pictures with ID path
    const pictures = await uploadPictures(req.files);

    try {
      const newOffer = new Offer({
        product_name:
          req.body.name.length > 50
            ? res.status(400).json({
                message:
                  'Title is too long. Shorten it to maximum 50 characters',
              })
            : req.body.name,
        product_description:
          req.body.description.length > 500
            ? res.status(400).json({
                message:
                  'Description is too long. Shorten it to maximum 500 characters',
              })
            : req.body.description,
        product_price:
          req.body.price > 100000
            ? res.status(400).json({
                message: 'Price is too high. Lower it to maximum 100000€',
              })
            : req.body.price,
        product_details: [
          { brand: req.body.brand },
          { size: req.body.size },
          { color: req.body.color },
          { condition: req.body.condition },
          { city: req.body.city },
        ],
        product_image:
          !pictures || !pictures.length
            ? {}
            : pictures.length > 1
              ? pictures
              : pictures[0],

        owner: req.user._id,
      });

      // await newOffer.save();
      await newOffer.populate('owner', 'email account');

      res.status(201).json({
        message: 'Offer successfully created',
        data: newOffer,
      });
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Internal server error' });
    }
  },
);

// Modify offer
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

      res
        .status(200)
        .json({ message: 'Offer successfully modified', data: offer });
    } catch (error) {
      res
        .status(error.status || 500)
        .json({ message: error.message || 'Internal server error' });
    }
  },
);

// Delete offer
router.delete('/offer/:id', isAuthenticated, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      throw res.status(400).json({ message: 'Invalid id' });
    const offer = await Offer.findByIdAndDelete(req.params.id);

    if (!offer) throw res.status(404).json({ message: 'Offer not found' });

    res.status(200).json({ message: 'Offer successfully deleted' });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || 'Internal server error' });
  }
});

// Search and filter offers
router.get('/offers', async (req, res) => {
  try {
    const filters = {};

    if (req.query.title) filters.title = new RegExp(`${req.query.title}`, 'i');
    if (req.query.priceMin) filters.priceMin = req.query.priceMin;
    if (req.query.priceMax) filters.priceMax = req.query.priceMax;

    // 2 types of sorting possible: 'price-asc' , 'price-desc' or 'name-asc', 'name'desc'
    filters.sort = req.query.sort || 'price-desc';
    // defines `skip`. Each page shows 5 items. If no page selected, it defaults to 1 (0 skipped items).
    filters.page = 5 * (req.query.page - 1) || 0;

    // replace key according to sorting
    const sortingKey = filters.sort.includes('price')
      ? 'product_price'
      : 'product_name';

    const offers = await Offer.find({
      // if no filters provided, it defaults to :
      product_name: filters.title ?? /.*/,
      product_price: {
        $lte: filters.priceMax ?? Infinity,
        $gte: filters.priceMin ?? 0,
      },
    })
      // remove prefixes from filters
      .sort({
        [sortingKey]: filters.sort.replace('price-', '').replace('name-', ''),
      })
      .select('product_name product_price')
      .limit(5)
      .skip(filters.page);

    res.status(200).json(offers);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || 'Internal server error' });
  }
});

// Search offer by id
router.get('/offers/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id))
      throw res.status(400).json({ message: 'Invalid id' });

    const offer = await Offer.findById(req.params.id).populate(
      'owner',
      'account',
    );
    if (!offer) throw res.status(404).json({ message: 'Item not found' });

    res.status(200).json(offer);
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || 'Internal server error' });
  }
});

module.exports = router;
