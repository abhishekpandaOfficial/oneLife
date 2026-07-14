import express from "express";
import cors from "cors";
import { pinoHttp } from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
const app = express();
app.use(pinoHttp({
    logger,
    serializers: {
        req(req) {
            return {
                id: req.id,
                method: req.method,
                url: req.url?.split("?")[0],
            };
        },
        res(res) {
            return {
                statusCode: res.statusCode,
            };
        },
    },
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);
// 404 — branded not-found handler
app.use((_req, res) => {
    res.status(404).json({
        error: "Not Found",
        message: "The requested OneLife API endpoint does not exist.",
        brand: "OneLife Finance",
        docs: "/api/healthz",
    });
});
// Global error handler — branded 500
app.use((err, _req, res, _next) => {
    logger.error(err, "Unhandled server error");
    res.status(500).json({
        error: "Internal Server Error",
        message: "Something went wrong on the OneLife server. Please try again.",
        brand: "OneLife Finance",
    });
});
export default app;
