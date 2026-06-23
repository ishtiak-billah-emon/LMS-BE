import dotenv from "dotenv";
dotenv.config();


import connectDB from "./db/db.js";
import { app } from "./app.js";

connectDB()
.then( ()=> {
  app.on("error", (error)=>{
    console.log("Error at server: ", error);
    throw error
  })
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Server is running at port: ${process.env.PORT}`);
  })
})
.catch((err) =>{
  console.log("MONGODB Connection failed", err);
})
