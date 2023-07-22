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
    customerID: {
      type: DataTypes.STRING(),
      allowNull: false,
      defaultValue: 0,
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
    profilePicture: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    attachments: {
      type: DataTypes.STRING(1024),
      allowNull: true,
    },
    totalSharePromised: {
      type: DataTypes.INTEGER({ unsigned: true }),
      allowNull: false,
      defaultValue: 5,
    },
    totalSharePaid: {
      type: DataTypes.INTEGER({ unsigned: true }),
      allowNull: false,
      defaultValue: 0,
    },
    totalSharePromisedAmount: {
      type: DataTypes.DOUBLE({ unsigned: true }),
      allowNull: false,
      defaultValue: 0.0,
    },
    totalSharePaidAmount: {
      type: DataTypes.DOUBLE({ unsigned: true }),
      allowNull: false,
      defaultValue: 0.0,
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
