const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { connectToDB } = require("./config/connectToDB");
const helmet = require("helmet");
const rateLimting = require("express-rate-limit");
const { errorHandler, notFound } = require("./middlewares/error");
connectToDB();
const app = express();
app.use(express.json());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      },
    },
  }),
);

app.set("trust proxy", 1);
// Rate Limting
app.use(
  rateLimting({
    windowMs: 10 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// cors policy
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://blog-frontend-marihan.vercel.app",
    ],
    credentials: true,
  })
);

// Routes
app.use("/api/auth", require("./routes/authRoute"));
app.use("/api/users", require("./routes/usersRoute"));
app.use("/api/posts", require("./routes/postsRout"));
app.use("/api/comments", require("./routes/commentsRoute"));
app.use("/api/categories", require("./routes/categoriesRoute"));
app.use("/api/password", require("./routes/passwordRoute"));

// Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

// Running The Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () =>
  console.log(`Server is running ${process.env.NODE_ENV} mode on port ${PORT}`),
);

module.exports = app;
