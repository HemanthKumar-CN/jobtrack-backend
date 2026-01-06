"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("employees", "sms_opt_in", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn("employees", "sms_opt_in_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn("employees", "sms_opt_out_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn("employees", "email_opt_in", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });

    await queryInterface.addColumn("employees", "email_opt_in_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn("employees", "email_opt_out_date", {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("employees", "sms_opt_in");
    await queryInterface.removeColumn("employees", "sms_opt_in_date");
    await queryInterface.removeColumn("employees", "sms_opt_out_date");
    await queryInterface.removeColumn("employees", "email_opt_in");
    await queryInterface.removeColumn("employees", "email_opt_in_date");
    await queryInterface.removeColumn("employees", "email_opt_out_date");
  },
};
