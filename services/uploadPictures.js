const convertToBase64 = require("../utils/convertToBase64");
const cloudinary = require("cloudinary").v2;

// arguments : files, data
const uploadPictures = async (files, data) => {
  if (files === null || files.picture.length === 0) return [];

  // if it's a picture for avatar
  if (typeof data !== "undefined" && data.username) {
    const result = await cloudinary.uploader.upload(
      convertToBase64(files.picture),
      {
        folder: `vinted/avatars`,
      },
    );

    return result;
  }
  // if it's pictures for a product

  const picturesToUpload = Array.isArray(files.picture)
    ? files.picture
    : [files.picture];

  const promises = picturesToUpload.map((picture) => {
    return cloudinary.uploader.upload(convertToBase64(picture), {
      folder: "vinted/products",
    });
  });

  const arrayOfPictures = await Promise.all(promises);

  return arrayOfPictures;
};

module.exports = uploadPictures;
