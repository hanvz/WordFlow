#!/usr/bin/env node

const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const vm = require("node:vm");

loadLocalEnv();

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";
const ENDPOINT = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/chat/completions";
const DEFAULT_SYNTAX_OUT = path.join(__dirname, "../data/deepseek-syntax-overrides.js");
const DEFAULT_QUALITY_OUT = path.join(__dirname, "../data/deepseek-quality-reviews.js");
const BAD_PHRASES = ["作者论证脉络", "真题反复命中", "事实描述和作者评价", "常出现在考研阅读"];
const SAMPLE_IDS = ["crisis", "demand", "condition", "quality", "subject"];

const args = parseArgs(process.argv.slice(2));
const limit = Number(args.limit || 100);
const batchSize = Math.max(1, Math.min(Number(args.batchSize || 6), 10));
const concurrency = Math.max(1, Number(args.concurrency || 2));
const scope = args.scope || "high-value";
const dryRun = !args.apply;
const force = Boolean(args.force);
const syntaxOut = path.resolve(args.syntaxOut || DEFAULT_SYNTAX_OUT);
const qualityOut = path.resolve(args.qualityOut || DEFAULT_QUALITY_OUT);

main().catch((error) => {
  console.error(error.stack || error.message);
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
    if (!process.env[key]) process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  });
}

async function main() {
  const bank = loadBank();
  const syntax = loadJsObject(syntaxOut, "KAOYAN_DEEPSEEK_SYNTAX");
  const quality = loadJsObject(qualityOut, "KAOYAN_DEEPSEEK_QUALITY");
  const selected = selectWords(bank, syntax, quality);

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      scope,
      limit,
      batchSize,
      concurrency,
      selected: selected.map(summaryForPrompt)
    }, null, 2));
    console.log("\nRun with --apply and DEEPSEEK_API_KEY to write syntax and quality overrides.");
    return;
  }

  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("Missing DEEPSEEK_API_KEY. Set it in the environment or .env.local; do not commit it.");
  }

  const batches = chunk(selected, batchSize);
  let next = 0;
  const skipped = [];
  await Promise.all(Array.from({ length: Math.min(concurrency, batches.length) }, async () => {
    while (next < batches.length) {
      const batch = batches[next];
      next += 1;
      const label = batch.map((word) => word.id).join(",");
      try {
        const reviews = await generateValidBatch(batch);
        reviews.forEach((item) => {
          syntax[item.id] = item.syntax;
          quality[item.id] = item.quality;
        });
        writeJsObject(syntaxOut, "KAOYAN_DEEPSEEK_SYNTAX", syntax);
        writeJsObject(qualityOut, "KAOYAN_DEEPSEEK_QUALITY", quality);
        console.log(`Reviewed ${label}... ok`);
      } catch (error) {
        skipped.push({ ids: batch.map((word) => word.id), error: error.message });
        console.log(`Reviewed ${label}... skip (${error.message})`);
      }
    }
  }));

  console.log(JSON.stringify({
    selected: selected.length,
    syntaxTotal: Object.keys(syntax).length,
    qualityTotal: Object.keys(quality).length,
    skipped
  }, null, 2));
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

function loadJsObject(file, globalName) {
  if (!fs.existsSync(file)) return {};
  const source = fs.readFileSync(file, "utf8");
  const pattern = new RegExp(`window\\.${globalName}\\s*=\\s*(\\{[\\s\\S]*\\});?\\s*$`);
  const match = source.match(pattern);
  return match ? JSON.parse(match[1]) : {};
}

function writeJsObject(file, globalName, value) {
  const sorted = Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  fs.writeFileSync(file, `window.${globalName} = ${JSON.stringify(sorted, null, 2)};\n`);
}

function selectWords(bank, syntax, quality) {
  let words = bank.words.filter((word) => {
    if (args.ids) {
      const ids = new Set(String(args.ids).split(",").map((id) => id.trim()).filter(Boolean));
      return ids.has(word.id) || ids.has(word.word);
    }
    if (scope === "all") return true;
    if (scope === "risk") return hasRuleRisk(word);
    return isHighValue(word);
  });

  words = words.sort((a, b) => priority(b) - priority(a));
  if (!force) {
    words = words.filter((word) => !syntax[word.id] || !quality[word.id]);
  }
  if (limit) words = words.slice(0, limit);
  return words;
}

function isHighValue(word) {
  return !word.recognitionOnly || word.polysemy || word.paperHits > 0 || word.tags?.includes("熟词生义");
}

function hasRuleRisk(word) {
  const context = word.examContext || {};
  const sentence = context.sentence || word.example || "";
  const analysis = context.analysis || "";
  const translation = context.translation || word.exampleCn || "";
  return !new RegExp(`\\b${escapeRegExp(word.word)}\\b`, "i").test(sentence) ||
    sentence.split(/\s+/).filter(Boolean).length < 8 ||
    sentence.split(/\s+/).filter(Boolean).length > 30 ||
    translation.length < 8 ||
    analysis.length < 10 ||
    BAD_PHRASES.some((phrase) => `${sentence} ${translation} ${analysis}`.includes(phrase));
}

