"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("restrictions", "type", {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: "Other",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("restrictions", "type");
  },
};
