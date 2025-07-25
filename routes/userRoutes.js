const express = require("express");
const {
  getAllUsers,
  createUser,
  updateUser,
  userLogin,
  userLogout,
  userChangePassword,
  getScheduleForToken,
  scheduleRespond,
  getScheduleByToken,
} = require("../controllers/userController");
const { validAuth } = require("../utils/validateAuth");
const { authenticateUser } = require("../utils/authenticateUser");

const router = express.Router();

router.get("/", getAllUsers);
router.post("/", createUser);
router.post("/login", userLogin);
router.post("/logout", userLogout);
router.get("/check-validity", validAuth);
router.put("/change-password", authenticateUser, userChangePassword);

router.put("/:id", updateUser);
router.get("/by-token/:response_token", getScheduleByToken);
router.post("/schedule/respond", scheduleRespond);

module.exports = router;
