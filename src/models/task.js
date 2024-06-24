const mongoose = require("mongoose")

const taskSchema = new mongoose.Schema({
    description : {
        type : String,
        required : true,
        validate(value) {
            if(value.length > 50){
                throw new Error("Task description is more than 50 characters")
            }
        }
    },
    isComplete : {
        type : Boolean,
        default : false
    },
    owner :  {
        type : mongoose.Schema.Types.ObjectId,
        required : true,
        ref : "User"
    }
}, {
    timestamps : true
})

const Task = mongoose.model("Task", taskSchema)

module.exports = Task