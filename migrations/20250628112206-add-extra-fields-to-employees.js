"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.addColumn("employees", "mobile_phone", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("employees", "ssn", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("employees", "snf", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("employees", "number_id", {
        type: Sequelize.STRING,
        allowNull: true,
      }),
      queryInterface.addColumn("employees", "comments", {
        type: Sequelize.TEXT,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface, Sequelize) {
    await Promise.all([
      queryInterface.removeColumn("employees", "mobile_phone"),
      queryInterface.removeColumn("employees", "ssn"),
      queryInterface.removeColumn("employees", "snf"),
      queryInterface.removeColumn("employees", "number_id"),
      queryInterface.removeColumn("employees", "comments"),
    ]);
  },
};
