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
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // ✅ Set your frontend URL
    credentials: true, // ✅ Allow credentials (cookies, authorization headers)
  }),
); // Allow all origins (for development)

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

app.use("/api/users", userRoutes);
app.use(authenticateUser, require("./routes/locationRoutes"));
app.use("/api/employees", authenticateUser, employeeRoutes);
app.use("/api/schedules", authenticateUser, scheduleRoutes);
app.use("/api/contractors", authenticateUser, contractorRoutes);
app.use("/api/events", authenticateUser, eventRoutes);
app.use("/api/reports", authenticateUser, reportRoutes);

// Sync database
sequelize
  .authenticate()
  .then(() => console.log("Database connected..."))
  .catch((err) => console.error("Error connecting to database:", err));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
