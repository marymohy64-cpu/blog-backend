const router = require("express").Router();
const {
  registerUserCtrl,
  loginUserCtrl,
  verifyUserAccountCtrl,
} = require("../controllers/authControllers");

router.post("/register", registerUserCtrl);
router.post("/login", loginUserCtrl);

// /api/auth/users/:userId/verify/:token
router.get("/users/:userId/verify/:token", verifyUserAccountCtrl);

module.exports = router;
