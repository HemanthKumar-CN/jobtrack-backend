"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.addColumn("employees", "notification_preference", {
      type: Sequelize.STRING, // Changed from ENUM to STRING
      allowNull: false,
      defaultValue: "email",
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn("employees", "notification_preference");
  },
};
