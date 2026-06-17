const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const ECDICT_CSV = process.env.ECDICT_CSV || "/private/tmp/ecdict.csv";
const OUTPUT_FILE = path.join(ROOT, "data", "kaoyan-syllabus-recognition-pack.js");
const TARGET_NEW_WORDS = 4100;
const MIN_POLYSEMY_WORDS = 320;
const SOURCE_MODEL = "deepseek/deepseek-v4-pro";

const POS_MAP = {
  n: "n.",
  v: "v.",
  a: "adj.",
  adj: "adj.",
  ad: "adv.",
  adv: "adv.",
  prep: "prep.",
  conj: "conj.",
  pron: "pron.",
  num: "num.",
  int: "interj."
};

const DEEPSEEK_POLYSEMY_SEEDS = new Set([
  "accommodate", "anchor", "attribute", "avail", "beam", "bias", "bound", "case",
  "charge", "claim", "compound", "constitute", "convention", "course", "credit",
  "discipline", "draft", "edge", "embrace", "engage", "entertain", "faculty",
  "figure", "fine", "foundation", "issue", "justify", "launch", "liberal",
  "margin", "measure", "medium", "observe", "organ", "parallel", "passage",
  "practice", "present", "principal", "proceed", "profile", "project", "promising",
  "propose", "purchase", "remote", "render", "respect", "school", "secure",
  "sense", "settle", "shape", "sound", "subject", "term", "volume", "wage"
]);

global.window = global;
require(path.join(ROOT, "data", "kaoyan-core-pack.js"));
require(path.join(ROOT, "data", "kaoyan-extended-pack.js"));
require(path.join(ROOT, "data", "kaoyan-complete-pack.js"));
require(path.join(ROOT, "data", "pastpapers-index.js"));
require(path.join(ROOT, "data", "pastpapers-vocab-stats.js"));
require(path.join(ROOT, "data", "word-banks.js"));

const existingBank = global.WORD_BANKS.find((bank) => bank.id === "kaoyan");
const existingIds = new Set(existingBank.words.map((word) => word.id));
const records = readCsv(ECDICT_CSV)
  .map(normalizeRecord)
  .filter(Boolean)
  .filter((record) => !existingIds.has(record.id));

const kyWords = records
  .filter((record) => record.ecdictTags.includes("ky"))
  .sort(compareCandidates);

const supplementWords = records
  .filter((record) => !record.ecdictTags.includes("ky"))
  .filter((record) => record.ecdictTags.some((tag) => ["cet6", "toefl", "ielts", "gre", "cet4"].includes(tag)))
  .filter((record) => record.frq > 0 || record.bnc > 0 || record.collins > 0 || record.oxford)
  .sort(compareCandidates);

const selected = [];
const seen = new Set(existingIds);
addCandidates(kyWords, selected, seen);
addCandidates(supplementWords, selected, seen);

if (selected.length < TARGET_NEW_WORDS) {
  throw new Error(`Only selected ${selected.length} new words; target is ${TARGET_NEW_WORDS}.`);
}

markPolysemy(selected);
writePack(selected.slice(0, TARGET_NEW_WORDS));

const stats = {
  source: path.relative(ROOT, ECDICT_CSV),
  existing: existingIds.size,
  selected: Math.min(selected.length, TARGET_NEW_WORDS),
  fromKy: selected.filter((item) => item.ecdictTags.includes("ky")).length,
  fromSupplement: selected.filter((item) => !item.ecdictTags.includes("ky")).length,
  polysemy: selected.filter((item) => item.level === "熟词生义").length,
  output: path.relative(ROOT, OUTPUT_FILE)
};

console.log(JSON.stringify(stats, null, 2));

function addCandidates(candidates, selectedRows, seenIds) {
  for (const candidate of candidates) {
    if (selectedRows.length >= TARGET_NEW_WORDS + 250) return;
    if (seenIds.has(candidate.id)) continue;
    seenIds.add(candidate.id);
    selectedRows.push(candidate);
  }
}

