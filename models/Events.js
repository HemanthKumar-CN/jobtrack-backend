"use strict";

module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    "Event",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      event_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: "Events",
      timestamps: true,
      underscored: true,
    },
  );

  Event.associate = (models) => {
    Event.hasMany(models.EventLocation, { foreignKey: "event_id" });
  };

  return Event;
};
