const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "info.bright.future.ser@gmail.com",
    pass: "hjoqqbokbylfsgom",
  },
});

/**
 * Send email (supports HTML)
 * @param {string} to - Receiver's email
 * @param {string} subject - Email subject
 * @param {string} html - HTML content
 */
const sendMail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Care Home Management" <info.bright.future.ser@gmail.com>`,
      to,
      subject,
      html, // 👈 important: use html instead of text
    });
    console.log("📩 Email sent successfully");
  } catch (err) {
    console.error("❌ Email sending failed:", err.message);
  }
};

module.exports = sendMail;
