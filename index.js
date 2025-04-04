import express from "express";
import cors from "cors";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

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
app.get("/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    return res.status(200).json({
      message: "All users",
      users,
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
    user: user,
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

app.put("/user/user_id", async(req, res)=>{
try {
const userId = parseInt(req.params.user_id);
const {username} = req.body;
const updateUser = await prisma.user.update({
where: {id:userId},
data:{
username:username
}
})
} catch (error) {
    
}
})

// 404 Middleware - Handles undefined routes
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
  });
// Start the server
app.listen(3000, () => console.log("Server is running on port 3000"));
