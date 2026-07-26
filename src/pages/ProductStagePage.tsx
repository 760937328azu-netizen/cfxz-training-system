import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Sparkles,
  Droplets,
  FlaskConical,
  Feather,
  ShieldCheck,
  Users,
  HeartPulse,
  Flower2,
  Dna,
  HandHeart,
  Home,
} from "lucide-react";
import { useLearningProgress } from "../hooks/useLearningProgress";
import XiaoyaoDialogue from "../components/XiaoyaoDialogue";

type ProductStagePageProps = { onNavigate: (path: string) => void };

const SECTIONS = [
  { id: "entry", label: "本关入口" },
  { id: "scalp", label: "为什么先讲头皮" },
  { id: "foundation", label: "米水气技" },
  { id: "transition", label: "从淘米水到现代养护" },
  { id: "lines", label: "洗护养" },
  { id: "wash", label: "洗｜四个系列" },
  { id: "care", label: "护｜羽肽三相与稻米蛋白" },
  { id: "nourish", label: "养｜防脱赋活精华水" },
  { id: "faq", label: "产品基础问答" },
  { id: "summary", label: "本关总结" },
];

type ScalpNote = {
  id: "strand" | "scalp" | "root";
  title: string;
  tag: string;
  desc: string;
  top: string;
  line: { x1: number; y1: number; x2: number; y2: number };
};

const SCALP_NOTES: ScalpNote[] = [
  {
    id: "strand",
    title: "发丝",
    tag: "已经长出来的部分",
    desc: "干枯、毛躁、断裂、烫染损伤发生在这里。",
    top: "18%",
    line: { x1: 52, y1: 18, x2: 70, y2: 18 },
  },
  {
    id: "scalp",
    title: "头皮",
    tag: "基础环境",
    desc: "头油、头屑、头痒、敏感等问题首先发生在这里。",
    top: "50%",
    line: { x1: 58, y1: 50, x2: 70, y2: 50 },
  },
  {
    id: "root",
    title: "发根 / 毛囊",
    tag: "生长源头",
    desc: "掉发、发根脆弱、稀疏，从这里开始。",
    top: "82%",
    line: { x1: 52, y1: 82, x2: 70, y2: 82 },
  },
];

type XiaoYaoDialogType = "modal" | "bubble";

// ═══════════════════════════════════════════════════════════════════
// 第四关小瑶交互体系 — 已冻结 (FROZEN 2026-07-23)
// ═══════════════════════════════════════════════════════════════════
// 三级交互：
//   A级 (modal)  — 居中模态弹窗，锁定背景滚动。用于：本关入口、本关总结。
//   B级 (bubble) — 轻量气泡弹窗，不锁定滚动。用于：区段衔接引导。
//   C级 (corner) — 全局右下角常驻助手 (XiaoyaoCompanion)，由 App.tsx 统一管理。
//
// 4 个关键触发节点：
//   1. entry       — stage start     (A级 modal)  进入第四关
//   2. foundation  — scalp→米水气技  (B级 bubble)  从头皮认知进入米水气技
//   3. lines       — 淘米水→洗护养   (B级 bubble)  从现代养护进入产品体系
//   4. summary     — 本关总结        (A级 modal)  收尾 + 标记完成
//
// ⚠️ 冻结声明：以上 4 节点的位置、文案、交互层级已验收定稿。
//    后续任何修改必须经用户明确同意，禁止顺手调整。
// ═══════════════════════════════════════════════════════════════════

// 只包含有对话的 section ID，用于 dialog observer 过滤
// NOTE: 必须在 XIAOYAO_DIALOGS 定义之后使用，避免 TDZ 错误。

const XIAOYAO_DIALOGS: { sectionId: string; type: XiaoYaoDialogType; name: string; text: string; buttonLabel?: string }[] = [
  // 第 1 次｜进入第四关 — 正式居中对话
  {
    sectionId: "entry",
    type: "modal",
    name: "小瑶陪你开始",
    text: "这一关产品不少，但不用先背名字。先理解长发小寨为什么一直强调：头皮不老，头发才好。",
    buttonLabel: "从这里开始",
  },
  // 第 2 次｜从头皮认知进入米水气技 — 轻量气泡
  {
    sectionId: "foundation",
    type: "bubble",
    name: "小瑶帮你连接",
    text: "知道了头皮是基础，接下来看看——长发小寨用什么来建立自己的头皮养护逻辑？答案不是某一个成分，而是米、水、气、技共同孕育出的淘米水。",
    buttonLabel: "了解米水气技",
  },
  // 第 3 次｜从淘米水现代转化进入洗护养 — 轻量气泡
  {
    sectionId: "lines",
    type: "bubble",
    name: "小瑶帮你衔接",
    text: "米水气技 → 淘米水 → 现代研究与转化 → 头皮养护能力。到这里，终于可以开始认识具体产品了。先记住一个最简单的框架：洗、护、养。",
    buttonLabel: "认识产品体系",
  },
  // 第 4 次｜本关最终总结 — 正式居中对话
  {
    sectionId: "summary",
    type: "modal",
    name: "小瑶收个尾",
    text: "以后再看到一款产品，不需要先背名字。先问三个问题：它在解决什么问题？它属于洗、护还是养？它为什么这样设计？",
    buttonLabel: "完成第四关",
  },
];

// 必须在 XIAOYAO_DIALOGS 定义之后使用
const DIALOG_SECTION_IDS = XIAOYAO_DIALOGS.map((d) => d.sectionId);

type FoundationCardData = {
  id: string;
  title: string;
  subtitle: string;
  hook: string;
  buttonLabel: string;
  detail: { heading: string; paragraphs: string[]; takeaways: string[]; extra?: { heading: string; paragraphs: string[] }[] };
};

