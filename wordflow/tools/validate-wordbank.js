global.window = global;

require("../data/kaoyan-core-pack.js");
require("../data/kaoyan-extended-pack.js");
require("../data/kaoyan-complete-pack.js");
require("../data/kaoyan-syllabus-recognition-pack.js");
require("../data/pastpapers-index.js");
require("../data/pastpapers-vocab-stats.js");
require("../data/deepseek-context-overrides.js");
require("../data/deepseek-lexical-overrides.js");
require("../data/deepseek-syntax-overrides.js");
require("../data/deepseek-quality-reviews.js");
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
const highValueWords = bank.words.filter(isHighValueWord);
const requiredReviewIds = ["crisis", "demand", "condition", "quality", "subject"];
const reviewedSyntax = highValueWords.filter((word) => hasSyntaxReview(word)).length;
const reviewedQuality = highValueWords.filter((word) => hasQualityReview(word)).length;

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
  genericExamples: bank.words.filter((word) => isBadExample(word.example, word)).length,
  genericExampleCn: bank.words.filter((word) => isBadExampleCn(word.exampleCn)).length,
  abstractExamples: bank.words.filter((word) => /Recognizing .+ helps separate factual description from the writer's evaluation/i.test(word.example || "") || (word.exampleCn || "").includes("有助于区分事实描述和作者评价")).length,
  abstractAnalysis: bank.words.filter((word) => (word.examContext?.analysis || "").includes("社会证据和作者论证脉络") || (word.examContext?.analysis || "").includes("真题反复命中的考点")).length,
  missingContext: bank.words.filter((word) => !word.examContext?.sentence || !word.examContext?.analysis).length,
  duplicateEnglish: countDuplicateValues(bank.words, "en"),
  duplicateExamples: countDuplicateValues(bank.words, "example"),
  duplicateExampleCn: countDuplicateValues(bank.words, "exampleCn"),
  familiarMeaning: bank.words.filter((word) => word.polysemy && word.familiarMeaning).length,
  morphology: bank.words.filter((word) => (word.morphology?.parts || []).length > 0).length,
  family: bank.words.filter((word) => (word.family || []).length > 0).length,
  highValue: highValueWords.length,
  deepseekSyntax: reviewedSyntax,
  deepseekQuality: reviewedQuality,
  deepseekSyntaxCoverage: highValueWords.length ? Number((reviewedSyntax / highValueWords.length).toFixed(4)) : 0,
  deepseekQualityCoverage: highValueWords.length ? Number((reviewedQuality / highValueWords.length).toFixed(4)) : 0,
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

if (stats.genericEnglish || stats.genericExamples || stats.genericExampleCn || stats.abstractExamples || stats.abstractAnalysis || stats.missingContext) {
  throw new Error(`Generic study content remains: en=${stats.genericEnglish}, example=${stats.genericExamples}, exampleCn=${stats.genericExampleCn}, abstractExample=${stats.abstractExamples}, abstractAnalysis=${stats.abstractAnalysis}, context=${stats.missingContext}`);
}

if (stats.duplicateEnglish || stats.duplicateExamples || stats.duplicateExampleCn) {
  throw new Error(`Duplicate study content remains: en=${stats.duplicateEnglish}, example=${stats.duplicateExamples}, exampleCn=${stats.duplicateExampleCn}`);
}

if (stats.familiarMeaning < stats.polysemy) {
  throw new Error(`Polysemy familiar meanings are incomplete: ${stats.familiarMeaning}/${stats.polysemy}`);
}

if (stats.morphology < 2000 || stats.family < 2000) {
  throw new Error(`Morphology/family coverage is below target: morphology=${stats.morphology}, family=${stats.family}`);
}

if (stats.highValue < 1500 || stats.deepseekSyntax / stats.highValue < 0.95 || stats.deepseekQuality / stats.highValue < 0.95) {
  throw new Error(`DeepSeek review coverage below target: syntax=${stats.deepseekSyntax}/${stats.highValue}, quality=${stats.deepseekQuality}/${stats.highValue}`);
}

requiredReviewIds.forEach((id) => {
  const word = bank.words.find((item) => item.id === id || item.word === id);
  if (!word || !hasSyntaxReview(word) || !hasQualityReview(word)) {
    throw new Error(`Required DeepSeek syntax/quality review missing for ${id}`);
  }
});

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

function isBadExample(value, word) {
  if (!value) return true;
  const escaped = String(word.word || word.id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return /^In exam reading, .+ often appears/i.test(value) ||
    /^In exam reading, .+ should be recognized/i.test(value) ||
    new RegExp(`^The sentence uses ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^The phrase around ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^Check the verb or adjective near ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^Readers should link ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^A question may test ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^A precise translation of ${escaped}\\b`, "i").test(value) ||
    /specific object, standard, or attitude/i.test(value);
}

function isBadExampleCn(value) {
  if (!value) return true;
  return value.includes("常出现在考研阅读") ||
    value.includes("属于考研速认词") ||
    (value.includes("先看") && value.includes("周围的短语")) ||
    value.includes("在这里帮助说明一个对象、标准或态度") ||
    value.includes("题目可能会通过");
}

function isHighValueWord(word) {
  return !word.recognitionOnly || word.polysemy || word.paperHits > 0 || word.tags?.includes("熟词生义");
}

function hasSyntaxReview(word) {
  const review = word.deepseekSyntax;
  return Boolean(review?.subject && review?.predicate && review?.objectOrComplement && review?.targetRole && review?.readingHint);
}

function hasQualityReview(word) {
  const review = word.deepseekQuality;
  return Boolean(review && Number.isFinite(Number(review.score)) && Array.isArray(review.flags) && review.review && review.suggestedFix);
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