function priority(word) {
  return (SAMPLE_IDS.includes(word.id) ? 10000 : 0) +
    (word.paperHits || 0) * 10 +
    (word.polysemy ? 80 : 0) +
    (word.level === "核心必背" ? 40 : 0) +
    (word.frequency || 0);
}

function summaryForPrompt(word) {
  const context = word.examContext || {};
  return {
    id: word.id,
    word: word.word,
    pos: word.pos,
    cn: word.cn,
    examSense: word.examSense,
    familiarMeaning: word.familiarMeaning || "",
    polysemy: Boolean(word.polysemy),
    level: word.level,
    paperHits: word.paperHits || 0,
    sentence: context.sentence || word.example || "",
    translation: context.translation || word.exampleCn || "",
    analysis: context.analysis || ""
  };
}

async function generateValidBatch(words) {
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const content = await generateBatch(words, attempt);
      const reviews = normalizeBatch(words, content);
      reviews.forEach((item) => validateReview(words.find((word) => word.id === item.id), item));
      return reviews;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function generateBatch(words, attempt) {
  const payload = {
    model: MODEL,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "你是考研英语阅读长难句和语境质量审稿专家。",
          "只返回 JSON，不要 Markdown。",
          "不要编造真题年份；只基于给定 sentence/translation/analysis 审稿。",
          "句法解析要服务阅读理解：主干、修饰、从句、目标词作用必须清晰。"
        ].join("\n")
      },
      {
        role: "user",
        content: JSON.stringify({
          task: "为每个词生成 syntax 和 quality 两个对象。",
          schema: {
            items: [{
              id: "word id",
              syntax: {
                subject: "英文主语段，短语即可",
                predicate: "英文谓语核心",
                objectOrComplement: "英文宾语/补足语/后续成分",
                modifiers: ["英文关键修饰语，0-4项"],
                clauses: ["英文从句或非谓语结构，0-3项"],
                targetRole: "中文说明目标词作用，不能为空",
                readingHint: "中文阅读判断提示，少于60字",
                confidence: 0.0
              },
              quality: {
                score: 0,
                verdict: "pass|review|rewrite",
                flags: ["中文风险标签"],
                rewritePriority: "low|medium|high",
                naturalness: 1,
                examRelevance: 1,
                targetWordFit: 1,
                translationFit: 1,
                analysisFit: 1,
                review: "中文审稿意见，少于70字",
                suggestedFix: "中文修改建议，少于70字"
              }
            }]
          },
          constraints: [
            "每个输入必须返回一项，id 必须完全一致。",
            "score 必须 0-100；五个 fit 分必须 1-5；confidence 必须 0-1。",
            "flags 是数组；没有风险时可为空数组。",
            "禁止出现：作者论证脉络、真题反复命中、事实描述和作者评价。",
            "不要把例句改写成 The sentence uses... 这类元分析句。",
            "如果句子自然且贴近考研阅读，verdict=pass；小问题 review；需重写 rewrite。",
            attempt ? `这是第 ${attempt + 1} 次尝试，必须修复上次 JSON 或字段问题。` : ""
          ].filter(Boolean),
          words: words.map(summaryForPrompt)
        })
      }
    ]
  };
  const response = await postJson(ENDPOINT, payload);
  const text = response.choices?.[0]?.message?.content;
  if (!text) throw new Error("Empty DeepSeek response");
  return JSON.parse(text);
}

function normalizeBatch(words, content) {
  const items = extractItems(content);
  const ids = new Set(words.map((word) => word.id));
  const wordById = new Map(words.map((word) => [word.id, word]));
  const normalized = items
    .map((item) => ({ ...item, id: String(item.id || item.wordId || item.word || "").trim() }))
    .filter((item) => ids.has(item.id))
    .map((item) => normalizeItem(item, wordById.get(item.id)));

  if (normalized.length !== words.length) {
    const returned = new Set(normalized.map((item) => item.id));
    throw new Error(`Missing ids: ${words.filter((word) => !returned.has(word.id)).map((word) => word.id).join(",")}`);
  }
  return normalized;
}

function normalizeItem(item, word) {
  const fallback = roughSyntax(word);
  return {
    id: item.id,
    syntax: {
      subject: cleanString(item.syntax?.subject) || fallback.subject,
      predicate: cleanString(item.syntax?.predicate) || fallback.predicate,
      objectOrComplement: cleanString(item.syntax?.objectOrComplement) || fallback.objectOrComplement,
      modifiers: cleanArray(item.syntax?.modifiers, 4),
      clauses: cleanArray(item.syntax?.clauses, 3),
      targetRole: cleanString(item.syntax?.targetRole) || fallback.targetRole,
      readingHint: cleanString(item.syntax?.readingHint, 90) || fallback.readingHint,
      confidence: clampNumber(item.syntax?.confidence, 0, 1) || 0.62
    },
    quality: {
      score: Math.round(clampNumber(item.quality?.score, 0, 100)),
      verdict: ["pass", "review", "rewrite"].includes(item.quality?.verdict) ? item.quality.verdict : "review",
      flags: cleanArray(item.quality?.flags, 6),
      rewritePriority: ["low", "medium", "high"].includes(item.quality?.rewritePriority) ? item.quality.rewritePriority : "medium",
      naturalness: Math.round(clampNumber(item.quality?.naturalness, 1, 5)),
      examRelevance: Math.round(clampNumber(item.quality?.examRelevance, 1, 5)),
      targetWordFit: Math.round(clampNumber(item.quality?.targetWordFit, 1, 5)),
      translationFit: Math.round(clampNumber(item.quality?.translationFit, 1, 5)),
      analysisFit: Math.round(clampNumber(item.quality?.analysisFit, 1, 5)),
      review: cleanString(item.quality?.review || defaultReview(item.quality), 100),
      suggestedFix: cleanString(item.quality?.suggestedFix || defaultFix(item.quality), 100)
    }
  };
}

