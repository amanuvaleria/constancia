// Armazenamento simples usando um repositório GitHub privado como "banco de dados".
// Lê/escreve data.json via GitHub Contents API (sempre fresco, nunca cacheado pela CDN).

const GITHUB_API = "https://api.github.com";

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_DATA_REPO; // ex: "amanuvaleria/constancia-data"
  const branch = process.env.GITHUB_DATA_BRANCH || "main";
  const path = process.env.GITHUB_DATA_PATH || "data.json";
  if (!token || !repo) throw new Error("GITHUB_TOKEN / GITHUB_DATA_REPO não configurados");
  return { token, repo, branch, path };
}

async function ghFetch(url, options = {}) {
  const { token } = cfg();
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/vnd.github+json",
      "User-Agent": "constancia-push-backend",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status}: ${text}`);
  }
  return res.json();
}

async function readStore() {
  const { repo, branch, path } = cfg();
  try {
    const json = await ghFetch(
      `${GITHUB_API}/repos/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}&_=${Date.now()}`
    );
    const content = Buffer.from(json.content, "base64").toString("utf-8");
    return { data: JSON.parse(content), sha: json.sha };
  } catch (err) {
    // arquivo pode não existir ainda
    return { data: { subscriptions: {} }, sha: null };
  }
}

async function writeStore(data, sha) {
  const { repo, branch, path } = cfg();
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
  const body = {
    message: `update data.json (${new Date().toISOString()})`,
    content,
    branch,
  };
  if (sha) body.sha = sha;
  return ghFetch(`${GITHUB_API}/repos/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Executa uma mutação com retentativa simples em caso de conflito de SHA
// (concorrência: outra chamada pode ter escrito entre o read e o write).
async function withStore(mutatorFn, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    const { data, sha } = await readStore();
    const result = mutatorFn(data) || data;
    try {
      await writeStore(result, sha);
      return result;
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 400));
    }
  }
}

module.exports = { readStore, writeStore, withStore };
