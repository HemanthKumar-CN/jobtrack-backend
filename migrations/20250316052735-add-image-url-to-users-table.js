"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable("users");

    if (!table.image_url) {
      await queryInterface.addColumn("users", "image_url", {
        type: Sequelize.STRING,
        allowNull: true, // Allow null initially
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "image_url");
  },
};
