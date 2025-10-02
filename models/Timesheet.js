"use strict";

module.exports = (sequelize, DataTypes) => {
  const Timesheet = sequelize.define(
    "Timesheet",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      schedule_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "schedules",
          key: "id",
        },
      },
      actual_start: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: "Actual start time of work",
      },
      end_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: "Actual end time of work",
      },
      st: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Straight Time hours",
        get() {
          const value = this.getDataValue("st");
          return value ? parseFloat(value) : 0.0;
        },
      },
      ot: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Overtime hours",
        get() {
          const value = this.getDataValue("ot");
          return value ? parseFloat(value) : 0.0;
        },
      },
      dt: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0.0,
        comment: "Double Time hours",
        get() {
          const value = this.getDataValue("dt");
          return value ? parseFloat(value) : 0.0;
        },
      },
      status: {
        type: DataTypes.ENUM("open", "complete"),
        allowNull: false,
        defaultValue: "open",
      },
    },
    {
      tableName: "timesheets",
      timestamps: true,
      underscored: true,
    },
  );

  Timesheet.associate = (models) => {
    Timesheet.belongsTo(models.Schedule, {
      foreignKey: "schedule_id",
      as: "schedule",
    });
  };

  return Timesheet;
};
