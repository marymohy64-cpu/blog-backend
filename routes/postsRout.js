const {
  createPostCtrl,
  getAllPostsCtrl,
  getSinglePostsCtrl,
  getPostsCountCtrl,
  deletePostsCtrl,
  updatePostCtrl,
  updatePostImageCtrl,
  toggleLikeCtrl,
} = require("../controllers/postsController");
const photoUpload = require("../middlewares/photoUpload");
const validateObjectId = require("../middlewares/validateObjectId");
const { verifyToken } = require("../middlewares/verifyToken");

const router = require("express").Router();
router
  .route("/")
  .post(verifyToken, photoUpload.single("image"), createPostCtrl)
  .get(getAllPostsCtrl);
router.route("/count").get(getPostsCountCtrl);
router
  .route("/:id")
  .get(validateObjectId, getSinglePostsCtrl)
  .delete(validateObjectId, verifyToken, deletePostsCtrl)
  .put(validateObjectId, verifyToken, updatePostCtrl);

// /update-image/:id
router
  .route("/update-image/:id")
  .put(
    validateObjectId,
    verifyToken,
    photoUpload.single("image"),
    updatePostImageCtrl,
  );
// /api/posts/like/:id
router.route("/like/:id").put(validateObjectId, verifyToken, toggleLikeCtrl);
module.exports = router;
