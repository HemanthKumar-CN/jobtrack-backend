"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("employees", "status");
    await queryInterface.addColumn("employees", "type", {
      type: Sequelize.STRING,
      allowNull: true, // Adjust as needed
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("employees", "status", {
      type: Sequelize.STRING,
    });
    await queryInterface.removeColumn("employees", "type");
  },
};
