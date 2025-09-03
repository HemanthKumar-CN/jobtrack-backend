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
