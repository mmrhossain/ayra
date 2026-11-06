import "./lib/openapi/registry.ts";
import express, { type Application, type Request } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.ts";
import { prisma } from "./lib/prisma.ts";
import { redis } from "./lib/redis.ts";
import { requestIdMiddleware } from "./common/middleware/request-id.middleware.ts";
import { authLimiter, domainLimiter, limiter } from "./common/middleware/rate-limit.middleware.ts";

import { notFoundHandler } from "./common/middleware/not-found.middleware.ts";
import { globalErrorHandler } from "./common/middleware/global-error.middleware.ts";
import { toNodeHandler } from "better-auth/node";


import catalogRoutes from "./modules/catalog/index.ts";
import cartRoutes from "./modules/cart/cart.routes.ts";
import orderRoutes from "./modules/order/index.ts";
import paymentRoutes from "./modules/payment/index.ts";
import settingsRoutes from "./modules/settings/index.ts";
import couponRoutes from "./modules/coupon/coupon.routes.ts";
import wishlistRoutes from "./modules/wishlist/index.ts";
import reviewRoutes from "./modules/review/index.ts";
import sliderRoutes from "./modules/slider/index.ts";
import homeRoutes from "./modules/home/index.ts";
import aiRoutes from "./modules/ai/index.ts";
import contentRoutes from "./modules/content/index.ts";
import analyticsRoutes from "./modules/analytics/index.ts";
import addressRoutes from "./modules/address/index.ts";
import profileRoutes from "./modules/profile/index.ts";
import authRoutes from "./modules/auth/auth.routes.ts";
import mediaRoutes from "./modules/media/index.ts";
import warehouseRoutes from "./modules/warehouse/index.ts";
import shippingRoutes from "./modules/shipping/index.ts";
import auditRoutes from "./modules/audit/index.ts";
import staffRoutes from "./modules/staff/index.ts";
import shipmentRoutes from "./modules/shipments/index.ts";
import courierRoutes from "./modules/courier/index.ts";
import geographyRoutes from "./modules/geography/index.ts";
import notificationRoutes from "./modules/notification/index.ts";
import { adminAuditMiddleware } from "./modules/audit/admin-audit.middleware.ts";
import {auth} from "./lib/auth.ts";
import { generateOpenApiDocument } from "./lib/openapi/document.ts";

const app: Application = express();
const betterAuthHandler = toNodeHandler(auth);

app.set("trust proxy", env.TRUST_PROXY_HOPS);

app.use(requestIdMiddleware);

app.use(
    cors({
        origin: [env.FRONTEND_URL, "http://localhost:3000"],
        credentials: true,
    })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(compression());
app.use(cookieParser());

morgan.token("request-id", (req) => (req as Request).requestId ?? "-");

if (env.isDevelopment) {
  app.use(morgan(":method :url :status :response-time ms :request-id"));
} else {
  app.use(morgan(":remote-addr - :method :url :status :response-time ms :request-id"));
}

app.use(limiter);
app.use(domainLimiter);

app.get("/health", (_, res) => {
  res.status(200).json({
    success: true,
    message: "Server running successfully",
    timestamp: new Date().toISOString(),
  });
});

app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    if (env.NODE_ENV !== "test") {
      if (!redis) {
        res.status(503).json({ success: false, message: "Redis unavailable" });
        return;
      }
      const pong = await redis.ping();
      if (pong !== "PONG") {
        res.status(503).json({ success: false, message: "Redis unavailable" });
        return;
      }
    }
    res.status(200).json({
      success: true,
      message: "Ready",
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({ success: false, message: "Not ready" });
  }
});

app.all("/api/v1/auth/*splat", authLimiter, betterAuthHandler);

app.use(
  express.json({
    limit: env.MAX_JSON_SIZE,
    verify: (req, _res, buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buffer);
    },
  })
);

app.use(
  express.urlencoded({
    extended: env.urlEncoded,
    limit: env.MAX_JSON_SIZE,
  })
);

if (env.enableApiDocs) {
  const openApiDocument = generateOpenApiDocument();

  app.get("/api-docs.json", (_req, res) => {
    res.status(200).json(openApiDocument);
  });

  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, {
      customSiteTitle: `${env.BETTER_AUTH_APP_NAME} API Docs`,
    })
  );
}

app.use("/api/v1/admin", adminAuditMiddleware);
app.use("/api/v1", catalogRoutes);
app.use("/api/v1", homeRoutes);
app.use("/api/v1", cartRoutes);
app.use("/api/v1", orderRoutes);
app.use("/api/v1", paymentRoutes);
app.use("/api/v1", settingsRoutes);
app.use("/api/v1", couponRoutes);
app.use("/api/v1", wishlistRoutes);
app.use("/api/v1", reviewRoutes);
app.use("/api/v1", sliderRoutes);
app.use("/api/v1", aiRoutes);
app.use("/api/v1", contentRoutes);
app.use("/api/v1", analyticsRoutes);
app.use("/api/v1", addressRoutes);
app.use("/api/v1", profileRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", mediaRoutes);
app.use("/api/v1", warehouseRoutes);
app.use("/api/v1", shippingRoutes);
app.use("/api/v1", auditRoutes);
app.use("/api/v1", staffRoutes);
app.use("/api/v1", shipmentRoutes);
app.use("/api/v1", courierRoutes);
app.use("/api/v1", geographyRoutes);
app.use("/api/v1", notificationRoutes);

app.use(notFoundHandler);

app.use(globalErrorHandler);

export default app;
