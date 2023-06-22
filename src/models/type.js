const { z } = require("zod");
const registerCustomerSchema = z.object({
  fullName: z.string().min(1, "full name is required"),
  phoneNumber: z.string().min(1, "phone number is required"),
  address: z.string().min(1, "phone number is required"),
  // password: z.string().min(1, "password is required"),
  // userName: z.string().min(1, "user name is required"),
  totalSharePromised: z.number(),
  totalSharePaid: z.number(),
});

const registerBoardSchema = z.object({
  fullName: z.string().min(1, "full name is required"),
  phoneNumber: z.string().min(1, "phone number is required"),
  address: z.string().min(1, "phone number is required"),
  password: z.string().min(1, "password is required"),
  userName: z.string().min(1, "user name is required"),
});
const loginRequestSchema = z.object({
  userName: z.string("id is required"),
  password: z.string().min(1, "password is required"),
});

module.exports = {
  registerCustomerSchema,
  registerBoardSchema,
  loginRequestSchema,
};
