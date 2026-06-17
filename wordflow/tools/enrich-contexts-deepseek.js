#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const vm = require("node:vm");

const DEFAULT_OUT = path.join(__dirname, "../data/deepseek-context-overrides.js");
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const ENDPOINT = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || 20);
const focus = args.focus || "sample";
const outFile = path.resolve(args.out || DEFAULT_OUT);
const dryRun = !args.apply;

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

async function main() {
  const bank = loadBank();
  const existing = loadOverrides(outFile);
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
  for (const word of words) {
    process.stdout.write(`Enriching ${word.word}... `);
    const context = await generateContext(word);
    validateGenerated(word, context);
    generated[word.id] = {
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
    console.log("ok");
  }

  const merged = { ...existing, ...generated };
  writeOverrides(outFile, merged);
  console.log(`Wrote ${Object.keys(generated).length} overrides to ${path.relative(process.cwd(), outFile)}`);
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

async function generateContext(word) {
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
            "translation 必须是 sentence 的自然中文翻译。",
            "analysis 必须 1 句中文，说明看哪个搭配、词性或句子关系来定中文，少于 45 个汉字。",
            "en 必须是英文解释，少于 22 个英文词。",
            "避免抽象套话，如 作者论证脉络、真题反复命中、事实描述和作者评价。",
            "如果是熟词生义，analysis 必须提醒常见义和考研义的区别。"
          ],
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
