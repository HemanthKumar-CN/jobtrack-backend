"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("restrictions", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("restrictions", "status");
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_restrictions_status";`,
    );
  },
};
