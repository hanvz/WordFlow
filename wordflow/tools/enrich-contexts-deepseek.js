#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const vm = require("node:vm");

loadLocalEnv();

const DEFAULT_OUT = path.join(__dirname, "../data/deepseek-context-overrides.js");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const ENDPOINT = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || 20);
const focus = args.focus || "sample";
const allFocuses = ["paper", "polysemy", "core", "recognition", "all"];
const outFile = path.resolve(args.out || DEFAULT_OUT);
const dryRun = !args.apply;
const skippedFile = path.resolve(args.skipped || outFile.replace(/\.js$/, ".skipped.json"));
const retries = Number(args.retries || 2);

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

function loadLocalEnv() {
  const envFile = path.join(__dirname, "../.env.local");
  if (!fs.existsSync(envFile)) return;
  const lines = fs.readFileSync(envFile, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
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
  const existing = loadOverrides(outFile);
  const usedContent = collectUsedContent(bank);
  if (args.all) {
    await runAllBatches(bank, existing, usedContent);
    return;
  }
  const words = selectWords(bank, existing, focus, limit);

  if (!words.length) {
    console.log("No words selected. Try a different --focus or remove existing overrides.");
    return;
  }

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      focus,
      limit,
      selected: words.map(summaryForPrompt)
    }, null, 2));
    console.log("\nRun with --apply and DEEPSEEK_API_KEY in your environment to write overrides.");
    return;
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY. Set it as an environment variable; do not write it into source files.");
  }

  const generated = {};
  const skipped = [];
  for (const word of words) {
    process.stdout.write(`Enriching ${word.word}... `);
    try {
      const context = await generateValidContext(word, usedContent);
      generated[word.id] = buildOverride(word, context);
      rememberContent(usedContent, word, context);
      console.log("ok");
    } catch (error) {
      console.log(`skip (${error.message})`);
      skipped.push(skippedEntry(word, focus, error));
    }
  }

  const merged = { ...existing, ...generated };
  writeOverrides(outFile, merged);
  writeSkipped(skippedFile, skipped);
  console.log(`Wrote ${Object.keys(generated).length} overrides to ${path.relative(process.cwd(), outFile)}`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} words. See ${path.relative(process.cwd(), skippedFile)}`);
  }
}

async function runAllBatches(bank, initialExisting, usedContent) {
  if (dryRun) {
    const plan = allFocuses.map((item) => ({
      focus: item,
      limit,
      selected: selectWords(bank, initialExisting, item, limit).map((word) => word.id)
    }));
    console.log(JSON.stringify({ mode: "dry-run-all", plan }, null, 2));
    console.log("\nRun with --all --apply and DEEPSEEK_API_KEY in your environment to write overrides.");
    return;
  }

  let existing = initialExisting;
  const skipped = [];
  for (const item of allFocuses) {
    const words = selectWords(bank, existing, item, limit);
    if (!words.length) {
      console.log(`Skipping ${item}: no candidates`);
      continue;
    }
    console.log(`\n=== Focus ${item}: ${words.length} words ===`);
    const generated = {};
    for (const word of words) {
      process.stdout.write(`Enriching ${word.word}... `);
      try {
        const context = await generateValidContext(word, usedContent);
        generated[word.id] = buildOverride(word, context);
        existing = { ...existing, [word.id]: generated[word.id] };
        rememberContent(usedContent, word, context);
        writeOverrides(outFile, existing);
        console.log("ok");
      } catch (error) {
        console.log(`skip (${error.message})`);
        skipped.push(skippedEntry(word, item, error));
      }
    }
  }
  writeSkipped(skippedFile, skipped);
  console.log(`\nAll requested batches finished. Overrides: ${Object.keys(existing).length}`);
  if (skipped.length) {
    console.log(`Skipped ${skipped.length} words. See ${path.relative(process.cwd(), skippedFile)}`);
  }
}

async function generateValidContext(word, usedContent) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const context = normalizeContext(word, await generateContext(word, attempt));
      validateGenerated(word, context);
      validateUniqueContent(word, context, usedContent);
      return context;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function buildOverride(word, context) {
  return {
    en: context.en,
    example: context.sentence,
    exampleCn: context.translation,
    examContext: {
      source: word.paperHits ? "DeepSeek 考研真题同域语境" : "DeepSeek 考研同域语境",
      year: word.paperHits ? `真题命中 ${word.paperCoverage || 1} 套` : "AI 校准语境",
      sentence: context.sentence,
      translation: context.translation,
      analysis: context.analysis
    },
    sourceRefs: {
      ...(word.sourceRefs || {}),
      examCorpus: "DeepSeek context curation"
    }
  };
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

function loadBank() {
  const sandbox = {
    console,
    window: null,
    Set,
    Map,
    RegExp,
    String,
    Number,
    Array,
    JSON
  };
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
  const match = source.match(/window\.KAOYAN_DEEPSEEK_CONTEXTS\s*=\s*(\{[\s\S]*\});?\s*$/);
  if (!match) return {};
  return JSON.parse(match[1]);
}

function writeOverrides(file, data) {
  const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
  const body = `window.KAOYAN_DEEPSEEK_CONTEXTS = ${JSON.stringify(sorted, null, 2)};\n`;
  fs.writeFileSync(file, body);
}

function writeSkipped(file, skipped) {
  const merged = new Map();
  if (fs.existsSync(file)) {
    try {
      JSON.parse(fs.readFileSync(file, "utf8")).forEach((item) => {
        merged.set(`${item.id}:${item.focus}`, item);
      });
    } catch (error) {
      console.warn(`Could not merge existing skipped file: ${error.message}`);
    }
  }
  skipped.forEach((item) => {
    merged.set(`${item.id}:${item.focus}`, item);
  });
  const sorted = [...merged.values()].sort((a, b) => (
    a.id.localeCompare(b.id) || a.focus.localeCompare(b.focus)
  ));
  fs.writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
}

function collectUsedContent(bank) {
  const used = {
    example: new Map(),
    exampleCn: new Map()
  };
  bank.words.forEach((word) => {
    if (word.example) used.example.set(normalizeForDuplicate(word.example), word.id);
    if (word.exampleCn) used.exampleCn.set(normalizeForDuplicate(word.exampleCn), word.id);
  });
  return used;
}

function rememberContent(used, word, context) {
  used.example.set(normalizeForDuplicate(context.sentence), word.id);
  used.exampleCn.set(normalizeForDuplicate(context.translation), word.id);
}

function validateUniqueContent(word, context, used) {
  const exampleOwner = used.example.get(normalizeForDuplicate(context.sentence));
  if (exampleOwner && exampleOwner !== word.id) {
    throw new Error(`${word.word}: sentence duplicates ${exampleOwner}`);
  }
  const translationOwner = used.exampleCn.get(normalizeForDuplicate(context.translation));
  if (translationOwner && translationOwner !== word.id) {
    throw new Error(`${word.word}: translation duplicates ${translationOwner}`);
  }
}

function normalizeForDuplicate(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function skippedEntry(word, focusName, error) {
  return {
    id: word.id,
    word: word.word,
    focus: focusName,
    error: error.message
  };
}

function selectWords(bank, existing, mode, max) {
  const idFilter = args.ids
    ? new Set(String(args.ids).split(",").map((item) => item.trim()).filter(Boolean))
    : null;

  const candidates = bank.words
    .filter((word) => args.force || !existing[word.id])
    .filter((word) => !word.record?.buried);

  if (idFilter) {
    return candidates
      .filter((word) => idFilter.has(word.id) || idFilter.has(word.word))
      .slice(0, max);
  }

  const filters = {
    sample: (word) => word.level === "核心必背" || word.polysemy || word.paperHits > 0,
    core: (word) => word.level === "核心必背",
    polysemy: (word) => word.polysemy || word.tags?.includes("熟词生义"),
    paper: (word) => word.paperHits > 0,
    recognition: (word) => word.recognitionOnly,
    all: () => true
  };

  const filter = filters[mode] || filters.sample;
  return candidates
    .filter(filter)
    .sort((a, b) => {
      const aScore = (a.paperHits || 0) * 8 + (a.polysemy ? 20 : 0) + (a.level === "核心必背" ? 12 : 0) + (a.frequency || 0);
      const bScore = (b.paperHits || 0) * 8 + (b.polysemy ? 20 : 0) + (b.level === "核心必背" ? 12 : 0) + (b.frequency || 0);
      return bScore - aScore || a.word.localeCompare(b.word);
    })
    .slice(0, max);
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
    paperHits: word.paperHits || 0,
    currentSentence: word.examContext?.sentence || word.example || ""
  };
}

async function generateContext(word, attempt = 0) {
  const payload = {
    model: MODEL,
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "你是考研英语阅读词汇教练，只生成简洁、自然、可直接放进背词卡片的内容。",
          "不要写真实年份或声称来自某套真题。不要编造真题出处。",
          "句子要像考研阅读同域句，但不要过长。中文解释要像老师口头讲解。",
          "必须返回 JSON，字段为 en, sentence, translation, analysis。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "为目标词生成考研阅读同域语境，帮助学生判断句中含义。",
          constraints: [
            "sentence 必须自然包含目标英文词，长度 12-24 个英文词。",
            `sentence 里必须原样出现英文单词 “${word.word}”，不要只写变形、派生词或同义词。`,
            "不要使用模板句，如 A careful analysis of the data reveals a clear trend.",
            "sentence 和 translation 必须和其他单词卡片明显不同。",
            "translation 必须是 sentence 的自然中文翻译。",
            "analysis 必须 1 句中文，说明看哪个搭配、词性或句子关系来定中文，少于 45 个汉字。",
            "en 必须是英文解释，少于 22 个英文词。",
            "避免抽象套话，如 作者论证脉络、真题反复命中、事实描述和作者评价。",
            "如果是熟词生义，analysis 必须提醒常见义和考研义的区别。",
            attempt > 0 ? `这是第 ${attempt + 1} 次生成，务必修正上次未通过校验的问题。` : ""
          ].filter(Boolean),
          word: summaryForPrompt(word)
        })
      }
    ]
  };

  const response = await postJson(ENDPOINT, payload);
  const content = response.choices?.[0]?.message?.content;
  if (!content) throw new Error(`Empty DeepSeek response for ${word.word}`);
  return JSON.parse(content);
}

function postJson(url, payload) {
  const endpoint = new URL(url);
  const body = JSON.stringify(payload);
  const options = {
    method: "POST",
    hostname: endpoint.hostname,
    path: `${endpoint.pathname}${endpoint.search}`,
    headers: {
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
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
          reject(new Error(`DeepSeek HTTP ${response.statusCode}: ${data.slice(0, 400)}`));
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

function validateGenerated(word, context) {
  const required = ["en", "sentence", "translation", "analysis"];
  required.forEach((field) => {
    if (!context[field] || typeof context[field] !== "string") {
      throw new Error(`${word.word}: missing generated field ${field}`);
    }
  });
  if (!new RegExp(`\\b${escapeRegExp(word.word)}\\b`, "i").test(context.sentence)) {
    throw new Error(`${word.word}: sentence does not include target word`);
  }
  const badPhrases = ["作者论证脉络", "真题反复命中", "事实描述和作者评价", "常出现在考研阅读"];
  const combined = `${context.sentence} ${context.translation} ${context.analysis}`;
  const badPhrase = badPhrases.find((phrase) => combined.includes(phrase));
  if (badPhrase) throw new Error(`${word.word}: generated content contains abstract phrase ${badPhrase}`);
  if (context.analysis.length > 55) throw new Error(`${word.word}: analysis is too long`);
}

function normalizeContext(word, context) {
  const normalized = {
    en: String(context.en || "").trim(),
    sentence: String(context.sentence || "").trim(),
    translation: String(context.translation || "").trim(),
    analysis: String(context.analysis || "").trim()
  };

  normalized.analysis = normalized.analysis
    .replace(/^解析[:：]\s*/, "")
    .replace(/^注意[:：]\s*/, "");

  const badPhrases = ["作者论证脉络", "真题反复命中", "事实描述和作者评价", "常出现在考研阅读"];
  const hasBadPhrase = badPhrases.some((phrase) => normalized.analysis.includes(phrase));
  if (hasBadPhrase || normalized.analysis.length > 55) {
    normalized.analysis = fallbackAnalysis(word);
  }

  return normalized;
}

function fallbackAnalysis(word) {
  const sense = firstSense(word.examSense || word.cn || word.word);
  if (word.polysemy || word.familiarMeaning) {
    return `别按常见义“${word.familiarMeaning || "原义"}”，这里先看搭配判断“${sense}”。`;
  }
  return `先把 ${word.word} 试译为“${sense}”，再看前后搭配是否贴合本句。`;
}

function firstSense(value) {
  return String(value || "")
    .replaceAll(",", "；")
    .split("；")
    .map((item) => item.trim())
    .filter(Boolean)[0] || "";
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
