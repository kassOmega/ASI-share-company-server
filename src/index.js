require("dotenv").config();
const express = require("express");
const cors = require("cors");
require("./database/db");
require("./database");

const PORT = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/customer", require("./routes/customer"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/board", require("./routes/board"));

// app.get("/", (req, res) => res.send("healthy!"));
app.use(express.static("./public"));

app.use((req, res, next) => {
  res.sendFile("./public/index.html");
});

app.listen(PORT, () => console.log(`server started on port ${PORT}`));
