const express = require("express");
const router = express.Router();
const employeeReviewController = require("../controllers/employeeReviewController");

// Create a new review
router.post("/", employeeReviewController.createReview);

// Update a review by ID
router.put("/:id", employeeReviewController.updateReview);

// Delete a review by ID
router.delete("/:id", employeeReviewController.deleteReview);

// Get all reviews for a specific employee
router.get(
  "/employee/:employeeId",
  employeeReviewController.getReviewsByEmployee,
);

// Get reviews by date
router.get("/date/:date", employeeReviewController.getReviewsByDate);

module.exports = router;
