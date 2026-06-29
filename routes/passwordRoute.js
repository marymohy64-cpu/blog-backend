const router = require("express").Router();

const {
  sendResestPasswordLinkCtrl,
  getResestPasswordLinkCtrl,
  resetPasswordCtrl,
} = require("../controllers/passwordController");

// /api/password/reset-password-link
router.post("/reset-password-link", sendResestPasswordLinkCtrl);

// /api/password/reset-password/:userId/:token
router
  .route("/reset-password/:userId/:token")
  .get(getResestPasswordLinkCtrl)
  .post(resetPasswordCtrl);

module.exports = router;
