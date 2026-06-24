#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const vm = require("node:vm");

loadLocalEnv();

const DEFAULT_OUT = path.join(__dirname, "../data/deepseek-lexical-overrides.js");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const ENDPOINT = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";

const args = parseArgs(process.argv.slice(2));
const outFile = path.resolve(args.out || DEFAULT_OUT);
const mode = args.mode || "all";
const batchSize = Math.max(1, Number(args.batchSize || 12));
const concurrency = Math.max(1, Number(args.concurrency || 3));
const familiarLimit = Number(args.familiarLimit || 10000);
const morphologyLimit = Number(args.morphologyLimit || 2000);
const dryRun = !args.apply;

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

function loadLocalEnv() {
  const envFile = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envFile)) return;
  fs.readFileSync(envFile, "utf8").split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const [, key, rawValue] = match;
    if (process.env[key]) return;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  });
}

async function main() {
  const bank = loadBank();
  let existing = loadOverrides(outFile);
  const familiarTargets = mode === "morphology"
    ? []
    : selectFamiliarTargets(bank, existing).slice(0, familiarLimit);
  const morphologyTargets = mode === "familiar"
    ? []
    : selectMorphologyTargets(bank, existing).slice(0, morphologyLimit);

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      familiar: familiarTargets.length,
      morphology: morphologyTargets.length,
      familiarSample: familiarTargets.slice(0, 20).map((word) => word.word),
      morphologySample: morphologyTargets.slice(0, 20).map((word) => word.word)
    }, null, 2));
    console.log("\nRun with --apply to write lexical overrides.");
    return;
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY. Put it in .env.local or export it in the environment.");
  }

  if (familiarTargets.length) {
    console.log(`\n=== familiarMeaning: ${familiarTargets.length} words ===`);
    existing = await processBatches("familiar", familiarTargets, existing);
  }

  if (morphologyTargets.length) {
    console.log(`\n=== morphology/family: ${morphologyTargets.length} words ===`);
    existing = await processBatches("morphology", morphologyTargets, existing);
  }

  writeOverrides(outFile, existing);
  console.log(`\nDone. Lexical overrides: ${Object.keys(existing).length}`);
}

async function processBatches(kind, words, initialExisting) {
  let existing = initialExisting;
  const batches = chunk(words, batchSize);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
    while (cursor < batches.length) {
      const batch = batches[cursor];
      const batchIndex = cursor + 1;
      cursor += 1;
      process.stdout.write(`${kind} batch ${batchIndex}/${batches.length} (${batch.map((word) => word.word).join(", ")})... `);
      try {
        const generated = await generateBatch(kind, batch);
        const normalized = normalizeBatch(kind, batch, generated);
        existing = mergeOverrides(existing, normalized);
        writeOverrides(outFile, existing);
        console.log("ok");
      } catch (error) {
        console.log(`skip (${error.message})`);
      }
    }
  });
  await Promise.all(workers);
  return existing;
}

function loadBank() {
  const sandbox = { console, window: null, Set, Map, RegExp, String, Number, Array, JSON };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  [
    "../data/kaoyan-core-pack.js",
    "../data/kaoyan-extended-pack.js",
    "../data/kaoyan-complete-pack.js",
    "../data/kaoyan-syllabus-recognition-pack.js",
    "../data/pastpapers-index.js",
    "../data/pastpapers-vocab-stats.js",
    "../data/deepseek-context-overrides.js",
    "../data/deepseek-lexical-overrides.js",
    "../data/word-banks.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), sandbox, { filename: file });
  });
  const bank = sandbox.window.WORD_BANKS.find((item) => item.id === "kaoyan");
  if (!bank) throw new Error("Kaoyan bank not found");
  return bank;
}

function loadOverrides(file) {
  if (!fs.existsSync(file)) return {};
  const source = fs.readFileSync(file, "utf8");
  const match = source.match(/window\.KAOYAN_DEEPSEEK_LEXICAL\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) return {};
  return JSON.parse(match[1]);
}

function writeOverrides(file, data) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, `window.KAOYAN_DEEPSEEK_LEXICAL = ${JSON.stringify(sorted, null, 2)};\n`);
}

function selectFamiliarTargets(bank, existing) {
  return bank.words
    .filter((word) => word.polysemy || word.tags?.includes("熟词生义"))
    .filter((word) => !word.familiarMeaning && !existing[word.id]?.familiarMeaning)
    .sort((a, b) => scoreWord(b) - scoreWord(a) || a.word.localeCompare(b.word));
}

