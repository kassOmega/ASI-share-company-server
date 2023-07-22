const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
// Set up storage for uploaded files
const storageProfile = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
// Set up storage for uploaded files
const storageAttachments = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/attachments/");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4());
  },
});

// Create the multer instance
const uploadProfile = multer({ storage: storageProfile });
const uploadAttachments = multer({ storage: storageAttachments });

module.exports = { uploadProfile, uploadAttachments };