const FOUNDATION_CARDS: FoundationCardData[] = [
  {
    id: "mi",
    title: "米",
    subtitle: "龙参米",
    hook: "一粒好米，是淘米水的起点。来自龙脊梯田的龙参米，一年一季，拥有更长的生长周期，也承载着这片土地长期形成的农业智慧。",
    buttonLabel: "了解龙参米 →",
    detail: {
      heading: "为什么我们特别强调龙参米？",
      paragraphs: [
        "因为淘米水的第一步，就是米。",
        "龙脊梯田独特的自然环境，孕育了当地特色的龙参米。相比普通稻米，它拥有更长的生长周期，也承载着这片土地长期形成的农业智慧。",
        "对长发小寨来说，淘米水并不是随便取一碗米水进行发酵。从选择什么样的米开始，产品的底层逻辑就已经不同。",
      ],
      takeaways: [
        "「米」代表的不只是一种原料——它是这片土地给予我们的第一份养发馈赠。",
      ],
    },
  },
  {
    id: "shui",
    title: "水",
    subtitle: "龙脊山泉",
    hook: "好米，也需要好水。来自龙脊山脉的自然水源，为淘米水的形成提供了独特的水环境基础。",
    buttonLabel: "了解龙脊水源 →",
    detail: {
      heading: "为什么这里的水值得被单独讲？",
      paragraphs: [
        "水，是淘米水形成过程中不可缺少的一部分。",
        "龙胜当地拥有天然的山地水源环境。在长发小寨所使用的水质研究资料中，龙胜县江底乡城岭村白石组的 N1 数值达到 0.0005。",
        "这也是为什么我们一直相信：真正有差异的淘米水，不只取决于米，也取决于孕育它的水。",
        "对于长发小寨来说，水不是简单的产品基底——它是这片地域环境赋予淘米水的另一层独特条件。",
      ],
      takeaways: [
        "真正有差异的淘米水，不只取决于米，也取决于孕育它的水。",
      ],
    },
  },
  {
    id: "qi",
    title: "气",
    subtitle: "龙脊自然环境",
    hook: "有米、有水，还需要适合发酵发生的环境。龙脊地区独特的气候、温度、湿度与自然生态，共同参与着淘米水长期形成与发酵的过程。",
    buttonLabel: "了解自然环境 →",
    detail: {
      heading: "「气」，到底指的是什么？",
      paragraphs: [
        "这里的「气」，不是单纯指空气。它代表的是一整套自然环境：气候的变化、山间的温度、空气中的湿度，以及长期稳定形成的自然生态条件。",
        "发酵从来不是孤立发生的。同样的原料、同样的方法，换一个环境，结果也可能完全不同。",
        "所以在长发小寨看来：龙脊的自然环境，本身就是淘米水发酵智慧的一部分。它无法被装进一个瓶子里带走，却始终参与着这份传统智慧的形成。",
      ],
      takeaways: [
        "龙脊的自然环境，本身就是淘米水发酵智慧的一部分——无法被装进瓶子里，却始终参与其中。",
      ],
    },
  },
  {
    id: "ji",
    title: "技",
    subtitle: "红瑶发酵智慧",
    hook: "自然给予原料，而时间沉淀出方法。红瑶世代传承的淘米水发酵智慧，让米、水与自然环境真正发生连接。",
    buttonLabel: "了解红瑶技艺 →",
    detail: {
      heading: "从一碗淘米水，到今天的产品",
      paragraphs: [
        "真正让米、水、气产生变化的，是「技」。红瑶女性世代使用和传承淘米水养发，在漫长的生活实践中，逐渐形成了一套独特的淘米水发酵与使用方法。",
        "长发小寨所做的，不只是把这份传统保存下来。我们希望让传统智慧继续向前。",
        "从传统发酵经验，到今天持续进行的微生物研究、发酵研究与产品转化，我们不断探索：怎样让一碗来自生活的淘米水，成为今天更多人都能够使用的现代养发产品。",
        "所以，「技」连接着两个时代。一边，是红瑶流传至今的智慧。另一边，是长发小寨正在继续探索的现代养发科技。",
      ],
      takeaways: [
        "「技」连接着两个时代：红瑶流传至今的智慧 × 长发小寨正在探索的现代养发科技。",
      ],
    },
  },
];

type TransitionNode = {
  stage: number;
  title: string;
  desc: string;
  icon: typeof Flower2;
  highlight?: boolean;
};

const transitionMainline: TransitionNode[] = [
  {
    stage: 0,
    title: "米、水、气、技",
    desc: "四个条件共同存在",
    icon: Flower2,
  },
  {
    stage: 1,
    title: "发酵淘米水",
    desc: "来自自然与时间的馈赠",
    icon: Droplets,
    highlight: true,
  },
  {
    stage: 2,
    title: "现代研究与转化",
    desc: "红瑶智慧 → 现代微生物与发酵研究",
    icon: FlaskConical,
    highlight: true,
  },
];

const transitionBranches = [
  {
    id: "micro-ecology",
    title: "头皮微生态养护",
    desc: "关注头皮菌群平衡与健康状态",
    icon: HeartPulse,
    detail: "现代科学研究发现，头皮表面存在着复杂的微生物群落。当微生态失衡时，头油、头屑、头痒等问题更容易出现。长发小寨通过发酵研究，提取出有助于维护头皮微生态平衡的活性养护成分。",
  },
  {
    id: "barrier",
    title: "头皮屏障养护",
    desc: "强化头皮自身防御能力",
    icon: ShieldCheck,
    detail: "头皮屏障是头皮健康的第一道防线。现代人常见的头皮敏感、紧绷、易受刺激，往往与屏障功能减弱有关。从淘米水发酵研究中获得的活性成分，能够帮助养护和稳固头皮屏障。",
  },
  {
    id: "follicle",
    title: "发根毛囊养护",
    desc: "从生长源头呵护发根",
    icon: Flower2,
    detail: "头发从毛囊中生长出来，发根状态直接影响头发的强韧与密度。长发小寨将现代发酵活性成分与小分子肽技术结合，更精准地作用于头皮与发根区域，为毛囊营造良好的生长环境。",
  },
];

type ProductDetail = {
  name: string;
  oneLiner: string;
  fit: string[];
  special: string;
  usage: string;
  note?: string;
  image?: string;
};

