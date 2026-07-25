/**
 * 员工手册问答引擎
 * 基于本地知识库的全文检索 + 意图匹配 + 模板回答
 *
 * 回答规则：
 * 1. 先直接回答问题，不要客套话
 * 2. 区分"确定内容"和"需要确认的内容"
 * 3. 涉及岗位差异时先确认身份
 * 4. 不代替审批人作决定
 * 5. 不回答员工隐私和他人信息
 * 6. 每个回答保留来源信息
 * 7. 不显示内部技术信息
 */

import kbData from "../data/handbook-kb.json";

export interface KBSection {
  title: string;
  level: number;
  content: string;
}

export interface QAResult {
  /** 回答正文 */
  answer: string;
  /** 来源章节 */
  source: string;
  /** 是否需要先确认用户信息（部门/岗位） */
  needsUserInfo: boolean;
  /** 追问内容 */
  followUp?: string;
  /** 是否为"无法回答" */
  unknown: boolean;
}

const HANDBOOK_TITLE = "长发小寨员工手册（2026年1月1日版）";
const UNKNOWN_REPLY =
  "我在当前员工手册中暂时没有找到明确说明，因此不能直接替你判断。建议联系对应部门确认：制度、考勤及员工关系问题可咨询人力资源部；报销与发票问题可咨询财务部。";

const sections: KBSection[] = (kbData as any).sections || [];

/** 获取来源引用 */
function cite(sectionTitle: string): string {
  return `参考：${HANDBOOK_TITLE} · ${sectionTitle}`;
}

