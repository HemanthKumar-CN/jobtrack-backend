// ✅ First line: Set up logging
require("./logger");

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors"); // Import cors
const { Op } = require("sequelize");
const { Employee, User } = require("./models");

const app = express();

// ✅ Use cookie-parser to parse cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://dev.schedyl.com", // ✅ Set your frontend URL
    credentials: true, // ✅ Allow credentials (cookies, authorization headers)
  }),
); // Allow all origins (for development)

app.use(cookieParser());

// app.use(bodyParser.json());
// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images

// Import routes
const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const contractorRoutes = require("./routes/contractorRoutes");
const eventRoutes = require("./routes/eventRoutes");
const reportRoutes = require("./routes/reportRoutes");
const restrictionRoutes = require("./routes/restrictionRoutes");
const classificationRoutes = require("./routes/classificationRoutes");
const adminConfigRoutes = require("./routes/adminConfigRoutes");

const sequelize = require("./config/database");
const { authenticateUser } = require("./utils/authenticateUser");

app.get("/", (req, res) => {
  res.send("✅ Backend API Running!");
});

// ✅ Webhook for handling Twilio SMS replies
app.post("/api/twilio/sms-reply", async (req, res) => {
  console.log("Received Twilio webhook:", req.body);
  try {
    const fromNumber = req.body.From; // Employee's phone number
    const messageBody = req.body.Body.trim().toLowerCase(); // Reply message (YES/NO/SUBSCRIBE/STOP)

    console.log(`Received reply from ${fromNumber}: ${messageBody}`);

    // Handle SMS opt-in/opt-out
    if (messageBody === "subscribe") {
      await handleSmsOptIn(fromNumber);
      console.log(`${fromNumber} subscribed to SMS notifications.`);
    } else if (messageBody === "stop") {
      await handleSmsOptOut(fromNumber);
      console.log(`${fromNumber} opted out of SMS notifications.`);
    }
    // Handle availability responses
    else if (messageBody === "yes") {
      await updateEmployeeAvailability(fromNumber, true);
      console.log(`${fromNumber} confirmed availability.`);
    } else if (messageBody === "no") {
      await updateEmployeeAvailability(fromNumber, false);
      console.log(`${fromNumber} is unavailable.`);
    } else {
      console.log(`Invalid response received: ${messageBody}`);
    }

    // Twilio expects a valid XML response
    res.send("<Response></Response>");
  } catch (error) {
    console.error("Error handling Twilio webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// ✅ Webhook for handling incoming email replies (opt-in/opt-out)
app.post("/api/email/reply", async (req, res) => {
  console.log("Received email webhook:", req.body);
  try {
    // Different email services send data differently
    let fromEmail, body;

    // CloudMailin format
    if (req.body.envelope && req.body.envelope.from) {
      fromEmail = req.body.envelope.from;
      body = (req.body.plain || req.body.html || "").trim().toLowerCase();
    }
    // SendGrid format
    else if (req.body.from) {
      fromEmail = req.body.from;
      body = (req.body.text || req.body.html || "").trim().toLowerCase();
    }
    // Mailgun format
    else if (req.body.sender) {
      fromEmail = req.body.sender;
      body = (req.body["body-plain"] || req.body["stripped-text"] || "")
        .trim()
        .toLowerCase();
    }
    // Generic format
    else {
      fromEmail = req.body.email || req.body.from_email;
      body = (req.body.body || req.body.message || "").trim().toLowerCase();
    }

    // Extract email if it's in format "Name <email@domain.com>"
    if (fromEmail && fromEmail.includes("<")) {
      fromEmail = fromEmail.match(/<(.+?)>/)[1];
    }

    console.log(`Received email from ${fromEmail}: ${body.substring(0, 100)}`);

    if (!fromEmail) {
      console.log("⚠️ No sender email found in request");
      return res.status(400).json({ message: "No sender email found" });
    }

    // Handle email opt-in/opt-out
    if (body.includes("subscribe")) {
      await handleEmailOptIn(fromEmail);
      console.log(`${fromEmail} subscribed to email notifications.`);
    } else if (body.includes("stop") || body.includes("unsubscribe")) {
      await handleEmailOptOut(fromEmail);
      console.log(`${fromEmail} opted out of email notifications.`);
    } else {
      console.log(`Invalid email response received: ${body.substring(0, 50)}`);
    }

    res.status(200).json({ message: "Email processed successfully" });
  } catch (error) {
    console.error("Error handling email webhook:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.use("/api/users", userRoutes);
app.use(authenticateUser, require("./routes/locationRoutes"));
app.use("/api/employees", authenticateUser, employeeRoutes);
app.use("/api/schedules", authenticateUser, scheduleRoutes);
app.use("/api/contractors", authenticateUser, contractorRoutes);
app.use("/api/events", authenticateUser, eventRoutes);
app.use("/api/reports", authenticateUser, reportRoutes);
app.use("/api/restrictions", authenticateUser, restrictionRoutes);
app.use("/api/classifications", authenticateUser, classificationRoutes);
app.use("/api/admin-configs", authenticateUser, adminConfigRoutes);

// Dummy function to update employee status in DB
async function updateEmployeeAvailability(phoneNumber, isAvailable) {
  // Replace this with actual DB update logic
  console.log(
    `Updating employee ${phoneNumber} availability to: ${
      isAvailable ? "Available" : "Unavailable"
    }`,
  );
}

// ✅ Function to handle SMS opt-in (SUBSCRIBE)
async function handleSmsOptIn(phoneNumber) {
  try {
    // Find employee by phone number
    const employee = await Employee.findOne({
      where: {
        [Op.or]: [{ phone: phoneNumber }, { mobile_phone: phoneNumber }],
      },
    });

    if (employee) {
      // Update SMS opt-in status
      await employee.update({
        sms_opt_in: true,
        sms_opt_in_date: new Date().toISOString().split("T")[0], // Only date (YYYY-MM-DD)
        sms_opt_out_date: null, // Clear opt-out date
      });
      console.log(`✅ Employee ${employee.id} opted IN to SMS notifications`);
    } else {
      console.log(`⚠️ No employee found with phone number: ${phoneNumber}`);
    }
  } catch (error) {
    console.error("Error handling SMS opt-in:", error);
    throw error;
  }
}

// ✅ Function to handle SMS opt-out (STOP)
async function handleSmsOptOut(phoneNumber) {
  try {
    // Find employee by phone number
    const employee = await Employee.findOne({
      where: {
        [Op.or]: [{ phone: phoneNumber }, { mobile_phone: phoneNumber }],
      },
    });

    if (employee) {
      // Update SMS opt-out status
      await employee.update({
        sms_opt_in: false,
        sms_opt_out_date: new Date().toISOString().split("T")[0], // Only date (YYYY-MM-DD)
        sms_opt_in_date: null, // Clear opt-in date
      });
      console.log(`✅ Employee ${employee.id} opted OUT of SMS notifications`);
    } else {
      console.log(`⚠️ No employee found with phone number: ${phoneNumber}`);
    }
  } catch (error) {
    console.error("Error handling SMS opt-out:", error);
    throw error;
  }
}

// ✅ Function to handle email opt-in (SUBSCRIBE)
async function handleEmailOptIn(email) {
  try {
    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`⚠️ No user found with email: ${email}`);
      return;
    }

    // Find employee by user_id
    const employee = await Employee.findOne({
      where: { user_id: user.id },
    });

    if (employee) {
      // Update email opt-in status
      await employee.update({
        email_opt_in: true,
        email_opt_in_date: new Date().toISOString().split("T")[0], // Only date (YYYY-MM-DD)
        email_opt_out_date: null, // Clear opt-out date
      });
      console.log(
        `✅ Employee ${employee.id} (User: ${user.email}) opted IN to email notifications`,
      );
    } else {
      console.log(`⚠️ No employee record found for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling email opt-in:", error);
    throw error;
  }
}

// ✅ Function to handle email opt-out (STOP/UNSUBSCRIBE)
async function handleEmailOptOut(email) {
  try {
    // Find user by email
    const user = await User.findOne({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      console.log(`⚠️ No user found with email: ${email}`);
      return;
    }

    // Find employee by user_id
    const employee = await Employee.findOne({
      where: { user_id: user.id },
    });

    if (employee) {
      // Update email opt-out status
      await employee.update({
        email_opt_in: false,
        email_opt_out_date: new Date().toISOString().split("T")[0], // Only date (YYYY-MM-DD)
        email_opt_in_date: null, // Clear opt-in date
      });
      console.log(
        `✅ Employee ${employee.id} (User: ${user.email}) opted OUT of email notifications`,
      );
    } else {
      console.log(`⚠️ No employee record found for user: ${user.email}`);
    }
  } catch (error) {
    console.error("Error handling email opt-out:", error);
    throw error;
  }
}

// Sync database
sequelize
  .authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.error("Error connecting to database:", err));

// ✅ Global error handler (last middleware)
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught error:", err.stack || err);
  res.status(500).json({
    success: false,
    error: err || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
