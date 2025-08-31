const { Classification } = require("../models");
const { Op } = require("sequelize");

const getAllClassifications = async (req, res) => {
  const { status = "", search = "" } = req.query;

  const where = {};

  if (status && ["active", "inactive"].includes(status)) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { description: { [Op.iLike]: `%${search}%` } },
      { abbreviation: { [Op.iLike]: `%${search}%` } },
    ];
  }

  try {
    const classifications = await Classification.findAll({
      where,
      order: [["order_number", "ASC"]],
    });
    res.status(200).json(classifications);
  } catch (error) {
    console.error("Error fetching classifications:", error);
    res.status(500).json({ message: "Failed to fetch classifications" });
  }
};

const updateClassification = async (req, res) => {
  const { id } = req.params;
  const { description, abbreviation, status, orderNumber } = req.body;

  try {
    const classification = await Classification.findByPk(id);
    if (!classification) {
      return res.status(404).json({ message: "Classification not found" });
    }

    if (orderNumber) {
      const existingClassification = await Classification.findOne({
        where: {
          orderNumber: orderNumber,
          id: { [Op.ne]: id }, // Exclude current classification
        },
      });
      if (existingClassification) {
        return res.status(400).json({
          message: `Order number '${orderNumber}' already exists for classification '${existingClassification.abbreviation}'.`,
        });
      }
    }

    classification.description = description || classification.description;
    classification.abbreviation = abbreviation || classification.abbreviation;
    classification.status = status || classification.status;
    classification.orderNumber = orderNumber || classification.orderNumber;

    await classification.save();
    res.status(200).json(classification);
  } catch (error) {
    console.error("Error updating classification:", error);
    res.status(500).json({ message: "Failed to update classification" });
  }
};

const createClassification = async (req, res) => {
  const classificationsData = req.body;

  // Ensure classificationsData is an array and not empty
  if (!Array.isArray(classificationsData) || classificationsData.length === 0) {
    return res.status(400).json({
      message: "Request body must be an array of classification objects.",
    });
  }

  try {
    const errors = [];
    const createdClassifications = [];

    for (const data of classificationsData) {
      const { abbreviation, description, status, orderNumber } = data;

      // Check if orderNumber already exists
      if (orderNumber) {
        const existingClassification = await Classification.findOne({
          where: { orderNumber: orderNumber },
        });
        if (existingClassification) {
          errors.push(
            `Order number '${orderNumber}' already exists for classification '${existingClassification.abbreviation}'.`,
          );
          continue; // Skip this classification and move to the next
        }
      }

      // If both checks pass, create the classification
      const newClassification = await Classification.create({
        abbreviation,
        description,
        status,
        orderNumber,
      });
      createdClassifications.push(newClassification);
    }

    if (errors.length > 0) {
      // If some errors occurred, you might want to return a 400 or a 207 Multi-Status
      // For simplicity, let's just send the errors.
      return res.status(400).json({
        message: "Some classifications could not be created.",
        errors: errors,
        created: createdClassifications,
      });
    }

    res.status(201).json(createdClassifications);
  } catch (error) {
    console.error("Bulk creation error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  getAllClassifications,
  updateClassification,
  createClassification,
};
