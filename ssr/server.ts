/**
 * Production-ready Node.js SSR Service for Coalition Builder
 */

import express, { Request, Response, NextFunction, Application } from "express";
import React from "react";
import ReactDOMServer from "react-dom/server";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import winston from "winston";

interface MemoryUsage {
  rss: number;
  heapTotal: number;
  heapUsed: number;
  external: number;
}

interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: string;
  memory: {
    used: string;
    total: string;
  };
  cacheSize: number;
  environment: string;
}

interface MetricsResponse {
  cache: {
    size: number;
    hitRate: string;
  };
  memory: MemoryUsage;
  uptime: number;
}

interface RenderRequest {
  component?: string;
  props?: Record<string, any>;
  initialData?: {
    campaigns?: Campaign[];
    endorsers?: Endorser[];
  };
}

interface RenderResponse {
  html: string;
  success: boolean;
  cached?: boolean;
  renderTime: number;
  error?: string;
}

interface Campaign {
  id: number;
  title: string;
  summary: string;
}

interface Endorser {
  id: number;
  name: string;
  organization?: string;
}

interface AppProps {
  title?: string;
  description?: string;
  initialData?: {
    campaigns?: Campaign[];
    endorsers?: Endorser[];
  };
}

interface CacheEntry {
  html: string;
  timestamp: number;
}

// Configure logging
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

const app: Application = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Security middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// Performance middleware
app.use(compression());

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get("User-Agent"),
    });
  });
  next();
});

// React Components
const AppComponent = (props: AppProps = {}): React.ReactElement => {
  const { title, description, initialData = {} } = props;

  return React.createElement(
    "div",
    {
      className: "App",
      "data-ssr": "true",
    },
    [
      React.createElement(
        "header",
        {
          key: "header",
          className: "App-header",
        },
        [
          React.createElement("img", {
            key: "logo",
            src: "/static/media/logo.svg",
            className: "App-logo",
            alt: "logo",
          }),
          React.createElement(
            "h1",
            { key: "title" },
            title || process.env.ORGANIZATION_NAME || "Coalition Builder",
          ),
          React.createElement(
            "a",
            {
              key: "link",
              className: "App-link",
              href: "https://reactjs.org",
              target: "_blank",
              rel: "noopener noreferrer",
            },
            "Learn React",
          ),
        ],
      ),
      React.createElement(
        "main",
        {
          key: "main",
          className: "App-main",
        },
        [
          renderCampaignsList(initialData.campaigns || []),
          renderEndorsersList(initialData.endorsers || []),
        ],
      ),
    ],
  );
};

const renderCampaignsList = (campaigns: Campaign[]): React.ReactElement => {
  return React.createElement(
    "div",
    {
      key: "campaigns",
      className: "campaigns-list",
      "data-testid": "campaigns-list",
    },
    [
      React.createElement("h2", { key: "title" }, "Policy Campaigns"),
      campaigns.length === 0
        ? React.createElement("p", { key: "empty" }, "No campaigns found")
        : React.createElement(
            "ul",
            { key: "list" },
            campaigns.map((campaign: Campaign) =>
              React.createElement(
                "li",
                {
                  key: campaign.id,
                  "data-testid": `campaign-${campaign.id}`,
                },
                [
                  React.createElement("h3", { key: "title" }, campaign.title),
                  React.createElement(
                    "p",
                    { key: "summary" },
                    campaign.summary,
                  ),
                ],
              ),
            ),
          ),
    ],
  );
};

const renderEndorsersList = (endorsers: Endorser[]): React.ReactElement => {
  return React.createElement(
    "div",
    {
      key: "endorsers",
      className: "endorsers-list",
    },
    [
      React.createElement("h2", { key: "title" }, "Endorsers"),
      endorsers.length === 0
        ? React.createElement("p", { key: "empty" }, "No endorsers found")
        : React.createElement(
            "ul",
            { key: "list" },
            endorsers.map((endorser: Endorser) =>
              React.createElement(
                "li",
                {
                  key: endorser.id,
                },
                [
                  React.createElement("h3", { key: "name" }, endorser.name),
                  endorser.organization &&
                    React.createElement(
                      "p",
                      {
                        key: "org",
                      },
                      `Organization: ${endorser.organization}`,
                    ),
                ],
              ),
            ),
          ),
    ],
  );
};

