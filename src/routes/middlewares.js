const httpStatus = require("http-status");
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "unauthorized" });

  const token = authHeader.replace("Bearer ", "");

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    console.log("jwt error:", err.message);
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
};

const roleMiddleWare = (role) => (req, res, next) => {
  if (req.user.role != role) {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
};

const validateRequestBody = (zodSchema) => (req, res, next) => {
  const result = zodSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(httpStatus.BAD_REQUEST).json({ error: result.error });
  }
  next();
};

module.exports = {
  authMiddleware,
  roleMiddleWare,
  validateRequestBody,
};
