"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Contractors", "hourly_rate", {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true, // allow null unless you want to force it
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Contractors", "hourly_rate");
  },
};
