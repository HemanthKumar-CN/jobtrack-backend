"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const orgIdColumn = {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: "organizations", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    };

    await queryInterface.addColumn("users", "organization_id", orgIdColumn);
    await queryInterface.addColumn("locations", "organization_id", orgIdColumn);
    await queryInterface.addColumn(
      "Contractors",
      "organization_id",
      orgIdColumn,
    );
    await queryInterface.addColumn("Events", "organization_id", orgIdColumn);
    await queryInterface.addColumn(
      "restrictions",
      "organization_id",
      orgIdColumn,
    );
    await queryInterface.addColumn(
      "classifications",
      "organization_id",
      orgIdColumn,
    );
    await queryInterface.addColumn(
      "admin_configs",
      "organization_id",
      orgIdColumn,
    );
    await queryInterface.addColumn("employees", "organization_id", orgIdColumn);
    await queryInterface.addColumn("schedules", "organization_id", orgIdColumn);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "organization_id");
    await queryInterface.removeColumn("locations", "organization_id");
    await queryInterface.removeColumn("Contractors", "organization_id");
    await queryInterface.removeColumn("Events", "organization_id");
    await queryInterface.removeColumn("restrictions", "organization_id");
    await queryInterface.removeColumn("classifications", "organization_id");
    await queryInterface.removeColumn("admin_configs", "organization_id");
    await queryInterface.removeColumn("employees", "organization_id");
    await queryInterface.removeColumn("schedules", "organization_id");
  },
};
