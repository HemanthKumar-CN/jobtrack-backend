"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("schedules", "title");
    await queryInterface.removeColumn("schedules", "description");
    await queryInterface.removeColumn("schedules", "start_date");
    await queryInterface.removeColumn("schedules", "end_date");
    await queryInterface.removeColumn("schedules", "end_time");
    await queryInterface.removeColumn("schedules", "status");

    await queryInterface.sequelize.query(`
  DROP TYPE IF EXISTS "enum_schedules_status";
`);

    await queryInterface.addColumn("schedules", "status", {
      type: Sequelize.ENUM("pending", "confirmed", "declined"),
      allowNull: false,
      defaultValue: "pending",
    });

    await queryInterface.addColumn("schedules", "classification_id", {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "classifications",
        key: "id",
      },
    });

    await queryInterface.addColumn(
      "schedules",
      "event_location_contractor_id",
      {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "event_location_contractors",
          key: "id",
        },
      },
    );

    await queryInterface.addColumn("schedules", "comments", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {},
};
