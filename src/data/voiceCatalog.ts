export type VoiceCategory = "guide" | "learning" | "feedback" | "ui";

export type VoiceScene = {
  id: number;
  sceneKey: string;
  title: string;
  category: VoiceCategory;
  firstVisitPrompt: boolean;
  required: boolean;
  audioSrc?: string;
  scriptStatus?: "ready" | "needsRecording" | "pendingReview";
  transcript?: string;
};

const V = "/assets/voice/";

export const voiceScenes: VoiceScene[] = [
  // ── 关卡引导 (guide) ──────────────────────────────────────────
  {
    id: 1,
    sceneKey: "home_welcome",
    title: "首页欢迎语 V3",
    category: "guide",
    firstVisitPrompt: true,
    required: false,
    scriptStatus: "ready",
    audioSrc: `${V}1-首页欢迎语（小瑶录音 V3）.mp3`,
    transcript: "哈喽，新同伴，欢迎加入长发小寨！这里是人力资源部人才发展小组，为每一位新伙伴精心准备的新员工入职学习系统。我是小瑶。接下来，我会陪伴你一起开启这段特别的新人学习旅程。加入一家新的公司，就像开启一段新的成长旅程。在正式开始工作之前，我们希望先陪你认识长发小寨——了解我们从哪里出发，为什么做这个品牌，我们正在创造什么样的产品，以及未来如何和伙伴们一起协作成长。在接下来的六个成长节点中，你将逐步认识长发小寨的发展历程、品牌背后的文化故事、产品背后的核心理念，以及日常工作中需要了解的组织和制度流程。这不仅是一场入职培训，也是你认识公司、融入团队、开启成长的第一步。准备好了吗？跟着小瑶，一起开启你的长发小寨新人探索旅程吧！",
  },
  { id: 2, sceneKey: "journey_map", title: "学习地图介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}2学习地图介绍.mp3` },
  { id: 3, sceneKey: "museum_entry", title: "博物馆入口介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}3博物馆入口介绍.mp3` },
  { id: 12, sceneKey: "organization_intro", title: "组织架构模块介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}12组织架构模块介绍.mp3` },
  { id: 13, sceneKey: "rules_challenge", title: "制度闯关介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}13制度闯关介绍.mp3` },
  { id: 14, sceneKey: "compliance_game", title: "合规判断游戏介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}14合规判断游戏介绍.mp3` },
  { id: 16, sceneKey: "culture_match", title: "文化对对碰介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}16文化对对碰介绍.mp3` },
  { id: 17, sceneKey: "knowledge_quiz", title: "知识问答介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}17知识问答介绍.mp3` },
  { id: 22, sceneKey: "assistant_entry", title: "小瑶问答入口介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}22小瑶问答入口介绍.mp3` },
  { id: 23, sceneKey: "task_center", title: "任务中心介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}23任务中心介绍.mp3` },
  { id: 25, sceneKey: "brand_logo_story", title: "Logo 故事引导", category: "guide", firstVisitPrompt: false, required: false, scriptStatus: "needsRecording", transcript: "刚刚看到的发型，你有没有觉得有一点熟悉？点击发现秘密，看看乌龙盘发的轮廓如何与品牌 Logo 建立连接。" },

  // ── 关卡总引导 (stage guides) ─────────────────────────────────
  { id: 26, sceneKey: "journey_map_v2", title: "新版六关成长地图介绍", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}26-新版六关成长地图介绍.mp3` },
  { id: 27, sceneKey: "stage_2_intro", title: "第二关总引导：认识长发小寨", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}27-第二关总引导：认识长发小寨.mp3` },
  { id: 28, sceneKey: "stage_2_summary", title: "第二关结束总结", category: "guide", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}28-第二关结束总结.mp3` },
  { id: 29, sceneKey: "product_technology", title: "第四关总引导：认识产品与核心技术", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}29-第四关总引导：认识产品与核心技术.mp3` },
  { id: 30, sceneKey: "organization_rules", title: "第五关总引导：新人的一天", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}30-第五关总引导：新人的一天.mp3` },
  { id: 31, sceneKey: "certification_start", title: "第六关认证开始", category: "guide", firstVisitPrompt: true, required: false, scriptStatus: "ready", audioSrc: `${V}31-第六关认证开始.mp3` },

  // ── 展区学习 (learning) ──────────────────────────────────────
  {
    id: 4,
    sceneKey: "red_yao_culture",
    title: "红瑶长发文化展区",
    category: "learning",
    firstVisitPrompt: false,
    required: false,
    scriptStatus: "ready",
    audioSrc: `${V}4红瑶长发文化展区.mp3`,
    transcript: "这一站，我们先从真实生活认识红瑶长发文化，再看看文化记忆如何与品牌发生连接。",
  },
  {
    id: 5,
    sceneKey: "rice_water",
    title: "淘米水非遗技艺展区",
    category: "learning",
    firstVisitPrompt: false,
    required: false,
    scriptStatus: "ready",
    audioSrc: `${V}5淘米水非遗技艺展区.mp3`,
    transcript: "普通淘米水并不等于传统发酵淘米水技艺。跟着工艺路径，一步步看清它们的区别。",
  },
  { id: 6, sceneKey: "longshen_rice", title: "龙参米介绍", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}6龙参米介绍.mp3` },
  { id: 7, sceneKey: "spring_water", title: "山泉水介绍", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}7山泉水介绍.mp3` },
  { id: 8, sceneKey: "four_barriers", title: "米水气技四大壁垒展区", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}8米水气技四大壁垒展区.mp3` },
  { id: 9, sceneKey: "scalp_microbiome", title: "头皮微生态科研展区", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}9头皮微生态科研展区.mp3` },
  {
    id: 10,
    sceneKey: "technology_museum",
    title: "中国长发科技馆展区",
    category: "learning",
    firstVisitPrompt: false,
    required: false,
    scriptStatus: "ready",
    audioSrc: `${V}10中国长发科技馆展区.mp3`,
    transcript: "科技馆让文化被看见、技艺被传播，也让科研成果能够被更清楚地表达。",
  },
  { id: 11, sceneKey: "company_history", title: "企业历程与荣誉展区", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}11企业历程与荣誉展区.mp3` },
  { id: 18, sceneKey: "moka_intro", title: "Moka 系统介绍", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}18Moka系统介绍.mp3` },
  { id: 19, sceneKey: "attendance", title: "考勤制度介绍", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}19考勤制度介绍.mp3` },
  { id: 20, sceneKey: "leave_and_outing", title: "请假与外出介绍", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}20请假与外出介绍.mp3` },
  { id: 21, sceneKey: "expense_invoice", title: "报销与发票介绍", category: "learning", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}21报销与发票介绍.mp3` },

  // ── 反馈音 (feedback) ────────────────────────────────────────
  { id: 15, sceneKey: "compliance_feedback", title: "合规判断结果区话术 1", category: "feedback", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}15-1合规判断结果区话术.mp3` },
  { id: 15.2, sceneKey: "compliance_feedback_2", title: "合规判断结果区话术 2", category: "feedback", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}15-2合规判断结果区话术.mp3` },
  { id: 15.3, sceneKey: "compliance_feedback_3", title: "合规判断结果区话术 3", category: "feedback", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}15-3合规判断结果区话术.mp3` },
  { id: 15.4, sceneKey: "compliance_feedback_4", title: "合规判断结果区话术 4", category: "feedback", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}15-4合规判断结果区话术.mp3` },
  { id: 24, sceneKey: "onboarding_complete", title: "入职认证通关祝贺", category: "feedback", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}24入职认证通关祝贺.mp3` },

  // ── UI 交互短音 (ui) ─────────────────────────────────────────
  // 用于合规判断游戏等交互场景的即时语音反馈
  { id: 32, sceneKey: "ui_pause", title: "停一下", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}32-停一下.mp3` },
  { id: 33, sceneKey: "ui_discover", title: "发现问题", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}33-发现问题.mp3` },
  { id: 34, sceneKey: "ui_invite_click", title: "邀请点击", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}34-邀请点击.mp3` },
  { id: 35, sceneKey: "ui_start_judge", title: "开始判断", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}35-开始判断.mp3` },
  { id: 36, sceneKey: "ui_confirm_answer", title: "确认答案", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}36-确认答案.mp3` },
  { id: 37, sceneKey: "ui_correct", title: "回答正确", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}37-回答正确.mp3` },
  { id: 38, sceneKey: "ui_wrong", title: "回答错误", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}38-回答错误.mp3` },
  { id: 39, sceneKey: "ui_find_link", title: "找到隐藏关联", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}39-找到隐藏关联.mp3` },
  { id: 40, sceneKey: "ui_key_memory", title: "重点记忆", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}40-重点记忆.mp3` },
  { id: 41, sceneKey: "ui_continue", title: "继续前进", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}41-继续前进.mp3` },
  { id: 42, sceneKey: "ui_area_complete", title: "区域完成", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}42-区域完成.mp3` },
  { id: 43, sceneKey: "ui_stage_complete", title: "关卡完成", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}43-关卡完成.mp3` },
  { id: 44, sceneKey: "ui_next_unlock", title: "下一关解锁", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}44-下一关解锁.mp3` },
  { id: 45, sceneKey: "ui_back_to_map", title: "返回地图", category: "ui", firstVisitPrompt: false, required: false, scriptStatus: "ready", audioSrc: `${V}45-返回地图.mp3` },
];

export function getVoiceScene(sceneKey: string) {
  return voiceScenes.find((scene) => scene.sceneKey === sceneKey);
}

/** 播放一次性 UI 短语音（不绑定 VoiceGuide 组件） */
const uiAudioCache = new Map<string, HTMLAudioElement>();

export function playUiVoice(sceneKey: string): void {
  const scene = getVoiceScene(sceneKey);
  if (!scene?.audioSrc) return;
  let audio = uiAudioCache.get(sceneKey);
  if (!audio) {
    audio = new Audio(scene.audioSrc);
    audio.preload = "auto";
    uiAudioCache.set(sceneKey, audio);
  }
  audio.currentTime = 0;
  void audio.play().catch(() => { /* 用户尚未交互，忽略自动播放限制 */ });
}
