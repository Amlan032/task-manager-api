const express = require("express")
require("./db/mongoose.js")
const userRoute = require("./routes/userRoute.js")
const taskRoute = require("./routes/taskRoute.js")
const { ObjectId } = require("mongodb")

const app = express()
const port = process.env.PORT

app.use(express.json())
app.use(userRoute)
app.use(taskRoute)

app.listen(port, () => {
    console.log("Server is running on port",port)
})
