"use strict";

module.exports = (sequelize, DataTypes) => {
  const Classification = sequelize.define(
    "Classification",
    {
      abbreviation: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
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
    },
    {
      tableName: "classifications",
      underscored: true, // maps created_at and updated_at
      timestamps: true, // enables created_at and updated_at
    },
  );

  return Classification;
};
