const jwt = require("jsonwebtoken")
const User = require("../models/user.js")

const auth = async function(req, resp, next) {
    try{
        const token = req.header("Authorization").substring(7)
        const tokenData = jwt.verify(token, process.env.JWT_SIGNATURE)
        const user = await  User.findOne({_id : tokenData.id, "tokens.token" : token})
        if(!user){
            throw new Error()
        }
        req.user = user
        req.token = token
        next()
    }
    catch(error) {
        resp.status(401).send("Authentication failed.")
    }
}

module.exports = auth