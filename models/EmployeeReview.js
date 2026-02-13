"use strict";

module.exports = (sequelize, DataTypes) => {
  const EmployeeReview = sequelize.define(
    "EmployeeReview",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      review_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "employee_reviews",
      timestamps: true,
      underscored: true,
    },
  );

  EmployeeReview.associate = (models) => {
    EmployeeReview.belongsTo(models.Employee, { foreignKey: "employee_id" });
    EmployeeReview.belongsTo(models.User, {
      foreignKey: "reviewed_by",
      as: "reviewer",
    });
  };

  return EmployeeReview;
};
