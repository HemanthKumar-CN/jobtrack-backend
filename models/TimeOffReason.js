"use strict";

module.exports = (sequelize, DataTypes) => {
  const TimeOffReason = sequelize.define(
    "TimeOffReason",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: "time_off_reasons",
      timestamps: true,
      underscored: true,
    },
  );

  TimeOffReason.associate = (models) => {
    TimeOffReason.hasMany(models.TimeOff, {
      foreignKey: "reason_id",
      as: "time_offs",
    });
  };

  return TimeOffReason;
};
