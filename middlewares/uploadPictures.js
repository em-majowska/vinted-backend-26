const convertToBase64 = require('../utils/convertToBase64');
const cloudinary = require('cloudinary').v2;

const uploadPictures = async (req, res, next) => {
  if (req.files === null || req.files.pictures.length === 0) {
    res.send('No file uploaded!');
    return;
  }

  const arrayoOfPictures = [];
  if (Array.isArray(req.files.pictures)) {
    for (let i = 0; i < req.files.pictures.length; i++) {
      const picture = req.files.pictures[i];
      const result = await cloudinary.uploader.upload(convertToBase64(picture));
      arrayoOfPictures.push(result);
    }
  } else {
    const picture = await cloudinary.uploader.upload(
      convertToBase64(req.files.pictures),
    );

    arrayoOfPictures.push(picture);
  }

  req.body.pictureObjects = arrayoOfPictures;

  next();
};

module.exports = uploadPictures;
