import express, { urlencoded } from 'express';
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config({ path: "./.env" });
import cookieParser from 'cookie-parser';

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ limit: "16kb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(cors({
     origin: process.env.CORS_ORIGIN.split(",")|| "*",
     credentials: true,
     methods: ["GET", "POST", "PUT", "PATCH"],
     allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use((req, res, next) => {
     const start = Date.now();

     res.on("finish", () => {
          const duration = Date.now() - start;
          console.log(
               `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
          );
     });

     next();
});

import healthCheckRoute from "./router/healthcheck.route.js"
import authRoute from "./router/auth.route.js";
import treeRoute from "./router/tree.route.js";
app.use("/api/v1/healthcheck", healthCheckRoute);
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/tree", treeRoute);


import { errHandler } from "./middlewares/err.middlewares.js";
app.use(errHandler);

export default app;