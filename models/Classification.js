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
      orderNumber: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
      },
    },
    {
      tableName: "classifications",
      underscored: true, // maps created_at and updated_at
      timestamps: true, // enables created_at and updated_at
    },
  );

  Classification.associate = (models) => {
    Classification.hasMany(models.ContractorClass, {
      foreignKey: "classification_id",
      as: "classes",
    });
  };

  return Classification;
};
