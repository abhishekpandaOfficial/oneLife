import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    // Attempt a simple query to verify connection
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      message: "Could not connect to the database.",
      details: err?.message || err
    });
  }
});

export default router;
