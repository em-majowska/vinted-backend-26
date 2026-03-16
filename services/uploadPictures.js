const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

// arguments : files, data
const uploadPictures = async (files, data) => {
  if (files === null || files.pictures.length === 0) return [];

  const picturesToUpload = Array.isArray(files.pictures)
    ? files.pictures
    : [files.pictures];

  console.log(data);
  const promises = picturesToUpload.map((picture) => {
    if (typeof data !== "undefined" && data.username) {
      return cloudinary.uploader.upload(convertToBase64(picture), {
        folder: `vinted/avatars`,
      });
    } else {
      return cloudinary.uploader.upload(convertToBase64(picture), {
        folder: "vinted/products",
      });
    }
  });

  const arrayOfPictures = await Promise.all(promises);

  return arrayOfPictures;
};

module.exports = uploadPictures;
