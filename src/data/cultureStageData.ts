export type CultureFact = {
  label: string;
  detail: string;
};

export type CultureExhibit = {
  id: "long-hair" | "logo-story" | "rice-water" | "technology-museum";
  order: number;
  eyebrow: string;
  title: string;
  intro: string;
  story: string;
  sceneKey: string;
  remember: string;
  facts: CultureFact[];
};

export const cultureExhibits: CultureExhibit[] = [
  {
    id: "long-hair",
    order: 1,
    eyebrow: "真实人物 · 真实生活",
    title: "红瑶女性与长发文化",
    intro: "从真实人物与生活出发，理解红瑶长发文化，再看它如何与品牌建立连接。",
    story: "长发小寨不是创造了一段文化故事，而是从真实存在的红瑶长发文化中寻找品牌根源。在红瑶文化中，头发不仅是一种外在形象，也记录着女性不同人生阶段的变化。认识这些信息，是为了理解品牌从哪里来，并尊重真实人物、生活与文化。",
    sceneKey: "red_yao_culture",
    remember: "文化不是品牌装饰，而是我们知道自己从哪里来的方式。",
    facts: [
      { label: "真实文化", detail: "从真实人物与生活出发，认识红瑶女性与长发之间的文化联系。" },
      { label: "人生阶段", detail: "传统发式记录着女性不同人生阶段的变化。" },
      { label: "品牌连接", detail: "从乌龙盘发轮廓出发，理解品牌 Logo 的灵感。" },
    ],
  },
  {
    id: "logo-story",
    order: 2,
    eyebrow: "视觉来源 · 品牌记忆",
    title: "Logo 故事",
    intro: "从乌龙盘发的轮廓出发，发现品牌视觉背后的文化来源。",
    story: "品牌视觉不是凭空出现的装饰。乌龙盘发是红瑶传统发式中具有代表性的文化符号，长发小寨 Logo 的设计灵感也来源于这一传统发式。通过轮廓提取与视觉对照，新人可以直观看见一个品牌符号如何从文化中生长出来。",
    sceneKey: "brand_logo_story",
    remember: "长发小寨 Logo 的设计灵感来源于红瑶传统乌龙盘发。",
    facts: [
      { label: "文化起点", detail: "品牌符号的理解从红瑶传统乌龙盘发开始。" },
      { label: "轮廓提取", detail: "观察乌龙盘发与品牌 Logo 的视觉联系。" },
      { label: "品牌记忆", detail: "一个从真实文化中生长出来的品牌符号，更能帮助新人理解品牌根源。" },
    ],
  },
  {
    id: "rice-water",
    order: 3,
    eyebrow: "生活智慧 · 技艺传承",
    title: "淘米水非遗技艺",
    intro: "理解普通淘米水与传统发酵淘米水技艺之间的区别。",
    story: "普通淘米水只是生活中淘洗大米后留下的水，传统发酵淘米水则包含连续的工艺过程。新人这一站需要记住的不是未经审核的功效结论，而是两者在“是否经过完整技艺处理”上的本质区别。只有先理解工艺路径，后续才能正确理解产品研发如何从传统经验中寻找启发。",
    sceneKey: "rice_water",
    remember: "关键不只是“淘米水”三个字，而是完整、可被传承的发酵技艺。",
    facts: [
      { label: "基本区分", detail: "普通淘米水不等同于传统发酵淘米水技艺。" },
      { label: "工艺路径", detail: "本阶段按“取米、淘洗、发酵、检查、提取”建立基础流程认知。" },
      { label: "科研与功效", detail: "传统发酵技艺之外，长发小寨也继续研究淘米水中的发酵过程与活性成分，将传统智慧与现代研发结合。" },
    ],
  },
  {
    id: "technology-museum",
    order: 4,
    eyebrow: "文化保存 · 当代表达",
    title: "中国长发科技馆",
    intro: "理解科技馆为什么不仅是展陈空间，也是文化、技艺、科研与社会价值的连接点。",
    story: "科技馆的意义，不是把文化和技术分别摆进展柜，而是建立一条公众能够理解的连接：文化从哪里来，技艺怎样被传承，科研成果如何被说明，品牌又如何承担更长期的社会价值。具体展陈成果与科研数据仍需正式资料确认，但这四类角色构成了科技馆的基本认知框架。",
    sceneKey: "technology_museum",
    remember: "科技馆让文化被看见、技艺被传播，也为科研成果提供清晰的表达窗口。",
    facts: [
      { label: "文化展示", detail: "用可观看、可理解的方式呈现红瑶长发文化。" },
      { label: "技艺传播", detail: "让公众看懂传统发酵淘米水技艺。" },
      { label: "科研与社会价值", detail: "展陈、社会项目与科研数据待正式资料确认。" },
    ],
  },
];

export const cultureStageVoicePlan = {
  active: ["red_yao_culture", "brand_logo_story", "rice_water", "technology_museum"],
  pendingReview: ["museum_entry", "longshen_rice", "spring_water", "four_barriers", "scalp_microbiome", "company_history"],
  needsRecording: ["journey_map"],
};
