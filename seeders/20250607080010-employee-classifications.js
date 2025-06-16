"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert(
      "classifications",
      [
        {
          abbreviation: "CS",
          description: "Chief Steward",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "S",
          description: "Steward",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "WS",
          description: "Working Steward",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "WS/FK",
          description: "Working Steward Fork",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "D",
          description: "Dockman",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "L/M",
          description: "Lead Man",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "T",
          description: "Trafficman",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Ramp",
          description: "Ramp",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "FK",
          description: "Fork Driver",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Gas",
          description: "Gas",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "FR",
          description: "Freight",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "LM-Mags",
          description: "Leadman Magazines",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "LM-Strap",
          description: "Leadman-Strapping",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Loader",
          description: "Loader",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Mags",
          description: "Magazines",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Strap",
          description: "Strapping",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Aisles",
          description: "Aisles",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "Empt",
          description: "Empties",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "LM-SM",
          description: "Leadman - Show Management",
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          abbreviation: "SM",
          description: "Show Management",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("classifications", null, {});
  },
};
