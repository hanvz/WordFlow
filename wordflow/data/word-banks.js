/*
  Add more libraries by appending a bank object to WORD_BANKS.
  Required fields: id, title, shortTitle, exam, description, accent, words.
  Core word fields: id, word, phonetic, pos, cn, en, example, exampleCn, tags, difficulty.
  Kaoyan fields: examSense, familiarMeaning, polysemy, frequency, level, examTypes,
  morphology, family, examContext, sourceRefs, paperHits, paperCoverage, paperRefs.
*/
window.WORD_BANKS = [
  {
    id: "kaoyan",
    title: "考研核心词",
    shortTitle: "考研",
    exam: "全国硕士研究生入学考试",
    description: "优先训练阅读理解里的熟词生义、真题语境和主动提取。",
    accent: "#5eead4",
    dailyTarget: 18,
    targetSize: 5500,
    coverageLabel: "考研词库 5500+，核心精背 1700+，考纲速认 5500+，熟词生义 300+",
    dictionarySource: "Oxford Advanced Learner's Dictionary local MDX/MDD + ECDICT MIT filtered by ky/exam tags",
    paperSource: window.PASTPAPERS_KAOYAN_INDEX || null,
    paperStats: window.PASTPAPERS_KAOYAN_VOCAB_STATS || null,
    levels: ["核心必背", "熟词生义", "阅读高频", "边缘低频"],
    words: [
      {
        id: "school",
        word: "school",
        phonetic: "/skuːl/",
        pos: "n.",
        cn: "学派；流派；学校",
        en: "a group of people who share the same ideas or style",
        example: "The school of thought has shaped debates about human nature.",
        exampleCn: "这一思想流派塑造了关于人性的争论。",
        examSense: "学派；流派",
        familiarMeaning: "学校",
        polysemy: true,
        tags: ["熟词生义", "阅读", "核心"],
        frequency: 5,
        level: "熟词生义",
        examTypes: ["英语一", "英语二"],
        difficulty: 4,
        morphology: {
          parts: [
            { text: "school", meaning: "同一训练或思想体系下的人群" }
          ],
          note: "考研阅读里常指思想流派，不只指教学场所。"
        },
        family: ["schooling", "scholar", "scholarly"],
        examContext: {
          source: "真题同域语境",
          year: "待导入真题年份",
          sentence: "This school of thought regards choice as a product of social context.",
          translation: "这一思想流派认为选择是社会语境的产物。",
          analysis: "of thought 限定 school，说明它不是地点，而是观点体系。"
        },
        sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
      },
      {
        id: "subject",
        word: "subject",
        phonetic: "/ˈsʌbdʒɪkt/",
        pos: "n. adj. v.",
        cn: "实验对象；主题；受……支配的；使遭受",
        en: "a person or thing being studied, or something affected by a condition",
        example: "The subjects were asked to report how they made each decision.",
        exampleCn: "实验对象被要求报告他们如何做出每个决定。",
        examSense: "实验对象；受……支配的",
        familiarMeaning: "科目；主题",
        polysemy: true,
        tags: ["熟词生义", "学术", "核心"],
        frequency: 5,
        level: "熟词生义",
        examTypes: ["英语一", "英语二"],
        difficulty: 5,
        morphology: {
          parts: [
            { text: "sub-", meaning: "在……之下" },
            { text: "ject", meaning: "投掷；放置" }
          ],
          note: "在研究语境里常指被观察、被测试的对象。"
        },
        family: ["objective", "project", "reject", "subjective"],
        examContext: {
          source: "真题同域语境",
          year: "待导入真题年份",
          sentence: "The subjects were not fully aware of the forces shaping their responses.",
          translation: "实验对象并未完全意识到塑造其反应的力量。",
          analysis: "The subjects 不是“科目”，而是实验参与者。"
        },
        sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
      },
      {
        id: "harbor",
        word: "harbor",
        phonetic: "/ˈhɑːrbər/",
        pos: "v. n.",
        cn: "怀有；庇护；港口",
        en: "to keep a thought or feeling in your mind for a long time",
        example: "The public may harbor doubts about the neutrality of the report.",
        exampleCn: "公众可能对报告的中立性心存疑虑。",
        examSense: "怀有（想法、情感）",
        familiarMeaning: "港口",
        polysemy: true,
        tags: ["熟词生义", "阅读"],
        frequency: 4,
        level: "熟词生义",
        examTypes: ["英语一"],
        difficulty: 5,
        morphology: {
          parts: [
            { text: "harbor", meaning: "容纳；藏住" }
          ],
          note: "从“港口容纳船只”引申为“心里藏着某种情绪”。"
        },
        family: ["harbour", "harbored"],
        examContext: {
          source: "真题同域语境",
          year: "待导入真题年份",
          sentence: "Many readers still harbor the belief that innovation is driven by lone genius.",
          translation: "许多读者仍怀有一种信念，认为创新由孤独的天才推动。",
          analysis: "harbor 后接 belief，表示心理状态而不是地理名词。"
        },
        sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
      },
      {
        id: "address",
        word: "address",
        phonetic: "/əˈdres/",
        pos: "v. n.",
        cn: "处理；应对；演说；地址",
        en: "to think about a problem and begin to deal with it",
        example: "The policy attempts to address the gap between rich and poor regions.",
        exampleCn: "该政策试图处理贫富地区之间的差距。",
        examSense: "处理；应对",
        familiarMeaning: "地址",
        polysemy: true,
        tags: ["熟词生义", "写作", "核心"],
        frequency: 5,
        level: "核心必背",
        examTypes: ["英语一", "英语二"],
        difficulty: 4,
        morphology: {
          parts: [
            { text: "ad-", meaning: "朝向" },
            { text: "dress", meaning: "引导；整理" }
          ],
          note: "写作中常用 address a problem 表示解决或回应问题。"
        },
        family: ["redress", "addressee"],
        examContext: {
          source: "真题同域语境",
          year: "待导入真题年份",
          sentence: "The author argues that regulation should address the incentives behind the behavior.",
          translation: "作者认为监管应处理这种行为背后的激励因素。",
          analysis: "address 后接抽象问题，不能译成“地址”。"
        },
        sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
      },
      {
        id: "appreciate",
        word: "appreciate",
        phonetic: "/əˈpriːʃieɪt/",
        pos: "v.",
        cn: "理解；意识到；欣赏；增值",
        en: "to understand the importance or value of something",
        example: "Few people appreciate how slowly institutions change.",
        exampleCn: "很少有人理解制度变化有多缓慢。",
        examSense: "理解；意识到",
        familiarMeaning: "欣赏；感谢",
        polysemy: true,
        tags: ["熟词生义", "阅读", "核心"],
        frequency: 4,
        level: "熟词生义",
        examTypes: ["英语一", "英语二"],
        difficulty: 4,
        morphology: {
          parts: [
            { text: "ap-", meaning: "朝向" },
            { text: "preci", meaning: "价值" },
            { text: "-ate", meaning: "动词后缀" }
          ],
          note: "核心是“看见价值”，在阅读中常转为“充分理解”。"
        },
        family: ["appreciation", "appreciative", "depreciate"],
        examContext: {
          source: "真题同域语境",
          year: "待导入真题年份",
          sentence: "To appreciate the argument, one must consider the historical setting.",
          translation: "要理解这一论证，必须考虑历史背景。",
          analysis: "appreciate 不是感谢，而是理解论证。"
        },
        sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
      },
      {
        id: "account",
        word: "account",
        phonetic: "/əˈkaʊnt/",
        pos: "n. v.",
        cn: "解释；说明；账户；认为",
        en: "an explanation or description of an event or idea",
        example: "The author offers a different account of economic change.",
        exampleCn: "作者对经济变化给出了另一种解释。",
        examSense: "解释；说明",
        familiarMeaning: "账户",
        polysemy: true,
        tags: ["熟词生义", "阅读", "核心"],
        frequency: 5,
        level: "核心必背",
        examTypes: ["英语一", "英语二"],
        difficulty: 4,
        morphology: {
          parts: [
            { text: "ac-", meaning: "朝向；加强" },
            { text: "count", meaning: "计算；叙述" }
          ],
          note: "give an account of 常指解释或叙述。"
        },
        family: ["accountable", "accountability", "counter"],
        examContext: {
          source: "真题同域语境",
          year: "待导入真题年份",
          sentence: "This account fails to explain why the pattern appears across cultures.",
          translation: "这种解释无法说明为什么该模式会跨文化出现。",
          analysis: "This account 指前文理论解释，不是银行账户。"
        },
        sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
      },
      {
        id: "abandon",
        word: "abandon",
        phonetic: "/əˈbændən/",
        pos: "v.",
        cn: "放弃；抛弃；纵情于",
        en: "to leave something behind or stop supporting it",
        example: "The researcher refused to abandon the original hypothesis too early.",
        exampleCn: "研究者拒绝过早放弃最初的假设。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "academic",
        word: "academic",
        phonetic: "/ˌækəˈdemɪk/",
        pos: "adj.",
        cn: "学术的；学院的；理论上的",
        en: "connected with education, study, or scholarship",
        example: "Academic writing values evidence more than personal impression.",
        exampleCn: "学术写作重视证据胜过个人印象。",
        tags: ["学术", "写作"],
        difficulty: 2
      },
      {
        id: "access",
        word: "access",
        phonetic: "/ˈækses/",
        pos: "n. v.",
        cn: "进入；接近；获取；使用权",
        en: "the right or opportunity to use or reach something",
        example: "Digital tools give students wider access to academic resources.",
        exampleCn: "数字工具让学生更广泛地获取学术资源。",
        tags: ["阅读", "核心"],
        difficulty: 1
      },
      {
        id: "accumulate",
        word: "accumulate",
        phonetic: "/əˈkjuːmjəleɪt/",
        pos: "v.",
        cn: "积累；聚积",
        en: "to gradually collect more and more of something",
        example: "Small daily reviews accumulate into a strong vocabulary base.",
        exampleCn: "每天的小复习会积累成牢固的词汇基础。",
        tags: ["阅读", "写作"],
        difficulty: 3
      },
      {
        id: "acknowledge",
        word: "acknowledge",
        phonetic: "/əkˈnɑːlɪdʒ/",
        pos: "v.",
        cn: "承认；认可；告知收到",
        en: "to accept that something is true or important",
        example: "The author acknowledges the limits of the current evidence.",
        exampleCn: "作者承认当前证据的局限。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "adapt",
        word: "adapt",
        phonetic: "/əˈdæpt/",
        pos: "v.",
        cn: "适应；改编；改造",
        en: "to change in order to fit a new situation",
        example: "Learners adapt faster when feedback arrives immediately.",
        exampleCn: "反馈及时出现时，学习者适应得更快。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "adequate",
        word: "adequate",
        phonetic: "/ˈædɪkwət/",
        pos: "adj.",
        cn: "足够的；合格的",
        en: "enough for a particular purpose",
        example: "The study needs adequate data before drawing conclusions.",
        exampleCn: "这项研究需要足够的数据才能得出结论。",
        tags: ["阅读", "写作"],
        difficulty: 3
      },
      {
        id: "advocate",
        word: "advocate",
        phonetic: "/ˈædvəkeɪt/",
        pos: "v. n.",
        cn: "提倡；拥护；倡导者",
        en: "to publicly support an idea or policy",
        example: "Many educators advocate more active reading strategies.",
        exampleCn: "许多教育者提倡更主动的阅读策略。",
        tags: ["写作", "核心"],
        difficulty: 3
      },
      {
        id: "alter",
        word: "alter",
        phonetic: "/ˈɔːltər/",
        pos: "v.",
        cn: "改变；修改",
        en: "to make something different without replacing it completely",
        example: "A single assumption can alter the result of the model.",
        exampleCn: "一个假设就可能改变模型结果。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "ambiguous",
        word: "ambiguous",
        phonetic: "/æmˈbɪɡjuəs/",
        pos: "adj.",
        cn: "模糊不清的；有歧义的",
        en: "having more than one possible meaning",
        example: "Ambiguous wording often weakens an argument.",
        exampleCn: "有歧义的措辞常常削弱论证。",
        tags: ["阅读", "写作"],
        difficulty: 4
      },
      {
        id: "analyze",
        word: "analyze",
        phonetic: "/ˈænəlaɪz/",
        pos: "v.",
        cn: "分析；解析",
        en: "to examine something carefully in order to understand it",
        example: "The passage asks readers to analyze the author's attitude.",
        exampleCn: "文章要求读者分析作者态度。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "apparent",
        word: "apparent",
        phonetic: "/əˈpærənt/",
        pos: "adj.",
        cn: "明显的；表面上的",
        en: "easy to notice or understand",
        example: "The apparent conflict disappears after a closer reading.",
        exampleCn: "仔细阅读后，表面上的冲突消失了。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "approach",
        word: "approach",
        phonetic: "/əˈproʊtʃ/",
        pos: "n. v.",
        cn: "方法；接近；处理",
        en: "a way of dealing with a problem or task",
        example: "A careful approach helps reduce errors in translation.",
        exampleCn: "谨慎的方法有助于减少翻译错误。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "appropriate",
        word: "appropriate",
        phonetic: "/əˈproʊpriət/",
        pos: "adj.",
        cn: "合适的；恰当的",
        en: "suitable for a particular situation",
        example: "Choose an appropriate example to support the claim.",
        exampleCn: "选择恰当的例子来支持观点。",
        tags: ["写作", "核心"],
        difficulty: 3
      },
      {
        id: "arbitrary",
        word: "arbitrary",
        phonetic: "/ˈɑːrbətreri/",
        pos: "adj.",
        cn: "任意的；武断的",
        en: "based on personal choice rather than reason",
        example: "The boundary between the two categories is somewhat arbitrary.",
        exampleCn: "这两个类别之间的界限有些任意。",
        tags: ["阅读"],
        difficulty: 4
      },
      {
        id: "aspect",
        word: "aspect",
        phonetic: "/ˈæspekt/",
        pos: "n.",
        cn: "方面；层面",
        en: "one part or feature of a situation",
        example: "The social aspect of learning is often underestimated.",
        exampleCn: "学习的社会层面常被低估。",
        tags: ["阅读", "核心"],
        difficulty: 1
      },
      {
        id: "assess",
        word: "assess",
        phonetic: "/əˈses/",
        pos: "v.",
        cn: "评估；评价",
        en: "to judge the value, quality, or importance of something",
        example: "The exam assesses both vocabulary and reasoning.",
        exampleCn: "考试同时评估词汇和推理能力。",
        tags: ["学术", "核心"],
        difficulty: 3
      },
      {
        id: "assume",
        word: "assume",
        phonetic: "/əˈsuːm/",
        pos: "v.",
        cn: "假定；承担；呈现",
        en: "to think something is true without proof",
        example: "Do not assume every familiar word has a familiar meaning.",
        exampleCn: "不要假定每个熟词都只有熟悉的意思。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "attain",
        word: "attain",
        phonetic: "/əˈteɪn/",
        pos: "v.",
        cn: "达到；获得",
        en: "to succeed in achieving something",
        example: "Consistent practice helps learners attain fluency.",
        exampleCn: "持续练习帮助学习者达到流利程度。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "attribute",
        word: "attribute",
        phonetic: "/əˈtrɪbjuːt/",
        pos: "v. n.",
        cn: "把……归因于；属性；特征",
        en: "to regard something as caused by someone or something",
        example: "The decline was attributed to weak demand.",
        exampleCn: "下降被归因于需求疲软。",
        tags: ["阅读", "核心"],
        difficulty: 4
      },
      {
        id: "available",
        word: "available",
        phonetic: "/əˈveɪləbl/",
        pos: "adj.",
        cn: "可获得的；有空的",
        en: "able to be used or obtained",
        example: "Only limited evidence is available at this stage.",
        exampleCn: "现阶段只有有限证据可用。",
        tags: ["阅读", "核心"],
        difficulty: 1
      },
      {
        id: "beneficial",
        word: "beneficial",
        phonetic: "/ˌbenɪˈfɪʃl/",
        pos: "adj.",
        cn: "有益的；有利的",
        en: "having a good effect",
        example: "Regular review is beneficial to long-term memory.",
        exampleCn: "规律复习有益于长期记忆。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "challenge",
        word: "challenge",
        phonetic: "/ˈtʃælɪndʒ/",
        pos: "n. v.",
        cn: "挑战；质疑",
        en: "a difficult task or a call to question something",
        example: "The finding challenges a widely held belief.",
        exampleCn: "这一发现挑战了一个广泛持有的观念。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "circumstance",
        word: "circumstance",
        phonetic: "/ˈsɜːrkəmstæns/",
        pos: "n.",
        cn: "情况；环境；境遇",
        en: "a fact or condition affecting a situation",
        example: "Policy choices depend heavily on local circumstances.",
        exampleCn: "政策选择很大程度上取决于当地情况。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "coherent",
        word: "coherent",
        phonetic: "/koʊˈhɪrənt/",
        pos: "adj.",
        cn: "连贯的；有条理的",
        en: "logical and well organized",
        example: "A coherent paragraph develops one central idea.",
        exampleCn: "连贯的段落会展开一个中心思想。",
        tags: ["写作"],
        difficulty: 4
      },
      {
        id: "collapse",
        word: "collapse",
        phonetic: "/kəˈlæps/",
        pos: "v. n.",
        cn: "倒塌；崩溃；失败",
        en: "to fall down suddenly or fail completely",
        example: "The old theory collapsed under new evidence.",
        exampleCn: "旧理论在新证据面前崩溃了。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "commit",
        word: "commit",
        phonetic: "/kəˈmɪt/",
        pos: "v.",
        cn: "承诺；投入；犯；委托",
        en: "to promise to do something or put effort into it",
        example: "Students who commit to a routine usually improve faster.",
        exampleCn: "坚持固定计划的学生通常进步更快。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "compatible",
        word: "compatible",
        phonetic: "/kəmˈpætəbl/",
        pos: "adj.",
        cn: "兼容的；可共存的",
        en: "able to exist or work together",
        example: "The two explanations are not fully compatible.",
        exampleCn: "这两种解释并不完全兼容。",
        tags: ["阅读"],
        difficulty: 4
      },
      {
        id: "compensate",
        word: "compensate",
        phonetic: "/ˈkɑːmpenseɪt/",
        pos: "v.",
        cn: "补偿；弥补",
        en: "to make up for loss, damage, or weakness",
        example: "Clear structure can compensate for limited vocabulary.",
        exampleCn: "清晰结构可以弥补词汇有限的不足。",
        tags: ["写作"],
        difficulty: 4
      },
      {
        id: "comprehensive",
        word: "comprehensive",
        phonetic: "/ˌkɑːmprɪˈhensɪv/",
        pos: "adj.",
        cn: "全面的；综合的",
        en: "including all or nearly all parts",
        example: "A comprehensive review covers both strengths and weaknesses.",
        exampleCn: "全面的评述会涵盖优点和缺点。",
        tags: ["学术", "写作"],
        difficulty: 4
      },
      {
        id: "conceive",
        word: "conceive",
        phonetic: "/kənˈsiːv/",
        pos: "v.",
        cn: "构想；认为；怀孕",
        en: "to form an idea in your mind",
        example: "It is hard to conceive of progress without cooperation.",
        exampleCn: "很难想象没有合作还能取得进步。",
        tags: ["阅读"],
        difficulty: 4
      },
      {
        id: "conclude",
        word: "conclude",
        phonetic: "/kənˈkluːd/",
        pos: "v.",
        cn: "推断；结束；得出结论",
        en: "to decide something after considering the facts",
        example: "The report concludes that prevention is more efficient.",
        exampleCn: "报告得出结论：预防更高效。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "conduct",
        word: "conduct",
        phonetic: "/kənˈdʌkt/",
        pos: "v. n.",
        cn: "实施；进行；行为",
        en: "to organize and carry out an activity",
        example: "The team conducted a survey among first-year students.",
        exampleCn: "团队对一年级学生开展了一项调查。",
        tags: ["学术"],
        difficulty: 3
      },
      {
        id: "consequence",
        word: "consequence",
        phonetic: "/ˈkɑːnsəkwens/",
        pos: "n.",
        cn: "结果；后果；重要性",
        en: "a result of an action or situation",
        example: "The long-term consequences are difficult to predict.",
        exampleCn: "长期后果很难预测。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "consistent",
        word: "consistent",
        phonetic: "/kənˈsɪstənt/",
        pos: "adj.",
        cn: "一致的；持续的",
        en: "not changing and in agreement with something",
        example: "The results are consistent with previous studies.",
        exampleCn: "结果与先前研究一致。",
        tags: ["学术", "核心"],
        difficulty: 3
      },
      {
        id: "constitute",
        word: "constitute",
        phonetic: "/ˈkɑːnstɪtuːt/",
        pos: "v.",
        cn: "构成；组成；被视为",
        en: "to form or be considered as something",
        example: "These errors constitute only a small part of the dataset.",
        exampleCn: "这些错误只构成数据集的一小部分。",
        tags: ["阅读"],
        difficulty: 4
      },
      {
        id: "consume",
        word: "consume",
        phonetic: "/kənˈsuːm/",
        pos: "v.",
        cn: "消耗；消费；吞噬",
        en: "to use resources or buy goods and services",
        example: "Online entertainment can consume large amounts of attention.",
        exampleCn: "在线娱乐会消耗大量注意力。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "contemporary",
        word: "contemporary",
        phonetic: "/kənˈtempəreri/",
        pos: "adj. n.",
        cn: "当代的；同时代的人",
        en: "belonging to the present time",
        example: "Contemporary society depends heavily on information systems.",
        exampleCn: "当代社会高度依赖信息系统。",
        tags: ["阅读", "写作"],
        difficulty: 4
      },
      {
        id: "controversial",
        word: "controversial",
        phonetic: "/ˌkɑːntrəˈvɜːrʃl/",
        pos: "adj.",
        cn: "有争议的",
        en: "causing public disagreement",
        example: "The proposal remains controversial among experts.",
        exampleCn: "该提议在专家中仍有争议。",
        tags: ["写作"],
        difficulty: 4
      },
      {
        id: "convince",
        word: "convince",
        phonetic: "/kənˈvɪns/",
        pos: "v.",
        cn: "使确信；说服",
        en: "to make someone believe that something is true",
        example: "Strong evidence can convince readers more effectively.",
        exampleCn: "有力证据能更有效地说服读者。",
        tags: ["写作", "核心"],
        difficulty: 2
      },
      {
        id: "decline",
        word: "decline",
        phonetic: "/dɪˈklaɪn/",
        pos: "v. n.",
        cn: "下降；衰退；拒绝",
        en: "to become smaller, weaker, or worse",
        example: "The chart shows a steady decline in print sales.",
        exampleCn: "图表显示纸质书销量持续下降。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "demonstrate",
        word: "demonstrate",
        phonetic: "/ˈdemənstreɪt/",
        pos: "v.",
        cn: "证明；展示；示威",
        en: "to show clearly that something is true",
        example: "The experiment demonstrates the value of repeated practice.",
        exampleCn: "实验证明了重复练习的价值。",
        tags: ["学术", "核心"],
        difficulty: 3
      },
      {
        id: "derive",
        word: "derive",
        phonetic: "/dɪˈraɪv/",
        pos: "v.",
        cn: "获得；源于；派生",
        en: "to get something from a particular source",
        example: "Many English words derive from Latin or Greek.",
        exampleCn: "许多英语单词源自拉丁语或希腊语。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "diverse",
        word: "diverse",
        phonetic: "/daɪˈvɜːrs/",
        pos: "adj.",
        cn: "多样的；不同的",
        en: "including many different types",
        example: "A diverse vocabulary makes expression more precise.",
        exampleCn: "多样的词汇让表达更精确。",
        tags: ["写作"],
        difficulty: 2
      },
      {
        id: "dominate",
        word: "dominate",
        phonetic: "/ˈdɑːmɪneɪt/",
        pos: "v.",
        cn: "支配；占主导地位",
        en: "to control or be more important than others",
        example: "One theory dominated the field for decades.",
        exampleCn: "一个理论主导该领域数十年。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "eliminate",
        word: "eliminate",
        phonetic: "/ɪˈlɪmɪneɪt/",
        pos: "v.",
        cn: "消除；淘汰；排除",
        en: "to remove something completely",
        example: "Good editing eliminates unnecessary repetition.",
        exampleCn: "好的编辑会消除不必要的重复。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "emerge",
        word: "emerge",
        phonetic: "/ɪˈmɜːrdʒ/",
        pos: "v.",
        cn: "出现；浮现；形成",
        en: "to appear or become known",
        example: "A new pattern emerged from the survey data.",
        exampleCn: "调查数据中浮现出一种新模式。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "emphasize",
        word: "emphasize",
        phonetic: "/ˈemfəsaɪz/",
        pos: "v.",
        cn: "强调；重视",
        en: "to give special importance to something",
        example: "The article emphasizes the role of public education.",
        exampleCn: "文章强调公共教育的作用。",
        tags: ["写作", "核心"],
        difficulty: 2
      },
      {
        id: "enhance",
        word: "enhance",
        phonetic: "/ɪnˈhæns/",
        pos: "v.",
        cn: "提高；增强；改善",
        en: "to improve the quality or strength of something",
        example: "Context can enhance vocabulary memory.",
        exampleCn: "语境可以增强词汇记忆。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "ensure",
        word: "ensure",
        phonetic: "/ɪnˈʃʊr/",
        pos: "v.",
        cn: "确保；保证",
        en: "to make certain that something happens",
        example: "Daily review ensures that new words are not forgotten quickly.",
        exampleCn: "每日复习确保新词不会很快遗忘。",
        tags: ["写作", "核心"],
        difficulty: 2
      },
      {
        id: "establish",
        word: "establish",
        phonetic: "/ɪˈstæblɪʃ/",
        pos: "v.",
        cn: "建立；确立；证实",
        en: "to create something or prove that something is true",
        example: "The study established a link between sleep and memory.",
        exampleCn: "研究证实了睡眠与记忆之间的联系。",
        tags: ["学术", "核心"],
        difficulty: 3
      },
      {
        id: "evaluate",
        word: "evaluate",
        phonetic: "/ɪˈvæljueɪt/",
        pos: "v.",
        cn: "评价；评估",
        en: "to judge how good, useful, or important something is",
        example: "Readers should evaluate the evidence before agreeing.",
        exampleCn: "读者在同意前应评估证据。",
        tags: ["学术", "核心"],
        difficulty: 3
      },
      {
        id: "evident",
        word: "evident",
        phonetic: "/ˈevɪdənt/",
        pos: "adj.",
        cn: "明显的；显然的",
        en: "clear and easy to see",
        example: "It is evident that vocabulary grows through repeated contact.",
        exampleCn: "显然，词汇量通过反复接触而增长。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "evolve",
        word: "evolve",
        phonetic: "/ɪˈvɑːlv/",
        pos: "v.",
        cn: "进化；逐步发展",
        en: "to develop gradually over time",
        example: "Language continues to evolve with technology.",
        exampleCn: "语言随着技术继续发展。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "facilitate",
        word: "facilitate",
        phonetic: "/fəˈsɪlɪteɪt/",
        pos: "v.",
        cn: "促进；使便利",
        en: "to make an action or process easier",
        example: "Clear examples facilitate understanding.",
        exampleCn: "清楚的例子有助于理解。",
        tags: ["写作", "学术"],
        difficulty: 4
      },
      {
        id: "fundamental",
        word: "fundamental",
        phonetic: "/ˌfʌndəˈmentl/",
        pos: "adj. n.",
        cn: "基本的；根本的；基本原则",
        en: "basic and essential",
        example: "Vocabulary is a fundamental part of reading ability.",
        exampleCn: "词汇是阅读能力的基础部分。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "generate",
        word: "generate",
        phonetic: "/ˈdʒenəreɪt/",
        pos: "v.",
        cn: "产生；生成",
        en: "to produce or create something",
        example: "The discussion generated several useful questions.",
        exampleCn: "讨论产生了几个有用问题。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "implement",
        word: "implement",
        phonetic: "/ˈɪmplɪment/",
        pos: "v. n.",
        cn: "实施；执行；工具",
        en: "to put a plan or system into action",
        example: "The school implemented a new reading program.",
        exampleCn: "学校实施了一项新的阅读计划。",
        tags: ["阅读", "写作"],
        difficulty: 4
      },
      {
        id: "imply",
        word: "imply",
        phonetic: "/ɪmˈplaɪ/",
        pos: "v.",
        cn: "暗示；意味着",
        en: "to suggest something without saying it directly",
        example: "The data imply that habits matter more than talent.",
        exampleCn: "数据暗示习惯比天赋更重要。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "incentive",
        word: "incentive",
        phonetic: "/ɪnˈsentɪv/",
        pos: "n.",
        cn: "激励；刺激；动机",
        en: "something that encourages a person to do something",
        example: "Visible progress can be a strong incentive to continue.",
        exampleCn: "可见的进步会成为继续下去的强大动力。",
        tags: ["阅读"],
        difficulty: 4
      },
      {
        id: "incorporate",
        word: "incorporate",
        phonetic: "/ɪnˈkɔːrpəreɪt/",
        pos: "v.",
        cn: "包含；合并；吸收",
        en: "to include something as part of a whole",
        example: "The revision incorporated feedback from several teachers.",
        exampleCn: "修订吸收了几位老师的反馈。",
        tags: ["学术", "写作"],
        difficulty: 4
      },
      {
        id: "inevitable",
        word: "inevitable",
        phonetic: "/ɪnˈevɪtəbl/",
        pos: "adj.",
        cn: "不可避免的",
        en: "certain to happen and impossible to avoid",
        example: "Some forgetting is inevitable, so review must be planned.",
        exampleCn: "遗忘不可避免，因此复习必须被规划。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "interpret",
        word: "interpret",
        phonetic: "/ɪnˈtɜːrprət/",
        pos: "v.",
        cn: "解释；理解；口译",
        en: "to explain or understand the meaning of something",
        example: "Readers may interpret the same sentence differently.",
        exampleCn: "读者可能会以不同方式理解同一句话。",
        tags: ["阅读", "核心"],
        difficulty: 3
      },
      {
        id: "maintain",
        word: "maintain",
        phonetic: "/meɪnˈteɪn/",
        pos: "v.",
        cn: "保持；维护；主张",
        en: "to keep something at the same level or condition",
        example: "A stable routine helps maintain learning momentum.",
        exampleCn: "稳定的日程有助于保持学习势头。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "obtain",
        word: "obtain",
        phonetic: "/əbˈteɪn/",
        pos: "v.",
        cn: "获得；取得",
        en: "to get something through effort",
        example: "Reliable conclusions require data obtained from many sources.",
        exampleCn: "可靠结论需要从多个来源获得的数据。",
        tags: ["学术"],
        difficulty: 2
      },
      {
        id: "perspective",
        word: "perspective",
        phonetic: "/pərˈspektɪv/",
        pos: "n.",
        cn: "视角；观点；透视法",
        en: "a particular way of thinking about something",
        example: "The passage presents the issue from a historical perspective.",
        exampleCn: "文章从历史视角呈现这个问题。",
        tags: ["阅读", "写作"],
        difficulty: 3
      },
      {
        id: "potential",
        word: "potential",
        phonetic: "/pəˈtenʃl/",
        pos: "adj. n.",
        cn: "潜在的；可能性；潜力",
        en: "possible but not yet developed",
        example: "The method has potential benefits for adult learners.",
        exampleCn: "该方法对成人学习者有潜在益处。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "preliminary",
        word: "preliminary",
        phonetic: "/prɪˈlɪmɪneri/",
        pos: "adj. n.",
        cn: "初步的；预备的",
        en: "happening before a more important action",
        example: "Preliminary results suggest a positive trend.",
        exampleCn: "初步结果显示出积极趋势。",
        tags: ["学术"],
        difficulty: 4
      },
      {
        id: "principle",
        word: "principle",
        phonetic: "/ˈprɪnsəpl/",
        pos: "n.",
        cn: "原则；原理；准则",
        en: "a basic rule or belief",
        example: "The same principle applies to grammar learning.",
        exampleCn: "同一原则也适用于语法学习。",
        tags: ["阅读", "核心"],
        difficulty: 2
      },
      {
        id: "priority",
        word: "priority",
        phonetic: "/praɪˈɔːrəti/",
        pos: "n.",
        cn: "优先事项；优先权",
        en: "something that is more important than other things",
        example: "Weak words should become today's review priority.",
        exampleCn: "薄弱词应该成为今天的复习优先事项。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "procedure",
        word: "procedure",
        phonetic: "/prəˈsiːdʒər/",
        pos: "n.",
        cn: "程序；步骤；手续",
        en: "a fixed way of doing something",
        example: "The experiment followed a standard procedure.",
        exampleCn: "实验遵循了标准程序。",
        tags: ["学术"],
        difficulty: 3
      },
      {
        id: "promote",
        word: "promote",
        phonetic: "/prəˈmoʊt/",
        pos: "v.",
        cn: "促进；推广；晋升",
        en: "to help something develop or become known",
        example: "Reading promotes both vocabulary growth and critical thinking.",
        exampleCn: "阅读促进词汇增长和批判性思维。",
        tags: ["写作", "核心"],
        difficulty: 2
      },
      {
        id: "relevant",
        word: "relevant",
        phonetic: "/ˈreləvənt/",
        pos: "adj.",
        cn: "相关的；切题的",
        en: "closely connected with the subject",
        example: "Use only relevant evidence in an argument.",
        exampleCn: "论证中只使用相关证据。",
        tags: ["写作", "核心"],
        difficulty: 2
      },
      {
        id: "require",
        word: "require",
        phonetic: "/rɪˈkwaɪər/",
        pos: "v.",
        cn: "需要；要求",
        en: "to need something or make it necessary",
        example: "Deep understanding requires more than translation.",
        exampleCn: "深入理解需要的不只是翻译。",
        tags: ["阅读", "核心"],
        difficulty: 1
      },
      {
        id: "resource",
        word: "resource",
        phonetic: "/ˈriːsɔːrs/",
        pos: "n.",
        cn: "资源；资料；办法",
        en: "a supply of something useful",
        example: "Time is the most limited resource for exam preparation.",
        exampleCn: "时间是备考中最有限的资源。",
        tags: ["阅读"],
        difficulty: 2
      },
      {
        id: "restrict",
        word: "restrict",
        phonetic: "/rɪˈstrɪkt/",
        pos: "v.",
        cn: "限制；约束",
        en: "to limit the size, amount, or range of something",
        example: "Too many rules may restrict creativity.",
        exampleCn: "过多规则可能限制创造力。",
        tags: ["阅读"],
        difficulty: 3
      },
      {
        id: "significant",
        word: "significant",
        phonetic: "/sɪɡˈnɪfɪkənt/",
        pos: "adj.",
        cn: "重要的；显著的",
        en: "large or important enough to be noticed",
        example: "The new method led to a significant improvement.",
        exampleCn: "新方法带来了显著提升。",
        tags: ["学术", "核心"],
        difficulty: 3
      },
      {
        id: "sufficient",
        word: "sufficient",
        phonetic: "/səˈfɪʃnt/",
        pos: "adj.",
        cn: "足够的；充分的",
        en: "as much as is needed",
        example: "The claim lacks sufficient evidence.",
        exampleCn: "这个观点缺乏充分证据。",
        tags: ["写作"],
        difficulty: 3
      },
      {
        id: "sustain",
        word: "sustain",
        phonetic: "/səˈsteɪn/",
        pos: "v.",
        cn: "维持；支撑；遭受",
        en: "to keep something going for a period of time",
        example: "Motivation is easier to sustain when progress is visible.",
        exampleCn: "进步可见时，动力更容易维持。",
        tags: ["写作"],
        difficulty: 4
      },
      {
        id: "transform",
        word: "transform",
        phonetic: "/trænsˈfɔːrm/",
        pos: "v.",
        cn: "转变；改造",
        en: "to change completely in form or character",
        example: "Technology has transformed the way people learn languages.",
        exampleCn: "技术改变了人们学习语言的方式。",
        tags: ["阅读", "核心"],
        difficulty: 3
      }
    ]
  },
  {
    id: "toefl",
    title: "TOEFL 预留词库",
    shortTitle: "TOEFL",
    exam: "托福考试",
    description: "结构已预留，可直接添加听力、阅读和学术场景词。",
    accent: "#60a5fa",
    dailyTarget: 20,
    locked: true,
    words: []
  },
  {
    id: "ielts",
    title: "IELTS 预留词库",
    shortTitle: "IELTS",
    exam: "雅思考试",
    description: "结构已预留，可直接添加口语、写作和阅读高频词。",
    accent: "#f59e0b",
    dailyTarget: 20,
    locked: true,
    words: []
  }
];

