module.exports = (sequelize, DataTypes) => {
  const EmployeeRestriction = sequelize.define(
    "EmployeeRestriction",
    {
      employee_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "employees",
          key: "id",
        },
      },
      restriction_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "restrictions",
          key: "id",
        },
      },
      active_date: {
        type: DataTypes.DATEONLY, // Use DATEONLY if you only care about the date
        allowNull: true, // Assuming these dates are optional
      },
      inactive_date: {
        type: DataTypes.DATEONLY, // Use DATEONLY if you only care about the date
        allowNull: true, // Assuming these dates are optional
      },
    },
    {
      tableName: "employee_restrictions",
      timestamps: true,
      underscored: true,
    },
  );

  return EmployeeRestriction;
};
