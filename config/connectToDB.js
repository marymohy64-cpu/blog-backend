const mongoose = require("mongoose");

module.exports.connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_CLOUD_URI);
    console.log("Connected To MongoDB Successfully ^_^");
  } catch (error) {
    console.log("Connection Failed To MongoDB!", error);
  }
};
