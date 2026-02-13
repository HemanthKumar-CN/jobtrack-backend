const { EmployeeReview, Employee, User } = require("../models");
const moment = require("moment");

/**
 * Create a review for an employee
 * POST /api/employee-reviews
 */
exports.createReview = async (req, res) => {
  try {
    const {
      employee_id,
      comments,
      review_date, // The review_date from the payload
    } = req.body;

    // Get reviewed_by from the authenticated user (from token)
    const reviewed_by = req.user.userId;

    // Validate required fields
    if (!employee_id || !review_date) {
      return res.status(400).json({
        success: false,
        message: "employee_id and review_date are required",
      });
    }

    // Validate date format
    if (!moment(review_date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(employee_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee not found",
      });
    }

    // Check if review already exists for this employee on this date
    const existingReview = await EmployeeReview.findOne({
      where: {
        employee_id,
        review_date: review_date,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this employee on this date",
      });
    }

    // Create the review
    const newReview = await EmployeeReview.create({
      employee_id,
      comments: comments || null,
      review_date: review_date,
      reviewed_by,
    });

    // Fetch the created review with associations
    const reviewWithDetails = await EmployeeReview.findByPk(newReview.id, {
      include: [
        {
          model: Employee,
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["first_name", "last_name", "email"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Review created successfully",
      data: reviewWithDetails,
    });
  } catch (error) {
    console.error("Error creating employee review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create review",
      error: error.message,
    });
  }
};

/**
 * Update a review by ID
 * PUT /api/employee-reviews/:id
 */
exports.updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      comments,
      review_date,
    } = req.body;

    // Find the review
    const review = await EmployeeReview.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Validate date format if provided
    if (review_date && !moment(review_date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Update the review
    await review.update({
      comments: comments !== undefined ? comments : review.comments,
      review_date: review_date || review.review_date,
    });

    // Fetch the updated review with associations
    const updatedReview = await EmployeeReview.findByPk(id, {
      include: [
        {
          model: Employee,
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["first_name", "last_name", "email"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview,
    });
  } catch (error) {
    console.error("Error updating employee review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update review",
      error: error.message,
    });
  }
};

/**
 * Delete a review by ID
 * DELETE /api/employee-reviews/:id
 */
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the review
    const review = await EmployeeReview.findByPk(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Delete the review
    await review.destroy();

    res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting employee review:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

/**
 * Get all reviews for a specific employee
 * GET /api/employee-reviews/employee/:employeeId
 */
exports.getReviewsByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const reviews = await EmployeeReview.findAll({
      where: { employee_id: employeeId },
      include: [
        {
          model: User,
          as: "reviewer",
          attributes: ["first_name", "last_name", "email"],
        },
      ],
      order: [["review_date", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching employee reviews:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};

/**
 * Get reviews by date
 * GET /api/employee-reviews/date/:date
 */
exports.getReviewsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!moment(date, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    const reviews = await EmployeeReview.findAll({
      where: { review_date: date },
      include: [
        {
          model: Employee,
          include: [
            {
              model: User,
              attributes: ["first_name", "last_name", "email"],
            },
          ],
        },
        {
          model: User,
          as: "reviewer",
          attributes: ["first_name", "last_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews by date:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message,
    });
  }
};
