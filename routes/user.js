const express = require("express");
const router = express.Router();
const fileUpload = require("express-fileupload");
const uploadPictures = require("../services/uploadPictures");

// Import encryption packages
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Import DB models
const User = require("../models/User");

router.post("/user/signup", fileUpload(), async (req, res) => {
  try {
    const data = req.body;

    // check all parameters :
    if (!data.email || !data.username || !data.password) {
      throw {
        status: 400,
        message: "Email address, username and password are mandatory",
      };
    }

    // Check if email was already used for registration
    if (await User.findOne({ email: data.email }))
      throw { status: 409, message: "This email is already used" };

    // Check if username was already used for registration
    if (await User.findOne({ username: data.username })) {
      throw { status: 409, message: "The username is already taken" };
    }

    // Password encryption and creation of token
    const salt = uid2(16);
    const hash = SHA256(data.password + salt).toString(encBase64);
    const token = uid2(64);

    // Upload avatar
    const pictures = await uploadPictures(req.files);

    // Create new user
    const newUser = new User({
      account: {
        username: data.username,
        avatar: pictures[0],
      },
      email: data.email,
      newsletter: data.newsletter,
      salt: salt,
      hash: hash,
      token: token,
    });

    // Save the user in DB
    await newUser.save();

    res.status(201).json({
      _id: newUser.id,
      token: newUser.token,
      account: newUser.account,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    // Find and check if user of a given mail already exists
    const data = await User.findOne({ email: req.body.email });

    if (!data) throw { status: 400, message: "The account does not exist" };

    const hash = SHA256(req.body.password + data.salt).toString(encBase64);

    // Check if password is correct
    if (hash !== data.hash) {
      throw { status: 401, message: "Unauthorized" };
    }

    res.status(200).json({
      _id: data.id,
      token: data.token,
      account: data.account,
    });
  } catch (error) {
    res
      .status(error.status || 500)
      .json({ message: error.message || "Internal server error" });
  }
});

module.exports = router;
