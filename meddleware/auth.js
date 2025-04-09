import jwt from "jsonwebtoken"
import { PrismaClient } from "@prisma/client";
export const isUserLoggedIn = async (req, res, next)=>{
try {
const autholization= req.headers.authorization;
if(!autholization){
return res.status(401).json({message: "unautholized"})
}
const prisma = new PrismaClient()
console.log(autholization);
const tokenarr = autholization.split(" ")
const token = tokenarr[1]
const secret = process.env.JWT_SECRET;
const tokendata=jwt.verify(token,secret )
console.log(tokendata);

// const token = autholization.split("")[1]


//check if user exist in database

const user = await prisma.user.findUnique({where:{id:tokendata.id}})

if (!user) {
return res.status(401).json({message:"unoutholized"})
}
req.user=user
next() 

} catch (error) {
  
console.log(error)
res.status(400).json({message:error.message})
        }
}
