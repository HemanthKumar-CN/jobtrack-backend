"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("employees", "four", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("employees", "ges", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("employees", "fdc", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("employees", "drv_lic", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("employees", "four");
    await queryInterface.removeColumn("employees", "ges");
    await queryInterface.removeColumn("employees", "fdc");
    await queryInterface.removeColumn("employees", "drv_lic");
  },
};
