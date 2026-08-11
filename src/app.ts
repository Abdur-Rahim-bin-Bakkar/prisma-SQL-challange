import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFound } from "./middleware/error";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ success: true, message: "EJP-13 Shop API", data: null });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;
