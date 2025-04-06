"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("employees", "position");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("employees", "position", {
      type: Sequelize.STRING,
      allowNull: true, // Change if needed
    });
  },
};