const washSeriesDetail: { code: string; icon: typeof ShieldCheck; name: string; desc: string; products: ProductDetail[] }[] = [
  {
    code: "A",
    icon: ShieldCheck,
    name: "防脱固发系列",
    desc: "这一系列主要围绕头皮环境、发根状态和掉发困扰展开。其中最重要的一个认知是：同样是掉发，油性头皮与偏干、偏敏感的头皮，也可能需要不同的护理思路。",
    products: [
      {
        name: "控油防脱丰盈洗发露",
        oneLiner: "更适合油性头皮相关掉发问题的日常洗护产品。",
        fit: ["头皮容易出油", "洗头后很快又油", "发根容易扁塌", "同时伴随掉发困扰", "希望洗后头发更加清爽、蓬松"],
        special: "它不是只解决「油」，也不是只关注「掉发」。它的产品逻辑是：先关注头皮油脂和清爽状态，再兼顾发根养护与头发丰盈感。新人需要记住：油性头皮相关掉发，重点是「控油 + 防脱」一起考虑。",
        usage: "充分湿润头发和头皮后，取适量产品使用于头皮和发根区域。用指腹轻柔按摩头皮后，再以清水充分冲洗。根据个人头皮出油情况和日常洗发习惯进行清洁，不建议用指甲大力抓挠头皮。",
        note: "它属于「洗 → 防脱固发系列」。不要把它和控油蓬爽型普通清洁产品混为一类。它不仅关注油性头皮，也承担防脱固发方向的产品角色。",
        image: "/products/7-控油防脱.jpg",
      },
      {
        name: "固发防脱强韧洗发露",
        oneLiner: "更适合偏干、偏敏感头皮相关掉发问题的日常洗护产品。",
        fit: ["头皮偏干", "容易紧绷", "容易干痒", "头皮状态较敏感", "发根容易脆弱", "同时伴随掉发困扰"],
        special: "和控油防脱不同，它不会把所有掉发都简单归结为「头皮太油」。它更关注偏干、偏敏感头皮环境下的发根养护与长期固发护理。新人需要记住：控油防脱解决的是偏油方向；固发防脱强韧更偏向滋养和强韧方向。",
        usage: "充分湿润头发和头皮后，取适量产品使用于头皮。用指腹轻柔按摩，再用清水充分冲洗。日常使用时，应根据个人头皮状态选择适合自己的洗护产品，不需要因为「防脱」两个字而同时使用多款同类洗发产品。",
        image: "/products/6-固发防脱.jpg",
      },
    ],
  },
  {
    code: "B",
    icon: Droplets,
    name: "头皮清洁系列",
    desc: "头皮清洁不是「洗得越狠越干净」。有的人轻度出油，有的人重度出油，有的人同时伴随头屑、头痒。所以清洁也需要根据头皮状态继续分型。",
    products: [
      {
        name: "控油滋养型",
        oneLiner: "适合头皮容易出油，但发丝同时偏干的人群。",
        fit: ["中轻度头皮出油", "发根容易油", "发中、发尾却偏干", "发丝容易粗糙或打结", "不希望为了控油把头发越洗越涩"],
        special: "它解决的是很多人都会遇到的矛盾：头皮油，但头发并不一定也需要强力去油。因此它更强调在清洁头皮的同时，也兼顾整体洗后舒适度和发丝状态。",
        usage: "重点清洁头皮区域。冲洗泡沫时，让泡沫自然带过发丝即可，不需要反复大力揉搓发尾。如果发丝本身比较干燥，可在洗发后继续搭配「护」线产品进行护理。",
        image: "/products/3-控油滋养.jpg",
      },
      {
        name: "控油蓬爽型",
        oneLiner: "针对明显出油和头发容易贴头皮、扁塌的问题。",
        fit: ["头皮出油较明显", "发根容易贴头皮", "洗完头后蓬松感维持时间短", "频繁洗头仍容易感觉油腻"],
        special: "它更聚焦「油 + 塌」。有些消费者并没有明显掉发需求，他们首先需要解决的是头皮清爽和发根蓬松问题。",
        usage: "使用时重点清洁容易出油的头皮和发根区域。用指腹充分按摩后彻底冲洗。如果发尾比较干燥，应将头皮清洁和发丝护理分开处理，可在后续搭配护发产品。",
        image: "/products/1-控油蓬爽.jpg",
      },
      {
        name: "三益菌净屑洗发水 / 衡菌型",
        oneLiner: "主要关注头屑、头痒以及头皮状态反复的人群。",
        fit: ["容易出现头屑", "同时伴随头油", "头皮容易发痒", "头皮状态容易反复"],
        special: "它不只是普通意义上的「把头屑洗掉」。它所关注的是头屑出现时背后的头皮环境管理。看到头屑问题时，不能只关注已经掉下来的头屑，也要回到头皮本身去理解问题。",
        usage: "使用时将产品重点作用于头皮。以指腹轻柔按摩后充分冲洗。对于持续、严重或异常的头皮问题，产品护理不能代替专业判断。",
        image: "/products/2-去屑滋养.jpg",
      },
    ],
  },
  {
    code: "C",
    icon: Users,
    name: "分型养护系列",
    desc: "除了油头、干头和头屑，人群本身的头皮特征也存在差异。分型养护的意义，就是让产品进一步针对不同人群的真实头皮需求。",
    products: [
      {
        name: "男士专用",
        oneLiner: "围绕男性常见的头皮出油、头屑、头痒和异味等问题进行分型护理。",
        fit: ["头皮容易出油", "容易产生头屑", "容易头痒", "关注头皮清爽感和异味问题"],
        special: "它并不是简单地把包装换成「男士款」。它的产品思路是根据男性常见的头皮状态和使用需求，进行更有针对性的头皮护理。",
        usage: "按照正常洗发步骤使用，重点清洁头皮区域。根据个人出油频率和实际头皮状态安排洗发频率。",
        image: "/products/5-男士.jpg",
      },
      {
        name: "女士专用",
        oneLiner: "围绕女性较复杂的头皮和发丝状态进行分型护理。",
        fit: ["头皮状态较脆弱", "发丝容易干涩", "头油与头屑", "特殊阶段出现的头皮状态变化", "掉发等复合困扰"],
        special: "它同样不是简单的「女性包装」。重点在于女性的头皮和发丝问题有时会同时出现，因此需要兼顾不同护理需求。",
        usage: "根据个人头皮实际状态进行日常清洁。如果同时存在明显发丝干枯或受损问题，应继续搭配「护」线产品，而不是让洗发产品承担所有修护功能。",
        image: "/products/4-女士.jpg",
      },
    ],
  },
  {
    code: "D",
    icon: Sparkles,
    name: "沙龙奢护系列",
    desc: "沙龙奢护系列更进一步关注高阶头皮护理与烫染受损发丝之间的协同需求。姜乌和参乌最重要的区别不是「哪个更高级」，而是它们面对的头皮状态不同。",
    products: [
      {
        name: "姜乌洗头水",
        oneLiner: "更适合头皮偏油，同时存在烫染受损发丝问题的人群。",
        fit: ["头皮容易出油", "发根容易扁塌", "发尾却干枯、毛躁", "有烫染损伤", "容易出现分叉、断裂或发丝状态不佳"],
        special: "它面对的是一种典型的复合状态：上面油，下面干。既要关注头皮清爽，也要考虑已经受损的发丝状态。新人可以记成：偏油头皮 + 烫染受损 → 姜乌方向。",
        usage: "洗发时重点清洁头皮和发根。不要用力反复揉搓已经受损的发尾。洗发后，可以根据发丝损伤情况继续搭配羽肽三相发膜、护发精华油等发丝护理产品。",
        image: "/products/8-姜乌.jpg",
      },
      {
        name: "参乌洗头水",
        oneLiner: "更适合头皮偏干，同时存在烫染受损发丝问题的人群。",
        fit: ["头皮容易干燥、紧绷", "发丝枯黄、脆弱", "烫染后发质状态下降", "发尾容易干枯毛躁", "需要更偏滋养方向的洗护体验"],
        special: "它与姜乌的核心区别在于：姜乌更偏向油性头皮的高阶护理；参乌更偏向干性头皮的滋养护理。新人可以记成：偏干头皮 + 烫染受损 → 参乌方向。",
        usage: "正常湿发后使用于头皮和发根，并轻柔按摩。充分冲洗后，可根据发丝受损程度继续搭配发膜、稻米蛋白或护发精华油。",
        image: "/products/9-参乌.jpg",
      },
    ],
  },
];

