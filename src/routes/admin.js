const { Router } = require("express");
const AfricasTalking = require("africastalking");
const HttpStatus = require("http-status");
const { Admin, CustomerUser, BoardMembers } = require("../database");
const {
  registerCustomerSchema,
  registerBoardSchema,
  loginRequestSchema,
} = require("../models/type");
const jwt = require("jsonwebtoken");
const {
  roleMiddleWare,
  authMiddleware,
  validateRequestBody,
} = require("./middlewares");
const { z } = require("zod");
const httpStatus = require("http-status");
const { where, Op } = require("sequelize");
const { uploadAttachments, uploadProfile } = require("./upload");
const adminRouter = Router();

adminRouter.get("/start", async (req, res) => {
  await Admin.build({
    fullName: "Admin",
    phoneNumber: "000000000",
    password: "admin@123",
    userName: "admin",
    role: "admin",
  }).save();
  res.json({ message: "admin registered" });
});

adminRouter.post(
  "/login",
  validateRequestBody(loginRequestSchema),
  async (req, res) => {
    const admin = await Admin.findOne({
      where: { userName: req.body.userName },
      attributes: { include: ["password"] },
    });

    if (!admin) return res.status(400).json({ message: "User does not exist" });

    if (admin.password !== req.body.password)
      return res.status(400).json({ message: "invalid credentials" });

    const { password, ...saved } = await admin.toJSON();

    const loginToken = jwt.sign({ ...saved }, process.env.JWT_SECRET, {
      expiresIn: "1y",
    });

    res.json({
      message: "Admin logged in",
      token: loginToken,
    });
  }
);

adminRouter.get("/customers", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findByPk(req.user.id);
  if (!adminUser)
    return res
      .status(400)
      .json({ message: "you are not allowed for this service" });
  const search = req.query.name ? req.query.name : "";
  const min = req.query.min ? req.query.min : 0;

  const customers = await CustomerUser.findAll({
    where: {
      [Op.or]: [
        { fullName: { [Op.like]: `%${search}%` } },
        { customerID: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } },
      ],
      totalSharePaidAmount: { [Op.gte]: min },
    },
  });

  return res.status(200).json({ data: customers });
});

adminRouter.get("/promised-share/:phone", async (req, res) => {
  const promisedShare = await CustomerUser.sum("totalSharePromised", {
    where: {
      phoneNumber: req.params.phone,
    },
  });
  return res.status(200).json({ data: { promisedShare: promisedShare } });
});

adminRouter.get("/customers/profile/:id", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findByPk(req.user.id);
  if (!adminUser)
    return res
      .status(400)
      .json({ message: "You are not allowed for this service" });

  const customer = await CustomerUser.findByPk(req.params.id);
  if (!customer)
    return res.status(400).json({ message: "User does not exist" });

  const { password, attachments, ...saved } = await customer.toJSON();
  const newAttachments = JSON.parse(attachments);

  res.json({
    message: "customer profile",
    data: { ...saved, attachments: newAttachments },
  });
});
adminRouter.get("/customers/fully-payed", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findByPk(req.user.id);
  if (!adminUser)
    return res
      .status(400)
      .json({ message: "You are not allowed for this service" });

  const customers = await CustomerUser.findAll({
    where: { fullyPayed: true },
  });

  return res.status(200).json({ data: customers });
});
adminRouter.get(
  "/customers/incomplete-payment",
  authMiddleware,
  async (req, res) => {
    const adminUser = await Admin.findByPk(req.user.id);
    if (!adminUser)
      return res
        .status(400)
        .json({ message: "You are not allowed for this service" });

    const customers = await CustomerUser.findAll({
      where: { fullyPayed: false },
    });

    return res.status(200).json({ data: customers });
  }
);
// adminRouter.get(
//   "/customers/payment-filter",
//   authMiddleware,
//   async (req, res) => {
//     const adminUser = await Admin.findByPk(req.user.id);
//     if (!adminUser)
//       return res
//         .status(400)
//         .json({ message: "You are not allowed for this service" });

//     const customers = await CustomerUser.findAll({
//       where: { fullyPayed: false },
//     });

