const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendRegistrationEmail = async (to, name) => {
  await transporter.sendMail({
    from: `"I Work Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Registration Successful 🎉",
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>Your registration was successful.</p>
      <p>You can now log in to your account.</p>
      <br/>
      <p>Thanks,<br/>I Work Team</p>
    `,
  });
};

module.exports = sendRegistrationEmail;
