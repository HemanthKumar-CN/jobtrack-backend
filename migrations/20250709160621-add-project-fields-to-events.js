"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Events", "project_code", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("Events", "project_comments", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Events", "project_code");
    await queryInterface.removeColumn("Events", "project_comments");
  },
};
