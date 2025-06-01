"use strict";

module.exports = (sequelize, DataTypes) => {
  const EventLocationContractor = sequelize.define(
    "EventLocationContractor",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      event_location_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      contractor_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "event_location_contractors",
      timestamps: true,
      underscored: true,
    },
  );

  EventLocationContractor.associate = (models) => {
    EventLocationContractor.belongsTo(models.EventLocation, {
      foreignKey: "event_location_id",
    });
    EventLocationContractor.belongsTo(models.Contractor, {
      foreignKey: "contractor_id",
    });
  };

  return EventLocationContractor;
};
