import dotenv from "dotenv";
dotenv.config();


import connectDB from "./db/db.js";
import { app } from "./app.js";
import { closeRedis, connectRedis } from "./config/redis.js";

connectDB()
.then(() => {
  app.on("error", (error)=>{
    console.log("Error at server: ", error);
    throw error
  })
  app.listen(process.env.PORT || 8000, ()=>{
    console.log(`Server is running at port: ${process.env.PORT}`);
  })

  // Redis is an optional cache. Never block API availability on it.
  void connectRedis();
})
.catch((err) =>{
  // console.log("MONGODB Connection failed", err);
})

const shutdown = async () => {
  await closeRedis();
  process.exit(0);
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
