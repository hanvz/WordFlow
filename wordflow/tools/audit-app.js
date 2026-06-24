const fs = require("node:fs");
const vm = require("node:vm");

const elements = new Map();

function getElement(id) {
  if (elements.has(id)) return elements.get(id);

  const element = {
    id,
    innerHTML: "",
    textContent: "",
    hidden: false,
    value: "",
    dataset: {},
    className: "",
    style: {
      setProperty(key, value) {
        this[key] = value;
      }
    },
    classList: {
      toggle(className, enabled) {
        element.className = enabled ? className : "";
      }
    },
    addEventListener() {},
    focus() {},
    closest() {
      return null;
    }
  };

  elements.set(id, element);
  return element;
}

function createSandbox() {
  const sandbox = {
    console,
    Date,
    Math,
    Number,
    JSON,
    Set,
    Map,
    Array,
    String,
    RegExp,
    window: null,
    localStorage: {
      getItem() {
        return null;
      },
      setItem() {}
    },
    document: {
      body: getElement("body"),
      documentElement: {
        dataset: {},
        style: {
          setProperty(key, value) {
            this[key] = value;
          }
        }
      },
      querySelector(selector) {
        return selector.startsWith("#") ? getElement(selector.slice(1)) : getElement(selector);
      },
      querySelectorAll() {
        return [];
      },
      addEventListener() {}
    }
  };

  sandbox.window = sandbox;
  sandbox.window.confirm = () => true;
  return sandbox;
}

function loadApp() {
  const sandbox = createSandbox();
  vm.createContext(sandbox);

  [
    "data/kaoyan-core-pack.js",
    "data/kaoyan-extended-pack.js",
    "data/kaoyan-complete-pack.js",
    "data/kaoyan-syllabus-recognition-pack.js",
    "data/pastpapers-index.js",
    "data/pastpapers-vocab-stats.js",
    "data/deepseek-context-overrides.js",
    "data/deepseek-lexical-overrides.js",
    "data/word-banks.js",
    "app.js"
  ].forEach((file) => {
    vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file });
  });

  return sandbox;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const sandbox = loadApp();
const css = fs.readFileSync("styles.css", "utf8");
const appSource = fs.readFileSync("app.js", "utf8");
const oaldExtractor = fs.readFileSync("tools/extract-oald-local.py", "utf8");
const bank = sandbox.window.WORD_BANKS.find((item) => item.id === "kaoyan");
const ids = bank.words.map((word) => word.id);
const dashboard = getElement("appView").innerHTML;
const major = bank.words.find((word) => word.word === "major");
const conditionWord = bank.words.find((word) => word.word === "condition");
const initialLayerStats = {
  coreIntensive: sandbox.getModeStats(bank, "core-intensive"),
  syllabusRecognition: sandbox.getModeStats(bank, "syllabus-recognition"),
  paperPolysemy: sandbox.getModeStats(bank, "paper-polysemy"),
  weakWords: sandbox.getModeStats(bank, "weak-words")
};