//     return res.status(200).json({ data: customers });
//   }
// );
adminRouter.post(
  "/customer",
  authMiddleware,
  validateRequestBody(registerCustomerSchema),
  async (req, res) => {
    const adminUser = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!adminUser)
      return res.status(400).json({ message: "You can't create a member" });

    const existingCustomer = await CustomerUser.findOne({
      where: { customerID: req.body.customerID },
    });

    if (existingCustomer)
      return res.status(400).json({ message: "User already exists" });

    const newCustomer = CustomerUser.build({
      customerID: req.body.customerID,
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      totalSharePromised: parseInt(req.body.totalSharePromised),
      totalSharePaid: parseInt(req.body.totalSharePaid),
      totalSharePromisedAmount: parseInt(req.body.totalSharePromisedAmount),
      totalSharePaidAmount: parseInt(req.body.totalSharePaidAmount),
      ServiceCharge: parseFloat(req.body.ServiceCharge),
      fullyPayed:
        req.body.totalSharePromised === req.body.totalSharePaid ? true : false,
    });

    await newCustomer.save();

    const { password, ...saved } = await (await newCustomer.reload()).toJSON();

    res.json({
      message: "Customer registered",
      data: saved,
    });
  }
);

// upload a profile picture for an existing customer
adminRouter.put(
  "/customer/picture/:id",
  authMiddleware,
  uploadProfile.single("pic"),
  async (req, res) => {
    const existingCustomer = await CustomerUser.findByPk(req.params.id);

    if (!existingCustomer)
      return res.status(400).json({ message: "User doesn't exists" });

    await existingCustomer.update({
      profilePicture: `${req.file.path}`,
    });

    const { attachments, ...other } = existingCustomer.toJSON();
    const newAttachments = JSON.parse(attachments);
    return res.json({
      data: { ...other, newAttachments },
      message: "Customer updated successfully",
    });
  }
);
// upload a profile picture for an existing customer
adminRouter.put(
  "/customer/attachments/:id",
  authMiddleware,
  uploadAttachments.array("attachments", 10),
  async (req, res) => {
    const existingCustomer = await CustomerUser.findByPk(req.params.id);

    if (!existingCustomer)
      return res.status(400).json({ message: "User doesn't exists" });

    await existingCustomer.update({
      attachments: JSON.stringify(req.files.map((item) => item.path)),
    });
    const { attachments, ...other } = existingCustomer.toJSON();
    const newAttachments = JSON.parse(attachments);
    return res.json({
      data: { ...other, newAttachments },
      message: "Customer updated successfully",
    });
  }
);

adminRouter.put(
  "/customer/:id",
  authMiddleware,
  validateRequestBody(registerCustomerSchema),
  async (req, res) => {
    const adminUser = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!adminUser)
      return res.status(400).json({ message: "You can't update a member" });

    const existingCustomer = await CustomerUser.findByPk(req.params.id);

    if (!existingCustomer)
      return res.status(400).json({ message: "User doesn't exists" });

    await existingCustomer.update({
      customerID: req.body.customerID,
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      totalSharePromised: parseInt(req.body.totalSharePromised),
      totalSharePaid: parseInt(req.body.totalSharePaid),
      totalSharePromisedAmount: parseInt(req.body.totalSharePromisedAmount),
      totalSharePaidAmount: parseInt(req.body.totalSharePaidAmount),
      ServiceCharge: parseFloat(req.body.ServiceCharge),
      fullyPayed:
        req.body.totalSharePromised === req.body.totalSharePaid ? true : false,
    });

    const { attachments, ...other } = existingCustomer.toJSON();
    const newAttachments = JSON.parse(attachments);
    return res.json({
      data: { ...other, newAttachments },
      message: "Customer updated successfully",
    });
  }
);
adminRouter.delete("/customer/:id", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findOne({
    where: { userName: req.user.userName },
  });
  const user = await CustomerUser.findByPk(req.params.id);
  if (!adminUser)
    return res.status(404).json({ message: "You can't update a member" });
  if (!user)
    return res.status(HttpStatus.NOT_FOUND).json({ message: "No user found" });

  await user.destroy();
  return res.json({ message: "User Deleted" });
});

adminRouter.delete("/board/:id", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findByPk(req.user.id);
  const user = await Admin.findByPk(req.params.id);
  if (!adminUser)
    return res.status(404).json({ message: "You can't update a member" });
  if (!user)
    return res.status(HttpStatus.NOT_FOUND).json({ message: "No user found" });

  await user.destroy();
  return res.json({ message: "User Deleted" });
});

