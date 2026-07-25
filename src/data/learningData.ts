export type LearningStatus = "completed" | "current" | "locked";

export type LearningUnit = {
  id: string;
  title: string;
  summary: string;
  duration: string;
  status: LearningStatus;
  remember: string;
  mediaStatus?: "ready" | "missing";
};

export type LearningStage = {
  id: string;
  order: number;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  badge: string;
  status: LearningStatus;
  progress: number;
  voiceTitle: string;
  voiceSceneKey: string;
  voiceParagraphs: string[];
  units: LearningUnit[];
};

export const learningStages: LearningStage[] = [
  {
    id: "welcome",
    order: 1,
    title: "欢迎加入",
    shortTitle: "欢迎加入",
    subtitle: "完成新人身份登记",
    description: "认识小瑶与新人学习旅程，了解顺序解锁、任务完成和入职认证规则。",
    badge: "/stages/stage-01-welcome.png",
    status: "completed",
    progress: 100,
    voiceTitle: "你好，我是小瑶",
    voiceSceneKey: "home_welcome",
    voiceParagraphs: [
      "你好呀，欢迎加入长发小寨，我是小瑶。",
      "这套新人学习旅程，是专门为每一位新伙伴准备的。",
      "在你正式投入工作之前，我会先陪你认识一下自己刚刚加入的地方。",
      "我们会一起看看长发小寨从哪里出发，在做什么，为什么这样做产品，以及以后和大家一起工作时，需要知道哪些事情。",
      "不用急着一次记住所有内容。接下来，我会陪你一步一步走完六个成长节点。",
      "准备好了吗？我们一起出发吧！",
    ],
    units: [
      { id: "welcome-hero", title: "欢迎来到长发小寨", summary: "认识小瑶、了解六关旅程，并点击开始。", duration: "约 5 分钟", status: "completed", remember: "这是一段新人认知成长旅程，不是课程清单。" },
    ],
  },
  {
    id: "company",
    order: 2,
    title: "认识长发小寨",
    shortTitle: "认识长发小寨",
    subtitle: "了解品牌来源与核心文化",
    description: "从公司介绍、企业历程和主要团队三个角度认识长发小寨。",
    badge: "/stages/stage-02-brand-origin.png",
    status: "completed",
    progress: 100,
    voiceTitle: "小瑶带你认识长发小寨",
    voiceSceneKey: "stage_2_intro",
    voiceParagraphs: [
      "正式开始之前，小瑶先问你一个问题。",
      "你觉得，你刚刚加入的长发小寨，到底是一家怎样的公司？是一个洗护品牌？一家电商公司？还是一个和红瑶文化有关的品牌？",
      "其实都对，但又不完全。",
      "接下来这一站，我们会从公司的起点开始，看看文化、科研、产品、品牌和市场，是怎么一步一步连接起来的。",
      "走完这一站，你会真正知道，自己加入的是一个怎样的地方。",
    ],
    units: [
      { id: "company-overview", title: "认识今天的长发小寨", summary: "通过品牌宣传片与正式介绍，了解长发小寨是一家什么样的公司。", duration: "待配置", status: "completed", remember: "公司定位必须以正式介绍与宣传片为准。" },
      { id: "company-timeline", title: "我们从哪里走来", summary: "沿关键节点理解公司从文化起点到品牌发展的轨迹。", duration: "待配置", status: "completed", remember: "只呈现经过审核的年份、事件与荣誉。" },
      { id: "company-organization-map", title: "和哪些伙伴一起工作", summary: "认识职能支持、业务增长等主要团队，以及大家分别在解决什么问题。", duration: "待配置", status: "completed", remember: "遇到问题时，要知道应该找谁协作。" },
    ],
  },
  {
    id: "culture",
    order: 3,
    title: "认识品牌与非遗文化",
    shortTitle: "品牌与非遗文化",
    subtitle: "探索品牌与非遗文化展区",
    description: "以数字文化馆方式认识红瑶长发文化、Logo 故事、非遗淘米水与中国长发科技馆。",
    badge: "/stages/stage-03-museum.png",
    status: "current",
    progress: 33,
    voiceTitle: "小瑶带你走进数字文化馆",
    voiceSceneKey: "museum_entry",
    voiceParagraphs: [
      "欢迎来到桂林长发博物馆，也就是我们的中国长发科技馆。",
      "这里不是一个普通展馆，它记录着长发小寨从红瑶文化出发，一步步走向现代国货品牌的故事。",
      "在这里，你会看到红瑶女性长发背后的文化意义，也会了解到为什么发酵淘米水能成为长发小寨的核心技术来源。",
      "简单来说，这一站你要记住一句话：长发小寨不是凭空出现的品牌，它是从红瑶长发文化、非遗淘米水技艺和现代科研转化里长出来的。",
      "走吧，小瑶带你进馆看看！",
    ],
    units: [
      { id: "long-hair", title: "红瑶长发文化", summary: "从真实人物与生活认识长发意义和传统发式。", duration: "待配置", status: "completed", remember: "真实文化是品牌来源，不是装饰素材。", mediaStatus: "missing" },
      { id: "logo-story", title: "Logo 故事", summary: "观察乌龙盘发轮廓与品牌 Logo 的视觉关联。", duration: "待配置", status: "current", remember: "正式关联必须使用审核后的发式图片和品牌规范。", mediaStatus: "missing" },
      { id: "rice-water", title: "非遗淘米水", summary: "沿五步工艺路径区分普通淘米水与传统发酵技艺。", duration: "待配置", status: "locked", remember: "关键不只在原料名称，更在完整技艺过程。", mediaStatus: "missing" },
      { id: "technology-museum", title: "中国长发科技馆", summary: "理解文化、技艺、科研与社会价值如何发生连接。", duration: "待配置", status: "locked", remember: "科技馆让文化被看见，也让成果被清楚表达。", mediaStatus: "missing" },
    ],
  },
  {
    id: "product",
    order: 4,
    title: "认识产品与核心技术",
    shortTitle: "产品与核心技术",
    subtitle: "了解核心产品与技术壁垒",
    description: "先识别消费者问题发生在哪里，再理解产品逻辑、米水气技和正式产品体系。",
    badge: "/stages/stage-04-org.png",
    status: "locked",
    progress: 0,
    voiceTitle: "小瑶带你认识产品与核心技术",
    voiceSceneKey: "product_technology",
    voiceParagraphs: [
      "前面我们已经知道长发小寨从哪里来。",
      "但作为公司的一员，还有一个问题一定要弄明白。我们到底在做什么产品？",
      "为什么面对不同的头发和头皮问题，要使用不同的解决思路？",
      "这一关，我们不会让你背产品目录。小瑶会带你从真实问题出发，一步一步理解产品背后的逻辑。",
    ],
    units: [
      { id: "consumer-problem", title: "消费者问题认知", summary: "区分头皮、发根、发丝，以及掉发与断发。", duration: "待配置", status: "locked", remember: "先看问题发生在哪里，再谈产品。", mediaStatus: "missing" },
      { id: "product-logic", title: "产品底层逻辑", summary: "理解问题如何进入产品定义、研发与验证。", duration: "待配置", status: "locked", remember: "产品从真实问题出发，并在验证中持续优化。", mediaStatus: "missing" },
      { id: "four-foundations", title: "米水气技", summary: "认识原料、环境与技术共同构成的产品基础。", duration: "待配置", status: "locked", remember: "未经审核的产地与技术结论不能直接发布。", mediaStatus: "missing" },
      { id: "product-system", title: "产品体系", summary: "认识防脱固发、头皮清洁、分型养护与沙龙奢护。", duration: "待配置", status: "locked", remember: "产品体系以公司最新正式资料为准。", mediaStatus: "missing" },
      { id: "key-products", title: "重点产品认识", summary: "理解产品解决的问题、所属体系和核心价值。", duration: "待配置", status: "locked", remember: "不自行扩大单一产品理论到整个品牌。", mediaStatus: "missing" },
      { id: "product-qa", title: "产品问答", summary: "通过带解释的问答检查产品逻辑认知。", duration: "待配置", status: "locked", remember: "答题为了理解，不是为了记功效词。", mediaStatus: "missing" },
    ],
  },
  {
    id: "organization",
    order: 5,
    title: "认识组织与基础制度",
    shortTitle: "组织与基础制度",
    subtitle: "认识部门协作与制度规则",
    description: "组织架构已前置到第二关；本关聚焦常用制度入口与四项真实互动练习。",
    badge: "/stages/stage-05-rules.png",
    status: "locked",
    progress: 0,
    voiceTitle: "小瑶带你认识日常制度",
    voiceSceneKey: "organization_rules",
    voiceParagraphs: [
      "欢迎来到新人工作生存指南。",
      "放心，这一关不会让你从头到尾背员工手册。",
      "接下来，我们直接过一天。从早上到公司开始，到打卡、请假、外出、报销，再到下班前可能遇到的问题，小瑶会陪你一个一个判断。",
      "你只需要记住一个原则：遇到事情先判断，遇到流程按流程，不确定的时候及时确认。",
      "好啦，新人的一天开始咯。",
    ],
    units: [
      { id: "moka", title: "Moka 常用流程", summary: "认识个人信息、考勤、请假、外出、出差、补卡与转正入口。", duration: "待配置", status: "locked", remember: "实际入口与流程以公司现行制度资料为准。" },
      { id: "attendance", title: "考勤", summary: "理解打卡、异常处理与及时补流程的基本要求。", duration: "待配置", status: "locked", remember: "考勤细则必须由人力正式资料确认。" },
      { id: "leave-and-outing", title: "请假 / 外出 / 出差", summary: "区分不同场景的申请、报备与审批要求。", duration: "待配置", status: "locked", remember: "具体规则不从历史逐字稿自动推断。" },
      { id: "expense", title: "报销与发票", summary: "围绕真实、完整、合规理解票据与报销流程。", duration: "待配置", status: "locked", remember: "报销规则以财务正式资料为准。" },
      { id: "rules-games", title: "四项制度练习", summary: "依次完成制度守卫战、价值观配对、小瑶接价值观和制度问答。", duration: "约 20 分钟", status: "locked", remember: "第五关完成条件只取四个正式游戏 Key。" },
    ],
  },
  {
    id: "certification",
    order: 6,
    title: "完成新人认证",
    shortTitle: "新人认证",
    subtitle: "完成认证，解锁学习天地",
    description: "汇总必学内容、互动任务与知识问答结果，完成新员工入职认证。",
    badge: "/stages/stage-06-certificate.png",
    status: "locked",
    progress: 0,
    voiceTitle: "小瑶陪你完成新人认证",
    voiceSceneKey: "certification_start",
    voiceParagraphs: [
      "原来我们已经一起走这么远啦。",
      "现在，前面的成长印记都已经被你一步一步点亮了。",
      "不过最后这一枚，还得靠你自己完成。",
      "接下来的新人认证，会看看你是不是真的理解了公司、品牌、产品和基础工作规则。",
      "不用紧张。考试不是为了证明你不会，而是为了在真正开始工作之前，把还没理解的地方找出来，再补上去。",
      "准备好了，我们开始最后一关。",
    ],
    units: [
      { id: "journey-review", title: "六关回顾", summary: "回看成长印记和最后一枚待点亮的徽章。", duration: "待解锁", status: "locked", remember: "认证建立在前五关真实完成记录上。" },
      { id: "certification-exam", title: "新人认证考试", summary: "整卷完成公司文化、产品认知与制度流程题目。", duration: "待解锁", status: "locked", remember: "正式考试整卷提交后统一出分。" },
      { id: "certification-result", title: "认证结果", summary: "查看总成绩、薄弱领域、错题回顾与再次认证入口。", duration: "待解锁", status: "locked", remember: "认证用于发现薄弱项，不逐题即时公布答案。" },
      { id: "learning-world-unlock", title: "学习天地解锁", summary: "点亮第六枚徽章，生成证书并开启持续学习。", duration: "待解锁", status: "locked", remember: "这不是毕业，是正式出发。" },
    ],
  },
];

export const currentStage = learningStages.find((stage) => stage.status === "current") ?? learningStages[0];

export const learningWorldModules = [
  { id: "products", title: "产品知识", description: "产品线、单品、成分、功效与新品学习。" },
  { id: "culture", title: "企业文化", description: "企业文化、公司故事与内部文化活动。" },
  { id: "rules", title: "管理制度", description: "正式制度、流程更新与必要签署。" },
  { id: "vr", title: "VR 云游", description: "长发科技馆、办公空间与生产基地。" },
  { id: "growth", title: "岗位成长", description: "依据部门和岗位配置持续学习路径。" },
];
