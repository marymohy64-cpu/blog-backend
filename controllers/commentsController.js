const asyncHandler = require("express-async-handler");
const {
  Comment,
  validateCreateComment,
  validateUpdateComment,
} = require("../models/commentModel");
const { User } = require("../models/userModel");

/**----------------------------------------------
 * @desc  Create New Comment
 * @route /api/comments
 * @method Post
 * @access private (only logged in user)
-----------------------------------------------*/
module.exports.createCommentCtrl = asyncHandler(async (req, res) => {
  const { error } = validateCreateComment(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const profile = await User.findById(req.user.id);
  const comment = await Comment.create({
    postId: req.body.postId,
    text: req.body.text,
    user: req.user.id,
    username: profile.username,
  });
  res.status(201).json(comment);
});

/**----------------------------------------------
 * @desc  Get All Comments
 * @route /api/comments
 * @method Get
 * @access private (only admin)
-----------------------------------------------*/
module.exports.getAllCommentCtrl = asyncHandler(async (req, res) => {
  const comments = await Comment.find().populate("user");
  res.status(200).json(comments);
});

/**----------------------------------------------
 * @desc  Delete Comment
 * @route /api/comments/:id
 * @method Delete
 * @access private (only admin or owner of the comment)
-----------------------------------------------*/
module.exports.deleteCommentCtrl = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: "Comment Not Found" });
  }
  if (req.user.isAdmin || req.user.id === comment.user.toString()) {
    const deleteComment = await Comment.findByIdAndDelete(req.params.id);
    res
      .status(200)
      .json({
        message: "The Comment Has Been Deleted Successfully",
        commentId: comment._id,
      });
  } else {
    res.status(403).json({ message: "access denied, not allowed" });
  }
});

/**----------------------------------------------
 * @desc  Update Comment
 * @route /api/comments/:id
 * @method PUT
 * @access private (only owner of the comment)
-----------------------------------------------*/
module.exports.updateCommentCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdateComment(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ message: "Comment Not Found" });
  }
  if (req.user.id !== comment.user.toString()) {
    return res.status(403).json({
      message: "access denied, only user himself can edit his comment",
    });
  }
  const updateComment = await Comment.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        text: req.body.text,
      },
    },
    { returnDocument: "after" },
  );
  res.status(200).json(updateComment);
});
