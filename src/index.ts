import "dotenv/config";
import { serve } from "@hono/node-server";
import app from "./router.js";

serve({ fetch: app.fetch, port: 3000 }, () => {
  console.log("growzone listening on http://localhost:3000");
});
