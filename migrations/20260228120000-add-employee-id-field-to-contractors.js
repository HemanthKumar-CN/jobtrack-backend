"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Contractors", "employee_id_field", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "four",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Contractors", "employee_id_field");
  },
};
