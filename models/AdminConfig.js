"use strict";

module.exports = (sequelize, DataTypes) => {
  const AdminConfig = sequelize.define(
    "AdminConfig",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      new_schedule_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      update_schedule_message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      timesheet_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.5,
        validate: {
          min: 0,
        },
        get() {
          const value = this.getDataValue("timesheet_amount");
          return value ? parseFloat(value) : 0.5;
        },
      },
      phone_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "admin_configs",
      timestamps: true,
      underscored: true,
    },
  );

  AdminConfig.associate = (models) => {
    AdminConfig.belongsTo(models.User, { foreignKey: "user_id" });
  };

  return AdminConfig;
};
