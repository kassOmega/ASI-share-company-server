const { DataTypes } = require("sequelize");
const db = require("./db");
const CustomerUser = db.define(
  "Members",
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT({ unsigned: true }),
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    totalSharePromised: {
      type: DataTypes.INTEGER({ unsigned: true }),
      allowNull: false,
    },
    totalSharePaid: {
      type: DataTypes.INTEGER({ unsigned: true }),
      allowNull: false,
    },
    fullyPayed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
  },
  { timestamps: true }
);
const Admin = db.define(
  "Admin",
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT({ unsigned: true }),
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(25),
      allowNull: false,
      defaultValue: "admin",
    },
    address: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
  },
  { timestamps: true }
);
const BoardMembers = db.define(
  "Board",
  {
    id: {
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT({ unsigned: true }),
    },
    fullName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING(25),
      allowNull: false,
    },
  },
  {
    timestamps: true,
    defaultScope: { attributes: { exclude: ["password"] } },
  }
);
// const Role = db.define(
//   "Role",
//   {
//     id: {
//       autoIncrement: true,
//       primaryKey: true,
//       type: DataTypes.BIGINT({ unsigned: true }),
//     },
//     roleName: {
//       type: DataTypes.STRING(255),
//       allowNull: false,
//     },
//     permission: {
//       type: DataTypes.STRING(25),
//       allowNull: false,
//     },
//   },
//   { timestamps: true }
// );

// Admin.hasMany(Role, { foreignKey: "roleID", constraints: true });
db.sync({ alter: true });
module.exports = { CustomerUser, Admin, BoardMembers };
