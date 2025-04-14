const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "mail.schedyl.com",
  port: 465,
  secure: true, // SSL
  auth: {
    user: process.env.EMAIL_USER, // Your cPanel email
    pass: process.env.EMAIL_PASS, // Use the email account's actual password
  },
});

const sendWelcomeEmail = async (to, firstName, tempPassword) => {
  const mailOptions = {
    from: '"Schedyl" <admin@schedyl.com>',
    to,
    subject: "Welcome! Your New Account is Ready",
    html: `
        <p>Hi ${firstName},</p>
  
        <p>Your new account has been successfully set up, and you're ready to get started.</p>
  
        <p><strong>Here are your login details:</strong></p>
        <p>
          Username: <strong>${to}</strong><br>
          Password: <strong>${tempPassword}</strong>
        </p>
  
        <p>You can log in here: <a href="https://schedyl.com" target="_blank">schedyl.com</a></p>
  
        <p>We recommend logging in soon and updating your password for security.</p>
  
        <p>Thanks,<br>Schedyl Team</p>
      `,
  };

  console.log("Sending email to:", to); // Log the recipient's email address
  console.log("Email subject:", transporter); // Log the email subject

  return transporter.sendMail(mailOptions);
};

module.exports = sendWelcomeEmail;
