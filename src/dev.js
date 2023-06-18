const { CustomerUser } = require("./database");

async function start() {
  const user = await CustomerUser.sum("totalSharePaid", {
    where: { fullyPayed: true },
  });
  console.log(user);
}
start();
