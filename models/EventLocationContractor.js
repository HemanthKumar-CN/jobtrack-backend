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
      steward_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "employees",
          key: "id",
        },
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
    EventLocationContractor.belongsTo(models.Employee, {
      foreignKey: "steward_id",
      as: "steward",
    });
    EventLocationContractor.hasMany(models.ContractorClass, {
      foreignKey: "assignment_id",
      as: "classes",
    });
  };

  return EventLocationContractor;
};
