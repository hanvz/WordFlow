const STORAGE_KEY = "suntory-wordflow-v2";
const BANKS = window.WORD_BANKS || [];
const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

const viewMeta = {
  dashboard: "今日学习",
  study: "开始背词",
  review: "复习队列",
  quiz: "快速测验",
  library: "词库管理"
};

const STUDY_MODES = [
  {
    id: "core-intensive",
    title: "核心精背",
    shortTitle: "精背",
    target: 2000,
    description: "高频核心、真题热词和熟词生义，按主动提取深度学习。",
    hint: "80+ 的主战场：考研义、搭配、长难句语境一起记。"
  },
  {
    id: "syllabus-recognition",
    title: "考纲速认",
    shortTitle: "速认",
    target: 5500,
    description: "大纲词快速识别，先追求英文到中文的秒反应。",
    hint: "先把识别面铺开，再把高频词拉回精背。"
  },
  {
    id: "paper-polysemy",
    title: "真题熟词生义",
    shortTitle: "熟词",
    target: 300,
    description: "聚焦真题命中词、熟词生义和阅读里的冷门义。",
    hint: "解决“每个字母都认识，但句子读不懂”。"
  },
  {
    id: "weak-words",
    title: "我的错词",
    shortTitle: "错词",
    target: 0,
    description: "自动收集答错、模糊、慢想和反复记不住的词。",
    hint: "冲刺期最值钱：只盯会丢分的词。"
  }
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const defaultState = {
  user: "Suntory",
  selectedBank: "kaoyan",
  view: "dashboard",
  revealed: false,
  cardStartedAt: 0,
  blindMs: 0,
  studyCursor: 0,
  studyWordId: null,
  studyMode: "core-intensive",
  examDate: defaultExamDate(),
  quiz: null,
  libraryQuery: "",
  libraryFilter: "all",
  theme: "dark",
  progress: {},
  daily: {}
};

let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return { ...defaultState, ...saved };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function defaultExamDate() {
  const currentYear = new Date().getFullYear();
  const candidate = new Date(`${currentYear}-12-26T00:00:00`);
  if (candidate.getTime() < Date.now()) {
    return `${currentYear + 1}-12-26`;
  }
  return `${currentYear}-12-26`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function todayKey(offset = 0) {
  const day = new Date();
  day.setDate(day.getDate() + offset);
  return day.toISOString().slice(0, 10);
}

function now() {
  return Date.now();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getBank(id = state.selectedBank) {
  return BANKS.find((bank) => bank.id === id) || BANKS[0];
}

function ensureBankProgress(bank = getBank()) {
  if (!state.progress[bank.id]) {
    state.progress[bank.id] = {};
  }
  return state.progress[bank.id];
}

function getRecord(word, bank = getBank()) {
  const bankProgress = ensureBankProgress(bank);
  const defaults = {
    seen: false,
    level: 0,
    correct: 0,
    wrong: 0,
    starred: false,
    buried: false,
    buriedAt: 0,
    lastAt: 0,
    nextAt: 0,
    responseMs: 0,
    attempts: 0,
    lastGrade: "",
    history: []
  };
  bankProgress[word.id] = { ...defaults, ...(bankProgress[word.id] || {}) };
  return bankProgress[word.id];
}

function getDaily(date = todayKey()) {
  if (!state.daily[date]) {
    state.daily[date] = { learned: 0, reviewed: 0, correct: 0, slow: 0, quiz: 0, buried: 0 };
  }
  state.daily[date] = { learned: 0, reviewed: 0, correct: 0, slow: 0, quiz: 0, buried: 0, ...state.daily[date] };
  return state.daily[date];
}

function getEnrichedWords(bank = getBank()) {
  return bank.words.map((word) => ({ ...word, record: getRecord(word, bank) }));
}

function getStats(bank = getBank()) {
  const words = getEnrichedWords(bank);
  const activeWords = words.filter(({ record }) => !record.buried);
  const current = now();
  const learned = activeWords.filter(({ record }) => record.seen).length;
  const mastered = activeWords.filter(({ record }) => record.level >= 4).length;
  const due = activeWords.filter(({ record }) => record.seen && record.nextAt <= current).length;
  const weak = activeWords.filter(({ record }) => record.wrong > record.correct).length;
  const starred = words.filter(({ record }) => record.starred).length;
  const buried = words.filter(({ record }) => record.buried).length;
  const polysemy = activeWords.filter((word) => word.polysemy).length;
  const target = bank.dailyTarget || 18;
  const today = getDaily();

  return {
    total: words.length,
    activeTotal: activeWords.length,
    learned,
    mastered,
    due,
    weak,
    starred,
    buried,
    polysemy,
    newWords: Math.max(activeWords.length - learned, 0),
    target,
    today,
    completion: activeWords.length ? Math.round((learned / activeWords.length) * 100) : 0,
    dailyCompletion: Math.min(100, Math.round((today.learned / target) * 100))
  };
}

function getPaperStatsSummary(bank = getBank()) {
  const stats = bank.paperStats;
  const readyPapers = stats?.papers?.filter((paper) => paper.ready).length || 0;
  const hitWords = stats?.aggregateMatchedWords || bank.words.filter((word) => word.paperHits > 0).length;
  const totalHits = stats?.papers?.reduce((sum, paper) => sum + (paper.totalHits || 0), 0) || 0;

  return { readyPapers, hitWords, totalHits };
}

function getStudyMode(modeId = state.studyMode) {
  return STUDY_MODES.find((mode) => mode.id === modeId) || STUDY_MODES[0];
}

function isModeWord(word, modeId = state.studyMode) {
  const record = word.record || getRecord(word);
  if (modeId === "core-intensive") {
    return !word.recognitionOnly || word.polysemy || word.paperHits > 0;
  }
  if (modeId === "syllabus-recognition") {
    return true;
  }
  if (modeId === "paper-polysemy") {
    return word.polysemy || word.paperHits > 0 || word.tags?.includes("熟词生义");
  }
  if (modeId === "weak-words") {
    return record.wrong > record.correct || record.lastGrade === "vague" || record.lastGrade === "unknown" || record.responseMs > 3000;
  }
  return true;
}

function getModeWords(bank = getBank(), modeId = state.studyMode) {
  return getEnrichedWords(bank)
    .filter(({ record }) => !record.buried)
    .filter((word) => isModeWord(word, modeId));
}

function getModeStats(bank = getBank(), modeId = state.studyMode) {
  const words = getModeWords(bank, modeId);
  const current = now();
  const learned = words.filter(({ record }) => record.seen).length;
  const due = words.filter(({ record }) => record.seen && record.nextAt <= current).length;
  const weak = words.filter(({ record }) => record.wrong > record.correct || record.responseMs > 3000).length;
  const mastered = words.filter(({ record }) => record.level >= 4).length;

  return {
    total: words.length,
    learned,
    due,
    weak,
    mastered,
    completion: words.length ? Math.round((learned / words.length) * 100) : 0
  };
}

function getStudyQueue(bank = getBank(), modeId = state.studyMode) {
  const current = now();
  const words = getModeWords(bank, modeId);
  return words
    .filter(({ record }) => !record.buried)
    .filter(({ record }) => !record.seen || record.nextAt <= current || record.level < 2)
    .sort((a, b) => {
      const aPriority = getPriority(a.record, a, modeId);
      const bPriority = getPriority(b.record, b, modeId);
      if (aPriority !== bPriority) return bPriority - aPriority;
      return a.record.lastAt - b.record.lastAt;
    });
}

function getPriority(record, word, modeId = state.studyMode) {
  const plan = getExamPlan();
  let score = !record.seen ? 72 : 36 - record.level * 3;
  if (record.wrong > record.correct) score += 34;
  if (record.seen && record.nextAt <= now()) score += 28;
  if (word.polysemy) score += plan.isSprint ? 18 : 10;
  if (word.level === "核心必背") score += plan.isSprint ? 14 : 8;
  score += (word.frequency || 3) * (plan.isSprint ? 4 : 2);
  score += Math.min(word.paperHits || 0, 10) * (plan.isSprint ? 2.2 : 1.2);
  if ((word.paperCoverage || 0) >= 4) score += plan.isSprint ? 8 : 4;
  if (record.responseMs > 3000) score += 8;
  if (modeId === "core-intensive" && word.level === "核心必背") score += 18;
  if (modeId === "syllabus-recognition" && !record.seen) score += word.level === "边缘低频" ? 10 : 4;
  if (modeId === "paper-polysemy" && word.polysemy) score += 24;
  if (modeId === "weak-words") score += record.wrong * 16 + (record.responseMs > 3000 ? 12 : 0);
  return score;
}

function getCurrentStudyWord(bank = getBank(), options = { lock: true }) {
  const queue = getStudyQueue(bank);
  if (!queue.length) {
    return null;
  }
  const stored = queue.find(({ id }) => id === state.studyWordId);
  if (stored) {
    if (options.lock && !state.cardStartedAt) {
      state.cardStartedAt = now();
    }
    return stored;
  }
  const word = queue[state.studyCursor % queue.length];
  if (options.lock) {
    state.studyWordId = word.id;
    state.cardStartedAt = now();
    state.blindMs = 0;
  }
  return word;
}

function getExamPlan() {
  const examTime = new Date(`${state.examDate || defaultExamDate()}T00:00:00`).getTime();
  const daysLeft = Math.ceil((examTime - now()) / MS_DAY);
  if (daysLeft <= 45) {
    return { daysLeft, phase: "临考收敛", isSprint: true, intervalFactor: 0.45, focus: "错词 + 熟词生义 + 真题核心词" };
  }
  if (daysLeft <= 90) {
    return { daysLeft, phase: "冲刺期", isSprint: true, intervalFactor: 0.65, focus: "高频错词优先，减少低频负担" };
  }
  if (daysLeft <= 180) {
    return { daysLeft, phase: "强化期", isSprint: false, intervalFactor: 0.9, focus: "阅读高频 + 语境搭配" };
  }
  return { daysLeft, phase: "基础期", isSprint: false, intervalFactor: 1.18, focus: "全面覆盖 + 词根词族" };
}

function getPrimarySense(word) {
  return word.examSense || word.cn;
}

function formatDuration(ms) {
  if (!ms) return "未记录";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(timestamp) {
  if (!timestamp) return "未安排";
  const date = new Date(timestamp);
  const today = new Date(todayKey()).getTime();
  const diff = Math.round((new Date(date.toDateString()).getTime() - today) / 86400000);
  if (diff <= 0) return "今天";
  if (diff === 1) return "明天";
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatPaperRefs(word) {
  const refs = word.paperRefs || [];
  if (!refs.length) return "暂无统计";
  return refs
    .slice(0, 4)
    .map((ref) => `${ref.paperId} ×${ref.count}`)
    .join(" · ");
}

function setView(view) {
  state.view = view;
  state.revealed = false;
  state.cardStartedAt = 0;
  state.blindMs = 0;
  if (view === "quiz" && !state.quiz) {
    state.quiz = createQuiz();
  }
  saveState();
  render();
}

function setBank(bankId) {
  state.selectedBank = bankId;
  state.revealed = false;
  state.studyCursor = 0;
  state.studyWordId = null;
  state.cardStartedAt = 0;
  state.blindMs = 0;
  state.quiz = null;
  saveState();
  render();
}

function setStudyMode(modeId, view = "study") {
  state.studyMode = getStudyMode(modeId).id;
  state.view = view;
  state.revealed = false;
  state.studyCursor = 0;
  state.studyWordId = null;
  state.cardStartedAt = 0;
  state.blindMs = 0;
  state.quiz = null;
  saveState();
  render();
}

function icon(name) {
  return `<svg aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
}

function render() {
  const bank = getBank();
  ensureBankProgress(bank);
  document.body.classList.toggle("study-focus", state.view === "study");
  document.documentElement.dataset.theme = state.theme;
  document.documentElement.style.setProperty("--accent", bank.accent || "#5eead4");

  renderChrome(bank);
  renderNotice(bank);

  if (!bank.words.length) {
    renderEmptyBank(bank);
    return;
  }

  const views = {
    dashboard: renderDashboard,
    study: renderStudy,
    review: renderReview,
    quiz: renderQuiz,
    library: renderLibrary
  };

  (views[state.view] || renderDashboard)(bank);
}

function renderChrome(bank) {
  $("#bankEyebrow").textContent = bank.title;
  $("#viewTitle").textContent = viewMeta[state.view] || "今日学习";

  const selector = $("#bankSelect");
  selector.innerHTML = BANKS.map((item) => `
    <option value="${escapeHtml(item.id)}" ${item.id === bank.id ? "selected" : ""}>
      ${escapeHtml(item.shortTitle)}${item.locked ? " · 预留" : ""}
    </option>
  `).join("");

  $$(".nav-item").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.view);
  });
}

function renderNotice(bank) {
  const notice = $("#bankNotice");
  if (!bank.locked) {
    notice.hidden = true;
    notice.innerHTML = "";
    return;
  }

  notice.hidden = false;
  notice.innerHTML = `
    <strong>${escapeHtml(bank.title)}</strong>
    <span>${escapeHtml(bank.description)} 在 <code>data/word-banks.js</code> 给这个词库添加 words 后即可启用。</span>
  `;
}

function renderDashboard(bank) {
  const stats = getStats(bank);
  const paperStats = getPaperStatsSummary(bank);
  const nextWord = getCurrentStudyWord(bank, { lock: false });
  const daily = stats.today;
  const plan = getExamPlan();
  const mode = getStudyMode();
  const modeStats = getModeStats(bank, mode.id);
  const app = $("#appView");

  app.innerHTML = `
    <div class="metrics-grid">
      ${metric("考期倒计时", `${Math.max(plan.daysLeft, 0)}天`, `${plan.phase}：${plan.focus}`)}
      ${metric("今日新词", `${daily.learned}/${stats.target}`, "按当前词库计划滚动推进")}
      ${metric("当前训练层", mode.shortTitle, `${modeStats.learned}/${modeStats.total} 已学`)}
      ${metric("薄弱词", stats.weak, "错选或慢想会进入重点")}
    </div>

    <section class="panel">
      <div class="panel-head">
        <div>
          <h2>英语一 80+ 四层词库</h2>
          <p class="micro-copy">先铺开考纲识别面，再把真题高频、熟词生义和错词拉进精背。</p>
        </div>
        <span class="level-badge">${escapeHtml(mode.title)}</span>
      </div>
      <div class="mode-grid">
        ${renderModeCards(bank)}
      </div>
    </section>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>学习进度</h2>
            <p class="micro-copy">${escapeHtml(bank.description)}</p>
          </div>
          <span class="tag">${escapeHtml(bank.exam)}</span>
        </div>
        <div class="progress-shell">
          <div class="progress-ring" style="--progress:${stats.completion}%">
            <div>
              <strong>${stats.completion}%</strong>
              <span>词库完成</span>
            </div>
          </div>
          <div>
            <div class="stat-line"><span>当前层</span><strong>${escapeHtml(mode.title)}</strong></div>
            <div class="stat-line"><span>已学习</span><strong>${stats.learned} / ${stats.activeTotal}</strong></div>
            <div class="stat-line"><span>词库规模</span><strong>${stats.total} / ${bank.targetSize || stats.total}</strong></div>
            <div class="stat-line"><span>收藏词</span><strong>${stats.starred}</strong></div>
            <div class="stat-line"><span>斩干词</span><strong>${stats.buried}</strong></div>
            <div class="stat-line"><span>今日正确</span><strong>${daily.correct} / ${daily.reviewed || 0}</strong></div>
            <div class="action-row">
              <button class="primary-button" type="button" data-view="study">${icon("play")}开始学习</button>
              <button class="ghost-button" type="button" data-view="review">${icon("refresh")}查看复习</button>
            </div>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <h2>今日推荐</h2>
          <span class="level-badge">${plan.isSprint ? "冲刺收敛" : stats.due ? "复习优先" : "新词优先"}</span>
        </div>
        ${nextWord ? `
          <div class="mini-word">
            <strong>${escapeHtml(nextWord.word)}</strong>
            <span class="phonetic">${escapeHtml(nextWord.phonetic)}</span>
            <p class="micro-copy">${escapeHtml(getPrimarySense(nextWord))}</p>
          </div>
        ` : emptyState("今天已经没有待学内容", "可以去测验页巩固一下。")}
      </section>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h2>七日活动</h2>
        <div class="activity-bars">
          ${renderActivityBars()}
        </div>
      </section>
      <section class="panel">
        <h2>考期设置</h2>
        <label class="date-field">
          <span>初试日期</span>
          <input id="examDateInput" type="date" value="${escapeHtml(state.examDate || defaultExamDate())}" />
        </label>
        <p class="micro-copy">当前算法阶段：${escapeHtml(plan.phase)}。离考试越近，系统越倾向错词、熟词生义和真题核心词。</p>
      </section>
    </div>

    <div class="dashboard-grid">
      <section class="panel">
        <h2>词库扩展</h2>
        <div class="side-list">
          ${BANKS.map(renderBankRow).join("")}
        </div>
      </section>
      <section class="panel">
        <h2>参考来源</h2>
        <div class="stat-line"><span>覆盖口径</span><strong>${escapeHtml(bank.coverageLabel || "自定义词库")}</strong></div>
        <div class="stat-line"><span>词典参考</span><strong>${escapeHtml(bank.dictionarySource || "自定义词库")}</strong></div>
        <div class="stat-line"><span>真题索引</span><strong>${escapeHtml(bank.paperSource ? `${bank.paperSource.papers.length} 套已索引` : "字段已预留")}</strong></div>
        <div class="stat-line"><span>命中统计</span><strong>${escapeHtml(paperStats.readyPapers ? `${paperStats.readyPapers} 套可用 · ${paperStats.hitWords} 词命中` : "待生成")}</strong></div>
        <p class="micro-copy">页面只保存精简学习字段；牛津 MDX/MDD 用作本地校对参考，真题站只保存链接和命中统计，不把整套文章写入前端。</p>
      </section>
    </div>
  `;
}

function renderModeCards(bank) {
  return STUDY_MODES.map((mode) => {
    const stats = getModeStats(bank, mode.id);
    const coverage = `${stats.total} 词`;
    const targetLabel = mode.target
      ? `目标 ${mode.target}+ · ${stats.total >= mode.target ? "已达标" : `还差 ${mode.target - stats.total}`}`
      : "动态生成";
    const percent = mode.target ? Math.min(100, Math.round((stats.total / mode.target) * 100)) : Math.min(100, stats.completion);
    const isActive = mode.id === getStudyMode().id;
    return `
      <button class="mode-card ${isActive ? "is-active" : ""}" type="button" data-study-mode="${escapeHtml(mode.id)}">
        <span class="mode-card-head">
          <strong>${escapeHtml(mode.title)}</strong>
          <span class="level-badge">${escapeHtml(coverage)}</span>
        </span>
        <span class="mode-bar" style="--mode-progress:${percent}%"><i></i></span>
        <span class="micro-copy">${escapeHtml(mode.description)}</span>
        <span class="word-meta">${escapeHtml(targetLabel)} · 已学 ${stats.learned} · 待复 ${stats.due}</span>
        <span class="word-meta">${escapeHtml(mode.hint)}</span>
      </button>
    `;
  }).join("");
}

function metric(label, value, hint) {
  return `
    <section class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <p class="micro-copy">${escapeHtml(hint)}</p>
    </section>
  `;
}

function renderActivityBars() {
  const max = Math.max(1, ...Array.from({ length: 7 }, (_, index) => {
    const item = state.daily[todayKey(index - 6)];
    return item ? item.reviewed + item.quiz : 0;
  }));

  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const key = todayKey(offset);
    const item = state.daily[key] || { reviewed: 0, quiz: 0 };
    const value = item.reviewed + item.quiz;
    const height = Math.max(6, Math.round((value / max) * 92));
    const label = offset === 0 ? "今" : key.slice(5).replace("-", "/");
    return `
      <div class="activity-bar">
        <i style="height:${height}%"></i>
        <span>${label}</span>
      </div>
    `;
  }).join("");
}

function renderBankRow(bank) {
  const stats = getStats(bank);
  return `
    <button class="bank-row ${bank.id === state.selectedBank ? "is-active" : ""}" type="button" data-bank="${escapeHtml(bank.id)}" style="--bank-accent:${escapeHtml(bank.accent)}">
      <span>
        <strong>${escapeHtml(bank.title)}</strong>
        <span class="word-meta">${bank.words.length ? `${stats.learned}/${stats.activeTotal} 已学 · ${stats.buried} 斩干` : "等待导入词条"}</span>
      </span>
    </button>
  `;
}

function renderStudy(bank) {
  const mode = getStudyMode();
  const currentWord = getCurrentStudyWord(bank);
  const app = $("#appView");

  if (!currentWord) {
    app.innerHTML = emptyState(`${mode.title} 暂无待学内容`, mode.id === "weak-words" ? "答错、模糊或慢想的词会自动进入这里。" : "可以切换到其他训练层，或者稍后继续复习。");
    return;
  }

  const record = currentWord.record;
  const plan = getExamPlan();
  const modeStats = getModeStats(bank, mode.id);
  const modeProgress = modeStats.total ? Math.round((modeStats.learned / modeStats.total) * 100) : 0;
  const queueCount = getStudyQueue(bank, mode.id).length;
  const tags = currentWord.tags || [];

  app.innerHTML = `
    <div class="study-grid">
      <article class="study-card">
        <div class="focus-topline">
          <button class="ghost-button" type="button" data-view="dashboard">退出</button>
          <span class="level-badge">${escapeHtml(mode.title)} · ${escapeHtml(plan.phase)}</span>
          <div class="focus-actions">
            <button class="ghost-button" type="button" data-action="bury-word">斩干词</button>
            <button class="star-button ${record.starred ? "is-on" : ""}" type="button" data-action="toggle-star" aria-label="收藏当前单词" title="收藏">
              ${icon("star")}
            </button>
          </div>
        </div>

        <div class="study-progress-strip" aria-label="当前训练层进度">
          <div>
            <strong>${escapeHtml(mode.title)}</strong>
            <span>${modeStats.learned}/${modeStats.total} 已学 · ${queueCount} 个待处理</span>
          </div>
          <span class="mode-bar" style="--mode-progress:${modeProgress}%"><i></i></span>
        </div>

        <div class="card-head focus-word-head">
          <div class="word-title">
            <strong>${escapeHtml(currentWord.word)}</strong>
            <span class="phonetic">${escapeHtml(currentWord.phonetic)}</span>
          </div>
        </div>

        <div class="chip-row">
          <span class="tag">${escapeHtml(currentWord.pos)}</span>
          <span class="tag">${escapeHtml(mode.shortTitle)}</span>
          ${currentWord.polysemy ? `<span class="tag hot-tag">熟词生义</span>` : ""}
          ${currentWord.paperHits ? `<span class="tag hot-tag">真题命中 ${currentWord.paperHits}</span>` : ""}
          <span class="tag">${escapeHtml(currentWord.level || "阅读高频")}</span>
          ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
          <span class="level-badge">熟练度 ${record.level}/5</span>
        </div>

        ${state.revealed ? renderRevealedStudy(currentWord, record, plan) : renderBlindStudy(currentWord, record, plan)}

        <div class="action-row">
          ${state.revealed ? `
            <button class="grade-button good" type="button" data-grade="easy">${icon("check")}秒懂</button>
            <button class="grade-button slow" type="button" data-grade="slow">想了才想起</button>
            <button class="grade-button warn" type="button" data-grade="vague">模糊</button>
            <button class="grade-button bad" type="button" data-grade="unknown">${icon("x")}完全不认识</button>
          ` : `
            <button class="primary-button" type="button" data-action="reveal-word">${icon("book")}翻牌</button>
          `}
        </div>
      </article>

      <aside class="panel">
        <h2>本词状态</h2>
        <div class="stat-line"><span>正确次数</span><strong>${record.correct}</strong></div>
        <div class="stat-line"><span>错误次数</span><strong>${record.wrong}</strong></div>
        <div class="stat-line"><span>平均提取</span><strong>${formatDuration(record.responseMs)}</strong></div>
        <div class="stat-line"><span>下次复习</span><strong>${formatDate(record.nextAt)}</strong></div>
        <div class="stat-line"><span>考期阶段</span><strong>${escapeHtml(plan.phase)}</strong></div>
        <div class="stat-line"><span>词条难度</span><strong>${"★".repeat(currentWord.difficulty)}</strong></div>
        <div class="stat-line"><span>真题覆盖</span><strong>${currentWord.paperCoverage ? `${currentWord.paperCoverage} 套` : "暂无"}</strong></div>
        <div class="stat-line"><span>命中来源</span><strong>${escapeHtml(formatPaperRefs(currentWord))}</strong></div>
        <p class="micro-copy">确认已经稳定掌握时使用，冲刺期可以减少复习负担。</p>
      </aside>
    </div>
  `;
}

function renderBlindStudy(word, record, plan) {
  return `
    <section class="definition-panel is-hidden blind-panel">
      <div class="blind-card">
        <p class="eyebrow">主动提取</p>
        <strong>先盲猜，不看中文</strong>
        <p class="micro-copy">在脑中检索考研义、熟词生义和常见搭配，再翻牌。超过 3 秒会被记录为慢提取。</p>
      </div>
      <div class="recall-grid">
        ${recallStep("1", "英文到中文", "先说出最可能的考研义，不追求完整翻译。")}
        ${recallStep("2", "语境位置", "判断它更像观点、动作、态度，还是学术概念。")}
        ${recallStep("3", "风险检查", word.polysemy ? "这是熟词生义词，先排除常见义。" : "留意词性和搭配，避免只记一个中文。")}
      </div>
      <div class="study-mini-stats">
        ${studyMiniStat("熟练度", `${record.level}/5`)}
        ${studyMiniStat("考期阶段", plan.phase)}
        ${studyMiniStat("平均提取", formatDuration(record.responseMs))}
      </div>
    </section>
  `;
}

function renderRevealedStudy(word, record, plan) {
  return `
    <section class="study-answer-grid">
      <div class="definition-panel">
        <div class="sense-stack">
          ${word.polysemy ? `
            <div class="polysemy-callout">
              <span>熟词生义</span>
              <strong>${escapeHtml(word.familiarMeaning || "常见义")} → ${escapeHtml(word.examSense || word.cn)}</strong>
            </div>
          ` : ""}
          <div>
            <p class="eyebrow">考研优先义</p>
            <div class="definition-cn">${escapeHtml(getPrimarySense(word))}</div>
            <p class="full-sense">${escapeHtml(word.cn)}</p>
            <p class="definition-en">${escapeHtml(word.en)}</p>
          </div>
        </div>
      </div>

      <aside class="answer-inspector">
        <h3>本词状态</h3>
        <div class="stat-line"><span>正确/错误</span><strong>${record.correct}/${record.wrong}</strong></div>
        <div class="stat-line"><span>平均提取</span><strong>${formatDuration(record.responseMs)}</strong></div>
        <div class="stat-line"><span>下次复习</span><strong>${formatDate(record.nextAt)}</strong></div>
        <div class="stat-line"><span>阶段</span><strong>${escapeHtml(plan.phase)}</strong></div>
        <div class="stat-line"><span>难度</span><strong>${"★".repeat(word.difficulty)}</strong></div>
      </aside>
    </section>

    <section class="study-detail-grid">
      ${renderExamContext(word)}
      ${renderMorphology(word) || renderLearningAnchor(word)}
    </section>
  `;
}

function recallStep(number, title, text) {
  return `
    <div class="recall-step">
      <span>${number}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function studyMiniStat(label, value) {
  return `
    <div>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function renderLearningAnchor(word) {
  const senses = (word.cn || getPrimarySense(word)).split("；").filter(Boolean).slice(0, 4);
  return `
    <section class="mini-panel learning-anchor">
      <h3>识别锚点</h3>
      <div class="anchor-senses">
        ${senses.map((sense) => `<span>${escapeHtml(sense)}</span>`).join("")}
      </div>
      <p class="micro-copy">速认层先建立英文到中文的大意反应；进入核心精背时再补词根、词族和真题长难句。</p>
    </section>
  `;
}

function renderExamContext(word) {
  const context = word.examContext;
  if (!context) {
    return `
      <div class="context-card">
        <div class="panel-head">
          <p class="eyebrow">例句语境</p>
          <span class="level-badge">同域训练</span>
        </div>
        <p>${escapeHtml(word.example)}</p>
        <span class="example-cn">${escapeHtml(word.exampleCn)}</span>
        <p class="micro-copy">先用例句完成速认和搭配判断；真题命中词会在这里显示年份和来源。</p>
      </div>
    `;
  }

  return `
    <div class="context-card">
      <div class="panel-head">
        <p class="eyebrow">真题语境</p>
        <span class="level-badge">${escapeHtml(context.source || "语境")}</span>
      </div>
      <p>${escapeHtml(context.sentence)}</p>
      <span class="example-cn">${escapeHtml(context.translation || word.exampleCn)}</span>
      ${context.analysis ? `<p class="micro-copy">${escapeHtml(context.analysis)}</p>` : ""}
      ${context.year ? `<span class="word-meta">${escapeHtml(context.year)}</span>` : ""}
    </div>
  `;
}

function renderMorphology(word) {
  const parts = word.morphology?.parts || [];
  const family = word.family || [];
  if (!parts.length && !family.length) return "";

  return `
    <div class="morphology-grid">
      ${parts.length ? `
        <section class="mini-panel">
          <h3>词根拆解</h3>
          <div class="morph-parts">
            ${parts.map((part) => `
              <span class="morph-part">
                <strong>${escapeHtml(part.text)}</strong>
                <small>${escapeHtml(part.meaning)}</small>
              </span>
            `).join("")}
          </div>
          ${word.morphology?.note ? `<p class="micro-copy">${escapeHtml(word.morphology.note)}</p>` : ""}
        </section>
      ` : ""}
      ${family.length ? `
        <section class="mini-panel">
          <h3>词族联动</h3>
          <div class="chip-row">
            ${family.map((item) => `<span class="tag">${escapeHtml(item)}</span>`).join("")}
          </div>
        </section>
      ` : ""}
    </div>
  `;
}

function gradeWord(grade) {
  const bank = getBank();
  const word = getCurrentStudyWord(bank);
  if (!word) return;

  const record = getRecord(word, bank);
  const firstSeen = !record.seen;
  const daily = getDaily();
  const current = now();
  const responseMs = state.blindMs || (state.cardStartedAt ? current - state.cardStartedAt : 0);
  const slowRecall = responseMs > 3000;
  const plan = getExamPlan();
  const schedule = {
    easy: { level: 2, correct: 1, wrong: 0, baseDays: 4 },
    slow: { level: 1, correct: 1, wrong: 0, baseDays: 2 },
    vague: { level: 0, correct: 0, wrong: 1, baseDays: 1 },
    unknown: { level: -2, correct: 0, wrong: 1, baseHours: 3 }
  };
  const item = schedule[grade] || schedule.vague;
  const nextLevel = clamp(record.level + item.level, 0, 5);
  const levelMultiplier = [0.7, 1, 1.4, 2.2, 3.6, 5][nextLevel];
  const recallPenalty = slowRecall && (grade === "easy" || grade === "slow") ? 0.55 : 1;
  const polysemyPenalty = word.polysemy ? 0.78 : 1;
  const frequencyPenalty = (word.frequency || 3) >= 5 ? 0.86 : 1;
  const baseDelay = item.baseHours ? item.baseHours * MS_HOUR : item.baseDays * levelMultiplier * MS_DAY;
  const delay = clamp(
    baseDelay * recallPenalty * polysemyPenalty * frequencyPenalty * plan.intervalFactor,
    3 * MS_HOUR,
    45 * MS_DAY
  );

  record.seen = true;
  record.level = nextLevel;
  record.correct += item.correct;
  record.wrong += item.wrong;
  record.lastAt = current;
  record.nextAt = current + delay;
  record.lastGrade = grade;
  record.attempts += 1;
  record.responseMs = record.responseMs
    ? Math.round((record.responseMs * (record.attempts - 1) + responseMs) / record.attempts)
    : Math.round(responseMs);
  record.history = [
    ...(record.history || []).slice(-11),
    { at: current, grade, responseMs: Math.round(responseMs), nextAt: record.nextAt }
  ];

  daily.reviewed += 1;
  daily.correct += grade === "easy" || grade === "slow" ? 1 : 0;
  daily.slow += slowRecall ? 1 : 0;
  daily.learned += firstSeen ? 1 : 0;

  state.studyCursor += 1;
  state.studyWordId = null;
  state.revealed = false;
  state.cardStartedAt = 0;
  state.blindMs = 0;
  saveState();
  render();
}

function renderReview(bank) {
  const current = now();
  const dueWords = getEnrichedWords(bank)
    .filter(({ record }) => !record.buried && record.seen && record.nextAt <= current)
    .sort((a, b) => a.record.nextAt - b.record.nextAt);
  const weakWords = getEnrichedWords(bank)
    .filter(({ record }) => !record.buried && record.wrong > record.correct)
    .sort((a, b) => b.record.wrong - a.record.wrong);
  const buriedWords = getEnrichedWords(bank)
    .filter(({ record }) => record.buried)
    .sort((a, b) => b.record.buriedAt - a.record.buriedAt);
  const app = $("#appView");

  app.innerHTML = `
    <div class="review-grid">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>到期复习</h2>
            <p class="micro-copy">按间隔复习时间排序，先处理快忘的词。</p>
          </div>
          <button class="primary-button" type="button" data-view="study">${icon("play")}开始复习</button>
        </div>
        <div class="side-list">
          ${dueWords.length ? dueWords.map(renderMiniWord).join("") : emptyState("暂无到期词", "继续学习新词，系统会自动安排下次复习。")}
        </div>
      </section>
      <section class="panel">
        <h2>薄弱词</h2>
        <div class="side-list">
          ${weakWords.length ? weakWords.slice(0, 8).map(renderMiniWord).join("") : emptyState("薄弱词为空", "答错或标记不认识后会出现在这里。")}
        </div>
      </section>
      <section class="panel">
        <h2>斩干词</h2>
        <div class="side-list">
          ${buriedWords.length ? buriedWords.slice(0, 8).map(renderMiniWord).join("") : emptyState("还没有斩干词", "确认稳定掌握后，可以从学习卡片移出复习库。")}
        </div>
      </section>
    </div>
  `;
}

function renderMiniWord(item) {
  return `
    <div class="mini-word">
      <strong>${escapeHtml(item.word)}</strong>
      <span class="word-meta">${escapeHtml(getPrimarySense(item))}</span>
      <div class="stat-line"><span>熟练度</span><strong>${item.record.level}/5</strong></div>
      <div class="stat-line"><span>平均提取</span><strong>${formatDuration(item.record.responseMs)}</strong></div>
      <div class="stat-line"><span>下次复习</span><strong>${formatDate(item.record.nextAt)}</strong></div>
    </div>
  `;
}

function createQuiz() {
  const bank = getBank();
  const words = getModeWords(bank)
    .map(({ record, ...word }) => word)
    .sort(() => Math.random() - 0.5);
  if (!words.length) return null;
  const target = words[0];
  const options = [target, ...words.filter((word) => word.id !== target.id).slice(0, 3)]
    .sort(() => Math.random() - 0.5)
    .map((word) => word.id);

  return {
    targetId: target.id,
    options,
    selectedId: null
  };
}

function renderQuiz(bank) {
  const modeWords = getModeWords(bank);
  if (!modeWords.length) {
    $("#appView").innerHTML = `
      <section class="panel">
        ${emptyState(`${escapeHtml(getStudyMode().title)} 暂无可测词`, "先在这一层完成几张卡片，再回来测验。")}
      </section>
    `;
    return;
  }

  if (!state.quiz || !modeWords.some((word) => word.id === state.quiz.targetId)) {
    state.quiz = createQuiz();
  }

  const quiz = state.quiz;
  const target = modeWords.find((word) => word.id === quiz.targetId);
  const selected = quiz.selectedId;
  const app = $("#appView");

  app.innerHTML = `
    <div class="quiz-grid">
      <section class="study-card">
        <div>
          <p class="eyebrow">选择最贴近的中文释义</p>
          <span class="level-badge">${escapeHtml(getStudyMode().title)}</span>
          <div class="word-title">
            <strong>${escapeHtml(target.word)}</strong>
            <span class="phonetic">${escapeHtml(target.phonetic)}</span>
          </div>
        </div>
        <div class="option-stack">
          ${quiz.options.map((id) => renderQuizOption(id, target, selected, bank)).join("")}
        </div>
        <div class="quiz-footer">
          <p class="micro-copy">${selected ? renderQuizFeedback(target, selected) : "提交选择后会立刻更新本地掌握记录。"}</p>
          <button class="primary-button" type="button" data-action="next-quiz">${icon("refresh")}下一题</button>
        </div>
      </section>
      <aside class="panel">
        <h2>测验表现</h2>
        <div class="stat-line"><span>今日测验</span><strong>${getDaily().quiz}</strong></div>
        <div class="stat-line"><span>今日学习</span><strong>${getDaily().reviewed}</strong></div>
        <div class="stat-line"><span>今日正确</span><strong>${getDaily().correct}</strong></div>
      </aside>
    </div>
  `;
}

function renderQuizOption(id, target, selected, bank) {
  const word = getModeWords(bank).find((item) => item.id === id) || bank.words.find((item) => item.id === id);
  const isCorrect = id === target.id;
  const isSelected = id === selected;
  const className = selected ? (isCorrect ? "is-correct" : isSelected ? "is-wrong" : "") : "";

  return `
    <button class="option-button ${className}" type="button" data-quiz-option="${escapeHtml(id)}" ${selected ? "disabled" : ""}>
      ${escapeHtml(getPrimarySense(word))}
    </button>
  `;
}

function renderQuizFeedback(target, selected) {
  return selected === target.id
    ? "回答正确，熟练度已提升。"
    : `正确释义：${escapeHtml(getPrimarySense(target))}`;
}

function chooseQuiz(id) {
  if (!state.quiz || state.quiz.selectedId) return;
  const bank = getBank();
  const target = bank.words.find((word) => word.id === state.quiz.targetId);
  const record = getRecord(target, bank);
  const daily = getDaily();
  const correct = id === target.id;
  const firstSeen = !record.seen;
  const plan = getExamPlan();

  state.quiz.selectedId = id;
  record.seen = true;
  record.lastAt = now();
  if (correct) {
    record.level = clamp(record.level + 1, 0, 5);
    record.correct += 1;
    record.nextAt = now() + [1, 2, 4, 7, 14, 30][record.level] * MS_DAY * plan.intervalFactor;
  } else {
    record.wrong += 1;
    record.nextAt = now();
  }

  daily.quiz += 1;
  daily.correct += correct ? 1 : 0;
  daily.learned += firstSeen ? 1 : 0;
  saveState();
  render();
}

function renderLibrary(bank) {
  const query = state.libraryQuery.trim().toLowerCase();
  const words = getEnrichedWords(bank).filter((item) => {
    const haystack = [
      item.word,
      item.cn,
      item.examSense,
      item.familiarMeaning,
      item.level,
      item.tags.join(" "),
      (item.family || []).join(" "),
      formatPaperRefs(item)
    ].join(" ").toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    const matchesFilter =
      state.libraryFilter === "all" ||
      (state.libraryFilter === "new" && !item.record.seen) ||
      (state.libraryFilter === "starred" && item.record.starred) ||
      (state.libraryFilter === "weak" && item.record.wrong > item.record.correct) ||
      (state.libraryFilter === "polysemy" && item.polysemy) ||
      (state.libraryFilter === "core" && item.level === "核心必背") ||
      (state.libraryFilter === "paper" && item.paperHits > 0) ||
      (state.libraryFilter === "mode-core" && isModeWord(item, "core-intensive")) ||
      (state.libraryFilter === "mode-syllabus" && isModeWord(item, "syllabus-recognition")) ||
      (state.libraryFilter === "mode-polysemy" && isModeWord(item, "paper-polysemy")) ||
      (state.libraryFilter === "mode-weak" && isModeWord(item, "weak-words")) ||
      (state.libraryFilter === "buried" && item.record.buried);
    return matchesQuery && matchesFilter;
  });
  const app = $("#appView");

  app.innerHTML = `
    <div class="library-grid">
      <section class="panel">
        <div class="panel-head">
          <div>
            <h2>词条列表</h2>
            <p class="micro-copy">当前显示 ${words.length} 个词，可按英文、中文、熟词生义或词族搜索。</p>
          </div>
          <div class="search-box">
            ${icon("search")}
            <label class="sr-only" for="librarySearch">搜索词条</label>
            <input id="librarySearch" type="search" placeholder="搜索 subject / 熟词生义 / ced" value="${escapeHtml(state.libraryQuery)}" />
          </div>
        </div>
        <div class="chip-row" role="list" aria-label="词条筛选">
          ${renderFilterChip("mode-core", "核心精背")}
          ${renderFilterChip("mode-syllabus", "考纲速认")}
          ${renderFilterChip("mode-polysemy", "真题熟词生义")}
          ${renderFilterChip("mode-weak", "我的错词")}
          ${renderFilterChip("all", "全部")}
          ${renderFilterChip("new", "未学")}
          ${renderFilterChip("core", "核心")}
          ${renderFilterChip("paper", "真题热词")}
          ${renderFilterChip("polysemy", "熟词生义")}
          ${renderFilterChip("starred", "收藏")}
          ${renderFilterChip("weak", "薄弱")}
          ${renderFilterChip("buried", "斩干")}
        </div>
        <div class="word-list">
          ${words.length ? words.map(renderWordRow).join("") : emptyState("没有匹配词条", "换个关键词或筛选条件试试。")}
        </div>
      </section>
      <section class="panel">
        <h2>词库结构</h2>
        <p class="micro-copy">每个词库都使用同一套字段，学习、测验、复习逻辑会自动接管新增词条。</p>
        <div class="side-list">
          ${BANKS.map(renderBankRow).join("")}
        </div>
      </section>
    </div>
  `;

  $("#librarySearch")?.focus({ preventScroll: true });
}

function renderFilterChip(filter, label) {
  return `
    <button class="chip-button ${state.libraryFilter === filter ? "is-active" : ""}" type="button" data-filter="${escapeHtml(filter)}">
      ${escapeHtml(label)}
    </button>
  `;
}

function renderWordRow(item) {
  return `
    <article class="word-row ${item.record.buried ? "is-buried" : ""}">
      <div class="word-row-head">
        <div>
          <strong>${escapeHtml(item.word)}</strong>
          <span class="phonetic">${escapeHtml(item.phonetic)}</span>
        </div>
        <span class="level-badge">${item.record.level}/5</span>
      </div>
      <p>${escapeHtml(getPrimarySense(item))}</p>
      ${item.polysemy ? `<p class="micro-copy">熟词生义：${escapeHtml(item.familiarMeaning || "常见义")} → ${escapeHtml(item.examSense || item.cn)}</p>` : ""}
      <div class="chip-row">
        <span class="tag">${escapeHtml(item.level || "阅读高频")}</span>
        ${item.paperHits ? `<span class="tag hot-tag">真题 ${item.paperHits} · ${item.paperCoverage}套</span>` : ""}
        ${item.polysemy ? `<span class="tag hot-tag">熟词生义</span>` : ""}
        ${item.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        ${item.record.starred ? `<span class="tag">已收藏</span>` : ""}
        ${item.record.buried ? `<span class="tag">已斩干</span>` : ""}
      </div>
    </article>
  `;
}

function renderEmptyBank(bank) {
  $("#appView").innerHTML = `
    <section class="panel">
      ${emptyState(`${escapeHtml(bank.shortTitle)} 词库已预留`, `在 data/word-banks.js 中给 ${escapeHtml(bank.id)} 添加 words 数组后，学习、复习和测验会自动启用。`)}
    </section>
    <section class="panel">
      <h2>推荐词条 schema</h2>
      <pre><code>{
  id: "example",
  word: "example",
  phonetic: "/ɪɡˈzæmpəl/",
  pos: "n.",
  cn: "例子；样本",
  en: "a thing used to explain an idea",
  example: "This is an example sentence.",
  exampleCn: "这是一个例句。",
  examSense: "考研常考义",
  familiarMeaning: "常见义",
  polysemy: true,
  frequency: 5,
  level: "熟词生义",
  examTypes: ["英语一", "英语二"],
  morphology: {
    parts: [{ text: "ex-", meaning: "向外" }],
    note: "词根记忆提示"
  },
  family: ["exemplify", "exemplary"],
  examContext: {
    source: "真题同域语境",
    year: "待导入真题年份",
    sentence: "A sentence from the exam context.",
    translation: "真题语境翻译。",
    analysis: "长难句主干或含义提醒。"
  },
  sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" },
  tags: ["阅读", "核心"],
  difficulty: 2
}</code></pre>
    </section>
  `;
}

function emptyState(title, text) {
  return `
    <div class="empty-state">
      <div>
        <strong>${title}</strong>
        <p>${text}</p>
      </div>
    </div>
  `;
}

function toggleStar() {
  const bank = getBank();
  const word = getCurrentStudyWord(bank);
  if (!word) return;
  const record = getRecord(word, bank);
  record.starred = !record.starred;
  saveState();
  render();
}

function revealWord() {
  if (!state.cardStartedAt) {
    state.cardStartedAt = now();
  }
  state.blindMs = now() - state.cardStartedAt;
  state.revealed = true;
  saveState();
  render();
}

function buryCurrentWord() {
  const bank = getBank();
  const word = getCurrentStudyWord(bank);
  if (!word) return;
  const record = getRecord(word, bank);
  record.buried = true;
  record.buriedAt = now();
  record.nextAt = Number.MAX_SAFE_INTEGER;
  getDaily().buried += 1;
  state.studyCursor += 1;
  state.studyWordId = null;
  state.revealed = false;
  state.cardStartedAt = 0;
  state.blindMs = 0;
  saveState();
  render();
}

function resetProgress() {
  const confirmed = window.confirm("确定清空本地学习进度吗？词库内容不会删除。");
  if (!confirmed) return;
  state = { ...defaultState, selectedBank: state.selectedBank, theme: state.theme, examDate: state.examDate, studyMode: state.studyMode };
  saveState();
  render();
}

document.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-study-mode]");
  if (modeButton) {
    setStudyMode(modeButton.dataset.studyMode);
    return;
  }

  const viewButton = event.target.closest("[data-view]");
  if (viewButton) {
    setView(viewButton.dataset.view);
    return;
  }

  const bankButton = event.target.closest("[data-bank]");
  if (bankButton) {
    setBank(bankButton.dataset.bank);
    return;
  }

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    state.libraryFilter = filterButton.dataset.filter;
    saveState();
    render();
    return;
  }

  const gradeButton = event.target.closest("[data-grade]");
  if (gradeButton) {
    gradeWord(gradeButton.dataset.grade);
    return;
  }

  const quizButton = event.target.closest("[data-quiz-option]");
  if (quizButton) {
    chooseQuiz(quizButton.dataset.quizOption);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;

  const actions = {
    "go-dashboard": () => setView("dashboard"),
    "reset-progress": resetProgress,
    "toggle-theme": () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      saveState();
      render();
    },
    "reveal-word": revealWord,
    "toggle-star": toggleStar,
    "bury-word": buryCurrentWord,
    "next-quiz": () => {
      state.quiz = createQuiz();
      saveState();
      render();
    }
  };

  actions[actionButton.dataset.action]?.();
});

document.addEventListener("input", (event) => {
  if (event.target.id === "librarySearch") {
    state.libraryQuery = event.target.value;
    saveState();
    renderLibrary(getBank());
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "examDateInput") {
    state.examDate = event.target.value || defaultExamDate();
    saveState();
    render();
  }
});

$("#bankSelect").addEventListener("change", (event) => {
  setBank(event.target.value);
});

document.addEventListener("keydown", (event) => {
  if (state.view !== "study") return;
  if (event.key === " " && !state.revealed) {
    event.preventDefault();
    revealWord();
  }
  if (!state.revealed) return;
  if (event.key === "1") gradeWord("easy");
  if (event.key === "2") gradeWord("slow");
  if (event.key === "3") gradeWord("vague");
  if (event.key === "4") gradeWord("unknown");
});

render();