const KAOYAN_WORD_ENRICHMENTS = {
  abandon: {
    examSense: "放弃原有立场、假设或做法",
    familiarMeaning: "抛弃",
    frequency: 4,
    level: "核心必背",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "a-", meaning: "离开" },
        { text: "bandon", meaning: "控制；管辖" }
      ],
      note: "阅读中常与 hypothesis、policy、belief 搭配。"
    },
    family: ["abandoned", "abandonment"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "The author does not abandon the theory but narrows its application.",
      translation: "作者并未放弃该理论，而是缩小其适用范围。",
      analysis: "注意 but 后的转折，abandon 表示放弃观点或理论。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  academic: {
    examSense: "学术研究相关的；纯理论的",
    frequency: 5,
    level: "阅读高频",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "academ", meaning: "学院；学术" },
        { text: "-ic", meaning: "形容词后缀" }
      ],
      note: "academic concern 可表示理论问题，不一定有现实紧迫性。"
    },
    family: ["academy", "academia", "academically"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "The debate is not merely academic; it affects public policy.",
      translation: "这场争论并非纯理论问题；它会影响公共政策。",
      analysis: "not merely academic 提醒读者：它有现实影响。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  access: {
    examSense: "获取信息、资源或机会的权利",
    frequency: 5,
    level: "核心必背",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "ac-", meaning: "朝向" },
        { text: "cess", meaning: "走；接近" }
      ],
      note: "常见搭配：access to education / data / resources。"
    },
    family: ["accessible", "accessibility", "inaccessible"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "Unequal access to information can deepen social divisions.",
      translation: "信息获取机会不平等可能加深社会分化。",
      analysis: "access to 后接抽象资源，是阅读常见搭配。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  acknowledge: {
    examSense: "承认事实、局限或贡献",
    frequency: 5,
    level: "核心必背",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "ac-", meaning: "加强" },
        { text: "knowledge", meaning: "知道；认识" }
      ],
      note: "常用于让步：acknowledge limits / problems。"
    },
    family: ["acknowledgement", "knowledge"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "The author acknowledges the problem but rejects the proposed solution.",
      translation: "作者承认这个问题，但拒绝所提出的解决方案。",
      analysis: "acknowledge 后常接 but，定位作者态度。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  assume: {
    examSense: "假定；承担角色或责任",
    familiarMeaning: "认为",
    polysemy: true,
    frequency: 5,
    level: "核心必背",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "as-", meaning: "朝向" },
        { text: "sum", meaning: "拿起；承担" }
      ],
      note: "assume responsibility 表示承担责任，不是“假设责任”。"
    },
    family: ["assumption", "assuming", "resume", "consume"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "The argument assumes that consumers always act rationally.",
      translation: "该论证假定消费者总是理性行动。",
      analysis: "assumes that 引出未被证明的前提。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  constitute: {
    examSense: "构成；被视为",
    frequency: 4,
    level: "阅读高频",
    examTypes: ["英语一"],
    morphology: {
      parts: [
        { text: "con-", meaning: "共同" },
        { text: "stitut", meaning: "建立；放置" },
        { text: "-e", meaning: "动词后缀" }
      ],
      note: "A constitutes B 表示 A 构成 B，是长难句主干常见动词。"
    },
    family: ["constitution", "constituent", "institution"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "These small choices constitute a powerful social signal.",
      translation: "这些小选择构成了一种强有力的社会信号。",
      analysis: "主干是 choices constitute signal，中间修饰语不要打断理解。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  condition: {
    examSense: "使习惯于；制约；条件；状况",
    familiarMeaning: "条件；状况",
    en: "to shape someone's habits or limits; also a state, requirement, or surrounding situation",
    example: "A society conditioned to crave instant gratification will inevitably see a decline in long-term reading habits, a condition that alarms educators.",
    exampleCn: "一个习惯于追求即时满足的社会，将不可避免地看到长期阅读习惯的衰退，这种状况让教育工作者感到忧虑。",
    polysemy: true,
    frequency: 5,
    level: "熟词生义",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "con-", meaning: "共同；加强" },
        { text: "dit", meaning: "说；安排" },
        { text: "-ion", meaning: "名词后缀" }
      ],
      note: "be conditioned to do 表示被训练得习惯于做某事；conditions 复数常指生活、工作或社会环境。"
    },
    family: ["conditional", "unconditional", "precondition", "conditioning", "recondition"],
    examContext: {
      source: "DeepSeek V4 Pro 校准语境",
      year: "真题同域语境",
      sentence: "A society conditioned to crave instant gratification will inevitably see a decline in long-term reading habits, a condition that alarms educators.",
      translation: "一个习惯于追求即时满足的社会，将不可避免地看到长期阅读习惯的衰退，这种状况让教育工作者感到忧虑。",
      analysis: "conditioned to crave 作后置定语，conditioned 是熟词生义“使习惯于”；a condition that... 概括前文现象。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "DeepSeek V4 Pro curation" }
  },
  major: {
    examSense: "主修；专业；主要的；重大的",
    familiarMeaning: "主要的；少校",
    en: "to study something as a main subject; also something important or large in scale",
    example: "Students who major in humanities are often conditioned to justify their educational choices in purely economic terms.",
    exampleCn: "主修人文学科的学生常常被习惯性地要求用纯经济术语来为自己的教育选择辩护。",
    polysemy: true,
    frequency: 5,
    level: "熟词生义",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "maj", meaning: "大；重要" },
        { text: "-or", meaning: "名词或形容词后缀" }
      ],
      note: "major in 表示主修，不能写成 be majored in；注意和 mayor（市长）区分。"
    },
    family: ["majority", "majoritarian", "minority", "majorly", "mayor"],
    examContext: {
      source: "DeepSeek V4 Pro 校准语境",
      year: "真题同域语境",
      sentence: "Students who major in humanities are often conditioned to justify their educational choices in purely economic terms.",
      translation: "主修人文学科的学生常常被习惯性地要求用纯经济术语来为自己的教育选择辩护。",
      analysis: "who major in humanities 修饰 Students；major 作动词表示“主修”，不是“主要”。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "DeepSeek V4 Pro curation" }
  },
  maintain: {
    examSense: "主张；坚持认为；维持",
    familiarMeaning: "保持",
    polysemy: true,
    frequency: 5,
    level: "核心必背",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "main", meaning: "手" },
        { text: "tain", meaning: "握住；保持" }
      ],
      note: "作者态度题里 maintain 常等于 argue / claim。"
    },
    family: ["maintenance", "sustain", "retain"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "The author maintains that the change is less dramatic than it appears.",
      translation: "作者主张，这种变化没有看起来那么剧烈。",
      analysis: "maintains that 后面是作者观点。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  },
  significant: {
    examSense: "显著的；有统计或论证意义的",
    frequency: 5,
    level: "核心必背",
    examTypes: ["英语一", "英语二"],
    morphology: {
      parts: [
        { text: "sign", meaning: "标记；信号" },
        { text: "-fic", meaning: "做；造成" },
        { text: "-ant", meaning: "形容词后缀" }
      ],
      note: "significant 不只是 important，也常指研究结果有显著性。"
    },
    family: ["significance", "signify", "insignificant"],
    examContext: {
      source: "真题同域语境",
      year: "待导入真题年份",
      sentence: "The difference is significant only when the sample is large enough.",
      translation: "只有样本足够大时，这种差异才具有显著意义。",
      analysis: "significant 与研究语境结合，偏“显著”。"
    },
    sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" }
  }
};

