import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" })

export const pool = new Pool({
     connectionString: process.env.CONNECTION_STRING
});

export const connectDB = async () => {
     try {
          const client = await pool.connect();
          const res = await client.query("SELECT NOW()");
          console.log(`✅ Postgres Connected Successfully : ${res.rows[0].now}`);
          client.release();
     } catch (error) {
          console.log("❌ Error Connecting to the DB : ", error);
          process.exit(-1)
     }
};