adminRouter.put("/customer/reset/:id/", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findOne({
    where: { userName: req.user.userName },
  });
  if (!adminUser)
    return res.status(404).json({ message: "You can't update a member" });

  const existingCustomer = await CustomerUser.findByPk(req.params.id);

  if (!existingCustomer)
    return res.status(HttpStatus.NOT_FOUND).json({ message: "No user found" });

  if (req.body.totalSharePaid < 0)
    return res.status(httpStatus.BAD_REQUEST).json({
      data: existingCustomer,
      message: "Payed totalSharePromised of lots should be greater than zero",
    });

  await existingCustomer.update(
    { totalSharePaid: 0 },
    { where: { id: existingCustomer.id } }
  );
  if (
    parseInt(existingCustomer.totalSharePromised) !==
    parseInt(existingCustomer.totalSharePaid)
  )
    await existingCustomer.update({
      fullyPayed: false,
    });

  await existingCustomer.reload();
  if (
    parseInt(existingCustomer.totalSharePromised) ===
    parseInt(existingCustomer.totalSharePaid)
  )
    await existingCustomer.update({
      fullyPayed: true,
    });
  return res.json({
    data: existingCustomer.toJSON(),
    message: "Customer updated successfully",
  });
});
adminRouter.put("/customer/pay/:id/", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findOne({
    where: { userName: req.user.userName },
  });
  if (!adminUser)
    return res.status(404).json({ message: "You can't update a member" });

  const existingCustomer = await CustomerUser.findByPk(req.params.id);

  if (!existingCustomer)
    return res.status(HttpStatus.NOT_FOUND).json({ message: "No user found" });

  if (req.body.totalSharePaid < 0)
    return res.status(httpStatus.BAD_REQUEST).json({
      data: existingCustomer,
      message: "Payed totalSharePromised of lots should be greater than zero",
    });

  if (
    parseInt(existingCustomer.totalSharePromised) <
    parseInt(existingCustomer.totalSharePaid) +
      parseInt(req.body.totalSharePaid)
  ) {
    return res.status(httpStatus.BAD_REQUEST).json({
      data: existingCustomer,
      message: `you already have subscribed for ${
        existingCustomer.totalSharePromised
      } but you are exceeding the totalSharePromised by ${
        parseInt(existingCustomer.totalSharePaid) +
        parseInt(req.body.totalSharePaid) -
        parseInt(existingCustomer.totalSharePromised)
      }`,
    });
  }

  // if (
  //   parseInt(existingCustomer.totalSharePromised) ===
  //   parseInt(existingCustomer.totalSharePaid)
  // ) {
  //   return res.status(httpStatus.BAD_REQUEST).json({
  //     data: existingCustomer,
  //     message: "You already have fully paid your subscription ",
  //   });
  // }
  await existingCustomer.increment(
    { totalSharePaid: req.body.totalSharePaid },
    { where: { id: existingCustomer.id } }
  );
  await existingCustomer.reload();
  if (
    parseInt(existingCustomer.totalSharePromised) ===
    parseInt(existingCustomer.totalSharePaid)
  )
    await existingCustomer.update({
      fullyPayed: true,
    });
  return res.json({
    data: existingCustomer.toJSON(),
    message: "Customer updated successfully",
  });
});

adminRouter.get("/board-members", authMiddleware, async (req, res) => {
  const User = await Admin.findOne({
    where: { userName: req.user.userName },
  });
  if (!User)
    return res
      .status(400)
      .json({ message: "You aren't allowed to get list of board members" });

  const members = await Admin.findAll({
    attributes: { exclude: ["userName"] },
    where: { role: "board" },
  });
  if (!members)
    res.json({
      message: "No Member available",
    });
  res.json({
    message: "Member List",
    data: members,
  });
});

adminRouter.post(
  "/board-member",
  authMiddleware,
  validateRequestBody(registerBoardSchema),
  async (req, res) => {
    const adminUser = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!adminUser)
      return res.status(400).json({ message: "You can't create a member" });

    const existingMember = await Admin.findOne({
      where: { fullName: req.body.fullName },
    });

    if (existingMember)
      return res.status(400).json({ message: "User already exists" });

    const newMember = Admin.build({
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: req.body.password,
      userName: req.body.userName,
      role: "board",
    });

    await newMember.save();

    const { password, ...saved } = await (await newMember.reload()).toJSON();

    res.json({
      message: "Member registered",
      data: saved,
    });
  }
);

