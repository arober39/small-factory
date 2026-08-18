import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app";
import { resetStore } from "../src/store";

const app = createApp();

beforeEach(() => {
  resetStore();
});

describe("GET /", () => {
  it("serves the browser UI", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/html");
    expect(res.text).toContain("tinylinks");
  });
});

describe("POST /links", () => {
  it("creates a link with a generated slug", async () => {
    const res = await request(app).post("/links").send({ url: "https://example.com" });
    expect(res.status).toBe(201);
    expect(res.body.url).toBe("https://example.com");
    expect(res.body.slug).toMatch(/^[a-z0-9]{6}$/);
    expect(res.body.visits).toBe(0);
  });

  it("accepts a custom slug", async () => {
    const res = await request(app).post("/links").send({ url: "https://example.com", slug: "docs" });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe("docs");
  });

  it("rejects an invalid url", async () => {
    const res = await request(app).post("/links").send({ url: "not-a-url" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("url");
  });

  it("rejects a non-http url", async () => {
    const res = await request(app).post("/links").send({ url: "ftp://example.com" });
    expect(res.status).toBe(400);
  });

  it("rejects an invalid slug", async () => {
    const res = await request(app).post("/links").send({ url: "https://example.com", slug: "Bad Slug!" });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain("slug");
  });

  it("rejects a duplicate slug", async () => {
    await request(app).post("/links").send({ url: "https://example.com", slug: "docs" });
    const res = await request(app).post("/links").send({ url: "https://example.org", slug: "docs" });
    expect(res.status).toBe(409);
  });
});

describe("GET /:slug", () => {
  it("redirects to the stored url", async () => {
    await request(app).post("/links").send({ url: "https://example.com", slug: "docs" });
    const res = await request(app).get("/docs");
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe("https://example.com");
  });

  it("counts visits", async () => {
    await request(app).post("/links").send({ url: "https://example.com", slug: "docs" });
    await request(app).get("/docs");
    await request(app).get("/docs");
    const stats = await request(app).get("/links/docs/stats");
    expect(stats.status).toBe(200);
    expect(stats.body.visits).toBe(2);
  });

  it("404s on an unknown slug", async () => {
    const res = await request(app).get("/nope");
    expect(res.status).toBe(404);
  });
});

describe("GET /links/:slug/stats", () => {
  it("404s on an unknown slug", async () => {
    const res = await request(app).get("/links/nope/stats");
    expect(res.status).toBe(404);
  });
});
