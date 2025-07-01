"use strict";

module.exports = (sequelize, DataTypes) => {
  const RecurringBlockedTime = sequelize.define(
    "RecurringBlockedTime",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      day_of_week: {
        type: DataTypes.ENUM("M", "T", "W", "Th", "F", "Sa", "Su"),
      },
      start_date: {
        type: DataTypes.DATEONLY,
      },
      end_date: {
        type: DataTypes.DATEONLY,
      },
      start_time: {
        type: DataTypes.TIME,
      },
      end_time: {
        type: DataTypes.TIME,
      },
    },
    {
      tableName: "recurring_blocked_times",
      timestamps: true,
      underscored: true,
    },
  );

  RecurringBlockedTime.associate = (models) => {
    RecurringBlockedTime.belongsTo(models.Employee, {
      foreignKey: "employee_id",
      as: "employee",
    });
  };

  return RecurringBlockedTime;
};
