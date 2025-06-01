"use strict";

module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address_1: DataTypes.STRING,
      address_2: DataTypes.STRING,
      city: DataTypes.STRING,
      state: DataTypes.STRING,
      postal_code: DataTypes.STRING,
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      colour_code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "locations",
      timestamps: true,
      underscored: true,
    },
  );

  Location.associate = (models) => {
    Location.hasMany(models.EventLocation, {
      foreignKey: "location_id",
      as: "eventLocations",
    });
  };

  return Location;
};
