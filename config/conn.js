require('dotenv').config();
const mongoose=require('mongoose');
const dbconnect=()=>{mongoose.connect(process.env.MONGODB_URL).then(()=>{
    console.log("DB Coonected successfully")
}).catch((err)=>{console.log(err)})}
module.exports=dbconnect;