const careProductsDetail: ProductDetail[] = [
  {
    name: "羽肽三相修护还原发膜",
    oneLiner: "针对受损发丝进行更集中、更深入的修护护理。",
    fit: ["烫染后的发丝受损", "干枯", "毛躁", "发丝粗糙", "容易打结", "缺乏顺滑感"],
    special: "相较于日常基础护理，发膜更偏向集中修护。它主要面对的是已经长出来、已经产生损伤的发丝。不要把它理解为头皮防脱产品。",
    usage: "洗发后，将头发多余水分轻轻挤掉。取适量产品均匀涂抹于发中至发尾，特别关注受损较明显的位置。停留适当时间后充分冲洗。原则上避免大量直接涂抹头皮。",
    image: "/products/29-羽肽三相修护还原发膜.jpg",
  },
  {
    name: "羽肽三相蓬爽修护发膜",
    oneLiner: "在修护受损发丝的同时，帮助头发保持蓬爽轻盈感。",
    fit: ["烫染后的发丝受损", "头发容易扁塌", "希望修护同时不加重发丝负担", "发丝偏细软"],
    special: "它同样属于羽肽三相发膜系列，但更侧重在修护的同时维持头发的蓬松感。适合发丝受损但又不喜欢过于滋润、厚重感的人群。",
    usage: "洗发后，将头发多余水分轻轻挤掉。取适量产品均匀涂抹于发中至发尾。停留适当时间后充分冲洗。避免大量直接涂抹头皮。",
    image: "/products/30-羽肽三相蓬爽修护发膜.jpg",
  },
  {
    name: "羽肽三相水光闪充发膜",
    oneLiner: "为干枯暗哑发丝注入水光感与闪充般的集中滋养。",
    fit: ["发丝严重干枯", "缺乏光泽", "毛躁明显", "发尾分叉", "需要集中补水与光泽提升"],
    special: "它在羽肽三相发膜系列中更偏向「水光感」方向。面对的是发丝干枯、暗哑且需要更强集中滋养的状态。不要把它和头皮防脱产品混为一类。",
    usage: "洗发后，将头发多余水分轻轻挤掉。取适量产品均匀涂抹于发中至发尾，特别关注受损较明显的位置。停留适当时间后充分冲洗。原则上避免大量直接涂抹头皮。",
    image: "/products/31-羽肽三相水光闪充发膜.jpg",
  },
  {
    name: "羽肽三相水光护发精华油（轻蓬型）",
    oneLiner: "轻肤感的日常发丝护理，帮助抚平毛躁、提升顺滑与光泽，同时尽量保持蓬松不压塌。",
    fit: ["发丝偏细软", "怕油怕塌", "发尾毛躁", "日常需要轻盈顺滑感", "希望护理后仍然蓬松"],
    special: "它属于「轻蓬型」精华油，质地更轻盈清爽，适合细软、易塌发质的日常护理。重点作用在已经长出来的发丝，而不是清洁或防脱头皮。",
    usage: "取少量产品于手掌搓匀后，重点涂抹于发中至发尾，可在吹发前或吹发后使用。少量多次即可，避免一次使用过多，也避免大量直接作用于头皮。",
    image: "/products/32-羽肽三相水光护发精华油.jpg",
  },
  {
    name: "羽肽三相强韧护发精华油（滋润型）",
    oneLiner: "滋润感更强的发丝护理，更适合染烫受损、偏干发质的集中顺滑与修护。",
    fit: ["染烫后发丝受损", "发质偏干偏粗", "毛躁明显", "发尾干涩打结", "希望更强滋润与顺滑"],
    special: "它属于「滋润型」精华油，质地更滋润，更适合染烫损伤、偏干发质。和轻蓬型是同系列的两种方向，可根据发质干湿与轻重需求选择。",
    usage: "取适量产品于手掌搓匀后，重点涂抹于发中至发尾受损较明显的位置，可在吹发前或吹发后使用。发质越粗越干可适当增加用量，仍需避免大量直接作用于头皮。",
    image: "/products/32-羽肽三相水光护发精华油.jpg",
  },
  {
    name: "稻米蛋白",
    oneLiner: "承担日常洗发后的基础柔顺与滋润护理。",
    fit: ["洗发后发丝容易打结", "发尾偏干", "希望改善柔顺度", "希望提升日常发丝触感"],
    special: "稻米蛋白承担的是基础、日常、高频的发丝护理。它与发膜可以处于不同的护理强度和使用场景。稻米蛋白主要护理发丝，不承担头皮防脱产品的角色。",
    usage: "洗发并冲净泡沫后，取适量产品涂抹于发中至发尾。轻柔梳理或按摩发丝后充分冲洗。使用时注意避开头皮。",
    image: "/products/11-养发乳.jpg",
  },
];

const nourishProductDetail: ProductDetail = {
  name: "防脱赋活精华水",
  oneLiner: "针对头皮与发根进行更聚焦的日常养护。",
  fit: ["发际线变化", "发缝逐渐明显", "头发看起来较稀疏", "发根较脆弱", "希望在日常洗发之外增加头皮养护"],
  special: "它不是洗发水，也不是护理发尾的护发产品。它在「洗、护、养」体系里的角色非常清楚：洗完以后，进一步养。重点更加聚焦于头皮与发根区域。",
  usage: "按照产品正式使用说明，将适量产品作用于需要护理的头皮区域。可以重点关注发际线、发缝、发根较薄弱区域，使用后用指腹轻柔按摩。不要把它涂抹在发尾，当成护发油使用。",
  image: "/products/12-防脱精华液.jpg",
};

const faqs = [
  {
    q: "为什么长发小寨先讲头皮？",
    a: "头皮是头发生长的基础环境。头油、头屑、头痒、敏感等问题首先发生在头皮，发根和毛囊状态也与头皮环境有关。先把头皮环境照顾好，才谈得上头发健康。",
  },
  {
    q: "米水气技和淘米水是什么关系？",
    a: "龙参米、当地水源、自然环境和传统发酵技艺，这四个条件共同孕育了淘米水。米水气技不是四个并列的成分卖点，而是淘米水形成的地域与技艺基础。",
  },
  {
    q: "洗、护、养分别负责什么？",
    a: "洗负责头皮清洁与基础洗护，下面还分四个系列；护主要照顾已经长出来的发丝，以羽肽三相发膜、羽肽三相护发精华油和稻米蛋白为重点；养是在洗和护之外，更精准地针对头皮和发根进行养护，代表产品是防脱赋活精华水。",
  },
  {
    q: "洗这一条线为什么还分四个系列？",
    a: "因为不同头皮状态需要不同的清洁与护理逻辑：防脱固发针对掉发问题，头皮清洁针对不同油脂和头屑状态，分型养护区分男女不同头皮特点，沙龙奢护面向高阶协同护理需求。",
  },
  {
    q: "羽肽三相属于洗、护还是养？",
    a: "羽肽三相发膜、羽肽三相护发精华油和稻米蛋白都属于「护」。它们主要解决发丝受损、干枯、毛躁等问题，针对的是已经长出来的发丝，而不是头皮或发根。",
  },
  {
    q: "防脱赋活精华水为什么不属于洗发产品？",
    a: "防脱赋活精华水不是洗发水，它在产品体系中的角色是在日常洗护之外，更进一步针对头皮和发根进行精准养护。所以它单独归入「养」这条线，而不是埋在洗发系列里。",
  },
];

function ProductBottle({ tone = "warm" }: { tone?: "warm" | "cool" | "rose" }) {
  return (
    <svg viewBox="0 0 80 116" className={`prod-bottle prod-bottle--${tone}`} aria-hidden="true">
      <rect x="31" y="3" width="18" height="13" rx="3" className="bottle-cap" />
      <path
        d="M28 16 h24 v10 q0 5 6 9 v66 q0 9 -9 9 h-18 q-9 0 -9 -9 v-66 q6 -4 6 -9 z"
        className="bottle-body"
      />
      <rect x="33" y="48" width="14" height="34" rx="3" className="bottle-label" />
    </svg>
  );
}

