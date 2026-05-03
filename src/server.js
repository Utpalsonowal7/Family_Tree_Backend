import dotenv from 'dotenv';
dotenv.config({ path: "./.env" });

import app from "./app.js";
import { connectDB } from "./config/db.js";

const port = process.env.PORT || 3000;

connectDB()
     .then(() => {
          app.listen(port, () => {
               console.log(`✅ server is running at ${port}`)
          });
     })
     .catch((er) => {
          console.log(`Error : ${er}`);
          process.exit(-1)
     })

