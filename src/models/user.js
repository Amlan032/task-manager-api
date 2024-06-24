const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    email : {
        type : String,
        unique : true,
        required : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Not a valid email")
            }
        }
    },
    password : {
        type : String,
        required : true,
        trim : true,
        minLength : 8
    },
    tokens : [
        {
            token : {
                type : String,
                required : true
            }
        }
    ],
    profilePic : {
        type : Buffer
    }
},{
    timestamps : true
})

//adding a vitual property to userschema, not stored in db, but mongoose populates it while querying
userSchema.virtual("tasks", {
    ref : "Task",
    localField : "_id",
    foreignField : "owner"
})

//statics method is used on collections
userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email})
    if(!user){
        throw new Error("Invalid Login Credentials")
    }
    const passwordMatch = await bcrypt.compare(password, user.password)
    if(!passwordMatch){
        throw new Error("Invalid Login Credentials")
    }
    return user
}

//methods is used for instance level, not at collection level
//arrow functions don't have "this" binding, hence we use normal function
userSchema.methods.generateAuthToken = async function () {
    const user = this // the user instance
    const token = jwt.sign({id : user._id.toString() }, process.env.JWT_SIGNATURE)
    user.tokens.push({token})
    await user.save()
    return token
}

userSchema.pre("save", async function(next) {
    const user = this
    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})
const User = mongoose.model("User", userSchema)

module.exports = User