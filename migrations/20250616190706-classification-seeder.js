"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const classifications = [
      { abbreviation: "CS", description: "Chief Steward" },
      { abbreviation: "S", description: "Steward" },
      { abbreviation: "WS", description: "Working Steward" },
      { abbreviation: "WS/FK", description: "Working Steward Fork" },
      { abbreviation: "D", description: "Dockman" },
      { abbreviation: "L/M", description: "Lead Man" },
      { abbreviation: "T", description: "Trafficman" },
      { abbreviation: "Ramp", description: "Ramp" },
      { abbreviation: "FK", description: "Fork Driver" },
      { abbreviation: "Gas", description: "Gas" },
      { abbreviation: "FR", description: "Freight" },
      { abbreviation: "LM-Mags", description: "Leadman Magazines" },
      { abbreviation: "LM-Strap", description: "Leadman-Strapping" },
      { abbreviation: "Loader", description: "Loader" },
      { abbreviation: "Mags", description: "Magazines" },
      { abbreviation: "Strap", description: "Strapping" },
      { abbreviation: "Aisles", description: "Aisles" },
      { abbreviation: "Empt", description: "Empties" },
      { abbreviation: "LM-SM", description: "Leadman - Show Management" },
      { abbreviation: "SM", description: "Show Management" },
    ].map((item) => ({
      ...item,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    await queryInterface.bulkInsert("classifications", classifications, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("classifications", null, {});
  },
};
