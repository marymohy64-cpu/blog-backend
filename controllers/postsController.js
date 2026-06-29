const asyncHandler = require("express-async-handler");
const fs = require("fs");
const path = require("path");
const {
  Post,
  validateCreatePost,
  validateUpdatePost,
} = require("../models/postModel");
const {
  cloudinaryUploadImage,
  cloudinaryRemoveImage,
} = require("../utlis/cloudinary");
const { Comment } = require("../models/commentModel");
/**----------------------------------------------
 * @desc  Create New Post
 * @route /api/posts
 * @method Post
 * @access private (only logged in user)
-----------------------------------------------*/
module.exports.createPostCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }
  const { error } = validateCreatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const imagePath = path.join("/tmp", req.file.filename);
  const cloudinaryImage = await cloudinaryUploadImage(imagePath);

  const post = await Post.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    user: req.user.id,
    image: {
      url: cloudinaryImage.secure_url,
      publicId: cloudinaryImage.public_id,
    },
  });

  res.status(201).json({ post });
  fs.unlinkSync(imagePath);
});

/**----------------------------------------------
 * @desc  Get All Posts
 * @route /api/posts
 * @method Get
 * @access public 
-----------------------------------------------*/

module.exports.getAllPostsCtrl = asyncHandler(async (req, res) => {
  const post_per_page = 3;
  const { pageNumber, category } = req.query;
  let posts;
  if (pageNumber) {
    posts = await Post.find()
      .skip((pageNumber - 1) * post_per_page)
      .limit(post_per_page)
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  } else if (category) {
    posts = await Post.find({ category })
      .sort({ createdAt: -1 })
      .populate("user", ["-password"])
      .populate("comments");
  } else {
    posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("user", ["-password"]);
  }
  res.status(200).json(posts);
});

/**----------------------------------------------
 * @desc  Get Posts Count 
 * @route /api/posts/count
 * @method Get
 * @access public 
-----------------------------------------------*/

module.exports.getPostsCountCtrl = asyncHandler(async (req, res) => {
  const postsCount = await Post.countDocuments();
  res.status(200).json(postsCount);
});

/**----------------------------------------------
 * @desc  Get Single Post
 * @route /api/posts/:id
 * @method Get
 * @access public 
-----------------------------------------------*/

module.exports.getSinglePostsCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("user", ["-password"])
    .populate("comments");
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  res.status(200).json(post);
});

/**----------------------------------------------
 * @desc  Delete Post
 * @route /api/posts/:id
 * @method Delete
 * @access private (only admin or owner of the post)
-----------------------------------------------*/

module.exports.deletePostsCtrl = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  if (req.user.isAdmin || req.user.id === post.user.toString()) {
    await Post.findByIdAndDelete(req.params.id);
    await cloudinaryRemoveImage(post.image.publicId);
    //  Delete All Comments that belong to this post
    await Comment.deleteMany({ postId: post._id });
    res.status(200).json({
      message: "the post has been deleted successfully",
      postId: post._id,
    });
  } else {
    res.status(403).json({ message: "access denied , forbidden" });
  }
});

/**----------------------------------------------
 * @desc  Update Post
 * @route /api/posts/:id
 * @method PUT
 * @access private (only owner of the post)
-----------------------------------------------*/
module.exports.updatePostCtrl = asyncHandler(async (req, res) => {
  const { error } = validateUpdatePost(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied , your not allowed" });
  }
  const updatePost = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        user: req.user.id,
      },
    },
    { returnDocument: "after" },
  )
    .populate("user", ["-password"])
    .populate("comments");
  res.status(200).json(updatePost);
});

/**----------------------------------------------
 * @desc  Update Post Image
 * @route /api/posts/update-image/:id
 * @method PUT
 * @access private (only owner of the post)
-----------------------------------------------*/
module.exports.updatePostImageCtrl = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "no image provided" });
  }
  const post = await Post.findById(req.params.id);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  if (req.user.id !== post.user.toString()) {
    return res
      .status(403)
      .json({ message: "access denied , your not allowed" });
  }
  await cloudinaryRemoveImage(post.image.publicId);
  const imagePath = path.join("/tmp", req.file.filename);
  const cloudinaryImage = await cloudinaryUploadImage(imagePath);
  const updatePostImage = await Post.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        image: {
          url: cloudinaryImage.secure_url,
          publicId: cloudinaryImage.public_id,
        },
      },
    },
    { returnDocument: "after" },
  );
  res.status(200).json(updatePostImage);
  fs.unlinkSync(imagePath);
});

/**----------------------------------------------
 * @desc  Toggle Like
 * @route /api/posts/like/:id
 * @method PUT
 * @access private (only logged in user)
-----------------------------------------------*/
module.exports.toggleLikeCtrl = asyncHandler(async (req, res) => {
  const loggedInUser = req.user.id;
  const { id: postId } = req.params;
  let post = await Post.findById(postId);
  if (!post) {
    return res.status(404).json({ message: "Post Not Found" });
  }
  const isPostAlreadyLiked = post.likes.find(
    (user) => user.toString() === loggedInUser,
  );
  if (isPostAlreadyLiked) {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $pull: { likes: loggedInUser },
      },
      { returnDocument: "after" },
    );
  } else {
    post = await Post.findByIdAndUpdate(
      postId,
      {
        $push: { likes: loggedInUser },
      },
      { returnDocument: "after" },
    );
  }
  res.status(200).json(post);
});
