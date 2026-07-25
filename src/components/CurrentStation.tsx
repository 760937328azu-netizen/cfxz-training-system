import { ArrowRight, BookOpen, Check, Clock3, Compass, Lock, Sparkles } from "lucide-react";
import { useLearningProgress, getCurrentStageId, getCompletedCount } from "../hooks/useLearningProgress";

type CurrentStationProps = { onContinue?: () => void; onEnterLearningWorld?: () => void };

const cultureCheckpoints = [
  { name: "长发文化", status: "completed" },
  { name: "淘米水技艺", status: "current" },
  { name: "长发科技馆", status: "locked" },
] as const;

const STAGE_INFO: Record<string, { order: number; title: string; subtitle: string; tags: string[]; desc: string }> = {
  welcome: { order: 1, title: "欢迎加入", subtitle: "开启新人旅程", tags: ["认识系统", "了解小瑶", "看见路线"], desc: "正式走进长发小寨的世界，认识你的成长伙伴小瑶。" },
  company: { order: 2, title: "认识长发小寨", subtitle: "认识品牌从哪里来", tags: ["品牌起源", "企业历程", "组织架构"], desc: "认识长发小寨的品牌故事、发展历程和今天的组织团队。" },
  culture: { order: 3, title: "认识品牌与非遗文化", subtitle: "探索红瑶文化与非遗技艺", tags: ["理解文化根源", "认识发酵技艺", "连接品牌记忆"], desc: "不是看完一组课程，而是沿着三个主题展区完成一次数字文化馆探索。" },
  product: { order: 4, title: "认识产品与核心技术", subtitle: "理解产品与核心技术", tags: ["从问题开始", "区分头皮与发丝", "理解产品产生逻辑"], desc: "从真实问题出发，理解不同问题对应的产品逻辑。" },
  organization: { order: 5, title: "认识组织与基础制度", subtitle: "熟悉组织协作与制度", tags: ["组织协作", "制度闯关", "日常规范"], desc: "通过互动闯关，了解公司组织协作与日常制度规范。" },
  certification: { order: 6, title: "完成新人认证", subtitle: "完成认证，开启学习天地", tags: ["综合考核", "获得认证", "解锁学习天地"], desc: "完成新人认证，正式解锁「学习天地」的全部内容。" },
};

