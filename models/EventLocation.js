"use strict";

module.exports = (sequelize, DataTypes) => {
  const EventLocation = sequelize.define(
    "EventLocation",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      event_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: "event_locations",
      timestamps: true,
      underscored: true,
    },
  );

  EventLocation.associate = (models) => {
    EventLocation.belongsTo(models.Event, { foreignKey: "event_id" });
    EventLocation.belongsTo(models.Location, { foreignKey: "location_id" });
    EventLocation.hasMany(models.EventLocationContractor, {
      foreignKey: "event_location_id",
    });
  };

  return EventLocation;
};
