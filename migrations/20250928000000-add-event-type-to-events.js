"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Events", "event_type", {
      type: Sequelize.STRING,
      allowNull: true,
      after: "project_code",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Events", "event_type");
  },
};
