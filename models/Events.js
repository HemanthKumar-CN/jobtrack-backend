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
      project_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      event_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      project_comments: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      auto_confirm_schedule: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
