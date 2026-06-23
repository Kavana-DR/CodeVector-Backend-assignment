import express from "express";
import path from "path";

import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { router } from "./routes";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.use(
  express.static(path.join(process.cwd(), "frontend-dist"))
);

app.get("/", (_req, res) => {
  res.sendFile(
    path.join(process.cwd(), "frontend-dist", "index.html")
  );
});

app.use(router);
app.use(notFound);
app.use(errorHandler);