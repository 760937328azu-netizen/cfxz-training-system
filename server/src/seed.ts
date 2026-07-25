/**
 * 种子数据初始化
 * 运行方式: npm run seed
 *
 * 1. 创建初始管理员账号（从 .env 读取）
 * 2. 导入认证题库（从前端 certificationData.ts 对应的题目）
 */

import "dotenv/config";
import { prisma } from "./lib/prisma";
import { hashPassword } from "./lib/auth";

async function main() {
  console.log("\n┌──────────────────────────────────────────────┐");
  console.log("│  开始初始化种子数据...                         │");
  console.log("└──────────────────────────────────────────────┘\n");

  // ── 1. 创建初始管理员 ──
  const adminName = process.env.SEED_ADMIN_NAME || "超级管理员";
  const adminUsername = process.env.SEED_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe!2026";

  // 生产环境安全检查：禁止使用默认密码
  if (process.env.NODE_ENV === "production" && adminPassword === "ChangeMe!2026") {
    console.error("  ❌ 生产环境禁止使用默认密码！请在 .env 中设置 SEED_ADMIN_PASSWORD");
    process.exit(1);
  }

  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: adminUsername },
  });

  if (existingAdmin) {
    console.log(`  [跳过] 管理员 "${adminUsername}" 已存在`);
  } else {
    const passwordHash = await hashPassword(adminPassword);
    await prisma.adminUser.create({
      data: {
        name: adminName,
        username: adminUsername,
        passwordHash,
        role: "super",
        status: "active",
      },
    });
    console.log(`  [创建] 管理员账号: ${adminUsername} / ${adminPassword}`);
    console.log(`         ⚠️  请上线前修改此密码！`);
  }

  // ── 2. 导入认证题库 ──
  const existingBank = await prisma.questionBank.findFirst({
    where: { version: "v1.0" },
  });

  if (existingBank) {
    console.log("  [跳过] 题库 v1.0 已存在");
  } else {
    const questions = CERTIFICATION_QUESTIONS.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctIndex: q.answer,
      category: q.area,
      explanation: q.explanation,
    }));

    await prisma.questionBank.create({
      data: {
        version: "v1.0",
        questions: questions as any,
        isActive: true,
      },
    });
    console.log(`  [创建] 题库 v1.0（${questions.length} 题）`);
  }

  console.log("\n┌──────────────────────────────────────────────┐");
  console.log("│  种子数据初始化完成！                           │");
  console.log("└──────────────────────────────────────────────┘\n");
}

