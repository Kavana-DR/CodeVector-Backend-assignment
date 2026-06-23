import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { router } from "./routes";


export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  express.static(path.join(__dirname, "../frontend-dist"))
);

app.get("/", (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../frontend-dist/index.html")
  );
});
app.use(router);
app.use(notFound);
app.use(errorHandler);