function buildPaperStatsByWord(stats) {
  const stopWords = new Set(["section"]);
  return new Map((stats?.aggregateTop || [])
    .filter(([word]) => !stopWords.has(word))
    .map(([word, hits, refs]) => {
      const paperRefs = refs.map((ref) => {
        const [paperId, count] = ref.split(":");
        return { paperId, count: Number(count) || 0 };
      });

      return [word, {
        paperHits: hits,
        paperCoverage: paperRefs.length,
        paperRefs
      }];
    }));
}

const EXAM_TOPIC_CUES = [
  { tags: ["熟词生义"], en: "a hidden meaning shift", cn: "熟词生义转换" },
  { tags: ["学术"], en: "research logic and academic evidence", cn: "研究逻辑和学术证据" },
  { tags: ["写作"], en: "argument structure and written evaluation", cn: "论证结构和写作评价" },
  { tags: ["边缘"], en: "a low-frequency detail that may block sentence meaning", cn: "可能卡住句意的低频细节" },
  { tags: ["核心"], en: "the author's claim or a key relation", cn: "作者主张或关键关系" },
  { tags: ["阅读"], en: "paragraph development and sentence relations", cn: "段落推进和句间关系" }
];

function splitSenses(value) {
  return String(value || "")
    .replaceAll(",", "；")
    .split("；")
    .map((item) => item.trim())
    .filter(Boolean);
}

