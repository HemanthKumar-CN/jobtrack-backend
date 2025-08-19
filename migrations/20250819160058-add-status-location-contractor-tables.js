"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("Contractors", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });

    await queryInterface.addColumn("locations", "status", {
      type: Sequelize.ENUM("active", "inactive"),
      allowNull: false,
      defaultValue: "active",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Contractors", "status");
    await queryInterface.removeColumn("locations", "status");

    // Drop ENUM types explicitly (important for Postgres)
    if (queryInterface.sequelize.getDialect() === "postgres") {
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Contractors_status";',
      );
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_locations_status";',
      );
    }
  },
};
