// The browser UI, served at GET /. Kept as a single inline document so the
// store stays the only state and the build stays a plain tsc run (no asset
// copying, no frontend toolchain).
export const indexHtml = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>tinylinks</title>
<style>
  :root { color-scheme: light dark; }
  body {
    font-family: system-ui, sans-serif;
    max-width: 40rem;
    margin: 3rem auto;
    padding: 0 1rem;
    line-height: 1.5;
  }
  h1 { font-size: 1.5rem; }
  form { display: flex; flex-direction: column; gap: 0.75rem; margin: 1.5rem 0; }
  label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; }
  input {
    font: inherit;
    padding: 0.5rem;
    border: 1px solid #8886;
    border-radius: 0.375rem;
  }
  button {
    font: inherit;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    background: #2563eb;
    color: white;
    cursor: pointer;
    align-self: flex-start;
  }
  button:hover { background: #1d4ed8; }
  #result { margin-top: 1rem; }
  .error { color: #dc2626; }
  code { background: #8882; padding: 0.1rem 0.35rem; border-radius: 0.25rem; }
  table { border-collapse: collapse; margin-top: 0.5rem; }
  td, th { text-align: left; padding: 0.25rem 1rem 0.25rem 0; }
</style>
</head>
<body>
<h1>tinylinks</h1>
<p>Create a short link. Leave the slug blank to get a random one.</p>

<form id="create-form">
  <label>URL
    <input name="url" type="url" placeholder="https://example.com" required>
  </label>
  <label>Slug (optional)
    <input name="slug" type="text" placeholder="docs" pattern="[a-z0-9-]{1,32}">
  </label>
  <button type="submit">Shorten</button>
</form>

<div id="result"></div>

<script>
  const form = document.getElementById("create-form");
  const result = document.getElementById("result");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const body = { url: data.get("url") };
    if (data.get("slug")) body.slug = data.get("slug");

    const res = await fetch("/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const link = await res.json();

    if (!res.ok) {
      result.innerHTML = '<p class="error"></p>';
      result.querySelector("p").textContent = link.error;
      return;
    }

    const shortUrl = location.origin + "/" + link.slug;
    result.innerHTML =
      '<table><tr><th>Short link</th><td><a target="_blank"></a></td></tr>' +
      '<tr><th>Points to</th><td class="dest"></td></tr>' +
      '<tr><th>Stats</th><td><a class="stats" target="_blank"></a></td></tr></table>';
    const a = result.querySelector("a");
    a.href = shortUrl;
    a.textContent = shortUrl;
    result.querySelector(".dest").textContent = link.url;
    const stats = result.querySelector(".stats");
    stats.href = "/links/" + link.slug + "/stats";
    stats.textContent = "/links/" + link.slug + "/stats";
    form.reset();
  });
</script>
</body>
</html>
`;
