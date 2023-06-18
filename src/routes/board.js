const { Router } = require("express");
const HttpStatus = require("http-status");
const { Admin, CustomerUser, BoardMembers } = require("../database");
const { loginRequestSchema } = require("../models/type");
const jwt = require("jsonwebtoken");
const {
  roleMiddleWare,
  authMiddleware,
  validateRequestBody,
} = require("./middlewares");
const { z } = require("zod");
const httpStatus = require("http-status");
const boardRouter = Router();

boardRouter.post(
  "/login",
  validateRequestBody(loginRequestSchema),
  async (req, res) => {
    const board = await BoardMembers.findOne({
      where: { userName: req.body.userName },
    });

    if (!board) return res.status(400).json({ message: "user does not exist" });

    if (board.password !== req.body.password)
      return res.status(400).json({ message: "invalid credentials" });

    const { password, ...saved } = await board.toJSON();

    const loginToken = jwt.sign(
      { ...saved, role: "board" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1y",
      }
    );

    res.json({
      message: "Board logged in",
      token: loginToken,
    });
  }
);

boardRouter.get(
  "/customers",
  authMiddleware,
  roleMiddleWare("board"),
  async (req, res) => {
    const User = await BoardMembers.findByPk(req.user.id);
    if (!User)
      return res
        .status(400)
        .json({ message: "you are not allowed for this service" });

    const customers = await CustomerUser.findAll();

    return res.status(200).json({ customers });
  }
);

boardRouter.get(
  "/members",
  authMiddleware,
  roleMiddleWare("board"),
  async (req, res) => {
    const User = await BoardMembers.findOne({
      where: { userName: req.user.userName },
    });
    if (!User)
      return res
        .status(400)
        .json({ message: "You aren't allowed to get list of members" });

    const members = await BoardMembers.findAll({
      attributes: { exclude: ["userName"] },
    });

    res.json({
      message: "Member List",
      data: members,
    });
  }
);

module.exports = boardRouter;
