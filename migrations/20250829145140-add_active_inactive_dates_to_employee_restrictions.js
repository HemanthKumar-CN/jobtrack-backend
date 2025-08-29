"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("employee_restrictions", "active_date", {
      type: Sequelize.DATEONLY,
      allowNull: true, // Set to false if it should be mandatory
      defaultValue: null,
    });

    // Add inactive_date column
    await queryInterface.addColumn("employee_restrictions", "inactive_date", {
      type: Sequelize.DATEONLY,
      allowNull: true, // Set to false if it should be mandatory
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove active_date column
    await queryInterface.removeColumn("employee_restrictions", "active_date");

    // Remove inactive_date column
    await queryInterface.removeColumn("employee_restrictions", "inactive_date");
  },
};
