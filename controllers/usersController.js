const asyncHandler = require("express-async-handler");
const { User, validateUpdateUser } = require("../models/userModel");
const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
  cloudinaryRemoveMultipleImage,
} = require("../utlis/cloudinary");
const { Post } = require("../models/postModel");
const { Comment } = require("../models/commentModel");

/**----------------------------------------------
 * @desc  Get All Users Profile
 * @route /api/users/profile
 * @method GET
 * @access private (only admin)
-----------------------------------------------*/

module.exports.getAllUsersCtrl = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password").populate("posts");
  res.status(200).json(users);
});

/**----------------------------------------------
 * @desc  Get User Profile
 * @route /api/users/profile/:id
 * @method GET
 * @access public
-----------------------------------------------*/

module.exports.getUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("posts");
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }
  res.status(200).json(user);
});

/**----------------------------------------------
 * @desc  Update User Profile
 * @route /api/users/profile/:id
 * @method PUT
 * @access private (only user himself)
-----------------------------------------------*/

module.exports.updateUserProfileCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateUser(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  if (req.body.password) {
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  }
  const updateUser = await User.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        username: req.body.username,
        ...(req.body.password && { password: req.body.password }),
        bio: req.body.bio,
      },
    },
    { returnDocument: "after" },
  )
    .select("-password")
    .populate("posts");
  res.status(200).json(updateUser);
});

/**----------------------------------------------
 * @desc  Get Users Count
 * @route /api/users/count
 * @method GET
 * @access private (only admin)
-----------------------------------------------*/

module.exports.getUsersContCtrl = asyncHandler(async (req, res) => {
  const count = await User.countDocuments();
  res.status(200).json(count);
});

/**----------------------------------------------
 * @desc  Profile Photo Upload
 * @route /api/users/profile/profile-photo-upload 
 * @method POST
 * @access private (only logged in user)
-----------------------------------------------*/
module.exports.profilePhotoCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }
  const imagePath = path.join("/tmp", req.file.filename);
  const resault = await cloudinaryUploadImage(imagePath);
  const user = await User.findById(req.user.id);
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }
  user.profilePhoto = {
    url: resault.secure_url,
    publicId: resault.public_id,
  };
  await user.save();
  res.status(200).json({
    message: "Your Profile Photo Uploaded Successfully",
    profilePhoto: { url: resault.secure_url, publicId: resault.public_id },
  });
  fs.unlinkSync(imagePath);
});

/**----------------------------------------------
 * @desc  Delete User Profile (account)
 * @route /api/users/profile/:id
 * @method Delete
 * @access private (only admin and user himself)
-----------------------------------------------*/

module.exports.deleteUserProfileCtrl = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ message: "User Not Found" });
  }
  const posts = await Post.find({ user: user._id });
  const publicIds = posts?.map((post) => post.image.publicId);
  if (publicIds?.length > 0) {
    await cloudinaryRemoveMultipleImage(publicIds);
  }
  if (user.profilePhoto.publicId !== null) {
    await cloudinaryRemoveImage(user.profilePhoto.publicId);
  }
  await Post.deleteMany({ user: user._id });
  await Comment.deleteMany({ user: user._id });
  await User.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "The Profile Has Been Deleted" });
});
