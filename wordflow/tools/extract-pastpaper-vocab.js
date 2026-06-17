global.window = global;

const fs = require("node:fs");

require("../data/kaoyan-core-pack.js");
require("../data/kaoyan-extended-pack.js");
require("../data/kaoyan-complete-pack.js");
require("../data/kaoyan-syllabus-recognition-pack.js");
require("../data/pastpapers-index.js");
require("../data/word-banks.js");

const bank = global.WORD_BANKS.find((item) => item.id === "kaoyan");
const papers = global.PASTPAPERS_KAOYAN_INDEX.papers;
const args = parseArgs(process.argv.slice(2));
const requested = new Set(args.paperIds);
const targetPapers = requested.size ? papers.filter((paper) => requested.has(paper.id)) : papers;

function parseArgs(values) {
  const parsed = { input: "", paperIds: [] };
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === "--input") {
      parsed.input = values[index + 1] || "";
      index += 1;
    } else {
      parsed.paperIds.push(values[index]);
    }
  }
  return parsed;
}

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function isRenderedPaperText(text) {
  return text.length > 2000 && /Section I|Use of English|Directions:|ANSWER SHEET|Text 1/.test(text);
}

function countWord(text, word) {
  const pattern = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "gi");
  return (text.match(pattern) || []).length;
}

function analyzeText(paper, text, mode) {
  const ready = isRenderedPaperText(text);
  const hits = ready ? bank.words
    .filter((word) => word.word !== "generic" && word.word !== "section")
    .map((word) => ({ word: word.word, id: word.id, count: countWord(text, word.word), level: word.level }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word)) : [];

  return {
    id: paper.id,
    url: paper.url,
    mode,
    ready,
    textLength: text.length,
    matchedWords: hits.length,
    totalHits: hits.reduce((sum, item) => sum + item.count, 0),
    top: hits.slice(0, 80),
    note: ready
      ? "Rendered text detected; word-hit report is usable."
      : "Static HTML did not expose enough exam text. Use a rendered DOM/accessibility snapshot with --input."
  };
}

async function fetchPaper(paper) {
  const response = await fetch(paper.url);
  if (!response.ok) {
    throw new Error(`${paper.id} fetch failed: ${response.status}`);
  }
  const html = await response.text();
  return analyzeText(paper, stripHtml(html), "static-fetch");
}

async function run() {
  let reports;
  if (args.input) {
    const text = fs.readFileSync(args.input, "utf8");
    const paper = targetPapers[0] || {
      id: "local-rendered-text",
      url: args.input
    };
    reports = [analyzeText(paper, text, "local-input")];
  } else {
    reports = [];
    for (const paper of targetPapers) {
      reports.push(await fetchPaper(paper));
    }
  }

  console.log(JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: global.PASTPAPERS_KAOYAN_INDEX.url,
    papers: reports
  }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
