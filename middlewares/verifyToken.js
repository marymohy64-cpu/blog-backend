const jwt = require("jsonwebtoken");

// verify Token

function verifyToken(req, res, next) {
  const authToken = req.headers.authorization;
  if (authToken) {
    const token = authToken.split(" ")[1];
    try {
      const decodedPayload = jwt.verify(token, process.env.SECRETKEY);
      req.user = decodedPayload;
      next();
    } catch (error) {
      return res.status(401).json({ message: "invalid token , access denied" });
    }
  } else {
    return res
      .status(401)
      .json({ message: "no token provided , access denied" });
  }
}

// verify Token & Admin
function verifyTokenAndAdmin(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.isAdmin) {
      next();
    } else {
      return res.status(403).json({ message: "not allowed, only admin" });
    }
  });
}

// verify Token & only user himself
function verifyTokenAnddOnlyUser(req, res, next) {
  verifyToken(req, res, () => {
    if (req.params.id === req.user.id) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "not allowed , only user himself" });
    }
  });
}

// verify Token & Admin or user himself
function verifyTokenAndAuthorization(req, res, next) {
  verifyToken(req, res, () => {
    if (req.user.isAdmin || req.params.id === req.user.id) {
      next();
    } else {
      return res
        .status(403)
        .json({ message: "not allowed , only user himself or Admin" });
    }
  });
}

module.exports = {
  verifyToken,
  verifyTokenAndAdmin,
  verifyTokenAnddOnlyUser,
  verifyTokenAndAuthorization,
};
