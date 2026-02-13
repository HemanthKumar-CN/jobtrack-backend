"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("contractor_classes", "start_time", {
      type: Sequelize.TIME,
      allowNull: true,
    });

    await queryInterface.changeColumn("contractor_classes", "end_time", {
      type: Sequelize.TIME,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("contractor_classes", "start_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });

    await queryInterface.changeColumn("contractor_classes", "end_time", {
      type: Sequelize.TIME,
      allowNull: false,
    });
  },
};
