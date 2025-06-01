"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Remove contractor_id and location_id from Events
    await queryInterface.removeColumn("Events", "contractor_id");
    await queryInterface.removeColumn("Events", "location_id");

    // 2. Create event_locations table
    await queryInterface.createTable("event_locations", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Events",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "locations",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    // 3. Create event_location_contractors table
    await queryInterface.createTable("event_location_contractors", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      event_location_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "event_locations",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      contractor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Contractors",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: drop the new tables and add old columns back
    await queryInterface.dropTable("event_location_contractors");
    await queryInterface.dropTable("EventLocations");

    await queryInterface.addColumn("Events", "contractor_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "Contractors",
        key: "id",
      },
    });

    await queryInterface.addColumn("Events", "location_id", {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "locations",
        key: "id",
      },
    });
  },
};
