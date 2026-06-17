global.window = global;

require("../data/kaoyan-core-pack.js");
require("../data/kaoyan-extended-pack.js");
require("../data/kaoyan-complete-pack.js");
require("../data/kaoyan-syllabus-recognition-pack.js");
require("../data/pastpapers-index.js");
require("../data/pastpapers-vocab-stats.js");
require("../data/word-banks.js");

const bank = global.WORD_BANKS.find((item) => item.id === "kaoyan");
if (!bank) {
  throw new Error("Missing kaoyan word bank");
}

const ids = bank.words.map((word) => word.id);
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
const requiredFields = ["id", "word", "pos", "cn", "examSense", "level", "tags", "difficulty", "frequency"];
const missing = bank.words
  .map((word) => ({
    word: word.word,
    fields: requiredFields.filter((field) => {
      const value = word[field];
      return Array.isArray(value) ? value.length === 0 : value === undefined || value === null || value === "";
    })
  }))
  .filter((item) => item.fields.length);

const stats = {
  targetSize: bank.targetSize || 0,
  total: bank.words.length,
  unique: new Set(ids).size,
  duplicates: [...new Set(duplicateIds)],
  core: bank.words.filter((word) => word.level === "核心必背").length,
  reading: bank.words.filter((word) => word.level === "阅读高频").length,
  low: bank.words.filter((word) => word.level === "边缘低频").length,
  polysemy: bank.words.filter((word) => word.polysemy).length,
  sourceReady: bank.words.filter((word) => word.sourceRefs?.dictionary).length,
  indexedPapers: bank.paperSource?.papers?.length || 0,
  readyPaperStats: bank.paperStats?.papers?.filter((paper) => paper.ready).length || 0,
  paperMatchedWords: bank.paperStats?.aggregateMatchedWords || 0,
  paperHotWords: bank.words.filter((word) => word.paperHits > 0).length,
  recognitionOnly: bank.words.filter((word) => word.recognitionOnly).length,
  genericEnglish: bank.words.filter((word) => !word.en || /^Kaoyan .+ vocabulary item/i.test(word.en) || /fast English-to-Chinese recall/i.test(word.en)).length,
  genericExamples: bank.words.filter((word) => !word.example || /^In exam reading, .+ often appears/i.test(word.example) || /^In exam reading, .+ should be recognized/i.test(word.example)).length,
  genericExampleCn: bank.words.filter((word) => !word.exampleCn || word.exampleCn.includes("常出现在考研阅读") || word.exampleCn.includes("属于考研速认词")).length,
  missingContext: bank.words.filter((word) => !word.examContext?.sentence || !word.examContext?.analysis).length,
  duplicateEnglish: countDuplicateValues(bank.words, "en"),
  duplicateExamples: countDuplicateValues(bank.words, "example"),
  duplicateExampleCn: countDuplicateValues(bank.words, "exampleCn"),
  missing
};

console.log(JSON.stringify(stats, null, 2));

if (stats.duplicates.length) {
  throw new Error(`Duplicate word ids: ${stats.duplicates.join(", ")}`);
}

if (missing.length) {
  throw new Error(`Missing fields in ${missing.length} words`);
}

if (stats.total < stats.targetSize) {
  throw new Error(`Expected at least ${stats.targetSize} words, got ${stats.total}`);
}

if (stats.core < 600 || stats.reading < 800 || stats.low < 150 || stats.polysemy < 300) {
  throw new Error(`Word-bank levels are underfilled: core=${stats.core}, reading=${stats.reading}, low=${stats.low}, polysemy=${stats.polysemy}`);
}

if (stats.total < 5500 || stats.recognitionOnly < 1500) {
  throw new Error(`Syllabus recognition bank is underfilled: total=${stats.total}, recognitionOnly=${stats.recognitionOnly}`);
}

if (stats.genericEnglish || stats.genericExamples || stats.genericExampleCn || stats.missingContext) {
  throw new Error(`Generic study content remains: en=${stats.genericEnglish}, example=${stats.genericExamples}, exampleCn=${stats.genericExampleCn}, context=${stats.missingContext}`);
}

if (stats.duplicateEnglish || stats.duplicateExamples || stats.duplicateExampleCn) {
  throw new Error(`Duplicate study content remains: en=${stats.duplicateEnglish}, example=${stats.duplicateExamples}, exampleCn=${stats.duplicateExampleCn}`);
}

function countDuplicateValues(words, field) {
  const seen = new Set();
  const duplicates = new Set();
  words.forEach((word) => {
    const value = word[field];
    if (!value) return;
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return duplicates.size;
}

if (stats.indexedPapers < 6) {
  throw new Error(`Expected at least 6 indexed past papers, got ${stats.indexedPapers}`);
}

if (stats.readyPaperStats < 6) {
  throw new Error(`Expected 6 ready past-paper stat entries, got ${stats.readyPaperStats}`);
}

if (stats.paperMatchedWords < 400 || stats.paperHotWords < 50) {
  throw new Error(`Past-paper hit stats look too small: ${stats.paperMatchedWords} matched, ${stats.paperHotWords} hot words`);
}
