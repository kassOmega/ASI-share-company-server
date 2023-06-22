const { Sequelize } = require("sequelize");
const config = {
  dialect: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "root",
  database: process.env.DB_NAME || "asi-share",
  logging: false,
}
const sequelize = new Sequelize(config);
console.log('db connection', config);

sequelize
  .authenticate()
  .then(() => console.log("database connected"))
  .catch((err) => console.log("database: ", err));

module.exports = sequelize;
