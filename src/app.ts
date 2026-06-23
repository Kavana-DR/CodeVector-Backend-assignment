import express from "express";

import { errorHandler } from "./middleware/error-handler";
import { notFound } from "./middleware/not-found";
import { router } from "./routes";

export const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "CodeVector Backend Assignment API",
    status: "running"
  });
});

app.use(router);
app.use(notFound);
app.use(errorHandler);