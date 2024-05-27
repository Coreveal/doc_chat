import express from "express";
import cors from "cors";
import "express-async-errors";
import { json } from "body-parser";
import { chatRouter } from "./routes/endpoints/chat";

const app = express();

app.use(cors());

app.use(json());

app.get("/", (req, res) => res.send("pong"));

app.use(chatRouter);

app.all("*", () => {
  throw new Error("Route not Found");
});

export { app };