assert(bank.words.length >= bank.targetSize, "Kaoyan bank is below target size");
assert(new Set(ids).size === ids.length, "Kaoyan bank has duplicate ids");
assert(bank.words.filter((word) => word.level === "核心必背").length >= 600, "Core tier is underfilled");
assert(bank.words.filter((word) => word.level === "阅读高频").length >= 800, "Reading tier is underfilled");
assert(bank.words.filter((word) => word.level === "边缘低频").length >= 150, "Low-frequency tier is underfilled");
assert(bank.words.filter((word) => word.polysemy).length >= 300, "Polysemy tier is underfilled");
assert(bank.paperSource?.papers?.length >= 6, "Past-paper source index is missing");
assert(bank.paperStats?.papers?.filter((paper) => paper.ready).length >= 6, "Past-paper stats are not ready");
assert(bank.paperStats?.aggregateMatchedWords >= 400, "Past-paper matched word count is too low");
assert(bank.words.filter((word) => word.paperHits > 0).length >= 50, "Past-paper hot words are not attached");
assert(bank.words.filter((word) => word.recognitionOnly).length >= 1500, "Recognition-only tier is underfilled");
assert(major?.polysemy && major.example.includes("major in humanities") && major.examContext?.analysis.includes("主修"), "major is not enriched to the assume-level standard");
assert(conditionWord?.polysemy && conditionWord.example.includes("instant gratification") && conditionWord.examContext?.analysis.includes("conditioned"), "condition is not enriched to the assume-level standard");
assert(!bank.words.some((word) => /^Kaoyan .+ vocabulary item/i.test(word.en || "")), "Generic English explanation remains");
assert(!bank.words.some((word) => /^In exam reading, .+ often appears/i.test(word.example || "") || /^In exam reading, .+ should be recognized/i.test(word.example || "")), "Generic example remains");
const reviewCandidate = sandbox.getModeWords(bank, "core-intensive").find((word) => word.paperHits > 0 && word.record && !word.record.seen);
const futureCandidate = sandbox.getModeWords(bank, "core-intensive").find((word) => word.id !== reviewCandidate.id && word.record && !word.record.seen);
const currentTime = Date.now();
const reviewCandidateRecord = sandbox.getRecord(reviewCandidate, bank);
const futureCandidateRecord = sandbox.getRecord(futureCandidate, bank);
reviewCandidateRecord.seen = true;
reviewCandidateRecord.level = 3;
reviewCandidateRecord.nextAt = currentTime - 1000;
reviewCandidateRecord.lastAt = currentTime - 86400000;
futureCandidateRecord.seen = true;
futureCandidateRecord.level = 3;
futureCandidateRecord.nextAt = currentTime + 7 * 86400000;
futureCandidateRecord.lastAt = currentTime - 86400000;
const studyQueueAfterReview = sandbox.getStudyQueue(bank, "core-intensive");
assert(studyQueueAfterReview[0].id === reviewCandidate.id, "Due review word is not prioritized in the study queue");
sandbox.setView("review");
const reviewView = getElement("appView").innerHTML;
assert(reviewView.includes(reviewCandidate.word), "Due review word does not appear in review view");
assert(!reviewView.includes(futureCandidate.word), "Future review word appears before it is due");
sandbox.setView("dashboard");
assert(dashboard.includes(bank.coverageLabel), "Dashboard does not show coverage label");
assert(dashboard.includes("词库规模"), "Dashboard does not show word-bank size");
assert(dashboard.includes("6 套可用 · 432 词命中"), "Dashboard does not show past-paper hit stats");
["核心精背", "考纲速认", "真题熟词生义", "我的错词"].forEach((label) => {
  assert(dashboard.includes(label), `Dashboard does not show study layer: ${label}`);
});
[
  initialLayerStats.coreIntensive,
  initialLayerStats.syllabusRecognition,
  initialLayerStats.paperPolysemy
].forEach((stats) => {
  assert(dashboard.includes(`<span class="level-badge">0/${stats.total}</span>`), "Mode card does not show learned/total progress");
});
const emptyModeBars = dashboard.match(/class="mode-bar" style="--mode-progress:0%"/g) || [];
assert(emptyModeBars.length === 4, "Mode progress bars should start empty before learning");
sandbox.setView("study");
const study = getElement("appView").innerHTML;
assert(getElement("body").className === "study-focus", "Study view does not enter focus mode");
assert(study.includes("真题命中"), "Study card does not show past-paper hit tag");
assert(study.includes("data-action=\"play-pronunciation\""), "Study card does not show pronunciation action");
["主动提取", "英文到中文", "语境位置", "风险检查"].forEach((label) => {
  assert(study.includes(label), `Study card does not show blind-recall module: ${label}`);
});
sandbox.revealWord();
const contextStudy = getElement("appView").innerHTML;
assert(contextStudy.includes("语境挑战"), "Study card does not show the context challenge phase");
assert(contextStudy.includes("data-action=\"reveal-answer\""), "Context challenge does not lead to answer reveal");
sandbox.revealAnswer();
const revealedStudy = getElement("appView").innerHTML;
["考研优先义", "本词状态", "语境"].forEach((label) => {
  assert(revealedStudy.includes(label), `Revealed study card is missing module: ${label}`);
});
assert(revealedStudy.includes("掉落卡片") && revealedStudy.includes("语境挑战首胜"), "First context challenge reward does not appear");
sandbox.dismissReward();
["秒懂考研义", "认出但慢", "只记得常见义", "不认识"].forEach((label) => {
  assert(revealedStudy.includes(label), `Revealed study card is missing grade button: ${label}`);
});
["<kbd>Q</kbd>", "<kbd>W</kbd>", "<kbd>E</kbd>", "<kbd>R</kbd>"].forEach((label) => {
  assert(revealedStudy.includes(label), `Revealed study card is missing keyboard hint: ${label}`);
});
[
  ['key === "q"', 'gradeWord("easy")'],
  ['key === "w"', 'gradeWord("slow")'],
  ['key === "e"', 'gradeWord("vague")'],
  ['key === "r"', 'gradeWord("unknown")']
].forEach(([keyCheck, gradeCall]) => {
  assert(appSource.includes(keyCheck) && appSource.includes(gradeCall), `Keyboard shortcut is missing: ${keyCheck}`);
});
for (let index = 0; index < 10; index += 1) {
  sandbox.revealWord();
  sandbox.revealAnswer();
  sandbox.gradeWord("easy");
}
const streakReward = getElement("appView").innerHTML;
assert(streakReward.includes("连续 10 个"), "Ten-correct streak reward does not appear");
sandbox.dismissReward();
sandbox.getDaily().learned = 17;
sandbox.revealWord();
sandbox.revealAnswer();
sandbox.gradeWord("easy");
const dailyReward = getElement("appView").innerHTML;
assert(dailyReward.includes("今日任务清空"), "Daily target reward does not appear");
sandbox.dismissReward();
["core-intensive", "syllabus-recognition", "paper-polysemy", "weak-words"].forEach((modeId) => {
  sandbox.setStudyMode(modeId);
  const html = getElement("appView").innerHTML;
  assert(getElement("body").className === "study-focus", `Mode ${modeId} does not enter focus mode`);
  assert(html.includes("退出") || html.includes("暂无待学内容"), `Mode ${modeId} did not render a study state`);
});
assert(css.includes(".study-focus .sidebar") && css.includes(".study-focus .topbar"), "Focus CSS does not hide chrome");
assert(css.includes(".study-focus .study-grid > aside"), "Focus CSS does not hide the side panel");
assert(css.includes("font-size: clamp(3.8rem, 10vw, 8.4rem)"), "Focus word size is not tuned for the complete study layout");
assert(css.includes(".study-answer-grid") && css.includes(".study-detail-grid"), "Study CSS is missing complete card grids");
assert(css.includes(".pronounce-button"), "Pronunciation button CSS is missing");
assert(css.includes(".reward-drop"), "Reward drop CSS is missing");
assert(appSource.includes("renderQualityAudit") && appSource.includes("assessContextQuality"), "Context quality audit view is missing");
assert(appSource.includes("buildQualityFixHint") && css.includes(".quality-hint"), "DeepSeek quality repair hints are missing");
assert(appSource.includes("analyzeSentenceStructure") && appSource.includes("buildRelationHint") && css.includes(".syntax-strip") && css.includes(".syntax-note"), "Sentence structure parser UI is missing");
assert(oaldExtractor.includes("--from-bank") && oaldExtractor.includes("extract_audio") && oaldExtractor.includes("audioExtracted"), "OALD local extractor does not support full-bank audio extraction");
assert(css.includes("body.study-focus {\n    overflow: hidden;"), "Mobile focus mode does not lock body overflow");

console.log(JSON.stringify({
  ok: true,
  total: bank.words.length,
  targetSize: bank.targetSize,
  core: bank.words.filter((word) => word.level === "核心必背").length,
  reading: bank.words.filter((word) => word.level === "阅读高频").length,
  low: bank.words.filter((word) => word.level === "边缘低频").length,
  polysemy: bank.words.filter((word) => word.polysemy).length,
  paperMatchedWords: bank.paperStats.aggregateMatchedWords,
  paperHotWords: bank.words.filter((word) => word.paperHits > 0).length,
  layers: {
    coreIntensive: sandbox.getModeStats(bank, "core-intensive").total,
    syllabusRecognition: sandbox.getModeStats(bank, "syllabus-recognition").total,
    paperPolysemy: sandbox.getModeStats(bank, "paper-polysemy").total,
    weakWords: sandbox.getModeStats(bank, "weak-words").total
  },
  recognitionOnly: bank.words.filter((word) => word.recognitionOnly).length,
  focusMode: getElement("body").className
}, null, 2));
