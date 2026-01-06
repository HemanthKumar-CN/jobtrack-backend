"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Change start_date and end_date to DATE type (without time)
    await queryInterface.changeColumn("Events", "start_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    await queryInterface.changeColumn("Events", "end_date", {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert back to TIMESTAMP type
    await queryInterface.changeColumn("Events", "start_date", {
      type: Sequelize.DATE,
      allowNull: false,
    });

    await queryInterface.changeColumn("Events", "end_date", {
      type: Sequelize.DATE,
      allowNull: false,
    });
  },
};
