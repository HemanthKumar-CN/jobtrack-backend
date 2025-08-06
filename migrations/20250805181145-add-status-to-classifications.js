"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("classifications", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("classifications", "status");

    // Remove ENUM type if needed (Postgres-specific)
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_classifications_status";',
    );
  },
};