export default function CurrentStation({ onContinue, onEnterLearningWorld }: CurrentStationProps) {
  const { progress } = useLearningProgress();
  const TOTAL_STAGES = 6;
  const completedCount = getCompletedCount(progress);
  const currentStageId = getCurrentStageId(progress);
  const isUnlocked = progress.learningWorldUnlocked;
  const info = STAGE_INFO[currentStageId] ?? STAGE_INFO.welcome;
  const currentStation = info.order;

  return (
    <section className="flex h-full flex-col">
      <div className="mb-4 flex h-8 items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">{isUnlocked ? "入职探索完成" : "当前探索"}</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-light px-3 py-1.5 text-xs font-medium text-brand"><Compass size={12} />{completedCount >= 6 ? "全部完成" : "进行中"}</span>
      </div>

      <div data-visual="current-exploration" className="app-surface flex flex-1 flex-col overflow-hidden p-7">
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_132px]">
          <div>
            <p className="text-xs font-medium text-text-tertiary">新人旅程 · 第 {currentStation} 站</p>
            <h4 className="mt-2 text-[26px] font-semibold leading-tight tracking-[-.035em] text-text-primary">{isUnlocked ? "恭喜完成全部入职探索" : info.title}</h4>
            <p className="mt-3 max-w-xl text-sm leading-7 text-text-secondary">
              {isUnlocked
                ? "你已经走完了全部 6 站入职探索并通过认证，学习天地已正式开放。继续探索更多成长内容吧！"
                : info.desc}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {(isUnlocked ? ["获得认证", "学习天地开放", "持续成长"] : info.tags).map((goal) => <span key={goal} className="rounded-full border border-[#E6DED4] bg-[#FAF5EE] px-3 py-1.5 text-xs font-medium text-[#685E55]">{goal}</span>)}
            </div>
          </div>
          <div className="flex flex-col items-center justify-center rounded-[22px] border border-white/75 bg-[linear-gradient(145deg,rgba(250,237,233,.86),rgba(255,255,255,.58))] p-4">
            <div className="grid h-20 w-20 place-items-center rounded-full" style={{ background: `conic-gradient(#B44C3E 0 ${(currentStation / TOTAL_STAGES) * 100}%, rgba(180,76,62,.10) ${(currentStation / TOTAL_STAGES) * 100}% 100%)` }}>
              <div className="grid h-[68px] w-[68px] place-items-center rounded-full bg-[#FFFDFC]"><div className="text-center"><strong className="block text-lg font-semibold text-text-primary">{completedCount} / {TOTAL_STAGES}</strong><span className="text-[10px] text-text-tertiary">新人旅程</span></div></div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-text-tertiary"><Clock3 size={11} />{completedCount >= 6 ? "已完成全部" : completedCount > 0 ? `已完成 ${completedCount} 站` : "约 18 分钟"}</span>
          </div>
        </div>

        <div className="my-6 h-px bg-border-faint" />

        {isUnlocked ? (
          <div className="rounded-[22px] border border-[#EAF2EC]/60 bg-[linear-gradient(112deg,rgba(234,242,236,.72),rgba(255,251,246,.76))] p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#4C795E] text-white shadow-[0_8px_22px_rgba(76,127,94,.18)]"><BookOpen size={18} /></span>
              <div className="min-w-0 flex-1"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#4C795E]">Learning world</p><h5 className="mt-1 text-base font-semibold text-text-primary">学习天地已开放</h5><p className="mt-1.5 text-xs leading-6 text-text-secondary">产品知识、企业文化、管理制度、岗位成长——更多内容等你探索。</p></div>
              <button onClick={onEnterLearningWorld} className="app-button-primary shrink-0">进入学习天地<BookOpen size={15} /></button>
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-brand/10 bg-[linear-gradient(112deg,rgba(250,237,233,.72),rgba(255,251,246,.76))] p-5">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-[0_8px_22px_rgba(180,76,62,.18)]"><Sparkles size={18} /></span>
              <div className="min-w-0 flex-1"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-brand">Now exploring</p><h5 className="mt-1 text-base font-semibold text-text-primary">{info.title}</h5><p className="mt-1.5 text-xs leading-6 text-text-secondary">{info.desc}</p></div>
              <button onClick={onContinue} className="app-button-primary shrink-0">继续探索<ArrowRight size={15} /></button>
            </div>
          </div>
        )}

        {!isUnlocked && !progress.culture.completed && currentStageId === "culture" && <div className="mt-6"><div className="mb-3 flex items-center justify-between"><span className="text-xs font-medium text-text-secondary">本关探索路径</span><span className="text-[11px] text-text-tertiary">顺序开放</span></div><div className="grid grid-cols-3 gap-2">{cultureCheckpoints.map((checkpoint, index) => { const dynamicStatus = index < progress.culture.completedExhibits.length ? "completed" : index === progress.culture.completedExhibits.length ? "current" : "locked"; return <div key={checkpoint.name} className={`relative rounded-xl px-2 py-3 text-center ${dynamicStatus === "current" ? "bg-brand-light/75" : "bg-bg-elevated/72"}`}><span className={`mx-auto grid h-6 w-6 place-items-center rounded-full text-[10px] font-semibold ${dynamicStatus === "completed" ? "bg-status-done text-white" : dynamicStatus === "current" ? "bg-brand text-white" : "border border-border-subtle bg-white text-text-tertiary"}`}>{dynamicStatus === "completed" ? <Check size={12} strokeWidth={3} /> : dynamicStatus === "locked" ? <Lock size={10} /> : index + 1}</span><span className={`mt-2 block text-[10px] leading-4 ${dynamicStatus === "current" ? "font-semibold text-brand" : "text-text-secondary"}`}>{checkpoint.name}</span></div>; })}</div></div>}
      </div>
    </section>
  );
}