function wordHash(value) {
  return String(value || "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function getPrimaryExamSense(word) {
  return splitSenses(word.examSense || word.cn)[0] || word.word;
}

function getSecondaryExamSense(word) {
  return splitSenses(word.cn).find((sense) => sense !== getPrimaryExamSense(word)) || getPrimaryExamSense(word);
}

function getTopicCue(word) {
  const tags = word.tags || [];
  if (word.paperHits > 0) {
    return { en: "a point repeatedly tested in past papers", cn: "真题反复命中的考点" };
  }
  return EXAM_TOPIC_CUES.find((cue) => cue.tags.some((tag) => tags.includes(tag))) || {
    en: "the local logic of an exam sentence",
    cn: "考研句子的局部逻辑"
  };
}

function getDomainCue(word) {
  const haystack = `${word.word} ${word.cn || ""} ${(word.tags || []).join(" ")}`;
  const domains = [
    {
      pattern: /腹|病|症|医|治疗|健康|心理|神经|trauma|therapy|cancer|cholesterol|symptom|abdomen/,
      en: "health or psychology evidence",
      cn: "健康或心理类证据",
      frame: "a health-related passage"
    },
    {
      pattern: /经济|市场|收入|工资|就业|金融|贷款|消费|价格|生产|税|贸易|market|income|salary|wage|mortgage|productivity/,
      en: "economic incentives and market behaviour",
      cn: "经济激励和市场行为",
      frame: "an economic-policy passage"
    },
    {
      pattern: /技术|数据|数字|算法|网络|媒体|信息|自动|technology|digital|algorithm|media|data|network/,
      en: "technology, data, and public life",
      cn: "技术、数据和公共生活",
      frame: "a technology passage"
    },
    {
      pattern: /法律|法院|权利|政策|政府|制度|监管|law|legal|policy|regulation|constitutional|civic/,
      en: "rules, institutions, and public policy",
      cn: "规则、制度和公共政策",
      frame: "a policy or legal passage"
    },
    {
      pattern: /教育|学生|学校|学院|学术|教学|大学|专业|education|student|academic|academy|tuition|undergraduate/,
      en: "education and academic choice",
      cn: "教育和学术选择",
      frame: "an education passage"
    },
    {
      pattern: /环境|气候|生态|能源|生物|城市|农业|climate|ecology|energy|urban|biodiversity|renewable/,
      en: "environmental pressure and social response",
      cn: "环境压力和社会回应",
      frame: "an environmental passage"
    },
    {
      pattern: /艺术|文学|语言|文化|历史|哲学|诗|drama|poetry|genre|linguistics|philosophy|cultural/,
      en: "culture, language, and interpretation",
      cn: "文化、语言和阐释",
      frame: "a humanities passage"
    }
  ];

  return domains.find((domain) => domain.pattern.test(haystack)) || {
    en: "social evidence and the author's line of reasoning",
    cn: "社会证据和作者论证脉络",
    frame: "a social-science passage"
  };
}

function isGenericEnglish(value) {
  return !value || /^Kaoyan .+ vocabulary item/i.test(value) || /fast English-to-Chinese recall/i.test(value);
}

function isGenericExample(value, word) {
  const escaped = String(word.word || word.id || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return !value ||
    new RegExp(`^In exam reading, ${escaped} often appears`, "i").test(value) ||
    new RegExp(`^In exam reading, ${escaped} should be recognized`, "i").test(value) ||
    new RegExp(`^The sentence uses ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^The phrase around ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^Check the verb or adjective near ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^Readers should link ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^A question may test ${escaped}\\b`, "i").test(value) ||
    new RegExp(`^A precise translation of ${escaped}\\b`, "i").test(value) ||
    /specific object, standard, or attitude/i.test(value);
}

function isGenericExampleCn(value, word) {
  const token = String(word.word || word.id || "");
  return !value ||
    value.includes(`${token} 常出现在考研阅读`) ||
    value.includes(`${token} 属于考研速认词`) ||
    value.includes("先看") && value.includes("周围的短语") ||
    value.includes("在这里帮助说明一个对象、标准或态度") ||
    value.includes("题目可能会通过");
}

function buildExamEnglish(word) {
  const sense = getPrimaryExamSense(word);
  const secondary = getSecondaryExamSense(word);
  const cue = getTopicCue(word);
  const domain = getDomainCue(word);
  const templates = [
    () => `Exam cue: read ${word.word} as "${sense}" when ${domain.frame} is building ${cue.en}.`,
    () => `${word.word} is anchored to "${sense}" in ${domain.frame}; resolve it through nearby collocations.`,
    () => `In reading, ${word.word} usually matters because it shapes ${domain.en}, especially around "${sense}".`,
    () => `Treat ${word.word} as an exam signal for "${sense}" inside ${domain.frame}, not as a loose one-word gloss.`,
    () => `${word.word} should be checked against nearby verbs and nouns; its priority sense here is "${sense}".`,
    () => `Use the clause around ${word.word} to decide whether it means "${sense}" or the related sense "${secondary}".`,
    () => `For Kaoyan reading, ${word.word} is stored with the working sense "${sense}" and the domain cue ${domain.en}.`,
    () => `The useful exam reading of ${word.word} is "${sense}", with attention to collocation and author attitude.`
  ];
  return templates[wordHash(word.word) % templates.length]();
}

function buildExamExample(word) {
  const sense = getPrimaryExamSense(word);
  const domain = getDomainCue(word);
  const subject = domain.en.split(" and ")[0] || "the debate";
  const templates = [
    () => `The report treats ${word.word} as a key factor in the wider debate over ${subject}.`,
    () => `Researchers often discuss ${word.word} when explaining changes in ${domain.en}.`,
    () => `The author's argument depends on how ${word.word} affects public judgment and policy choices.`,
    () => `Recent evidence suggests that ${word.word} can reshape the way institutions respond to pressure.`,
    () => `The passage connects ${word.word} with a broader concern about ${domain.en}.`,
    () => `Many readers overlook ${word.word} because it appears inside a long clause about ${subject}.`,
    () => `The study links ${word.word} to measurable differences in behavior, costs, or social outcomes.`,
    () => `A careful reading shows that ${word.word} is central to the author's explanation of the problem.`
  ];
  return templates[wordHash(word.word) % templates.length]();
}

function buildExamExampleCn(word) {
  const domain = getDomainCue(word);
  const subject = domain.cn.split("和")[0] || "相关讨论";
  const templates = [
    () => `这份报告把 ${word.word} 视为围绕${subject}展开的更大讨论中的关键因素。`,
    () => `研究人员在解释${domain.cn}变化时，经常讨论 ${word.word}。`,
    () => `作者的论证取决于 ${word.word} 如何影响公众判断和政策选择。`,
    () => `最新证据表明，${word.word} 会改变机构回应压力的方式。`,
    () => `这篇文章把 ${word.word} 与关于${domain.cn}的更广泛担忧联系起来。`,
    () => `许多读者会忽略 ${word.word}，因为它出现在关于${subject}的长从句中。`,
    () => `这项研究把 ${word.word} 与行为、成本或社会结果的可测差异联系起来。`,
    () => `仔细阅读可见，${word.word} 是作者解释该问题的核心。`
  ];
  return templates[wordHash(word.word) % templates.length]();
}

function buildExamContext(word) {
  return {
    source: word.paperHits ? "真题命中同域语境" : "考研同域语境",
    year: word.paperHits ? `已命中 ${word.paperCoverage || 1} 套真题` : "速认训练",
    sentence: word.example,
    translation: word.exampleCn,
    analysis: word.polysemy
      ? `${word.word} 有熟词生义风险，优先按“${getPrimaryExamSense(word)}”回到句子主干判断。`
      : `先把 ${word.word} 试译为“${getPrimaryExamSense(word)}”，再看它前后的动词、形容词或介词短语，确认这个中文是否贴合本句。`
  };
}

function normalizeStudyFields(word) {
  const normalized = { ...word };
  const needsEnglish = isGenericEnglish(normalized.en);
  const needsExample = isGenericExample(normalized.example, normalized);
  const needsExampleCn = isGenericExampleCn(normalized.exampleCn, normalized);

  if (needsEnglish) normalized.en = buildExamEnglish(normalized);
  if (needsExample) normalized.example = normalized.examContext?.sentence || buildExamExample(normalized);
  if (needsExampleCn) normalized.exampleCn = normalized.examContext?.translation || buildExamExampleCn(normalized);
  if (!normalized.examContext || needsExample || needsExampleCn) {
    normalized.examContext = normalized.examContext || buildExamContext(normalized);
    if (needsExample || needsExampleCn) {
      normalized.examContext = {
        ...normalized.examContext,
        sentence: normalized.example,
        translation: normalized.exampleCn
      };
    }
  }

  return normalized;
}

const kaoyanBank = window.WORD_BANKS.find((bank) => bank.id === "kaoyan");
if (kaoyanBank) {
  const paperStatsByWord = buildPaperStatsByWord(kaoyanBank.paperStats);
  const existingWordIds = new Set(kaoyanBank.words.map((word) => word.id));
  const seenSupplementIds = new Set(existingWordIds);
  const supplementalWords = [
    ...(window.KAOYAN_CORE_PACK || []),
    ...(window.KAOYAN_EXTENDED_PACK || []),
    ...(window.KAOYAN_COMPLETE_PACK || []),
    ...(window.KAOYAN_SYLLABUS_RECOGNITION_PACK || [])
  ].filter((word) => {
    if (seenSupplementIds.has(word.id)) return false;
    seenSupplementIds.add(word.id);
    return true;
  });
  kaoyanBank.words = [...kaoyanBank.words, ...supplementalWords];
  kaoyanBank.words = kaoyanBank.words.map((word) => {
    const paperStats = paperStatsByWord.get(word.word) || paperStatsByWord.get(word.id);

    return normalizeStudyFields({
      frequency: word.tags?.includes("核心") ? 4 : 3,
      level: word.tags?.includes("核心") ? "核心必背" : "阅读高频",
      examTypes: ["英语一", "英语二"],
      polysemy: false,
      examSense: word.cn?.split("；")[0] || word.cn,
      sourceRefs: { dictionary: "OALD local MDX", examCorpus: "pending" },
      paperHits: 0,
      paperCoverage: 0,
      paperRefs: [],
      ...word,
      ...(window.KAOYAN_DEEPSEEK_CONTEXTS?.[word.id] || {}),
      ...(window.KAOYAN_DEEPSEEK_LEXICAL?.[word.id] || {}),
      ...(window.KAOYAN_OALD_LOCAL?.[word.id] || {}),
      ...(KAOYAN_WORD_ENRICHMENTS[word.id] || {}),
      ...(paperStats || {})
    });
  });
}
