export type FactStatus = "verified" | "pendingReview";
export type ContentFormat = "hero" | "video" | "story" | "timeline" | "map" | "exhibition" | "comparison" | "process" | "scenario" | "quiz" | "certification";

export type V4Module = {
  id: string;
  title: string;
  purpose: string;
  format: ContentFormat;
  keyPoints: string[];
  interaction?: string;
  voiceSceneKeys: string[];
  factStatus: FactStatus;
  sourceRequired?: string;
};

export type V4StagePlan = {
  id: "welcome" | "company" | "culture" | "product" | "organization" | "certification";
  order: number;
  title: string;
  question: string;
  outcome: string;
  modules: V4Module[];
};

export const v4StagePlans: V4StagePlan[] = [
  {
    id: "welcome",
    order: 1,
    title: "欢迎加入",
    question: "为什么要完成这趟新人旅程？",
    outcome: "新人知道小瑶是谁、六关如何推进，并愿意点击开始。",
    modules: [
      {
        id: "welcome-hero",
        title: "欢迎来到长发小寨",
        purpose: "建立新人身份、陪伴关系和旅程期待。",
        format: "hero",
        keyPoints: ["新人姓名", "小瑶身份", "新人学习目的", "六关旅程预览"],
        interaction: "点击“好呀，一起出发！”完成第一关。",
        voiceSceneKeys: ["home_welcome", "journey_map"],
        factStatus: "verified",
        sourceRequired: "02 学习地图介绍需按 V4 六关结构重新录制。",
      },
    ],
  },
  {
    id: "company",
    order: 2,
    title: "认识长发小寨",
    question: "我加入的是一家什么样的公司？",
    outcome: "新人理解公司的业务全貌、成长逻辑、文化主张和协作结构。",
    modules: [
      {
        id: "company-overview",
        title: "公司全貌",
        purpose: "用视频与简明叙事建立公司整体认知。",
        format: "video",
        keyPoints: ["文化传承", "科技研发", "品牌创新"],
        voiceSceneKeys: ["company_history"],
        factStatus: "pendingReview",
        sourceRequired: "公司正式介绍、宣传片与品牌定位审核稿。",
      },
      {
        id: "company-timeline",
        title: "企业发展历程",
        purpose: "从文化起点理解品牌成长路径，不堆砌全部年份。",
        format: "timeline",
        keyPoints: ["品牌起源", "科研合作", "科技馆建设", "产品发展", "渠道成长", "未来规划"],
        voiceSceneKeys: ["company_history"],
        factStatus: "pendingReview",
        sourceRequired: "《长发小寨企业历程.doc》及正式荣誉清单。",
      },
      {
        id: "company-organization-map",
        title: "公司组织地图",
        purpose: "理解职能支持、销售增长和项目创新三类协作体系。",
        format: "map",
        keyPoints: ["职能支持体系", "销售增长体系", "项目创新体系", "遇到问题找谁"],
        interaction: "点击部门查看职责；按问题类型找到协作入口。",
        voiceSceneKeys: ["organization_intro"],
        factStatus: "pendingReview",
        sourceRequired: "最新版组织架构、部门负责人和部门职责。",
      },
      {
        id: "company-values",
        title: "我们相信什么",
        purpose: "把愿景、使命与价值观翻译成真实工作行为。",
        format: "scenario",
        keyPoints: ["先公后私", "真诚利他", "高效进取", "敢做敢当"],
        interaction: "2—4 个工作行为判断场景。",
        voiceSceneKeys: ["culture_match"],
        factStatus: "pendingReview",
        sourceRequired: "愿景、使命、价值观正式版本与行为案例。",
      },
    ],
  },
  {
    id: "culture",
    order: 3,
    title: "认识品牌与非遗文化",
    question: "我们的品牌根在哪里？",
    outcome: "新人从真实文化理解品牌来源，并记住发式、Logo、非遗技艺与科技馆的连接。",
    modules: [
      {
        id: "long-hair",
        title: "红瑶长发文化",
        purpose: "从真实人物与生活认识长发意义和传统发式。",
        format: "exhibition",
        keyPoints: ["红瑶文化", "长发意义", "闺中秀", "螺丝发", "乌龙盘发"],
        voiceSceneKeys: ["red_yao_culture"],
        factStatus: "pendingReview",
        sourceRequired: "审核通过的真实人物、生活场景、发式图片和文化说明。",
      },
      {
        id: "logo-story",
        title: "Logo 故事",
        purpose: "建立乌龙盘发轮廓与品牌 Logo 的核心视觉记忆。",
        format: "comparison",
        keyPoints: ["乌龙盘发", "轮廓提取", "品牌 Logo"],
        interaction: "点击提取发式轮廓，再显示品牌 Logo 视觉关联。",
        voiceSceneKeys: ["brand_logo_story"],
        factStatus: "pendingReview",
        sourceRequired: "正式乌龙盘发图片、Logo 规范和品牌视觉来源审核稿。",
      },
      {
        id: "rice-water",
        title: "非遗淘米水",
        purpose: "区分普通淘米水与传统发酵淘米水技艺。",
        format: "process",
        keyPoints: ["取米", "淘洗", "发酵", "检查", "提取"],
        interaction: "沿微缩工艺路径依次完成五个步骤。",
        voiceSceneKeys: ["rice_water"],
        factStatus: "verified",
      },
      {
        id: "technology-museum",
        title: "中国长发科技馆",
        purpose: "理解文化展示、技术转化、科研表达与品牌价值的关系。",
        format: "exhibition",
        keyPoints: ["文化展示", "技艺传播", "科研成果展示", "社会价值连接"],
        interaction: "点亮围绕科技馆的四类角色，并预留 VR / 全景入口。",
        voiceSceneKeys: ["technology_museum"],
        factStatus: "pendingReview",
        sourceRequired: "科技馆正式展陈、科研成果、社会项目和 VR 素材。",
      },
    ],
  },
  {
    id: "product",
    order: 4,
    title: "认识产品与核心技术",
    question: "为什么长发小寨能做这些产品？",
    outcome: "新人先识别问题发生在哪里，再理解产品逻辑、米水气技和正式产品体系。",
    modules: [
      {
        id: "consumer-problem",
        title: "消费者问题认知",
        purpose: "区分头皮、发根和发丝问题。",
        format: "comparison",
        keyPoints: ["头皮问题", "发根问题", "发丝问题", "掉发与断发"],
        interaction: "判断头发从发根脱落还是发丝中段断裂。",
        voiceSceneKeys: ["scalp_microbiome"],
        factStatus: "pendingReview",
        sourceRequired: "正式产品培训资料与审核后的科研表述。",
      },
      {
        id: "product-logic",
        title: "产品底层逻辑",
        purpose: "理解消费者问题如何进入产品定义、研发与验证。",
        format: "process",
        keyPoints: ["消费者问题", "问题位置", "产品机会", "产品定义", "研发设计", "市场验证", "持续优化"],
        voiceSceneKeys: ["scalp_microbiome"],
        factStatus: "pendingReview",
        sourceRequired: "公司正式产品开发流程。",
      },
      {
        id: "four-foundations",
        title: "米水气技",
        purpose: "认识原料、环境与技术共同构成的产品基础。",
        format: "exhibition",
        keyPoints: ["米：龙参米", "水：当地水源环境", "气：龙脊自然环境", "技：传统发酵智慧与现代技术"],
        voiceSceneKeys: ["longshen_rice", "spring_water", "four_barriers"],
        factStatus: "pendingReview",
        sourceRequired: "产地、原料、水源、环境和技术的正式证明及审核口径。",
      },
      {
        id: "product-system",
        title: "产品体系",
        purpose: "建立四类产品方向的基础认知。",
        format: "map",
        keyPoints: ["防脱固发", "头皮清洁", "分型养护", "沙龙奢护"],
        voiceSceneKeys: [],
        factStatus: "pendingReview",
        sourceRequired: "最新版产品体系与品牌口径。",
      },
      {
        id: "key-products",
        title: "重点产品认识",
        purpose: "理解核心、高端与修护产品分别解决什么问题。",
        format: "story",
        keyPoints: ["解决什么问题", "属于哪个体系", "核心价值"],
        voiceSceneKeys: [],
        factStatus: "pendingReview",
        sourceRequired: "《产品跑分表V3调整版》及正式产品资料。",
      },
      {
        id: "product-qa",
        title: "产品问答",
        purpose: "通过解释型问题检查新人是否真正理解产品逻辑。",
        format: "quiz",
        keyPoints: ["为什么掉发和断发不能用同一种方式解决"],
        interaction: "选择答案后展示解释，不做复杂游戏。",
        voiceSceneKeys: ["knowledge_quiz"],
        factStatus: "pendingReview",
        sourceRequired: "正式产品问答题库与答案解析。",
      },
    ],
  },
  {
    id: "organization",
    order: 5,
    title: "认识组织与基础制度",
    question: "我进入公司以后如何工作？",
    outcome: "新人知道自己的协作关系，并能在日常场景中选择正确流程。",
    modules: [
      {
        id: "organization-review",
        title: "组织协作复习",
        purpose: "确认我的部门、岗位、直属负责人和常用协作对象。",
        format: "map",
        keyPoints: ["我的部门", "我的岗位", "直属负责人", "跨部门协作"],
        voiceSceneKeys: ["organization_intro"],
        factStatus: "pendingReview",
        sourceRequired: "员工身份数据与最新组织架构。",
      },
      {
        id: "newcomer-day",
        title: "新人的一天",
        purpose: "把制度放进一整天的真实工作场景。",
        format: "scenario",
        keyPoints: ["上班打卡", "请假", "外出与出差", "报销", "加班", "异常处理"],
        interaction: "场景出现 → 用户判断 → 提交 → 小瑶反馈 → 展示正确处理方式。",
        voiceSceneKeys: ["rules_challenge", "compliance_game", "compliance_feedback", "attendance", "leave_and_outing", "expense_invoice"],
        factStatus: "pendingReview",
        sourceRequired: "现行考勤、请假、外出、出差、报销、加班制度。",
      },
      {
        id: "office-systems",
        title: "办公系统",
        purpose: "认识各系统负责的事项和正确入口。",
        format: "map",
        keyPoints: ["Moka", "OA", "企业微信", "云之家"],
        voiceSceneKeys: ["moka_intro"],
        factStatus: "pendingReview",
        sourceRequired: "现行系统入口、用途和操作手册。",
      },
      {
        id: "behavior-standard",
        title: "文化行为标准",
        purpose: "将价值观转化为工作行为判断。",
        format: "scenario",
        keyPoints: ["先公后私", "真诚利他", "高效进取", "敢做敢当"],
        interaction: "完成文化行为配对与合规判断练习。",
        voiceSceneKeys: ["culture_match"],
        factStatus: "pendingReview",
        sourceRequired: "价值观正式释义和公司审核案例。",
      },
    ],
  },
  {
    id: "certification",
    order: 6,
    title: "完成新人认证",
    question: "我是否已经具备开始正式工作的基础认知？",
    outcome: "完成整卷认证、识别薄弱项、点亮第六枚徽章并解锁学习天地。",
    modules: [
      {
        id: "journey-review",
        title: "六关回顾",
        purpose: "回看已获得的成长印记和待点亮的第六枚徽章。",
        format: "certification",
        keyPoints: ["六枚徽章", "前五关完成状态", "认证条件"],
        voiceSceneKeys: [],
        factStatus: "verified",
      },
      {
        id: "certification-exam",
        title: "新人认证考试",
        purpose: "覆盖公司文化、产品认知与制度流程三类基础内容。",
        format: "quiz",
        keyPoints: ["选择题", "判断题", "场景题", "整卷提交", "薄弱项分析", "错题回顾"],
        interaction: "整张试卷提交后统一出分；禁止逐题公布答案。",
        voiceSceneKeys: ["knowledge_quiz"],
        factStatus: "pendingReview",
        sourceRequired: "正式题库、答案、分数线、次数规则和证书字段。",
      },
      {
        id: "certification-result",
        title: "认证结果",
        purpose: "展示成绩、薄弱领域、复习入口和最终认证状态。",
        format: "certification",
        keyPoints: ["总成绩", "薄弱领域", "错题回顾", "再次认证", "新人证书"],
        voiceSceneKeys: ["onboarding_complete"],
        factStatus: "pendingReview",
        sourceRequired: "认证规则、证书模板和员工留痕要求。",
      },
      {
        id: "learning-world-unlock",
        title: "学习天地解锁",
        purpose: "从新人旅程进入持续成长空间。",
        format: "hero",
        keyPoints: ["产品深入", "企业文化", "岗位成长", "专业能力"],
        voiceSceneKeys: ["onboarding_complete"],
        factStatus: "verified",
      },
    ],
  },
];

export const v4ProductPrinciples = {
  positioning: "由小瑶陪伴新人完成的长发小寨认知成长旅程",
  forbidden: ["课程商城", "员工手册电子版", "儿童游戏", "PPT 式文字拼版", "大量同级卡片堆叠"],
  xiaoyaoRole: ["开场导游", "关键节点陪伴", "学习总结", "用户主动打开的问答助手"],
  interactionFlow: ["内容展示", "小瑶引导", "产品或知识问答", "完成并记录进度"],
};

export function getV4StagePlan(stageId: string) {
  return v4StagePlans.find((stage) => stage.id === stageId);
}