function roughSyntax(word) {
  const sentence = String(word?.examContext?.sentence || word?.example || "").replace(/\s+/g, " ").trim();
  const tokens = sentence.split(/\s+/).filter(Boolean);
  const verbIndex = Math.max(1, tokens.findIndex((token, index) => index > 0 && /^(is|are|was|were|has|have|had|can|could|will|would|may|might|must|should|do|does|did)$/i.test(cleanToken(token)) || /(ed|ing|s)$/.test(cleanToken(token).toLowerCase())));
  const subject = tokens.slice(0, verbIndex > 0 ? verbIndex : Math.min(tokens.length, 5)).join(" ") || word.word;
  const predicate = verbIndex > 0 ? cleanToken(tokens[verbIndex]) : "看全句谓语";
  const objectOrComplement = verbIndex > 0 ? tokens.slice(verbIndex + 1).join(" ") || "无明显宾语/补足语" : tokens.slice(5).join(" ") || "看后续成分";
  return {
    subject,
    predicate,
    objectOrComplement,
    targetRole: "结合主干判断目标词作用",
    readingHint: `${word.word} 的词义需要回到主语、谓语和后续成分中确认。`
  };
}

function extractItems(content) {
  if (Array.isArray(content)) return content;
  if (Array.isArray(content.items)) return content.items;
  if (Array.isArray(content.results)) return content.results;
  if (Array.isArray(content.reviews)) return content.reviews;
  if (Array.isArray(content.words)) return content.words;
  const firstArray = Object.values(content || {}).find(Array.isArray);
  return firstArray || [];
}

function defaultReview(quality) {
  if (!quality) return "AI 已完成结构化审稿。";
  if (quality.verdict === "pass") return "句子整体自然，目标词、翻译和解析基本匹配。";
  if (quality.verdict === "rewrite") return "该语境存在明显问题，建议优先重写。";
  return "该语境可用，但建议人工复核局部表达。";
}

function defaultFix(quality) {
  if (!quality || quality.verdict === "pass") return "可保留当前语境，后续抽查即可。";
  if (quality.verdict === "rewrite") return "重写例句、翻译或解析，确保目标词自然出现。";
  return "检查例句自然度、翻译贴合度和解析是否说明句子关系。";
}

function validateReview(word, item) {
  if (!item.syntax.subject || !item.syntax.predicate || !item.syntax.objectOrComplement || !item.syntax.targetRole || !item.syntax.readingHint) {
    throw new Error(`${item.id}: incomplete syntax`);
  }
  if (!Number.isFinite(item.syntax.confidence) || item.syntax.confidence < 0 || item.syntax.confidence > 1) {
    throw new Error(`${item.id}: invalid confidence`);
  }
  if (!Number.isFinite(item.quality.score) || item.quality.score < 0 || item.quality.score > 100) {
    throw new Error(`${item.id}: invalid quality score`);
  }
  if (!Array.isArray(item.quality.flags)) {
    throw new Error(`${item.id}: flags must be array`);
  }
  const combined = JSON.stringify(item);
  const badPhrase = BAD_PHRASES.find((phrase) => combined.includes(phrase));
  if (badPhrase) throw new Error(`${item.id}: contains abstract phrase ${badPhrase}`);
  if (/The sentence uses|The phrase around|Readers should|A question may test|specific object, standard, or attitude/i.test(combined)) {
    throw new Error(`${item.id}: contains meta-analysis wording`);
  }
  if (!targetAppears(word, word.examContext?.sentence || word.example || "")) {
    throw new Error(`${item.id}: source sentence no longer contains target word`);
  }
}

function targetAppears(word, sentence) {
  const target = String(word.word || word.id || "");
  const escaped = escapeRegExp(target);
  return new RegExp(`\\b${escaped}(?:s|es|ed|ing)?\\b`, "i").test(sentence);
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

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
  return chunks;
}

function cleanString(value, max = 140) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function cleanArray(value, max) {
  return Array.isArray(value) ? value.map((item) => cleanString(item, 80)).filter(Boolean).slice(0, max) : [];
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanToken(value) {
  return String(value || "").replace(/[^\w-]/g, "");
}
