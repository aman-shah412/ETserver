require("dotenv").config();
const express = require("express");
const router = new express.Router();
const nodemailer = require("nodemailer");
const mongoose = require('mongoose');
const User = require("../DB/user")
const Project = require("../DB/project")
const multer = require('multer')
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken")


mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log("connected");
}).catch((err) => {
    console.log(err);
})

const upload = multer();

let Files = []

router.post("/upload", upload.array('File'), (req, res) => {
    if (req.files != null) {
        Files = req.files.map((e) => {
            return {
                setFileName: e.originalname,
                fileData: e.buffer
            }
        })
    }
})

// send mail
router.post("/register", (req, res) => {

    const result = req.body

    try {

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        let mailOptions;

        for (let i = 0; i < result.length; i++) {
            const data = result[i];
            if (Files.length > 0) {
                mailOptions = {
                    from: process.env.EMAIL,
                    to: data.toEmail,
                    subject: `${data.Subject}`,
                    html: `${data.Message}`,
                    attachments: Files.map((file) => ({
                        filename: file.setFileName,
                        content: file.fileData,
                    }))
                }


            } else {
                mailOptions = {
                    from: process.env.EMAIL,
                    to: data.toEmail,
                    subject: `${data.Subject}`,
                    html: `${data.Message}`
                }
            }

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log("Error" + error)
                } else {
                    // console.log("Email has been sent");
                    res.status(201).json({ status: 201 })
                }
            })
        }
        Files = []


    } catch (error) {
        console.log("Error" + error);
        res.status(401).json({ status: 401, error })
    }
});

router.post("/addproject", async (req, res) => {
    let result = req.body
    let existingProject = await Project.findOne({ Name: result.Name })
    if (existingProject) {
        res.send({ data: "UserExists" })
    } else {
        const connect = new Project({
            Name: result.Name,
            Vertical: result.Vertical
        })

        connect.save().then(() => {
            res.send({ data: "UserAdd" })
        }).catch(error => {
            console.log(error);
        })
    }
})

router.get("/allprojectdata", async (req, res) => {
    try {
        let data = await Project.find({})
        res.send({ data })
    } catch (error) {
        if (error instanceof mongoose.CastError) {
            return res.send({ status: 404, error: "Invalid user ID provided." });
        }
    }
})

router.get("/DandD", async (req, res) => {
    try {
        let data = await Project.find({ Vertical: "Data & Digital (D&D)" })
        res.send({ data })
    } catch (error) {
        if (error instanceof mongoose.CastError) {
            return res.send({ status: 404, error: "Invalid user ID provided." });
        }
    }
})

router.get("/ECO", async (req, res) => {
    try {
        let data = await Project.find({ Vertical: "EdTech & Catalog Operations (ECO)" })
        res.send({ data })
    } catch (error) {
        if (error instanceof mongoose.CastError) {
            return res.send({ status: 404, error: "Invalid user ID provided." });
        }
    }
})

router.get("/SS", async (req, res) => {
    try {
        let data = await Project.find({ Vertical: "Shared Service (SS)" })
        res.send({ data })
    } catch (error) {
        if (error instanceof mongoose.CastError) {
            return res.send({ status: 404, error: "Invalid user ID provided." });
        }
    }
})

router.post("/adduser", async (req, res) => {
    let result = req.body
    let existingUser = await User.findOne({ Email: result.Email })
    if (existingUser) {
        res.send({ data: "UserExists" })
    } else {
        const connect = new User({
            Name: result.Name,
            Email: result.Email,
            Type: result.Type,
            Password: "",
            Status: "Invited"
        })
        let signUpLink
        connect.save().then(savedDocument => {
            let doc = savedDocument
            signUpLink = `localhost:5173/signup/${doc._id}`
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        user: process.env.EMAIL,
                        pass: process.env.PASSWORD
                    }
                });
                let mailOptions = {
                    from: process.env.EMAIL,
                    to: result.Email,
                    subject: `Got an invitation`,
                    html: `Please sign up using this link ${signUpLink}`
                }
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.log("Error" + error)
                    } else {
                        console.log(`${result.Name} got the invitation link`);
                        res.status(201).json({ status: 201 })
                    }
                })

                res.send({ data: "UserAdd" })
            } catch (error) {
                console.log(error);
            }
        }).catch(err => {
            console.error(err);
        });
    }
})

router.post("/fetchuser", async (req, res) => {
    let result = req.body.id
    try {
        let data = await User.findById(result).exec();
        if (data) {
            res.send({ status: 200, data: data })
        } else {
            return res.send({ status: 404, error: "Invalid user ID provided." })
        }
    } catch (error) {
        if (error instanceof mongoose.CastError) {
            return res.send({ status: 404, error: "Invalid user ID provided." });
        }
    }
})

router.post("/signup", async (req, res) => {
    let result = req.body
    let Password = await bcrypt.hash(result.Password, 12);
    const update = async (_id) => {
        try {
            const res = await User.updateOne({ _id }, {
                $set: {
                    Password: Password,
                    Status: "Signed up"
                }
            })
        } catch (error) {
            console.log(error);
        }
    }
    update(result.Id)
})

router.post("/login", async (req, res) => {
    let result = req.body
    try {
        let user = await User.findOne({ Email: result.Email })
        let signjwt = await User.findOne({ Email: result.Email }, { Password: 0 })
        if (user) {
            const match = await bcrypt.compare(result.Password, user.Password)
            if (!match) {
                res.status(400).send({ status: 400 });
            } else {
                const token = jwt.sign({ signjwt }, process.env.SECRET_KEY)
                res.status(200).send({ token });
            }
        } else {
            res.status(400).send({ status: 400 });
        }
    } catch (error) {

    }
})

router.post("/gettoken", (req, res) => {
    let result = req.body
    if (result.token) {
        try {
            let verifiedToken = jwt.verify(result.token, process.env.SECRET_KEY)
            res.status(200).send({ verifiedToken })
        } catch (error) {
            console.log(error);
        }
    }
})

router.get("/alluserdata", async (req, res) => {
    try {
        let data = await User.find({})
        res.send({ data })
    } catch (error) {
        if (error instanceof mongoose.CastError) {
            return res.send({ status: 404, error: "Invalid user ID provided." });
        }
    }
})

router.post("/deleteuser", (req, res) => {
    let result = req.body
    const deleteUser = async (_id) => {
        try {
            const res = await User.deleteOne({ _id })
        } catch (error) {
            console.log(error);
        }
    }
    deleteUser(result._id)
})

router.post("/deleteproject", (req, res) => {
    let result = req.body
    const deleteUser = async (_id) => {
        try {
            const res = await Project.deleteOne({ _id })
        } catch (error) {
            console.log(error);
        }
    }
    deleteUser(result._id)
})


module.exports = router;