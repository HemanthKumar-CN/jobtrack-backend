// ✅ First line: Set up logging
require("./logger");

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors"); // Import cors

const app = express();

// ✅ Use cookie-parser to parse cookies
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // ✅ Set your frontend URL
    credentials: true, // ✅ Allow credentials (cookies, authorization headers)
  }),
); // Allow all origins (for development)

app.use(cookieParser());

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads"))); // Serve uploaded images

// Import routes
const userRoutes = require("./routes/userRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const scheduleRoutes = require("./routes/scheduleRoutes");
const contractorRoutes = require("./routes/contractorRoutes");
const eventRoutes = require("./routes/eventRoutes");
const reportRoutes = require("./routes/reportRoutes");

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
    const messageBody = req.body.Body.trim().toLowerCase(); // Reply message (YES/NO)

    console.log(`Received reply from ${fromNumber}: ${messageBody}`);

    // Example: Update database based on response
    if (messageBody === "yes") {
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

app.use("/api/users", userRoutes);
app.use(authenticateUser, require("./routes/locationRoutes"));
app.use("/api/employees", authenticateUser, employeeRoutes);
app.use("/api/schedules", authenticateUser, scheduleRoutes);
app.use("/api/contractors", authenticateUser, contractorRoutes);
app.use("/api/events", authenticateUser, eventRoutes);
app.use("/api/reports", authenticateUser, reportRoutes);

// Dummy function to update employee status in DB
async function updateEmployeeAvailability(phoneNumber, isAvailable) {
  // Replace this with actual DB update logic
  console.log(
    `Updating employee ${phoneNumber} availability to: ${
      isAvailable ? "Available" : "Unavailable"
    }`,
  );
}

// Sync database
sequelize
  .authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.error("Error connecting to database:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
