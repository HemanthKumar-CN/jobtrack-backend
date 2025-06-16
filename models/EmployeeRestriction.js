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
    },
    {
      tableName: "employee_restrictions",
      timestamps: true,
      underscored: true,
    },
  );

  return EmployeeRestriction;
};
