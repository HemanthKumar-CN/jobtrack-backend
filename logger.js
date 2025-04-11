// logger.js
const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "logs");

// Create the logs directory if it doesn't exist
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
} catch (err) {
  console.error("Could not create log directory:", err);
}

const logFile = path.join(logDir, "backend.log");

let logStream;
try {
  logStream = fs.createWriteStream(logFile, { flags: "a" });
} catch (err) {
  console.error("Could not create log file stream:", err);
}

const writeLog = (type, args) => {
  const time = new Date().toISOString();
  const message = args
    .map((a) => (typeof a === "object" ? JSON.stringify(a) : a))
    .join(" ");
  if (logStream) {
    logStream.write(`[${type} ${time}] ${message}\n`);
  }
};

console.log = (...args) => writeLog("LOG", args);
console.error = (...args) => writeLog("ERROR", args);
