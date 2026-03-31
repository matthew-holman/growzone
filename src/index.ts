import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./router.js";

serve({ fetch: app.fetch, port: 8000 }, () => {
  console.log("growzone listening on http://localhost:8000");
});
