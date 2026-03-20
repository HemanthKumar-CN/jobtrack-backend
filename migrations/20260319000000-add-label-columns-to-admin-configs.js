"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add label columns to admin_configs table
    await queryInterface.addColumn("admin_configs", "label_schedules", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_timesheets", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_employees", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_events", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_locations", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_contractors", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_restrictions", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_classifications", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_reports", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_dashboard", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_sms_info", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn(
      "admin_configs",
      "label_section_scheduling",
      {
        type: Sequelize.STRING,
        allowNull: true,
      },
    );

    await queryInterface.addColumn("admin_configs", "label_section_analytics", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("admin_configs", "label_section_admin", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove label columns in reverse order
    await queryInterface.removeColumn("admin_configs", "label_section_admin");
    await queryInterface.removeColumn(
      "admin_configs",
      "label_section_analytics",
    );
    await queryInterface.removeColumn(
      "admin_configs",
      "label_section_scheduling",
    );
    await queryInterface.removeColumn("admin_configs", "label_sms_info");
    await queryInterface.removeColumn("admin_configs", "label_dashboard");
    await queryInterface.removeColumn("admin_configs", "label_reports");
    await queryInterface.removeColumn("admin_configs", "label_classifications");
    await queryInterface.removeColumn("admin_configs", "label_restrictions");
    await queryInterface.removeColumn("admin_configs", "label_contractors");
    await queryInterface.removeColumn("admin_configs", "label_locations");
    await queryInterface.removeColumn("admin_configs", "label_events");
    await queryInterface.removeColumn("admin_configs", "label_employees");
    await queryInterface.removeColumn("admin_configs", "label_timesheets");
    await queryInterface.removeColumn("admin_configs", "label_schedules");
  },
};
