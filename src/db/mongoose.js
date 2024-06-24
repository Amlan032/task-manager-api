const mongoose = require("mongoose")

const connectionURL = process.env.MONGO_CONNECTION_URL
const dbName = process.env.DB_NAME
mongoose.connect(connectionURL+"/"+dbName, {
    autoIndex : true
}).then((result) => {
    // console.log(result)
}).catch((error) => {
    console.log(error)
})