// ── 认证题库数据（从前端 certificationData.ts 同步） ──
const CERTIFICATION_QUESTIONS = [
  // Stage 1: 欢迎加入 (4题)
  {
    id: "cert-welcome-01",
    question: "新人成长旅程共有几个站点需要按顺序完成？",
    options: ["3 站", "4 站", "5 站", "6 站"],
    answer: 3,
    area: "新人旅程规则",
    explanation: "新人成长旅程共设 6 站：欢迎加入、认识长发小寨、品牌与非遗文化、产品与核心技术、组织与制度、入职认证。",
  },
  {
    id: "cert-welcome-02",
    question: "小瑶在旅程中扮演的角色是什么？",
    options: ["公司吉祥物", "人力资源部人才发展小组的成长伙伴", "课程讲师", "绩效考核员"],
    answer: 1,
    area: "新人旅程规则",
    explanation: "小瑶是人力资源部人才发展小组为每一位新伙伴准备的成长伙伴，陪伴新人认识长发小寨。",
  },
  {
    id: "cert-welcome-03",
    question: "新人成长地图的站点必须先完成前一关，才能解锁下一关。",
    options: ["对", "错"],
    answer: 0,
    area: "新人旅程规则",
    explanation: "站点采用顺序解锁机制，当前站点未完成前，下一站点不可进入。",
  },
  {
    id: "cert-welcome-04",
    question: "完成入职认证后，「学习天地」模块才会正式解锁。",
    options: ["对", "错"],
    answer: 0,
    area: "新人旅程规则",
    explanation: "学习天地在新人完成六站探索并获得入职认证后才正式解锁，认证前仅作为预告区域展示。",
  },
  // Stage 2: 认识长发小寨 (4题)
  {
    id: "cert-company-01",
    question: "长发小寨的品牌源头来自哪里？",
    options: ["城市里的美发沙龙", "红瑶长发文化与非遗淘米水技艺", "海外进口护发技术", "传统中医理论"],
    answer: 1,
    area: "品牌文化",
    explanation: "长发小寨的品牌根植于红瑶长发文化，核心技艺源自非遗淘米水发酵智慧。",
  },
  {
    id: "cert-company-02",
    question: "以下哪些部门属于「职能与专业支持」区域？",
    options: [
      "财务部、人力资源部、行政部、研发部",
      "抖音运营部、商务部、客服部",
      "小红书、视频号运营部、私域部",
      "传统电商部、分销渠道、线下事业部",
    ],
    answer: 0,
    area: "品牌文化",
    explanation: "职能与专业支持区域包括财务部、人力资源部、行政部、AI 数据部、采购部、研发部、市场部、产品部、会员社群部、科学传播等。",
  },
  {
    id: "cert-company-03",
    question: "长发小寨中国长发科技馆的意义，仅是把文化和技术分别摆进展柜。",
    options: ["对", "错"],
    answer: 1,
    area: "品牌文化",
    explanation: "科技馆的意义是建立公众能够理解的连接：文化从哪里来、技艺怎样传承、科研成果如何说明、品牌如何承担社会价值。",
  },
  {
    id: "cert-company-04",
    question: "市场部在长发小寨主要承担哪些工作方向？",
    options: [
      "品牌、文案策划、视觉设计",
      "抖音直播、小红书投放、私域运营",
      "产品研发、采购、科学传播",
      "财务核算、人力招聘、行政支持",
    ],
    answer: 0,
    area: "品牌文化",
    explanation: "市场部让品牌、产品和故事被更多消费者看见、理解和记住，主要工作方向包括品牌、文案策划和视觉设计。",
  },
  // Stage 3: 品牌与非遗文化 (4题)
  {
    id: "cert-culture-01",
    question: "长发小寨品牌 Logo 的设计灵感来源于哪种红瑶传统发式？",
    options: ["闺中秀", "螺丝发", "乌龙盘发", "凤凰髻"],
    answer: 2,
    area: "红瑶非遗",
    explanation: "长发小寨 Logo 的设计灵感来源于红瑶传统乌龙盘发的轮廓。",
  },
  {
    id: "cert-culture-02",
    question: "普通淘米水与传统发酵淘米水技艺的核心区别在于什么？",
    options: ["淘米次数不同", "是否经过完整、可传承的发酵技艺处理", "使用的大米品种不同", "水温不同"],
    answer: 1,
    area: "红瑶非遗",
    explanation: "核心区别不在原料名称，而在是否经过完整的取米、淘洗、发酵、检查、提取等技艺过程。",
  },
  {
    id: "cert-culture-03",
    question: "红瑶传统发式中，以下哪个不是用来记录女性不同人生阶段变化的？",
    options: ["闺中秀", "螺丝发", "乌龙盘发", "少女辫"],
    answer: 3,
    area: "红瑶非遗",
    explanation: "红瑶传统发式包括闺中秀、螺丝发、乌龙盘发等，分别对应不同人生阶段。",
  },
  {
    id: "cert-culture-04",
    question: "淘米水非遗技艺的核心步骤包括：取米、淘洗、发酵、检查、提取。",
    options: ["对", "错"],
    answer: 0,
    area: "红瑶非遗",
    explanation: "传统发酵淘米水技艺的核心流程正是：取米 → 淘洗 → 发酵 → 检查 → 提取。",
  },
  // Stage 4: 产品与核心技术 (4题)
  {
    id: "cert-product-01",
    question: "长发小寨产品体系中最基础的框架是什么？",
    options: ["洗、护、养", "前、中、后", "早、中、晚", "内、外、护"],
    answer: 0,
    area: "产品认知",
    explanation: "产品体系的基础框架是「洗、护、养」：洗（清洁）、护（护理）、养（养护）。",
  },
  {
    id: "cert-product-02",
    question: "「米水气技」中的「气」指的是什么？",
    options: ["空气流动", "龙脊自然环境", "蒸发的气体", "瓶内压力"],
    answer: 1,
    area: "产品认知",
    explanation: '"气"指龙脊自然环境，包括气候、海拔、植被等自然条件对产品原料的影响。',
  },
  {
    id: "cert-product-03",
    question: "掉发问题发生在发根，断发问题发生在发丝中段。",
    options: ["对", "错"],
    answer: 0,
    area: "产品认知",
    explanation: "掉发是从发根脱落，断发是发丝中段断裂，两者发生的位置和原因不同。",
  },
  {
    id: "cert-product-04",
    question: "认识一款产品时，最应该先问的三个问题是什么？",
    options: [
      "价格、包装、代言人",
      "它在解决什么问题、属于洗/护/养、为什么这样设计",
      "销量、口碑、渠道",
      "成分、香味、颜色",
    ],
    answer: 1,
    area: "产品认知",
    explanation: "先看问题发生在哪里，再理解产品为什么这样设计，属于洗、护还是养。",
  },
  // Stage 5: 组织与制度 (4题)
  {
    id: "cert-rules-01",
    question: "忘记打卡时，正确的做法是什么？",
    options: ["请同事代打卡", "按公司流程及时补卡并说明情况", "直接忽略，月底再说", "在微信群里通知主管即可"],
    answer: 1,
    area: "制度流程",
    explanation: "考勤记录需要真实，忘记打卡应及时按流程补卡并同步情况。",
  },
  {
    id: "cert-rules-02",
    question: "报销前最重要的准备工作是什么？",
    options: ["完整票据、审批与业务说明", "只提供付款截图", "月底统一口头说明", "找领导签字即可"],
    answer: 0,
    area: "制度流程",
    explanation: "报销需要真实、合规、票据完整，并保留必要审批和业务说明。",
  },
  {
    id: "cert-rules-03",
    question: "需要请假时，应在同事群里说一声即可，不需要走正式流程。",
    options: ["对", "错"],
    answer: 1,
    area: "制度流程",
    explanation: "请假应提前走正式流程，并让直接负责人知道工作安排，不能只在群里说一声。",
  },
  {
    id: "cert-rules-04",
    question: "以下哪项行为符合「真诚利他」的价值观？",
    options: ["只完成自己分内工作，不管他人", "主动帮助伙伴解决问题", "把工作成果归功于自己", "遇到协作请求委婉拒绝"],
    answer: 1,
    area: "公司价值观",
    explanation: '"真诚利他"的含义是主动帮助伙伴解决问题，是在团队中建立信任与协作的基础。',
  },
];

main()
  .catch((err) => {
    console.error("种子数据初始化失败:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
