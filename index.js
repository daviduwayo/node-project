 import express from "express";
import cors from "cors"
import morgan from "morgan";
import {PrismaClient} from "@prisma/client"


 const app = express();

 const prisma = new PrismaClient();

 prisma.$connect().then(()=>{
console.log("databasse connected");

 })

 .catch((err)=>{
console.log(err);
process.exit(1);
 })

 app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res)=>{
return res.send("welcome to edtach server training run")
})

app.post("/register", async (req, res)=>{
try {
// const username = req.body.username;

// const email = req.body.email;
 
// const passowrd = req.body.passowrd;

const {username , email , password} = req.body
const exitusername = await prisma.user.findUnique({
where:{
username:username
}
})

if(exitusername){

return req.status(409).json({message:"username already exist try onather one"})    
}

const existemail = await prisma.user.findUnique({
where:{
email:email
}
})

if(existemail){

    return req.status(409).json({message:"email  already exist try onather one"})    
    }


const newuser = await prisma.user.create({
data:{username:username,
email:email,
password:password
}
})



return res.status(201).json({
message: "user added sucessful",
userData:newuser
})

} catch (error) {
console.log(error)

return res.status(500).json({message:"server error"})
    
}
})
// 404 Middleware - Handles undefined routes
app.use((req, res ) => {
    res.status(404).json({ message: "Route not found" });
});




 app.listen(3000, ()=> console.log("server is runninng "));