adminRouter.get("/customers/stat", authMiddleware, async (req, res) => {
  const adminUser = await Admin.findByPk(req.user.id);
  if (!adminUser)
    return res
      .status(400)
      .json({ message: "You are not allowed for this service" });

  const [
    totalPaidShare,
    totalRequestedShare,
    totalShareHolders,
    totalShareHoldersCompletelyPaid,
    totalMoneyPromised,
    totalMoneyPaid,

    startedPay,

    customersPaid10kAndAbove,
    moneyPaid10kAndAbove,
    promisedMoney10kAndAbove,
    paidShare10kAndAbove,
    promisedShare10kAndAbove,

    customersPaidBelow10k,
    moneyPaidBelow10k,
    promisedMoneyBelow10k,
    paidShareBelow10k,
    promisedShareBelow10k,
  ] = await Promise.all([
    //paid share
    CustomerUser.sum("totalSharePaid", {
      where: { totalSharePaid: { [Op.gt]: 1 } },
    }),
    //requested share
    CustomerUser.sum("totalSharePromised"),
    //share holders
    CustomerUser.count(),
    //completed payement
    CustomerUser.count({
      where: { fullyPayed: true },
    }),
    //money promised
    CustomerUser.sum("totalSharePromisedAmount"),
    //money paid
    CustomerUser.sum("totalSharePaidAmount", {
      where: { totalSharePaidAmount: { [Op.gt]: 1 } },
    }),
    //started payment
    CustomerUser.count({
      where: { totalSharePaidAmount: { [Op.gte]: 1 } },
    }),

    //customers above 10k

    //customer 10k above
    CustomerUser.count({
      where: { totalSharePaidAmount: { [Op.gte]: 10000 } },
    }),
    //money paid  10k above
    CustomerUser.sum("totalSharePaidAmount", {
      where: { totalSharePaidAmount: { [Op.gte]: 10000 } },
    }),
    //money promised  10k above
    CustomerUser.sum("totalSharePromisedAmount", {
      where: { totalSharePaidAmount: { [Op.gte]: 10000 } },
    }),
    //share paid  10k above
    CustomerUser.sum("totalSharePaid", {
      where: { totalSharePaidAmount: { [Op.gte]: 10000 } },
    }),
    //promised share  10k above
    CustomerUser.sum("totalSharePromised", {
      where: { totalSharePaidAmount: { [Op.gte]: 10000 } },
    }),

    //customers below 10k

    //customer 10k below
    CustomerUser.count({
      where: { totalSharePaidAmount: { [Op.between]: [1, 9999] } },
    }),
    //money paid  10k below
    CustomerUser.sum("totalSharePaidAmount", {
      where: { totalSharePaidAmount: { [Op.between]: [1, 9999] } },
    }),
    //money promised  10k below
    CustomerUser.sum("totalSharePromisedAmount", {
      where: { totalSharePaidAmount: { [Op.between]: [1, 9999] } },
    }),
    //share paid  10k below
    CustomerUser.sum("totalSharePaid", {
      where: { totalSharePaidAmount: { [Op.between]: [1, 9999] } },
    }),
    //promised share  10k below
    CustomerUser.sum("totalSharePromised", {
      where: { totalSharePaidAmount: { [Op.between]: [1, 9999] } },
    }),
  ]);
  /**totalSharePaidAmount====>birr */
  return res.status(200).json({
    data: {
      totalShareHolders: totalShareHolders ?? 0,
      totalPaidShare: totalPaidShare ?? 0,
      totalRequestedShare: totalRequestedShare ?? 0,
      totalShareHoldersCompletelyPaid: totalShareHoldersCompletelyPaid ?? 0,
      totalSharePromisedAmount: totalMoneyPromised ?? 0,
      totalSharePaidAmount: totalMoneyPaid ?? 0,
      startedPay: startedPay,
      customerspaid10kAndAbove: customersPaid10kAndAbove,
      moneyPaid10kAndAbove: moneyPaid10kAndAbove,
      promisedMoney10kAndAbove: promisedMoney10kAndAbove,
      paidShare10kAndAbove: paidShare10kAndAbove,
      promisedShare10kAndAbove: promisedShare10kAndAbove,

      customersPaidBelow10k: customersPaidBelow10k,
      moneyPaidBelow10k: moneyPaidBelow10k,
      promisedMoneyBelow10k: promisedMoneyBelow10k,
      paidShareBelow10k: paidShareBelow10k,
      promisedShareBelow10k: promisedShareBelow10k,
    },
  });
});
adminRouter.get("/sms", (req, res) => {
  const apiKey =
    "f6131f257350d97683ec28ccd21e5ec780e36d30cd115920c0453ca536cebf82";
  const shortCode = "32022";
  const recipient = "+251924232022";
  const username = "kass3me@gmail.com";

  const africasTalking = new AfricasTalking({ apiKey, username });
  const sms = africasTalking.SMS;
  const options = {
    to: recipient,
    message: "Hello, this is your SMS message.",
    from: shortCode, // Optional
  };

  sms
    .send(options)
    .then((response) => {
      console.log(response);
    })
    .catch((error) => {
      console.error(error);
    });
});

module.exports = adminRouter;
