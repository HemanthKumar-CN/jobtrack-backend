"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("classifications", "order_number", {
      type: Sequelize.INTEGER, // Or Sequelize.STRING, matching your model
      allowNull: true, // Or false, matching your model
      unique: true, // Or remove if not unique
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("classifications", "order_number");
  },
};
