const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const joi = require("joi");
const {
  User,
  validateEmail,
  validateNewPassword,
} = require("../models/userModel");
const crypto = require("crypto");
const VerificationToken = require("../models/VerificationToken");
const sendEmail = require("../utlis/sendEmail");

/**----------------------------------------------
 * @desc  Send Reset Password Link
 * @route /api/password/reset-password-link
 * @method POST
 * @access public
-----------------------------------------------*/
module.exports.sendResestPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const { error } = validateEmail(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res
      .status(400)
      .json({ message: "user with given email dose not exsit!" });
  }
  let verificationToken = await VerificationToken.findOne({
    userId: user._id,
  });
  if (!verificationToken) {
    const verificationToken = new VerificationToken({
      userId: user._id,
      token: crypto.randomBytes(32).toString("hex"),
    });
    await verificationToken.save();
  }
  const link = `${process.env.CLIENT_DOMAIN}/reset-password/${user._id}/${verificationToken.token}`;
  const htmlTemplate = `
  <a href="${link}">Click here to reset your password</a>`;
  await sendEmail(user.email, "Reset Password", htmlTemplate);
  res.status(200).json({
    message: "Password reset link send to your email, please check your email",
  });
});
/**----------------------------------------------
 * @desc  Get Reset Password Link
 * @route /api/password/reset-password/:userId/:token
 * @method Get
 * @access public
-----------------------------------------------*/
module.exports.getResestPasswordLinkCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid Link" });
  }
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid Link" });
  }
  res.status(200).json({ message: "valid url" });
});

/**----------------------------------------------
 * @desc  Reset Password 
 * @route /api/password/reset-password/:userId/:token
 * @method post
 * @access public
-----------------------------------------------*/
module.exports.resetPasswordCtrl = asyncHandler(async (req, res) => {
  const { error } = validateNewPassword(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const user = await User.findById(req.params.userId);
  if (!user) {
    return res.status(400).json({ message: "Invalid Link" });
  }
  const verificationToken = await VerificationToken.findOne({
    userId: user._id,
    token: req.params.token,
  });
  if (!verificationToken) {
    return res.status(400).json({ message: "Invalid Link" });
  }
  if (!user.isAccountVerified) {
    user.isAccountVerified = true;
  }
  const salt = await bcrypt.genSalt(10);
  const hashPassword = await bcrypt.hash(req.body.password, salt);
  user.password = hashPassword;
  await user.save();
  await verificationToken.deleteOne();
  res
    .status(200)
    .json({ message: "password reset successfully, please login" });
});
