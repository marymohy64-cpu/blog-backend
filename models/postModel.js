const { required } = require("joi");
const mongoose = require("mongoose");
const joi = require("joi");

// Post Schema
const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      minlength: 2,
      maxlength: 200,
      trim: true,
      required: true,
    },
    description: {
      type: String,
      minlength: 2,
      trim: true,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: Object,
      default: {
        url: "",
        publicId: null,
      },
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Populate Comment For This Post
postSchema.virtual("comments", {
  ref: "Comment",
  foreignField: "postId",
  localField:"_id"
});

const Post = mongoose.model("Post", postSchema);

// validate create post
function validateCreatePost(obj) {
  const schema = joi.object({
    title: joi.string().trim().min(2).max(200).required(),
    description: joi.string().trim().min(2).required(),
    category: joi.string().trim().required(),
  });
  return schema.validate(obj);
}

// validate update post
function validateUpdatePost(obj) {
  const schema = joi.object({
    title: joi.string().trim().min(2).max(200),
    description: joi.string().trim().min(2),
    category: joi.string().trim(),
  });
  return schema.validate(obj);
}

module.exports = {
  Post,
  validateCreatePost,
  validateUpdatePost,
};