// Cache for rendered components (simple in-memory cache)
const renderCache = new Map<string, CacheEntry>();
const CACHE_TTL = parseInt(process.env.CACHE_TTL || "300000"); // 5 minutes

function getCacheKey(data: Record<string, any>): string {
  return Buffer.from(JSON.stringify(data)).toString("base64");
}

function getFromCache(key: string): string | null {
  const cached = renderCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.html;
  }
  renderCache.delete(key);
  return null;
}

function setCache(key: string, html: string): void {
  // Limit cache size to prevent memory issues
  if (renderCache.size > 100) {
    const firstKey = renderCache.keys().next().value;
    renderCache.delete(firstKey);
  }

  renderCache.set(key, {
    html,
    timestamp: Date.now(),
  });
}

// Main SSR endpoint
app.post(
  "/render",
  async (
    req: Request<{}, RenderResponse, RenderRequest>,
    res: Response<RenderResponse>,
  ) => {
    const startTime = Date.now();

    try {
      const { component = "App", props = {}, initialData = {} } = req.body;

      // Validate component name
      if (component !== "App") {
        return res.status(400).json({
          error: "Invalid component name",
          success: false,
          html: "",
          renderTime: 0,
        });
      }

      // Check cache
      const cacheKey = getCacheKey({ component, props, initialData });
      const cachedHtml = getFromCache(cacheKey);

      if (cachedHtml) {
        logger.info("SSR cache hit", { component, cacheKey });
        return res.json({
          html: cachedHtml,
          success: true,
          cached: true,
          renderTime: 0,
        });
      }

      // Render component
      const element = AppComponent({ ...props, initialData });
      const html = ReactDOMServer.renderToString(element);

      // Cache result
      setCache(cacheKey, html);

      const renderTime = Date.now() - startTime;

      logger.info("SSR render complete", {
        component,
        renderTime: `${renderTime}ms`,
        htmlLength: html.length,
      });

      res.json({
        html,
        success: true,
        cached: false,
        renderTime,
      });
    } catch (error) {
      const renderTime = Date.now() - startTime;
      const err = error as Error;

      logger.error("SSR render error", {
        error: err.message,
        stack: err.stack,
        renderTime: `${renderTime}ms`,
      });

      res.status(500).json({
        html: '<div class="ssr-error">Error rendering component</div>',
        error: err.message,
        success: false,
        renderTime,
      });
    }
  },
);

// Health check endpoint
app.get("/health", (req: Request, res: Response<HealthCheckResponse>) => {
  const memUsage: MemoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      used: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
    },
    cacheSize: renderCache.size,
    environment: NODE_ENV,
  });
});

// Metrics endpoint
app.get("/metrics", (req: Request, res: Response<MetricsResponse>) => {
  const memUsage: MemoryUsage = process.memoryUsage();

  res.json({
    cache: {
      size: renderCache.size,
      hitRate: "0%", // Could implement hit rate tracking
    },
    memory: {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
    },
    uptime: process.uptime(),
  });
});

// Cache management endpoints
app.delete("/cache", (req: Request, res: Response) => {
  const size = renderCache.size;
  renderCache.clear();
  logger.info("Cache cleared", { previousSize: size });

  res.json({
    message: "Cache cleared",
    previousSize: size,
    success: true,
  });
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error("Unhandled error", {
    error: error.message,
    stack: error.stack,
    url: req.url,
  });

  res.status(500).json({
    error: "Internal server error",
    success: false,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint not found",
    success: false,
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`SSR service running on port ${PORT}`, {
    environment: NODE_ENV,
    port: PORT,
  });
});

export default app;
