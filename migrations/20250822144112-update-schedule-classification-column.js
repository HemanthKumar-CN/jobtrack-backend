"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove old foreign key
    await queryInterface.removeConstraint(
      "schedules",
      "schedules_classification_id_fkey",
    );

    // 2. Remove old column
    await queryInterface.removeColumn("schedules", "classification_id");

    // 3. Add new column
    await queryInterface.addColumn("schedules", "contractor_class_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "contractor_classes",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: remove new column
    await queryInterface.removeColumn("schedules", "contractor_class_id");

    // Re-add old classification_id column
    await queryInterface.addColumn("schedules", "classification_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "classifications",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
  },
};
