const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

// arguments : files, data
const uploadPictures = async (files, data) => {
  if (!files || !files.pictures) return [];

  const picturesToUpload = Array.isArray(files.pictures)
    ? files.pictures
    : [files.pictures];

  const promises = picturesToUpload.map((picture) => {
    if (data.username) {
      cloudinary.uploader.upload(convertToBase64(picture), {
        folder: `vinted/avatars`,
      });
    } else {
      cloudinary.uploader.upload(convertToBase64(picture), {
        folder: "vinted/products",
      });
    }
  });

  const arrayOfPictures = await Promise.all(promises);

  return arrayOfPictures;
};

module.exports = uploadPictures;
