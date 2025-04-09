import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { isUserLoggedIn } from "./meddleware/auth.js";
dotenv.config();

const port = process.env.PORT;
const jwt_secret=process.env.JWT_SECRET;

const app = express();
const prisma = new PrismaClient();

// Connect to the database
prisma.$connect()
  .then(() => {
    console.log("Database connected");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  return res.send("Welcome to EdTech server training run");
});

// Register user
app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return res.status(409).json({ message: "Username already exists, try another one" });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists, try another one" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });

    return res.status(201).json({
      message: "User added successfully",
      userData: newUser,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get all users
app.get("/users",isUserLoggedIn, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json({
      message: "All users",
      users:users,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get user count
app.get("/users/count", async (req, res) => {
  try {
    const userCounter = await prisma.user.count();
    return res.status(200).json({
      message: "Total number of users",
      count: userCounter,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
});



//retrive a single user

app.get("/users/:user_id" , async(req, res)=>{
try {
const userId = parseInt(req.params.user_id); 
const user= await prisma.user.findUnique({
    where: {id: userId}
});

if(!user){
return res.status(404).json({
message: "user not found"
})
}
return res.status(200).json({
     user,
    message: "operation successful"
});
} catch (error) {
console.log(error);
return res.status(500).json({
message: "server error"
})
   
}
})

//update

app.put("/users/:user_id", async(req, res)=>{
try {
const userId = parseInt(req.params.user_id);
const {username} = req.body;
const existusername= await prisma.user.findUnique({
where :{
username
}
})
if (existusername) {
return res.status(409).json({message: "username already taken"})  
}
const updateUser = await prisma.user.update({
where: {id:userId},
data:{
username:username
}
});
return res.status(200).json({
message: "username successful updated",
updateUser
})

} 
catch (error) {
console.log(error);
return res.status(500).json({
    message: "server error"
    })
       
       
}
})


app.delete("/users/:user_id", async(req, res)=>{
try {
const userId = parseInt(req.params.user_id);
const checkExist = await prisma.user.findFirst({
where: {id: userId}
})
if(checkExist){
return res.status(404).json({
message: "deleted"
})
}
await prisma.user.delete({
where: {
id: userId
}
})
return res.status(204).json({
message: "userdeleted"
})
} catch (error) {
return res.status(500).json({
message: "server error"
 })
           
           
}
})

app.get("/checklogin" ,async(req, res)=>{
try {
const {username ,  password} = req.body
const user = await prisma.user.findUnique({
where:{username}

})
if(!user){
res.status(404).json({message: "user not found"})
}

const checkpassword = await bcrypt.compare(password , user.password)

if(!checkpassword){

res.status(404).json({message : "user not found"})
}

res.status(200).json({message: "well come" ,user,})
} catch (error) {
console.log(error)
res.status(500). json({message: "server error"})
}
})

app.post("/login" , async (req, res)=>{

try {
const {email ,password} = req.body
console.log(req.header);


const user = await prisma.user.findUnique({
where:{email}

})
if(!user){
res.status(401).json({message: "envalid credentials"})
}

//compare password


const isPasswordCorrect = await bcrypt.compare(password , user.password)

//if password is invalid
if(!isPasswordCorrect){
res.status(401).json({message: "invalid credential"})
}
//if password correct we generate the tokens
const token = jwt.sign({id:user.id},jwt_secret,{expiresIn: "1h"})

//when credentials are true

res.status(200).json({message:"welcome" ,token ,user})

} catch (error) {
console.log(error)
res.status(404).json({message: "envalid credentials"})
}

})
app.patch("/change-password", isUserLoggedIn , async(req, res)=>{
try {
const {newpassword,oldpassword} = req.body
const user = req.user

const isPwdCorrect= await bcrypt.compare(oldpassword,user.password)
if(!isPwdCorrect){
return res.status(401).json({message:"unoutholized"})
//check if new password id not the same as old password
}
if(newpassword ===oldpassword){
  return res.status(400).json({message:"new password should not be the same"})

}

const hashnewpassword = await bcrypt.hash(newpassword, 10)

await prisma.user.update({
where:{id:user.id},
data:{
password:hashnewpassword
}
})

return res.status(200).json({message:"password changed"})
} catch (error) {
console.log(error);
return res.status(500).json({message:"server fail"})
 
}
})
// 404 Middleware - Handles undefined routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });
// Start the server
app.listen(port, () => console.log(`Server is running on port ${port}`));
