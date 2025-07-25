require('dotenv').config();
const express=require('express');
const app=express()
const cors=require('cors')
app.use(cors())
const session = require('express-session');

app.use(session({
  secret: 'ashok-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 2 * 60 * 1000 // 2 minutes
  }
}));
const port=process.env.PORT||3000;
const dbconnect=require('./config/conn')
const router=require('./routes/routes')
const path=require('path');
const hbs=require('hbs')
app.set("view engine","hbs");
app.set('views',path.join(__dirname,"template/views"))
app.use("/api",router)
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.get('/',(req,res)=>{
    res.render("material")
})
app.listen(port,()=>{
    console.log( `server ${port} coonection is successfully`)
})  