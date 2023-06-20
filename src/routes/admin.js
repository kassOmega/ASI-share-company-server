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
const adminRouter = Router();

adminRouter.post("/register", (req, res) => {
  res.json({ message: "admin registered", data: req.body });
});

adminRouter.post(
  "/login",
  validateRequestBody(loginRequestSchema),
  async (req, res) => {
    const admin = await Admin.findOne({
      where: { userName: req.body.userName },
      attributes: { include: ["password"] },
    });

    if (!admin) return res.status(400).json({ message: "user does not exist" });

    if (admin.password !== req.body.password)
      return res.status(400).json({ message: "invalid credentials" });

    const { password, ...saved } = await admin.toJSON();

    const loginToken = jwt.sign(
      { ...saved, role: "admin" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1y",
      }
    );

    res.json({
      message: "Admin logged in",
      token: loginToken,
    });
  }
);

adminRouter.get(
  "/customers",
  authMiddleware,
  roleMiddleWare("admin"),
  async (req, res) => {
    const adminUser = await Admin.findByPk(req.user.id);
    if (!adminUser)
      return res
        .status(400)
        .json({ message: "you are not allowed for this service" });

    const customers = await CustomerUser.findAll();

    return res.status(200).json({ data: customers });
  }
);
adminRouter.get(
  "/customers/fully-payed",
  authMiddleware,
  roleMiddleWare("admin"),
  async (req, res) => {
    const adminUser = await Admin.findByPk(req.user.id);
    if (!adminUser)
      return res
        .status(400)
        .json({ message: "you are not allowed for this service" });

    const customers = await CustomerUser.findAll({
      where: { fullyPayed: true },
    });

    return res.status(200).json({ data: customers });
  }
);
adminRouter.get(
  "/customers/incomplete-payment",
  authMiddleware,
  roleMiddleWare("admin"),
  async (req, res) => {
    const adminUser = await Admin.findByPk(req.user.id);
    if (!adminUser)
      return res
        .status(400)
        .json({ message: "you are not allowed for this service" });

    const customers = await CustomerUser.findAll({
      where: { fullyPayed: false },
    });

    return res.status(200).json({ data: customers });
  }
);
adminRouter.post(
  "/customer",
  authMiddleware,
  roleMiddleWare("admin"),
  validateRequestBody(registerCustomerSchema),
  async (req, res) => {
    const adminUser = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!adminUser)
      return res.status(400).json({ message: "You can't create a member" });

    const existingCustomer = await CustomerUser.findOne({
      where: { userName: req.body.userName },
    });

    if (existingCustomer)
      return res.status(400).json({ message: "user already exists" });

    const newCustomer = CustomerUser.build({
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      address: req.body.address,
      password: req.body.password,
      userName: req.body.userName,
      totalSharePromised: parseInt(req.body.totalSharePromised),
      totalSharePaid: parseInt(req.body.totalSharePaid),
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
adminRouter.put(
  "/customer",
  authMiddleware,
  roleMiddleWare("admin"),
  async (req, res) => {
    const adminUser = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!adminUser)
      return res.status(404).json({ message: "You can't update a member" });

    const existingCustomer = await CustomerUser.findOne({
      where: { id: req.body.id },
    });

    if (!existingCustomer)
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: "No user found" });

    if (req.body.totalSharePaid <= 0)
      return res.status(httpStatus.BAD_REQUEST).json({
        data: existingCustomer,
        message: "payed totalSharePromised of lots should be greater than zero",
      });

    if (
      parseInt(existingCustomer.totalSharePromised) <
      parseInt(existingCustomer.totalSharePaid) + req.body.totalSharePaid
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        data: existingCustomer,
        message: `you already have subscribed for ${
          existingCustomer.totalSharePromised
        } but you are exceeding the totalSharePromised by ${
          parseInt(req.body.totalSharePaid) +
          parseInt(existingCustomer.totalSharePaid) -
          parseInt(existingCustomer.totalSharePromised)
        }`,
      });
    }

    if (
      parseInt(existingCustomer.totalSharePromised) ===
      parseInt(existingCustomer.totalSharePaid)
    ) {
      return res.status(httpStatus.BAD_REQUEST).json({
        data: existingCustomer,
        message: "you already have fully paid your subscription ",
      });
    }
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
  }
);
adminRouter.get(
  "/board-members",
  authMiddleware,
  roleMiddleWare("admin"),
  async (req, res) => {
    const User = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!User)
      return res
        .status(400)
        .json({ message: "You aren't allowed to get list of board members" });

    const members = await BoardMembers.findAll({
      attributes: { exclude: ["userName"] },
    });

    res.json({
      message: "Member List",
      data: members,
    });
  }
);

adminRouter.post(
  "/board-member",
  authMiddleware,
  roleMiddleWare("admin"),
  validateRequestBody(registerBoardSchema),
  async (req, res) => {
    const adminUser = await Admin.findOne({
      where: { userName: req.user.userName },
    });
    if (!adminUser)
      return res.status(400).json({ message: "You can't create a member" });

    const existingMember = await BoardMembers.findOne({
      where: { fullName: req.body.fullName },
    });

    if (existingMember)
      return res.status(400).json({ message: "user already exists" });

    const newMember = BoardMembers.build({
      fullName: req.body.fullName,
      phoneNumber: req.body.phoneNumber,
      password: req.body.password,
      userName: req.body.userName,
    });

    await newMember.save();

    const { password, ...saved } = await (await newMember.reload()).toJSON();

    res.json({
      message: "Member registered",
      data: saved,
    });
  }
);

adminRouter.get(
  "/customers/stat",
  authMiddleware,
  roleMiddleWare("admin"),
  async (req, res) => {
    const adminUser = await Admin.findByPk(req.user.id);
    if (!adminUser)
      return res
        .status(400)
        .json({ message: "you are not allowed for this service" });

    const [
      totalPaidShare,
      totalRequestedShare,
      totalShareHolders,
      totalShareHoldersCompletelyPaid,
    ] = await Promise.all([
      CustomerUser.sum("totalSharePaid"),
      CustomerUser.sum("totalSharePromised"),
      CustomerUser.count(),
      CustomerUser.count({
        where: { fullyPayed: true },
      }),
    ]);

    return res.status(200).json({
      data: {
        totalShareHolders,
        totalPaidShare,
        totalRequestedShare,
        totalShareHoldersCompletelyPaid,
      },
    });
  }
);
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
