const convertToBase64 = require('../utils/convertToBase64');
const cloudinary = require('cloudinary').v2;

const uploadPictures = async (files) => {
  if (files === null || files.pictures.length === 0) return;

  const arrayoOfPictures = [];
  if (Array.isArray(files.pictures)) {
    for (let i = 0; i < files.pictures.length; i++) {
      const picture = files.pictures[i];
      const result = await cloudinary.uploader.upload(convertToBase64(picture));
      arrayoOfPictures.push(result);
    }
  } else {
    const picture = await cloudinary.uploader.upload(
      convertToBase64(files.pictures),
    );

    arrayoOfPictures.push(picture);
  }

  return arrayoOfPictures;
};

module.exports = uploadPictures;