function normalizeRecord(row) {
  const word = cleanWord(row.word);
  if (!word) return null;

  const translation = cleanTranslation(row.translation);
  if (!translation) return null;

  const ecdictTags = (row.tag || "").split(/\s+/).filter(Boolean);
  const bnc = toNumber(row.bnc);
  const frq = toNumber(row.frq);
  const collins = toNumber(row.collins);
  const oxford = row.oxford === "1" || row.oxford === "true";
  const pos = normalizePos(row.pos, row.translation);
  const score = scoreRecord({ ecdictTags, bnc, frq, collins, oxford, translation });
  const difficulty = inferDifficulty({ ecdictTags, bnc, frq, collins, translation });
  const frequency = inferFrequency({ bnc, frq, collins, oxford });
  const tags = inferTags({ ecdictTags, bnc, frq, collins, oxford, translation });
  const level = inferLevel({ ecdictTags, bnc, frq, collins, oxford, translation });

  return {
    id: word.replace(/[^a-z0-9]+/g, "-"),
    word,
    phonetic: row.phonetic || "",
    pos,
    cn: translation,
    tags,
    difficulty,
    frequency,
    level,
    ecdictTags,
    bnc,
    frq,
    collins,
    oxford,
    score
  };
}

function cleanWord(value) {
  const word = String(value || "").trim().toLowerCase();
  if (!/^[a-z]{3,24}$/.test(word)) return "";
  if (word.endsWith("ed") || word.endsWith("ing")) return "";
  return word;
}

function cleanTranslation(value) {
  const text = String(value || "")
    .split(/\\n|\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^\[(网络|计|化|医|电|法|经)\]/.test(line))
    .map((line) => line
      .replace(/^\[[^\]]+\]\s*/g, "")
      .replace(/\s+/g, "")
      .replace(/[;,，、]+/g, "；")
      .replace(/；+/g, "；")
      .replace(/^；|；$/g, ""))
    .filter(Boolean)
    .filter((line) => /[\u4e00-\u9fff]/.test(line));

  const senses = [];
  for (const line of text) {
    const cleaned = line
      .replace(/^(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|a)\.\s*/i, "")
      .replace(/^\(.*?\)/, "");
    if (!cleaned || cleaned.length > 44) continue;
    senses.push(cleaned);
  }

  return [...new Set(senses)].slice(0, 3).join("；");
}

function normalizePos(value, translation) {
  const direct = String(value || "")
    .split("/")
    .map((part) => POS_MAP[part.trim()] || "")
    .filter(Boolean);

  if (direct.length) return [...new Set(direct)].join(" ");

  const guessed = [];
  const text = String(translation || "");
  if (/\bn\.|^n\./i.test(text)) guessed.push("n.");
  if (/\bv\.|vt\.|vi\.|^v\./i.test(text)) guessed.push("v.");
  if (/\badj\.|\ba\.|^a\./i.test(text)) guessed.push("adj.");
  if (/\badv\.|^adv\./i.test(text)) guessed.push("adv.");
  return guessed.length ? [...new Set(guessed)].join(" ") : "n. v.";
}

function inferTags(record) {
  const tags = ["速认"];
  if (record.ecdictTags.includes("ky")) tags.push("阅读");
  if (record.ecdictTags.includes("toefl") || record.ecdictTags.includes("ielts") || record.ecdictTags.includes("gre")) tags.push("学术");
  if (record.oxford || record.collins >= 3 || isHighFrequency(record)) tags.push("核心");
  if (!record.ecdictTags.includes("ky")) tags.push("边缘");
  return [...new Set(tags)];
}

function inferLevel(record) {
  if (record.oxford || record.collins >= 4 || isVeryHighFrequency(record)) return "核心必背";
  if (!record.ecdictTags.includes("ky")) return "边缘低频";
  if (record.collins >= 2 || isHighFrequency(record)) return "阅读高频";
  return "考纲速认";
}

function inferDifficulty(record) {
  if (!record.ecdictTags.includes("ky")) return 4;
  if (record.ecdictTags.includes("gre")) return 4;
  if (record.collins >= 3 || isVeryHighFrequency(record)) return 2;
  if (record.translation.length > 22) return 4;
  return 3;
}

function inferFrequency(record) {
  if (record.oxford || record.collins >= 4 || isVeryHighFrequency(record)) return 5;
  if (record.collins >= 3 || isHighFrequency(record)) return 4;
  if (record.collins >= 1 || record.frq > 0 || record.bnc > 0) return 3;
  return 2;
}

