"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "image_url", {
      type: Sequelize.STRING,
      allowNull: true, // Allow null initially
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "image_url");
  },
};
