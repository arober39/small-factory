import express from "express";
import { createLink, getLink, isExpired, recordVisit, SlugTakenError } from "./store";
import { indexHtml } from "./ui";

const SLUG_PATTERN = /^[a-z0-9-]{1,32}$/;

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.type("html").send(indexHtml);
  });

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  app.post("/links", (req, res) => {
    const { url, slug } = (req.body ?? {}) as { url?: unknown; slug?: unknown };

    if (typeof url !== "string" || !isHttpUrl(url)) {
      res.status(400).json({ error: "url must be a valid http(s) URL" });
      return;
    }
    if (slug !== undefined && (typeof slug !== "string" || !SLUG_PATTERN.test(slug))) {
      res.status(400).json({ error: "slug must be 1-32 characters of a-z, 0-9, or -" });
      return;
    }

    try {
      const link = createLink(url, slug);
      res.status(201).json(link);
    } catch (err) {
      if (err instanceof SlugTakenError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  app.get("/links/:slug/stats", (req, res) => {
    const link = getLink(req.params.slug);
    if (!link) {
      res.status(404).json({ error: "not found" });
      return;
    }
    res.json(link);
  });

  app.get("/:slug", (req, res) => {
    const link = getLink(req.params.slug);
    if (!link) {
      res.status(404).json({ error: "not found" });
      return;
    }
    if (isExpired(link)) {
      res.status(410).json({ error: "link expired" });
      return;
    }
    recordVisit(link.slug);
    res.redirect(302, link.url);
  });

  return app;
}
