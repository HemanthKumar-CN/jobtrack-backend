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
      organization: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      // Label customization fields
      label_schedules: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_timesheets: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_employees: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_events: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_locations: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_contractors: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_restrictions: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_classifications: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_reports: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_dashboard: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_sms_info: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_section_scheduling: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_section_analytics: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      label_section_admin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      organization_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "organizations",
          key: "id",
        },
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
    AdminConfig.belongsTo(models.Organization, {
      foreignKey: "organization_id",
    });
  };

  return AdminConfig;
};
