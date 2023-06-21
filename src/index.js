require("dotenv").config();
const https = require("https");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("./database/db");
require("./database");

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/customer", require("./routes/customer"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/board", require("./routes/board"));

// app.get("/", (req, res) => res.send("healthy!"));
app.use(express.static("./public"));

app.use((req, res, next) => {
  res.sendFile(path.join(process.cwd(), "public/index.html"));
});

if (process.env.HTTPS_PORT && process.env.CERT_KEY && process.env.CERT_FILE) {
  https
    .createServer(
      {
        key: fs.readFileSync(process.env.CERT_KEY),
        cert: fs.readFileSync(process.env.CERT_FILE),
      },
      app
    )
    .listen(process.env.HTTPS_PORT, () => {
      console.log(`server is running on https port ${process.env.HTTPS_PORT}`);
    });
} else {
  app.listen(process.env.PORT, () =>
    console.log(`server is running on http port ${process.env.PORT}`)
  );
}
