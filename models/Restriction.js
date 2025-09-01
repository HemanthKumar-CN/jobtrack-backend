// models/Restriction.js
"use strict";

module.exports = (sequelize, DataTypes) => {
  const Restriction = sequelize.define(
    "Restriction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Other",
      },
    },
    {
      tableName: "restrictions",
      timestamps: true,
      underscored: true,
    },
  );

  Restriction.associate = (models) => {
    Restriction.belongsToMany(models.Employee, {
      through: models.EmployeeRestriction,
      foreignKey: "restriction_id",
      otherKey: "employee_id",
      as: "employees", // optional but good practice
    });
  };

  return Restriction;
};