function selectMorphologyTargets(bank, existing) {
  return bank.words
    .filter((word) => isCoreMorphologyTarget(word))
    .filter((word) => !(word.morphology?.parts || []).length && !(existing[word.id]?.morphology?.parts || []).length)
    .sort((a, b) => scoreWord(b) - scoreWord(a) || a.word.localeCompare(b.word));
}

function isCoreMorphologyTarget(word) {
  return !word.recognitionOnly || word.level === "核心必背" || word.polysemy || word.paperHits > 0;
}

function scoreWord(word) {
  return (word.paperHits || 0) * 10 + (word.polysemy ? 25 : 0) + (word.level === "核心必背" ? 15 : 0) + (word.frequency || 3);
}

async function generateBatch(kind, words) {
  const payload = {
    model: MODEL,
    temperature: 0.25,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "你是考研英语词汇教练，只返回严格 JSON。",
          "内容要短、准确、适合背词卡片，不要编造真题出处。",
          "返回格式必须是 {\"items\":[...]}。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          task: kind === "familiar"
            ? "为熟词生义词补常见义 familiarMeaning。"
            : "为考研核心词补词根词缀拆解 morphology 和词族 family。",
          constraints: kind === "familiar" ? [
            "每个 item 必须包含 id, familiarMeaning。",
            "familiarMeaning 写学生最容易先想到的常见义，中文，少于 16 个汉字。",
            "不要重复 examSense；要体现常见义与考研义的差异。"
          ] : [
            "每个 item 必须包含 id, morphology, family。",
            "morphology.parts 是 2-4 个对象，每个对象包含 text 和 meaning。",
            "meaning 用中文，短语即可。",
            "morphology.note 用一句中文说明记忆逻辑，少于 38 个汉字。",
            "family 是 2-5 个同族词或派生词，英文字符串数组。",
            "不确定词源时可做教学型拆分，但不要写明显错误的拉丁词源。"
          ],
          words: words.map(summaryForPrompt)
        })
      }
    ]
  };
  const response = await postJson(ENDPOINT, payload);
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error("empty response");
  return JSON.parse(content);
}

function normalizeBatch(kind, words, generated) {
  if (!Array.isArray(generated.items)) throw new Error("response missing items array");
  const expectedIds = new Set(words.map((word) => word.id));
  const out = {};
  generated.items.forEach((item) => {
    if (!item?.id || !expectedIds.has(item.id)) return;
    if (kind === "familiar") {
      const familiarMeaning = String(item.familiarMeaning || "").trim();
      if (!familiarMeaning || familiarMeaning.length > 24) return;
      out[item.id] = { familiarMeaning };
      return;
    }
    const parts = Array.isArray(item.morphology?.parts)
      ? item.morphology.parts
          .map((part) => ({
            text: String(part.text || "").trim(),
            meaning: String(part.meaning || "").trim()
          }))
          .filter((part) => part.text && part.meaning)
          .slice(0, 4)
      : [];
    const family = Array.isArray(item.family)
      ? item.family.map((value) => String(value || "").trim()).filter(Boolean).slice(0, 5)
      : [];
    const note = String(item.morphology?.note || "").trim();
    if (parts.length < 2 || family.length < 2) return;
    out[item.id] = {
      morphology: {
        parts,
        note: note.length > 52 ? note.slice(0, 52) : note
      },
      family
    };
  });
  if (!Object.keys(out).length) throw new Error("no valid generated items");
  return out;
}

function mergeOverrides(existing, generated) {
  const merged = { ...existing };
  Object.entries(generated).forEach(([id, value]) => {
    merged[id] = { ...(merged[id] || {}), ...value };
  });
  return merged;
}

function summaryForPrompt(word) {
  return {
    id: word.id,
    word: word.word,
    pos: word.pos,
    cn: word.cn,
    examSense: word.examSense,
    familiarMeaning: word.familiarMeaning || "",
    level: word.level,
    tags: word.tags || [],
    paperHits: word.paperHits || 0
  };
}

function postJson(url, payload) {
  const endpoint = new URL(url);
  const body = JSON.stringify(payload);
  const options = {
    method: "POST",
    hostname: endpoint.hostname,
    path: `${endpoint.pathname}${endpoint.search}`,
    headers: {
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body)
    }
  };
  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let data = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        data += chunk;
      });
      response.on("end", () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`DeepSeek HTTP ${response.statusCode}: ${data.slice(0, 300)}`));
          return;
        }
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse DeepSeek response: ${error.message}`));
        }
      });
    });
    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const key = item.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}