function scoreRecord(record) {
  let score = 0;
  if (record.ecdictTags.includes("ky")) score += 1000;
  if (record.oxford) score += 180;
  score += record.collins * 60;
  if (record.frq > 0) score += Math.max(0, 160 - record.frq / 120);
  if (record.bnc > 0) score += Math.max(0, 120 - record.bnc / 160);
  if (record.ecdictTags.includes("cet6")) score += 40;
  if (record.ecdictTags.includes("toefl") || record.ecdictTags.includes("ielts")) score += 32;
  if (record.ecdictTags.includes("gre")) score += 20;
  if (looksPolysemous(record.translation)) score += 24;
  return score;
}

function compareCandidates(a, b) {
  if (a.score !== b.score) return b.score - a.score;
  return a.word.localeCompare(b.word);
}

function markPolysemy(items) {
  const candidates = items
    .filter((item) => item.ecdictTags.includes("ky"))
    .filter((item) => DEEPSEEK_POLYSEMY_SEEDS.has(item.word) || looksPolysemous(item.cn))
    .sort((a, b) => b.score - a.score);

  for (const item of candidates.slice(0, MIN_POLYSEMY_WORDS)) {
    item.level = "熟词生义";
    if (!item.tags.includes("熟词生义")) item.tags.push("熟词生义");
    item.difficulty = Math.max(item.difficulty, 3);
  }
}

function looksPolysemous(text) {
  const senses = String(text || "").split("；").filter(Boolean);
  return senses.length >= 3 || /抽象|引申|比喻|认为|支配|承担|提出|处理|代表|表现|构成|产生|进行|影响/.test(text);
}

function isVeryHighFrequency(record) {
  return (record.frq > 0 && record.frq <= 3000) || (record.bnc > 0 && record.bnc <= 3000);
}

function isHighFrequency(record) {
  return (record.frq > 0 && record.frq <= 9000) || (record.bnc > 0 && record.bnc <= 9000);
}

function toNumber(value) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function writePack(items) {
  const rows = items
    .sort((a, b) => a.word.localeCompare(b.word))
    .map((item) => [
      item.word,
      item.phonetic,
      item.pos,
      item.cn,
      item.tags.join(","),
      item.difficulty,
      item.frequency,
      item.level
    ].join("|"))
    .join("\n");

  const body = `/*
  Kaoyan syllabus recognition vocabulary expansion pack.
  Source: ECDICT (MIT) filtered by ky/exam tags and corpus frequency.
  DeepSeek ${SOURCE_MODEL} was used for vertical-domain curation direction and polysemy seed calibration.
  Format per line:
  word|phonetic|pos|Chinese senses|tags|difficulty|frequency|level
*/
window.KAOYAN_SYLLABUS_RECOGNITION_PACK = \`
${rows}
\`.trim().split("\\n").filter(Boolean).map((line) => {
  const [word, phonetic, pos, cn, tagText, difficulty, frequency, level] = line.split("|");
  const tags = tagText.split(",").map((tag) => tag.trim()).filter(Boolean);
  const polysemy = tags.includes("熟词生义") || level === "熟词生义";
  const recognitionOnly = tags.includes("速认") && !polysemy;
  return {
    id: word.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    word,
    phonetic,
    pos,
    cn,
    en: "",
    example: "",
    exampleCn: "",
    examSense: cn.split("；")[0],
    familiarMeaning: "",
    polysemy,
    recognitionOnly,
    tags,
    frequency: Number(frequency),
    level,
    examTypes: ["英语一", "英语二"],
    difficulty: Number(difficulty),
    sourceRefs: { dictionary: "ECDICT MIT + OALD local reference pending", examCorpus: "DeepSeek V4 Pro curation; past-paper stats pending" }
  };
});
`;

  fs.writeFileSync(OUTPUT_FILE, body);
}

function readCsv(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ECDICT CSV at ${filePath}. Download it before running this script.`);
  }

  const text = fs.readFileSync(filePath, "utf8");
  const rows = parseCsv(text);
  const header = rows.shift();
  return rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] || ""])));
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
