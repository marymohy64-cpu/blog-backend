const nodemailer = require("nodemailer");

module.exports = async (userEmail, subject, htmltemplate) => {
  {
    try {
      const transpoter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.APP_EMAIL_ADDRESS,
          pass: process.env.APP_EMAIL_PASSWORD,
        },
      });
      const mailOption = {
        from: process.env.APP_EMAIL_ADDRESS,
        to: userEmail,
        subject: subject,
        html: htmltemplate,
      };
      const info = await transpoter.sendMail(mailOption);
      console.log("Email Sent: " + info.response);
    } catch (error) {
      console.log(error);
      throw new Error("Internal Server Error (nodemailer)");
    }
  }
};
