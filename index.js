require("dotenv").config();
const express = require("express");
const app = express();
const router = require("./routes/router");
const cors = require("cors")
const serverIp = "0.0.0.0";
const port = 8004;

app.use(express.json());
app.use(cors());
app.use(router)


app.listen(port, serverIp, () => {
    console.log(`server start at port no :${port}`)
})