/** 查找包含关键词的章节 */
function findSections(keywords: string[]): KBSection[] {
  return sections
    .map((s) => {
      let score = 0;
      const titleLower = s.title.toLowerCase();
      const contentLower = s.content.toLowerCase();
      for (const kw of keywords) {
        const kwLower = kw.toLowerCase();
        if (titleLower.includes(kwLower)) score += 5;
        if (contentLower.includes(kwLower)) score += 1;
      }
      return { section: s, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.section);
}

/** 获取章节内容 */
function getSectionContent(keywords: string[]): { content: string; title: string } | null {
  const matched = findSections(keywords);
  if (matched.length === 0) return null;
  // 取分数最高的章节
  const best = matched[0];
  if (best.content.length === 0) {
    // 如果最佳匹配内容为空，尝试取下一个有内容的
    const withContent = matched.find((s) => s.content.length > 0);
    if (withContent) return { content: withContent.content, title: withContent.title };
    return null;
  }
  return { content: best.content, title: best.title };
}

/**
 * 从大章节内容中提取特定子段落。
 * "流程管理制度"章节包含多个子流程（入职/转正/异动/离职/报销/请假），
 * 需要按子标题切割，只返回用户关心的部分。
 */
const SUB_SECTION_HEADINGS = [
  "\u5165\u804C\u6D41\u7A0B",       // 入职流程
  "\u57F9\u8BAD\u7BA1\u7406\u6D41\u7A0B", // 培训管理流程
  "\u8F6C\u6B63\u6D41\u7A0B",       // 转正流程
  "\u5F02\u52A8\u7BA1\u7406\u6D41\u7A0B", // 异动管理流程
  "\u79BB\u804C\u6D41\u7A0B",       // 离职流程
  "\u62A5\u9500\u6D41\u7A0B",       // 报销流程
  "\u8BF7\u5047\u6D41\u7A0B",       // 请假流程
];

function extractSubSection(fullContent: string, targetHeading: string): string {
  // Check if content contains multiple sub-headings
  const headingPositions = SUB_SECTION_HEADINGS
    .map((h) => ({ heading: h, pos: fullContent.indexOf(h) }))
    .filter((x) => x.pos >= 0)
    .sort((a, b) => a.pos - b.pos);

  // If only one or no sub-headings found, return full content
  if (headingPositions.length <= 1) return fullContent;

  // Find the target heading
  const target = headingPositions.find((x) => x.heading === targetHeading);
  if (!target) return fullContent;

  // Find the next heading after the target
  const targetIdx = headingPositions.indexOf(target);
  const nextHeading = targetIdx < headingPositions.length - 1
    ? headingPositions[targetIdx + 1]
    : null;

  const startPos = target.pos;
  const endPos = nextHeading ? nextHeading.pos : fullContent.length;

  return fullContent.substring(startPos, endPos).trim();
}

// ============================================================
// 意图匹配器
// ============================================================

interface IntentMatcher {
  id: string;
  keywords: string[];
  /** 如果匹配到，返回 QAResult；返回 null 表示不匹配 */
  match: (question: string) => QAResult | null;
}

// --- 报销流程 ---
const reimbursementMatcher: IntentMatcher = {
  id: "reimbursement",
  keywords: ["报销", "发票", "报销流程", "报销凭证"],
  match(question: string): QAResult | null {
    if (!["报销", "发票", "凭证"].some((kw) => question.includes(kw))) return null;
    // 如果问的是审批人，交给 approverMatcher 处理
    if (question.includes("审批") || question.includes("批准") || question.includes("找谁")) return null;
    const data = getSectionContent(["报销流程", "报销", "凭证", "OA", "财务"]);
    if (!data) return unknown();
    const content = extractSubSection(data.content, "\u62A5\u9500\u6D41\u7A0B"); // 报销流程
    return {
      answer: `报销流程如下：\n${content}\n\n如需了解具体审批人或报销标准，建议联系财务部确认。`,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 请假流程 ---
const leaveMatcher: IntentMatcher = {
  id: "leave",
  keywords: ["请假", "休假", "事假", "病假", "调休"],
  match(question: string): QAResult | null {
    if (!["请假", "休假", "事假", "病假", "调休", "假"].some((kw) => question.includes(kw))) return null;
    // 如果问的是扣工资，交给 salaryMatcher 处理
    if (question.includes("扣工资") || question.includes("扣薪") || question.includes("扣多少钱")) return null;

    // 如果问的是某种具体假期类型的天数
    if (question.includes("多少") && (question.includes("假") || question.includes("天"))) {
      // 需要确认是哪种假期
      return {
        answer:
          "员工手册中包含多种假期类型（事假、病假、婚假、吊唁假、产假、年假等），每种假期的天数和条件不同。请问您想了解哪种假期的规定？",
        source: cite("考勤与假期管理 · 休假与请假"),
        needsUserInfo: true,
        followUp: "请问您想了解哪种假期（事假/病假/婚假/吊唁假/产假/年假）？",
        unknown: false,
      };
    }

    // 请假流程
    const flowData = getSectionContent(["请假流程"]);
    const leaveData = getSectionContent(["休假与请假", "请假", "病假", "婚假"]);

    let answer = "";
    let sourceTitle = "考勤与假期管理";

    if (flowData) {
      const subContent = extractSubSection(flowData.content, "\u8BF7\u5047\u6D41\u7A0B"); // 请假流程
      answer += `请假流程：\n${subContent}\n\n`;
      sourceTitle = flowData.title;
    }
    if (leaveData && leaveData.title.includes("休假")) {
      answer += `请假详细规定：\n${leaveData.content}`;
      sourceTitle = leaveData.title;
    } else if (!flowData) {
      answer += "请在企业微信中向直属领导和HRBP提前申请请假。";
    }

    return {
      answer: answer.trim(),
      source: cite(sourceTitle),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 离职流程 ---
const resignationMatcher: IntentMatcher = {
  id: "resignation",
  keywords: ["离职", "辞职", "离开公司"],
  match(question: string): QAResult | null {
    if (!["离职", "辞职"].some((kw) => question.includes(kw))) return null;

    // 离职后还能回来吗 — 无法回答
    if (question.includes("回来") || question.includes("重新入职") || question.includes("再入职")) {
      return unknown("员工手册中未说明离职后重新入职的相关规定，建议咨询人力资源部确认。");
    }

    const data = getSectionContent(["离职流程", "离职"]);
    if (!data) return unknown();
    const content = extractSubSection(data.content, "\u79BB\u804C\u6D41\u7A0B"); // 离职流程
    return {
      answer: `离职流程如下：\n${content}`,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 入职流程 ---
const onboardingMatcher: IntentMatcher = {
  id: "onboarding",
  keywords: ["入职", "新员工", "报到", "入职材料", "入职准备"],
  match(question: string): QAResult | null {
    if (!["入职", "新员工", "报到"].some((kw) => question.includes(kw))) return null;
    // 排除"离职后重新入职"类问题
    if (question.includes("离职") && (question.includes("回来") || question.includes("重新") || question.includes("再"))) return null;

    const data = getSectionContent(["入职流程", "入职", "入职提交资料"]);
    if (!data) return unknown();
    const content = extractSubSection(data.content, "\u5165\u804C\u6D41\u7A0B"); // 入职流程
    return {
      answer: `入职相关流程和所需材料：\n${content}`,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 上班时间/考勤时间（需要确认部门） ---
const workHoursMatcher: IntentMatcher = {
  id: "workHours",
  keywords: ["上班时间", "下班时间", "几点上班", "几点下班", "工作时间", "打卡时间", "考勤时间"],
  match(question: string): QAResult | null {
    const triggers = ["上班时间", "下班时间", "几点上班", "几点下班", "工作时间", "打卡", "考勤时间", "几点"];
    if (!triggers.some((kw) => question.includes(kw))) return null;
    // 排除"迟到"类问题
    if (question.includes("迟到") || question.includes("漏卡") || question.includes("补卡")) return null;

    const data = getSectionContent(["工作时间及打卡规则", "工作时间", "打卡"]);
    if (!data) return unknown();

    return {
      answer:
        "员工手册中规定了两种工作时间：\n\n" +
        "1. 标准工作制（大多数部门）：\n" +
        data.content +
        "\n\n由于电商推广部、电商运营部、抖音客服部、天猫客服部等按排班出勤，打卡次数和工作时间有所不同。" +
        "请问您属于哪个部门？我可以为您提供更准确的信息。",
      source: cite(data.title),
      needsUserInfo: true,
      followUp: "请问您属于哪个部门？（如：电商推广部/电商运营部/抖音客服部/天猫客服部/其他部门）",
      unknown: false,
    };
  },
};

// --- 迟到/漏卡/补卡 ---
const lateMatcher: IntentMatcher = {
  id: "late",
  keywords: ["迟到", "漏卡", "补卡", "早退", "全勤奖"],
  match(question: string): QAResult | null {
    if (!["迟到", "漏卡", "补卡", "早退", "全勤"].some((kw) => question.includes(kw))) return null;

    // "我今天迟到了能补卡吗" — 需要看具体情况，不能直接回答
    if (question.includes("能补卡") || question.includes("可以补卡") || question.includes("能不能补")) {
      const data = getSectionContent(["漏卡", "迟到", "补卡"]);
      return {
        answer:
          "是否能补卡取决于您的补卡次数和迟到情况。根据员工手册规定：\n\n" +
          (data?.content || "") +
          "\n\n建议您先确认本月已使用的补卡次数和迟到次数，再判断是否可以补卡。如有疑问可咨询人力资源部。",
        source: cite(data?.title || "考勤与假期管理"),
        needsUserInfo: false,
        unknown: false,
      };
    }

    const data = getSectionContent(["漏卡", "迟到", "补卡", "全勤奖"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 薪酬/工资 ---
const salaryMatcher: IntentMatcher = {
  id: "salary",
  keywords: ["薪酬", "工资", "发薪", "薪资", "薪水", "月薪"],
  match(question: string): QAResult | null {
    if (!["薪酬", "工资", "发薪", "薪资", "薪水", "月薪", "扣工资"].some((kw) => question.includes(kw))) return null;

    // \u9690\u79C1\u68C0\u67E5: \u8BE2\u95EE\u4ED6\u4EBA\u5DE5\u8D44\u5C5E\u4E8E\u5458\u5DE5\u9690\u79C1\uFF0C\u4E0D\u5E94\u56DE\u7B54
    // Privacy check: asking about someone else's salary
    const privacyPatterns = [
      "\u522B\u4EBA\u7684",  // 别人的
      "\u4ED6\u4EBA\u7684",  // 他人的
      "\u5979\u7684",        // 她的
      "\u4ED6\u7684",        // 他的
    ];
    // Common Chinese surnames (Unicode escaped to avoid parser issues)
    const surnames = "\u5F20\u738B\u674E\u8D75\u5218\u9648\u6768\u9EC4\u5468\u5434\u5F90\u5B59\u80E1\u6731\u9AD8\u6797\u4F55\u90ED\u9A6C\u7F57\u6881\u5B8B\u90D1\u8C22\u97E9\u5510\u51AF\u4E8E\u8463\u8427\u7A0B\u66F9\u8881\u9093\u8BB8\u5085\u6C88\u66FE\u5F6D\u5415\u82CF\u5362\u848B\u8521\u8D3E\u4E01\u9B4F\u859B\u53F6\u95EB\u4F59\u6F58\u675C\u6234\u590F\u949F\u6C6A\u7530\u4EFB\u59DC\u8303\u65B9\u77F3\u59DA\u8C2D\u5ED6\u90B9\u718A\u91D1\u9646\u90DD\u5B54\u767D\u5D14\u5EB7\u6BDB\u90B1\u79E6\u6C5F\u53F2\u987E\u4FAF\u90B5\u5B5F\u9F99\u4E07\u6BB5\u96F7\u94B1\u6C64\u5C39\u9ECE\u6613\u5E38\u6B66\u4E54\u8D3A\u8D56\u9F94\u6587";
    const isAskingAboutOther = privacyPatterns.some((p) => question.includes(p)) ||
      (() => {
        // Check if question contains a surname char followed by 1-2 chars + salary keyword
        for (const ch of surnames) {
          const idx = question.indexOf(ch);
          if (idx >= 0 && idx < question.length - 1) {
            // Found a surname; check if followed by a name and salary keyword
            const afterSurname = question.substring(idx);
            if (afterSurname.length >= 3 && (question.includes("工资") || question.includes("薪"))) {
              return true;
            }
          }
        }
        return false;
      })();

    if (isAskingAboutOther) {
      return unknown(
        "员工个人薪金属于公司高度机密，我无法提供他人工资信息。根据员工手册规定，薪资保密的范围包括员工的工资、奖金、补贴、津贴及提成等各项报酬。"
      );
    }

    // 试用期工资是多少 — 取决于个人合同
    if (question.includes("试用期") && (question.includes("多少") || question.includes("工资"))) {
      return unknown(
        "员工手册规定：试用期的薪酬依合同约定的标准执行。具体金额请查看您的劳动合同或咨询人力资源部。"
      );
    }

    // 请假超过3天怎么扣工资 — 手册没有具体扣款标准
    if (question.includes("扣工资") && (question.includes("请假") || question.includes("超过"))) {
      return unknown(
        "员工手册中说明了请假审批流程和全勤奖影响规则，但未明确请假超过3天的具体工资扣除标准。建议咨询人力资源部确认具体扣款计算方式。"
      );
    }

    const data = getSectionContent(["薪酬", "薪金", "工资", "薪资"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 福利 ---
const benefitsMatcher: IntentMatcher = {
  id: "benefits",
  keywords: ["福利", "婚假", "年假", "产假", "吊唁假", "工伤", "产品福利", "节假日"],
  match(question: string): QAResult | null {
    // 具体假期类型
    const leaveTypes: Record<string, string[]> = {
      婚假: ["婚假", "结婚", "结婚假"],
      病假: ["病假", "生病"],
      年假: ["年假", "带薪年假"],
      产假: ["产假", "生育"],
      吊唁假: ["吊唁", "丧假"],
      工伤假: ["工伤", "负伤"],
    };

    for (const [leaveName, keywords] of Object.entries(leaveTypes)) {
      if (keywords.some((kw) => question.includes(kw))) {
        const data = getSectionContent(["福利", leaveName]);
        if (data) {
          // 提取相关段落
          const lines = data.content.split("\n");
          const relevantLines = lines.filter(
            (line) => keywords.some((kw) => line.includes(kw)) || line.includes(leaveName)
          );
          const answerText = relevantLines.length > 0 ? relevantLines.join("\n") : data.content;
          return {
            answer: answerText,
            source: cite(data.title),
            needsUserInfo: false,
            unknown: false,
          };
        }
      }
    }

    if (!["福利"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["福利", "福利项目"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 转正流程 ---
const probationMatcher: IntentMatcher = {
  id: "probation",
  keywords: ["转正", "试用期", "转正流程"],
  match(question: string): QAResult | null {
    if (!["转正", "试用期"].some((kw) => question.includes(kw))) return null;
    // 试用期工资交给 salaryMatcher
    if (question.includes("工资") || question.includes("薪资") || question.includes("薪金")) return null;
    const data = getSectionContent(["转正流程", "转正"]);
    if (!data) return unknown();
    const content = extractSubSection(data.content, "\u8F6C\u6B63\u6D41\u7A0B"); // 转正流程
    return {
      answer: `转正流程：\n${content}`,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 调岗/晋升/异动 ---
const transferMatcher: IntentMatcher = {
  id: "transfer",
  keywords: ["调岗", "晋升", "异动", "调薪", "人事变动"],
  match(question: string): QAResult | null {
    if (!["调岗", "晋升", "异动", "调薪", "人事变动"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["异动", "调岗", "晋升", "人事变动"]);
    if (!data) return unknown();
    const content = extractSubSection(data.content, "\u5F02\u52A8\u7BA1\u7406\u6D41\u7A0B"); // 异动管理流程
    return {
      answer: `人事异动流程：\n${content}`,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 旷工 ---
const absenteeismMatcher: IntentMatcher = {
  id: "absenteeism",
  keywords: ["旷工", "缺席", "没去上班"],
  match(question: string): QAResult | null {
    if (!["旷工"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["旷工"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 行为规范 ---
const conductMatcher: IntentMatcher = {
  id: "conduct",
  keywords: ["行为规范", "禁止", "规章制度", "不能做", "不准", "严禁"],
  match(question: string): QAResult | null {
    if (!["行为", "禁止", "规章", "不能做", "不准", "严禁", "规范"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["员工行为管理", "行为", "禁止"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 外出流程 ---
const outingMatcher: IntentMatcher = {
  id: "outing",
  keywords: ["外出", "出门", "出外勤"],
  match(question: string): QAResult | null {
    if (!["外出", "出门", "外勤"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["外出", "员工出入管理"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 报销审批人（无法确认具体审批人） ---
const approverMatcher: IntentMatcher = {
  id: "approver",
  keywords: ["谁审批", "审批人", "谁批准", "找谁审批"],
  match(question: string): QAResult | null {
    if (!["审批", "批准"].some((kw) => question.includes(kw))) return null;
    if (question.includes("报销")) {
      return {
        answer:
          "员工手册中规定报销流程为：①相关报销凭证→②OA申请→③审批→④打印审批结果→⑤提交财务。\n\n手册未指定具体的报销审批人，审批人取决于您的部门和报销类型。建议在OA系统中提交申请后查看审批流，或咨询财务部确认。",
        source: cite("流程管理制度 · 报销流程"),
        needsUserInfo: true,
        followUp: "请问您所属哪个部门？不同部门的报销审批流程可能不同。",
        unknown: false,
      };
    }
    return null;
  },
};

// --- 会议制度 ---
const meetingMatcher: IntentMatcher = {
  id: "meeting",
  keywords: ["会议", "开会", "会议制度"],
  match(question: string): QAResult | null {
    if (!["会议", "开会"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["会议管理制度", "会议", "会议安排"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 办公物资 ---
const suppliesMatcher: IntentMatcher = {
  id: "supplies",
  keywords: ["办公物资", "领用", "办公用品", "物资"],
  match(question: string): QAResult | null {
    if (!["办公物资", "领用", "办公用品", "物资"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["办公物资", "领用"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 通信管理 ---
const communicationMatcher: IntentMatcher = {
  id: "communication",
  keywords: ["通信", "话费", "手机", "企业微信", "通讯"],
  match(question: string): QAResult | null {
    if (!["通信", "话费", "通讯", "手机报销"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["通信", "话费", "通讯工具", "移动电话"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// --- 解除劳动合同 ---
const dismissalMatcher: IntentMatcher = {
  id: "dismissal",
  keywords: ["解除劳动合同", "辞退", "开除", "劝退", "解职"],
  match(question: string): QAResult | null {
    if (!["解除劳动合同", "辞退", "开除", "劝退", "解职"].some((kw) => question.includes(kw))) return null;
    const data = getSectionContent(["其他管理制度", "解除劳动合同", "劝退"]);
    if (!data) return unknown();
    return {
      answer: data.content,
      source: cite(data.title),
      needsUserInfo: false,
      unknown: false,
    };
  },
};

// ============================================================
// 工具函数
// ============================================================

function unknown(extraHint?: string): QAResult {
  return {
    answer: extraHint ? `${extraHint}\n\n${UNKNOWN_REPLY}` : UNKNOWN_REPLY,
    source: cite("—"),
    needsUserInfo: false,
    unknown: true,
  };
}

// ============================================================
// 所有匹配器（按优先级排列）
// ============================================================

const matchers: IntentMatcher[] = [
  approverMatcher,    // 审批人问题（优先级高，因为可能和报销重叠）
  reimbursementMatcher,
  leaveMatcher,
  resignationMatcher,
  onboardingMatcher,
  workHoursMatcher,
  lateMatcher,
  salaryMatcher,
  benefitsMatcher,
  probationMatcher,
  transferMatcher,
  absenteeismMatcher,
  outingMatcher,
  meetingMatcher,
  suppliesMatcher,
  communicationMatcher,
  dismissalMatcher,
  conductMatcher,
];

// ============================================================
// 主问答函数
// ============================================================

export function ask(question: string): QAResult {
  const normalized = question.trim();

  if (!normalized) {
    return {
      answer: "请输入您的问题。",
      source: "",
      needsUserInfo: false,
      unknown: false,
    };
  }

  // 1. 尝试意图匹配
  for (const matcher of matchers) {
    const result = matcher.match(normalized);
    if (result) return result;
  }

  // 2. 全文搜索回退
  // Use Unicode escapes to avoid Rolldown parser issues with CJK in regex literal
  const stopChars = " \t\n\r,.\uFF0C\u3002\uFF1F?\uFF01!\u3001\u7684\u4E86\u5417\u5462\u5427\u554A\u662F\u6709\u4EC0\u4E48\u600E\u4E48\u5982\u4F55\u6211\u8981\u5728\u53BB\u548C\u4E0E\u53CA\u4EE5\u5BF9\u7ED9\u88AB\u628A\u8BA9\u4F60\u4ED6\u5979\u5B83\u8FD9\u90A3\u54EA\u4E9B\u591A\u5C11\u5929\u6B21\u5143\u4E2A\u4F4D\u540D";
  let cleaned = normalized;
  for (const ch of stopChars) {
    cleaned = cleaned.split(ch).join(" ");
  }
  const keywords = cleaned.split(/\s+/).filter((w) => w.length >= 2);

  if (keywords.length > 0) {
    const data = getSectionContent(keywords);
    if (data && data.content.length > 50) {
      return {
        answer: `根据员工手册中"${data.title}"的相关内容：\n\n${data.content}`,
        source: cite(data.title),
        needsUserInfo: false,
        unknown: false,
      };
    }
  }

  // 3. 无法回答
  return unknown();
}

// ============================================================
// 快捷问题
// ============================================================

export const QUICK_QUESTIONS = [
  "报销流程是什么？",
  "迟到怎么扣款？",
  "请假怎么申请？",
  "离职流程是什么？",
  "入职需要准备什么材料？",
  "公司上班时间是几点？",
];

// ============================================================
// 欢迎语
// ============================================================

export const WELCOME_MESSAGE =
  "您好，我是长发小寨员工手册助手。\n\n我可以帮您查询考勤、请假、报销、入职、离职等制度相关问题，所有回答均以《长发小寨员工手册（2026年1月1日版）》为依据。\n\n您可以直接提问，或点击下方的快捷问题开始。";
