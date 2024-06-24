const express = require("express")
const taskRouter = express.Router()
const Task = require("../models/task.js")
const auth = require("../middleware/auth.js")
const User = require("../models/user.js")

//GET /tasks/?completed=true|false
// GET /tasks/?limit=10&skip=10
taskRouter.get("/tasks", auth, async (req, resp) => {
    const match = {}
    const sort = {}
    if(req.query.completed){
        match.isComplete = (req.query.completed === "true")
    }
    if(req.query.sortBy){
        parts = req.query.sortBy.split(":")
        sort[parts[0]] = (parts[1] === "asc") ? 1 : -1
    } 
    try{
        const taskList = await User.findById(req.user._id).populate({
            path : "tasks",
            match,
            options : {
                limit : parseInt(req.query.limit),
                skip : parseInt(req.query.skip),
                sort
            }
        }).exec()
        resp.send(taskList.tasks)
    }catch(error){
        console.log(error)
        resp.status(500).send()
    }
})

taskRouter.get("/tasks/:id", auth, async (req, resp) => {
    try{
        // const task = await Task.findById(req.params.id)
        const task = await Task.findOne({_id : req.params.id, owner : req.user._id})
        if(!task){
            resp.status(404).send("Task not found")
            return
        }
        resp.send(task)
    }catch(error){
        resp.status(400).send("Invalid Id")
    }
})

//create task
taskRouter.post("/tasks", auth, async (req, resp) => {
    try{
        const task = new Task(req.body)
        task.owner = req.user._id
        const result = await task.save()
        const demoTask = await Task.findById(task._id).populate("owner").exec()
        resp.status(201).send(result)
    }catch(error){
        console.log(error)
        resp.status(400).send(error)
    }
})

taskRouter.patch("/tasks/:id", auth, async (req, resp) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["description", "isComplete"]
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
        const task = await Task.findOne({_id : req.params.id, owner : req.user._id})
        if(!task){
            resp.status(404).send("Task not found")
            return
        }
        updates.forEach((update) => {
            task[update] = req.body[update]
        })
        const updatedTask = await task.save()
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new : true, runValidators : true})
        resp.send(updatedTask)
    }
    catch(error){
        resp.status(400).send(error)
    }
})

taskRouter.delete("/tasks/:id", auth, async (req, resp) => {
    try{
        const task = await Task.findOneAndDelete({_id : req.params.id, owner : req.user._id})
        if(!task){
            resp.status(404).send("Task not found for deletion")
            return
        }
        resp.send(task)
    }
    catch(error){
        resp.status(400).send("Error in Task deletion process")
    }
})

module.exports = taskRouter