function ProductDetailBlocks({ p }: { p: ProductDetail }) {
  return (
    <div className="prod-card-detail">
      <div className="prod-block">
        <span className="prod-block-label">适合什么情况</span>
        <ul className="prod-list">
          {p.fit.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </div>
      <div className="prod-block">
        <span className="prod-block-label">特别之处</span>
        <p className="zh-body" data-typography-check>{p.special}</p>
      </div>
      <div className="prod-block">
        <span className="prod-block-label">怎么使用</span>
        <p className="zh-body" data-typography-check>{p.usage}</p>
      </div>
      {p.note && (
        <div className="prod-block">
          <span className="prod-block-label">认识它时要注意</span>
          <p className="zh-body" data-typography-check>{p.note}</p>
        </div>
      )}
    </div>
  );
}

function ProductDetailCard({ p, tone = "warm", expanded = false }: { p: ProductDetail; tone?: "warm" | "cool" | "rose"; expanded?: boolean }) {
  const [open, setOpen] = useState(expanded);
  if (expanded) {
    return (
      <article className="prod-card prod-card--expanded">
        <ProductDetailBlocks p={p} />
      </article>
    );
  }
  return (
    <article className="prod-card">
      <div className="prod-card-visual" aria-hidden="true">
        {p.image ? (
          <img src={p.image} alt="" className="prod-card-img" loading="lazy" />
        ) : (
          <ProductBottle tone={tone} />
        )}
      </div>
      <div className="prod-card-main">
        <header className="prod-card-head">
          <h5 className="zh-title" data-typography-check>{p.name}</h5>
          <p className="prod-card-oneliner" data-typography-check>{p.oneLiner}</p>
        </header>
        <button type="button" className="prod-card-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "收起详情" : "查看详情"}
          <ChevronDown size={15} className={open ? "is-open" : ""} />
        </button>
        {open && <ProductDetailBlocks p={p} />}
      </div>
    </article>
  );
}

function XiaoYaoModal({
  open,
  name,
  text,
  buttonLabel,
  onClose,
  onAction,
}: {
  open: boolean;
  name: string;
  text: string;
  buttonLabel?: string;
  onClose: () => void;
  onAction?: () => void;
}) {
  if (!open) return null;
  return createPortal(
    <div className="xy-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="xy-modal-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="xy-modal-close" onClick={onClose} aria-label="关闭对话">×</button>
        <div className="xy-modal-body">
          <div className="xy-modal-figure">
            <img src="/xiaoyao/transparent/1.png" alt="小瑶" className="xy-modal-avatar" />
          </div>
          <div className="xy-modal-content">
            <p className="xy-modal-name">{name}</p>
            <p className="xy-modal-text" data-typography-check>{text}</p>
            <div className="xy-modal-actions">
              {buttonLabel ? (
                <button type="button" className="xy-modal-btn" onClick={onAction || onClose}>
                  {buttonLabel}<ArrowRight size={14} />
                </button>
              ) : (
                <button type="button" className="xy-modal-btn xy-modal-btn--secondary" onClick={onClose}>
                  知道了
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function XiaoYaoBubble({
  open,
  name,
  text,
  buttonLabel,
  onClose,
}: {
  open: boolean;
  name: string;
  text: string;
  buttonLabel?: string;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="xy-bubble">
      <button type="button" className="xy-bubble-close" onClick={onClose} aria-label="关闭提示">×</button>
      <div className="xy-bubble-body">
        <img src="/xiaoyao/transparent/1.png" alt="小瑶" className="xy-bubble-avatar" />
        <div className="xy-bubble-content">
          <p className="xy-bubble-name">{name}</p>
          <p className="xy-bubble-text" data-typography-check>{text}</p>
          {buttonLabel && (
            <button type="button" className="xy-bubble-btn" onClick={onClose}>
              {buttonLabel}<ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FoundationDetailDrawer({
  card,
  onClose,
}: {
  card: FoundationCardData;
  onClose: () => void;
}) {
  const [showExtra, setShowExtra] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const root = document.querySelector(".ambient-page") as HTMLElement | null;
    if (!root) return;
    const original = root.style.overflow;
    root.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      root.style.overflow = original || "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!card) return null;
  return createPortal(
    <div className="fk-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="fk-drawer-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="fk-drawer-close" onClick={onClose} aria-label="关闭">×</button>
        <div className="fk-drawer-header">
          <span className="fk-drawer-title">{card.title}</span>
          <span className="fk-drawer-subtitle">{card.subtitle}</span>
        </div>
        <h4 className="fk-drawer-heading" data-typography-check>{card.detail.heading}</h4>
        {card.detail.paragraphs.map((p, i) => (
          <p key={i} className="zh-body fk-drawer-para" data-typography-check>{p}</p>
        ))}
        {card.detail.extra?.map((sec, si) => (
          <div key={si} className="fk-detail-extra">
            <button
              type="button"
              className="fk-detail-extra-toggle"
              onClick={() => setShowExtra((v) => ({ ...v, [si]: !v[si] }))}
            >
              {sec.heading} {showExtra[si] ? "▲" : "▼"}
            </button>
            {showExtra[si] && sec.paragraphs.map((ep, ei) => (
              <p key={ei} className="zh-body fk-detail-para fk-detail-extra-para" data-typography-check>{ep}</p>
            ))}
          </div>
        ))}
        <div className="fk-detail-takeaway">
          {card.detail.takeaways.map((t, i) => (
            <p key={i} data-typography-check>★ {t}</p>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}

function FoundationCard({
  card,
  isExplored,
  onExplore,
  onOpen,
  positionClass,
}: {
  card: FoundationCardData;
  isExplored: boolean;
  onExplore: () => void;
  onOpen: () => void;
  positionClass: string;
}) {
  return (
    <div className={`fk-float-card ${positionClass} ${isExplored ? "is-explored" : ""}`}>
      <div className="fk-float-header">
        <span className="fk-float-title">{card.title}</span>
        <span className="fk-float-subtitle">{card.subtitle}</span>
      </div>
      <p className="fk-float-hook" data-typography-check>{card.hook}</p>
      <button
        type="button"
        className="fk-float-btn"
        onClick={() => {
          onExplore();
          onOpen();
        }}
      >
        {card.buttonLabel}
      </button>
    </div>
  );
}

export default function ProductStagePage({ onNavigate }: ProductStagePageProps) {
  const { progress, completeProductStage } = useLearningProgress();
  const isProductDone = progress.product.completed;
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [currentDialogId, setCurrentDialogId] = useState<string | null>(null);
  const triggeredRef = useRef<Set<string>>(new Set());
  const closedByUserRef = useRef<Set<string>>(new Set());
  const scrollingProgrammaticallyRef = useRef(false);
  const [exploredCards, setExploredCards] = useState<Set<string>>(new Set());
  const [showConvergence, setShowConvergence] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);
  const [activeBranchId, setActiveBranchId] = useState<string | null>(null);

  const handleExploreCard = (cardId: string) => {
    setExploredCards((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      if (next.size >= 4 && !showConvergence) {
        setTimeout(() => setShowConvergence(true), 600);
      }
      return next;
    });
  };

  const currentDialog = XIAOYAO_DIALOGS.find((d) => d.sectionId === currentDialogId);

  // Lock ambient-page scroll only while a modal-type XiaoYao dialog is open.
  const isModalOpen = currentDialog?.type === "modal";
  useEffect(() => {
    const root = document.querySelector(".ambient-page") as HTMLElement | null;
    if (!root) return;
    const original = root.style.overflow;
    root.style.overflow = isModalOpen ? "hidden" : original || "";
    return () => {
      root.style.overflow = original || "";
    };
  }, [isModalOpen]);

  // Observe all sections for TOC highlight, but only trigger XiaoYao dialogs
  // for the 4 frozen key nodes (entry, foundation, lines, summary).
  useEffect(() => {
    const root = document.querySelector(".ambient-page");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          // Always update TOC active state
          setActiveId(id);
          // Only trigger dialog for sections that have a XiaoYao dialog defined
          if (!DIALOG_SECTION_IDS.includes(id)) return;
          setTimeout(() => {
            if (scrollingProgrammaticallyRef.current) return;
            if (triggeredRef.current.has(id) || closedByUserRef.current.has(id)) return;
            triggeredRef.current.add(id);
            setCurrentDialogId(id);
          }, 500);
        });
      },
      { root, rootMargin: "-40% 0px -45% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    scrollingProgrammaticallyRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => { scrollingProgrammaticallyRef.current = false; }, 1000);
  };

  const handleClose = () => {
    if (currentDialogId) {
      closedByUserRef.current.add(currentDialogId);
    }
    setCurrentDialogId(null);
  };

  const handleAction = () => {
    // Bubble type: just close, no chaining.
    if (currentDialog?.type === "bubble") {
      handleClose();
      return;
    }
    // Modal type: entry → scroll to scalp, summary → mark complete + scroll to completion.
    if (currentDialogId === "entry") {
      handleClose();
      scrollTo("scalp");
    } else if (currentDialogId === "summary") {
      completeProductStage();
      handleClose();
      // Scroll to the completion section at the bottom
      setTimeout(() => {
        const el = document.getElementById("product-completion-section");
        if (el) {
          scrollingProgrammaticallyRef.current = true;
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => { scrollingProgrammaticallyRef.current = false; }, 1000);
        }
      }, 200);
    } else {
      handleClose();
    }
  };

  return (
    <div className="content-enter pb-12" data-testid="product-stage-page">
      <button
        onClick={() => onNavigate("home")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-brand"
      >
        <ArrowLeft size={16} />返回成长地图
      </button>

      <div className="mb-6">
        <XiaoyaoDialogue
          title="小瑶带你认识产品体系"
          sceneKey="product_technology"
          layout="horizontal"
          fullBody
          paragraphs={[
            "前面我们已经知道长发小寨从哪里来。",
            "但作为公司的一员，还有一个问题一定要弄明白。我们到底在做什么产品？",
            "为什么面对不同的头发和头皮问题，要使用不同的解决思路？",
            "这一关，我们不会让你背产品目录。小瑶会带你从真实问题出发，一步一步理解产品背后的逻辑。",
          ]}
        />
      </div>

      <div className="product-layout">
        <aside className="product-toc">
          <p className="px-1 text-xs font-semibold uppercase tracking-[.14em] text-text-tertiary">本关路线</p>
          <nav>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`product-toc-item ${activeId === s.id ? "is-active" : ""}`}
              >
                <strong className="zh-title">{s.label}</strong>
              </button>
            ))}
          </nav>
        </aside>

        <main className="product-stage">
          {/* 1 · 本关入口 — 产品总理念 · Hero */}
          <section id="entry" className="product-hero-v2">
            <div className="product-hero-v2-eyebrow"><Sparkles size={14} />第四关 · 产品与核心技术</div>
            <h1 className="product-hero-v2-belief">头皮不老，头发才好。</h1>
            <p className="product-hero-v2-lead">
              长发小寨的产品，不是从"要做哪一瓶洗发水"开始，而是先回到一个更基础的问题：
              <strong>什么样的头皮环境，才能让头发拥有更好的生长基础？</strong>
            </p>
          </section>

          {/* 2 · 为什么先讲头皮 · 结构视觉 */}
          <section id="scalp" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Why scalp first</p>
                <h3 data-typography-check className="zh-title">为什么产品长期围绕头皮展开</h3>
              </div>
              <span>头皮 · 发根 · 发丝</span>
            </div>
            <p data-typography-check className="zh-body product-section-intro">
              头皮是头发生长的基础环境。头油、头屑、头痒、敏感等问题首先发生在头皮；发根和毛囊状态与头皮环境有关；已经长出来的发丝，则属于另一类护理对象。
            </p>

            <div className="scalp-viz">
              <div className="scalp-viz-diagram">
                <img
                  src="/assets/scalp-environment.png"
                  alt="头皮环境结构图"
                  className="scalp-viz-img"
                  draggable={false}
                />
                <svg
                  className="scalp-viz-lines"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  {SCALP_NOTES.map((n) => (
                    <line
                      key={n.id}
                      x1={n.line.x1}
                      y1={n.line.y1}
                      x2={n.line.x2}
                      y2={n.line.y2}
                      className={`sv-line sv-line--${n.id}`}
                    />
                  ))}
                </svg>
                {SCALP_NOTES.map((n) => (
                  <div
                    key={n.id}
                    className={`scalp-label scalp-label--${n.id}`}
                    style={{ top: n.top }}
                  >
                    <strong className="zh-title">{n.title}</strong>
                    <span>{n.tag}</span>
                    <p className="zh-body" data-typography-check>{n.desc}</p>
                  </div>
                ))}
              </div>
              <div className="scalp-viz-notes">
                {SCALP_NOTES.map((n) => (
                  <div key={n.id} className={`scalp-note scalp-note--${n.id}`}>
                    <strong className="zh-title">{n.title}</strong>
                    <span>{n.tag}</span>
                    <p className="zh-body" data-typography-check>{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3 · 米水气技 → 淘米水 · 汇聚视觉 */}
          <section id="foundation" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Product foundation</p>
                <h3 data-typography-check className="zh-title">米、水、气、技，共同孕育一碗好淘米水</h3>
              </div>
              <span>米 · 水 · 气 · 技</span>
            </div>
            <p data-typography-check className="zh-body product-section-intro">
              长发小寨相信，一碗真正有生命力的淘米水，从来不只是"米加水"这么简单。它来自一方土地长期孕育出的原料、水源、气候与技艺。米、水、气、技，缺一不可。
            </p>

            <XiaoYaoBubble
              open={!!(currentDialog && currentDialog.sectionId === "foundation" && currentDialog.type === "bubble")}
              name={currentDialog?.name || ""}
              text={currentDialog?.text || ""}
              buttonLabel={currentDialog?.buttonLabel}
              onClose={handleClose}
            />

            <div className="foundation-scene-wrap">
              <img
                src="/stages/foundation-scene-original.png"
                alt="米、气、水、技共同孕育淘米水"
                className="foundation-scene-img"
                draggable={false}
              />
              {FOUNDATION_CARDS.map((card) => (
                <FoundationCard
                  key={card.id}
                  card={card}
                  isExplored={exploredCards.has(card.id)}
                  onExplore={() => handleExploreCard(card.id)}
                  onOpen={() => setActiveDetailId(card.id)}
                  positionClass={`fk-pos-${card.id}`}
                />
              ))}
            </div>

            {activeDetailId && (
              <FoundationDetailDrawer
                card={FOUNDATION_CARDS.find((c) => c.id === activeDetailId)!}
                onClose={() => setActiveDetailId(null)}
              />
            )}

            {showConvergence && (
              <div className="fk-convergence">
                <h4 className="fk-conv-heading" data-typography-check>米、水、气、技，最终汇聚成一碗淘米水</h4>
                <div className="fk-convergence-items">
                  <span className="fk-conv-item">龙参米</span>
                  <span className="fk-conv-plus">＋</span>
                  <span className="fk-conv-item">龙脊水源</span>
                  <span className="fk-conv-plus">＋</span>
                  <span className="fk-conv-item">自然气候</span>
                  <span className="fk-conv-plus">＋</span>
                  <span className="fk-conv-item">红瑶技艺</span>
                </div>
                <div className="fk-conv-arrow">↓</div>
                <div className="fk-conv-result">淘米水</div>
                <div className="fk-convergence-text">
                  <p data-typography-check>米、水、气、技共同作用，孕育出红瑶世代传承的这碗发酵淘米水。</p>
                  <p data-typography-check>下一步，是这碗传统淘米水，如何一步步走向现代研究与养发产品。</p>
                </div>
                <button type="button" className="fk-conv-btn" onClick={() => scrollTo("transition")}>
                  继续探索淘米水的现代养护力量<ArrowRight size={15} />
                </button>
              </div>
            )}
          </section>

          {/* 4 · 从淘米水到现代养护 */}
          <section id="transition" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">From tradition to modern R&amp;D</p>
                <h3 data-typography-check className="zh-title">从一碗淘米水，到今天的头皮养护力量</h3>
              </div>
              <span>关键过渡</span>
            </div>
            <p data-typography-check className="zh-body product-section-intro">
              传统智慧让我们找到方向。现代科技，则让我们继续看见淘米水里更多值得被研究的可能。从发酵过程，到活性物质，再到头皮微生态研究，长发小寨正在不断把来自红瑶的养发智慧，转化为今天真正能够被更多人使用的产品能力。
            </p>

            <div className="transition-v3-flow">
              {/* 主轴 */}
              <div className="tv3-mainline">
                {transitionMainline.map((node, index) => {
                  const Icon = node.icon;
                  return (
                    <div key={node.stage} className="tv3-mainline-item">
                      <div className={`tv3-node ${node.highlight ? "is-highlight" : ""}`}>
                        <span className="tv3-node-icon"><Icon size={18} /></span>
                        <div className="tv3-node-text">
                          <strong className="zh-title" data-typography-check>{node.title}</strong>
                          <span className="tv3-node-desc" data-typography-check>{node.desc}</span>
                        </div>
                      </div>
                      {index < transitionMainline.length - 1 && (
                        <div className="tv3-connector">↓</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 分支引出 */}
              <div className="tv3-branch-intro">
                <div className="tv3-branch-stem" />
                <div className="tv3-branch-label">
                  <Dna size={15} />
                  <span>活性益生菌 / 二裂酵母 / 小分子活性肽</span>
                </div>
                <div className="tv3-branch-stem" />
              </div>

              {/* 三类养护方向（横向轻卡） */}
              <div className="tv3-branches">
                {transitionBranches.map((branch) => {
                  const Icon = branch.icon;
                  const isActive = activeBranchId === branch.id;
                  return (
                    <button
                      key={branch.id}
                      type="button"
                      className={`tv3-branch-card ${isActive ? "is-active" : ""}`}
                      onClick={() => setActiveBranchId(isActive ? null : branch.id)}
                    >
                      <span className="tv3-branch-icon"><Icon size={20} /></span>
                      <strong className="zh-title">{branch.title}</strong>
                      <span className="tv3-branch-desc">{branch.desc}</span>
                      <span className="tv3-branch-hint">{isActive ? "点击收起" : "点击查看"}</span>
                    </button>
                  );
                })}
              </div>

              {/* 展开的分支详情 */}
              {activeBranchId && (
                <div className="tv3-branch-detail">
                  <p className="zh-body" data-typography-check>
                    {transitionBranches.find((b) => b.id === activeBranchId)?.detail}
                  </p>
                </div>
              )}

              {/* 汇聚 */}
              <div className="tv3-converge">
                <div className="tv3-converge-stem" />
                <div className="tv3-converge-node">
                  <span className="tv3-converge-title">洗护养产品体系</span>
                  <span className="tv3-converge-desc">传统智慧被转化为今天真正可用的产品能力</span>
                </div>
              </div>
            </div>
          </section>

          {/* 5 · 当前主打三条线 · 系统视觉 */}
          <section id="lines" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Product lines</p>
                <h3 data-typography-check className="zh-title">当前主打三条线：洗 · 护 · 养</h3>
              </div>
              <span>产品体系总览</span>
            </div>

            <XiaoYaoBubble
              open={!!(currentDialog && currentDialog.sectionId === "lines" && currentDialog.type === "bubble")}
              name={currentDialog?.name || ""}
              text={currentDialog?.text || ""}
              buttonLabel={currentDialog?.buttonLabel}
              onClose={handleClose}
            />

            <div className="lines-v2">
              <article className="line-entry line-entry--wash">
                <span className="line-entry-icon"><Droplets size={24} /></span>
                <strong className="zh-title line-entry-title">洗</strong>
                <p className="line-entry-sub">头皮清洁与分型护理</p>
                <span className="line-entry-tag">4 个系列</span>
              </article>
              <article className="line-entry line-entry--care">
                <span className="line-entry-icon"><Feather size={24} /></span>
                <strong className="zh-title line-entry-title">护</strong>
                <p className="line-entry-sub">已经长出来的发丝护理</p>
                <span className="line-entry-tag">发膜 · 精华油 · 稻米蛋白</span>
              </article>
              <article className="line-entry line-entry--nourish">
                <span className="line-entry-icon"><HandHeart size={24} /></span>
                <strong className="zh-title line-entry-title">养</strong>
                <p className="line-entry-sub">进一步头皮与发根养护</p>
                <span className="line-entry-tag">防脱赋活精华水</span>
              </article>
            </div>
          </section>

          {/* 6 · 洗｜四个系列 · 系统分支 */}
          <section id="wash" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Wash · 4 series</p>
                <h3 data-typography-check className="zh-title">「洗」下面的四个系列</h3>
              </div>
              <span>防脱 · 清洁 · 分型 · 奢护</span>
            </div>
            <p data-typography-check className="zh-body product-section-intro">
              「洗」是长发小寨当前产品体系中的重要基础。但洗头并不只是把头发洗干净。不同的头皮状态、掉发问题和护理需求，需要不同的产品解决路径。因此，在「洗」这一条产品线下，目前形成了防脱固发、头皮清洁、分型养护和沙龙奢护四个系列。
            </p>

            <div className="wash-system">
              <div className="wash-system-trunk">
                <span className="wash-trunk-icon"><Droplets size={20} /></span>
                <div>
                  <strong className="zh-title">洗</strong>
                  <span className="wash-trunk-sub">四条分支，对应不同头皮状态</span>
                </div>
              </div>
              <div className="wash-system-branches">
                {washSeriesDetail.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <div key={cat.name} className="wash-branch">
                      <div className="wash-branch-head">
                        <span className="wash-branch-icon"><Icon size={18} /></span>
                        <h4 data-typography-check className="zh-title">{cat.name}</h4>
                      </div>
                      <p data-typography-check className="zh-body wash-branch-desc">{cat.desc}</p>
                      {cat.code === "A" && (
                        <p className="wash-branch-note" data-typography-check>偏干、偏敏感相关掉发 → 固发防脱强韧；偏油、扁塌相关掉发 → 控油防脱丰盈。先看头皮状态，再选方向。</p>
                      )}
                      {cat.code === "D" && (
                        <p className="wash-branch-note" data-typography-check>姜乌：偏油头皮 + 烫染受损；参乌：偏干头皮 + 烫染受损。一个偏油，一个偏干。</p>
                      )}
                      <div className="prod-grid">
                        {cat.products.map((p, i) => (
                          <ProductDetailCard key={p.name} p={p} tone={i % 3 === 0 ? "warm" : i % 3 === 1 ? "cool" : "rose"} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* 7 · 护｜羽肽三相与稻米蛋白 · 强度递进 */}
          <section id="care" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Care</p>
                <h3 data-typography-check className="zh-title">「护」：羽肽三相发膜系列 + 羽肽三相护发精华油系列 + 稻米蛋白</h3>
              </div>
              <span>发丝护理</span>
            </div>
            <p data-typography-check className="zh-body product-section-intro">
              「护」和「养头皮」不是同一件事。当头发已经从头皮中长出来以后，干枯、毛躁、打结和烫染损伤，就需要进入发丝护理逻辑。接下来，我们把视线从头皮移到已经长出来的头发——这些问题的护理，由「护」这条线承担。
            </p>

            <div className="care-ladder">
              <article className="care-rung care-rung--base">
                <div className="care-rung-head"><span className="care-rung-step">基础日常</span><strong className="zh-title">稻米蛋白</strong></div>
                <ProductDetailCard p={careProductsDetail[5]} tone="rose" />
              </article>
              <article className="care-rung care-rung--mid">
                <div className="care-rung-head"><span className="care-rung-step">集中修护</span><strong className="zh-title">羽肽三相修护还原发膜</strong></div>
                <ProductDetailCard p={careProductsDetail[0]} tone="warm" />
              </article>
              <article className="care-rung care-rung--mid">
                <div className="care-rung-head"><span className="care-rung-step">蓬爽修护</span><strong className="zh-title">羽肽三相蓬爽修护发膜</strong></div>
                <ProductDetailCard p={careProductsDetail[1]} tone="cool" />
              </article>
              <article className="care-rung care-rung--mid">
                <div className="care-rung-head"><span className="care-rung-step">水光闪充</span><strong className="zh-title">羽肽三相水光闪充发膜</strong></div>
                <ProductDetailCard p={careProductsDetail[2]} tone="warm" />
              </article>
              <article className="care-rung care-rung--light">
                <div className="care-rung-head"><span className="care-rung-step">日常顺滑 · 轻蓬型</span><strong className="zh-title">羽肽三相水光护发精华油（轻蓬型）</strong></div>
                <ProductDetailCard p={careProductsDetail[3]} tone="cool" />
              </article>
              <article className="care-rung care-rung--light">
                <div className="care-rung-head"><span className="care-rung-step">集中滋润 · 滋润型</span><strong className="zh-title">羽肽三相强韧护发精华油（滋润型）</strong></div>
                <ProductDetailCard p={careProductsDetail[4]} tone="warm" />
              </article>
            </div>
          </section>

          {/* 8 · 养｜防脱赋活精华水 · 单独突出 */}
          <section id="nourish" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Nourish</p>
                <h3 data-typography-check className="zh-title">「养」：防脱赋活精华水</h3>
              </div>
              <span>精准头皮养护</span>
            </div>
            <p data-typography-check className="zh-body product-section-intro">
              洗完了，也护好了，那「养」又是什么？养是把注意力重新放回头皮和发根——在日常洗护之外，进一步针对它们进行更聚焦的护理。
            </p>

            <div className="nourish-v2">
              <div className="nourish-v2-visual">
                <img src="/products/12-防脱精华液.jpg" alt="防脱赋活精华水" className="nourish-v2-img" />
              </div>
              <div className="nourish-v2-body">
                <span className="nourish-v2-tag">不属于洗发系列</span>
                <h4 className="zh-title nourish-v2-title">养 · 防脱赋活精华水</h4>
                <p className="zh-body nourish-v2-lead" data-typography-check>它不是洗发水，也不是护发油，是洗护之外的第三步精准养护，重点更聚焦头皮与发根。</p>
                <ProductDetailCard p={nourishProductDetail} tone="warm" expanded />
              </div>
            </div>
          </section>

          {/* 9 · 产品基础问答 */}
          <section id="faq" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Stage Q &amp; A</p>
                <h3 data-typography-check className="zh-title">产品基础问答</h3>
              </div>
              <span>答题为了理解</span>
            </div>

            <div className="product-faq">
              {faqs.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <div key={item.q} className={`product-faq-item ${isOpen ? "is-open" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="product-faq-q"
                      aria-expanded={isOpen}
                    >
                      <span className="product-faq-index">Q{index + 1}</span>
                      <span className="product-faq-question zh-title" data-typography-check>{item.q}</span>
                      <ChevronDown size={18} className="product-faq-chevron" />
                    </button>
                    {isOpen && (
                      <div className="product-faq-a">
                        <p data-typography-check className="zh-body">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="faq-outro">
              <p className="zh-body" data-typography-check>
                如果你现在能分清：什么问题先看头皮，什么产品属于洗、护、养，米水气技为什么会一路连接到今天的产品——那这一关最重要的东西，你已经掌握了。
              </p>
              <button type="button" className="app-button-primary" onClick={() => scrollTo("summary")}>
                查看本关总结<ArrowRight size={15} />
              </button>
            </div>
          </section>

          {/* 10 · 本关总结 */}
          <section id="summary" className="product-section">
            <div className="culture-section-heading">
              <div>
                <p className="culture-kicker">Stage summary</p>
                <h3 data-typography-check className="zh-title">本关，请记住这三件事</h3>
              </div>
              <span>本关总结</span>
            </div>

            <div className="product-summary-final">
              <div className="product-summary-final-card">
                <span className="product-summary-final-num">1</span>
                <h4 data-typography-check className="zh-title">头皮不老，头发才好。</h4>
                <p data-typography-check className="zh-body">长发小寨的产品逻辑，首先从头皮环境出发。</p>
              </div>
              <div className="product-summary-final-card">
                <span className="product-summary-final-num">2</span>
                <h4 data-typography-check className="zh-title">米水气技共同孕育淘米水。</h4>
                <p data-typography-check className="zh-body">龙参米、当地水源、自然环境和传统技艺，共同形成淘米水的独特基础，再通过现代研发继续提取和转化。</p>
              </div>
              <div className="product-summary-final-card">
                <span className="product-summary-final-num">3</span>
                <h4 data-typography-check className="zh-title">当前产品主线是洗、护、养。</h4>
                <p data-typography-check className="zh-body">洗下面有四个系列。护以羽肽三相发膜、羽肽三相护发精华油和稻米蛋白为重点。养以防脱赋活精华水为重点。</p>
              </div>
            </div>
          </section>
        </main>
      </div>

      <XiaoYaoModal
        open={!!(currentDialog && currentDialog.type === "modal")}
        name={currentDialog?.name || ""}
        text={currentDialog?.text || ""}
        buttonLabel={currentDialog?.buttonLabel}
        onClose={handleClose}
        onAction={handleAction}
      />

      <section id="product-completion-section" className={`product-completion ${isProductDone ? "is-done" : ""}`}>
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-brand/12 blur-2xl" />
          <img className="relative h-24 w-24 object-contain" src="/stages/stage-04-org.png" alt="第四关徽章" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="culture-kicker">{isProductDone ? "Stage completed" : "Stage content ready"}</p>
          <h2 data-typography-check className="zh-title mt-2 text-2xl font-semibold text-text-primary">
            {isProductDone ? "第四关已完成" : "第四关内容已完整承载"}
          </h2>
          <p data-typography-check className="zh-body mt-2 text-sm leading-7 text-text-secondary">
            {isProductDone
              ? "恭喜完成第四关！点击下方按钮进入第五关——认识组织与基础制度。"
              : "看完所有内容后，回到小瑶的总结对话，点击「完成第四关」即可标记本关完成。"}
          </p>
        </div>
        {isProductDone ? (
          <div className="flex shrink-0 flex-col items-stretch gap-2">
            <button
              onClick={() => onNavigate("stage/organization")}
              className="app-button-primary flex items-center justify-center gap-2"
            >
              进入第五关：认识组织与基础制度<ArrowRight size={15} />
            </button>
            <button
              onClick={() => onNavigate("home")}
              className="flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-brand"
            >
              <Home size={15} />返回成长地图
            </button>
          </div>
        ) : (
          <button onClick={() => onNavigate("home")} className="app-button-primary shrink-0">
            返回地图<ArrowRight size={15} />
          </button>
        )}
      </section>
    </div>
  );
}
