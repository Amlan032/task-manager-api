const express = require("express")
const userRoute = express.Router()
const User = require("../models/user.js")
const Task = require("../models/task.js")
const auth = require("../middleware/auth.js")
const multer = require("multer")
const sharp = require("sharp")

userRoute.get("/users/me", auth,  async (req, resp) => {
    try{
        resp.send("Fetched profile for "+req.user.name)
    }catch(e){
        resp.status(500).send("Unable to fetch user list")
    }
})

userRoute.post("/users", async (req, resp) => {
    try{
        const user = new User(req.body)
        const token = await user.generateAuthToken()
        //save is removed because on token generation save method is already called
        // const result = await user.save()
        const publicUserData = {
            "Name" : user.name,
            "EmailId" : user.email
        }
        resp.status(201).send({user  : publicUserData, token})
    }catch(e){
        resp.status(400).send(e)
    }
})

//update
userRoute.patch("/users/me", auth, async (req, resp) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "password"]
    var isUpdateAllowed = true
    updates.forEach((update) => {
        if(!allowedUpdates.includes(update)){
            isUpdateAllowed = false
            return
        }
    })
    if(!isUpdateAllowed){
       return resp.status(400).send("Invalid Update")
    }
    try{
        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })
        await req.user.save()
        const publicUserData = {
            "Name" : req.user.name,
            "EmailId" : req.user.email
        }
        resp.send(publicUserData)
    }
    catch(error){
        resp.status(400).send(error)
    }
})

userRoute.delete("/users/me", auth, async (req, resp) => {
    try{
        await User.deleteOne({_id : req.user._id})
        await Task.deleteMany({owner : req.user._id})
        const publicUserData = {
            "Name" : req.user.name,
            "EmailId" : req.user.email
        }
        resp.send(publicUserData)
    }
    catch(error){
        console.log(error)
        resp.status(400).send("Error in deletion process")
    }
})

userRoute.post("/users/login", async (req, resp) => {
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        const publicUserData = {
            "Name" : user.name,
            "EmailId" : user.email
        }
        resp.send({user : publicUserData, token})
    }
    catch(error) {
        console.log(error)
        resp.status(400).send(error)
    }
})

userRoute.post("/users/logout", auth, async (req, resp) => {
    try{
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        resp.send("Logged Out")
    }
    catch(error) {
        resp.status(500).send()
    }
})

userRoute.post("/users/logoutAll", auth, async(req, resp) => {
    try{
        req.user.tokens = []
        await req.user.save()
        resp.send("Logged Out from all devices")
    }
    catch(error){
        resp.status(500).send()
    }
})

const uploadImg = multer({
    limits : {
        fileSize : 1000000 //1MB
    },
    fileFilter(req, file, cb) {
        //we can use regex for this instead of so many OR clauses
        if(file.originalname.endsWith(".jpg") || file.originalname.endsWith(".jpeg") || file.originalname.endsWith(".png")){
            cb(undefined, true)
        }
        else{
            cb(new Error("Please upload a image file"))
        }
    }
})

//upload profile pic
userRoute.post("/users/me/profilePicture", auth, uploadImg.single("picture"), async (req, resp) => {
    const imgBuffer = await sharp(req.file.buffer).resize(250,250).png().toBuffer()
    req.user.profilePic = imgBuffer
    await req.user.save()
    resp.send("Profile Picture uploaded successfully")
}, (error, req, resp, next) => {
    resp.status(400).send({
        "error" : error.message
    })
})

//delete profile pic
userRoute.delete("/users/me/profilePicture", auth, async (req, resp) => {
    req.user.profilePic = undefined
    await req.user.save()
    resp.send("Profile picture deleted successfully for user :"+req.user.name)
})

//get profile pic 
userRoute.get("/users/:id/profilePicture", async (req, resp) => {
    try{
        const user = await User.findById(req.params.id)
        if(!user || !user.profilePic){
            throw new Error("Profile picture unavailable for given user")
        }
        resp.set({"Content-Type": "image/png"}).send(user.profilePic)
    }
    catch(error) {
        resp.status(400).send(error.message)
    }
})
module.exports = userRoute