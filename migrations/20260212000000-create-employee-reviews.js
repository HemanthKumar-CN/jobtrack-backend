"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("employee_reviews", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      comments: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      review_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      reviewed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
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

    // Add indexes for better query performance
    await queryInterface.addIndex("employee_reviews", ["employee_id"]);
    await queryInterface.addIndex("employee_reviews", ["review_date"]);
    await queryInterface.addIndex("employee_reviews", [
      "employee_id",
      "review_date",
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("employee_reviews");
  },
};
