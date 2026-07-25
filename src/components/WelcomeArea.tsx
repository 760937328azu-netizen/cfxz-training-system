import { ArrowRight, BookOpen, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { useLearningProgress, getCurrentStageId, getCompletedCount } from "../hooks/useLearningProgress";
import { useCurrentUser } from "../hooks/useCurrentUser";

const STAGE_LABELS: Record<string, { title: string; quote: string; percent: number }> = {
  welcome: { title: "欢迎加入", quote: "从这里开始，正式走进长发小寨的世界。", percent: 0 },
  company: { title: "认识长发小寨", quote: "认识品牌从哪里来，理解组织架构与协作方式。", percent: 17 },
  culture: { title: "认识品牌与非遗文化", quote: "再完成 1 个展区，下一段探索就会被点亮。我陪你一起往前走。", percent: 33 },
  product: { title: "认识产品与核心技术", quote: "从真实问题出发，理解产品背后的逻辑。", percent: 50 },
  organization: { title: "认识组织与基础制度", quote: "了解组织协作与日常制度，知道遇到问题时该找谁。", percent: 67 },
  certification: { title: "完成新人认证", quote: "汇总必学内容、互动任务与知识问答结果，完成新员工入职认证。", percent: 83 },
};

type WelcomeAreaProps = {
  onContinue?: () => void;
  onEnterLearningWorld?: () => void;
};

export default function WelcomeArea({ onContinue, onEnterLearningWorld }: WelcomeAreaProps) {
  const { progress } = useLearningProgress();
  const completedCount = getCompletedCount(progress);
  const currentStageId = getCurrentStageId(progress);
  const isUnlocked = progress.learningWorldUnlocked;
  const { name: userName } = useCurrentUser();
  const stageInfo = STAGE_LABELS[currentStageId] ?? STAGE_LABELS.welcome;
  const overallPercent = isUnlocked ? 100 : completedCount >= 6 ? 100 : stageInfo.percent;

  return (
    <section data-visual="welcome-hero" className="mb-9">
      <div className="hero-workspace relative isolate overflow-hidden rounded-[34px] border border-white/70">
        <div className="absolute inset-0 bg-[linear-gradient(122deg,rgba(255,252,247,.96)_0%,rgba(248,240,232,.91)_54%,rgba(237,241,238,.86)_100%)]" />
        <div className="absolute -left-20 -top-28 h-72 w-72 rounded-full bg-[#F2D9BE]/35 blur-3xl" />
        <div className="absolute -right-16 top-2 h-80 w-80 rounded-full bg-[#B7CFD1]/20 blur-3xl" />
        <svg className="pointer-events-none absolute inset-y-0 right-0 h-full w-[58%] opacity-35" viewBox="0 0 680 360" fill="none" preserveAspectRatio="none" aria-hidden="true">
          <path d="M40 280C160 218 204 286 334 218C460 151 506 83 680 56" stroke="rgba(133,118,104,.22)" strokeWidth="1" />
          <path d="M80 316C210 253 250 318 382 248C500 185 558 115 710 92" stroke="rgba(133,118,104,.13)" strokeWidth="1" />
        </svg>

        <div className="relative grid min-h-[330px] grid-cols-1 gap-8 px-9 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/55 px-3 py-1.5 text-xs font-medium text-text-secondary backdrop-blur-md"><MapPin size={12} />新人入职</span>
              {isUnlocked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC]/75 px-3 py-1.5 text-xs font-medium text-[#4C795E]"><CheckCircle2 size={12} />已获得入职认证</span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC]/75 px-3 py-1.5 text-xs font-medium text-[#4C795E]"><Sparkles size={12} />新人探索进行中</span>
              )}
            </div>

            <h2 className="text-[2.45rem] font-semibold leading-[1.1] tracking-[-.045em] text-text-primary">欢迎回来，{userName}</h2>
            {isUnlocked ? (
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-text-secondary">恭喜！你已完成 <strong className="font-semibold text-text-primary">100%</strong> 的入职旅程，正式获得新人认证。<span className="font-semibold text-brand">学习天地</span>已为你敞开，快来探索更多成长内容。</p>
            ) : (
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-text-secondary">你已完成 <strong className="font-semibold text-text-primary">{overallPercent}%</strong> 的新人旅程。今天和小瑶继续探索 <span className="font-semibold text-brand">「{stageInfo.title}」</span>。</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-4">
              {isUnlocked ? (
                <button onClick={onEnterLearningWorld} className="app-button-primary group">进入学习天地<BookOpen size={16} className="transition-transform group-hover:translate-x-1" /></button>
              ) : (
                <button onClick={onContinue} className="app-button-primary group">继续当前探索<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></button>
              )}
              <div className="max-w-md rounded-2xl border border-white/75 bg-white/52 px-4 py-3 shadow-[0_12px_32px_rgba(76,52,37,.045)] backdrop-blur-xl">
                <p className="text-[11px] font-semibold text-brand">小瑶</p>
                <p className="mt-1 text-xs leading-5 text-text-secondary">
                  {isUnlocked
                    ? "你已经走完全部入职探索，学习天地的大门已为你敞开，继续成长吧！"
                    : stageInfo.quote}
                </p>
              </div>
            </div>

            <div className="mt-7 max-w-2xl rounded-2xl border border-white/65 bg-white/38 px-4 py-3 backdrop-blur-md">
              <div className="mb-2.5 flex items-center justify-between text-xs"><span className="font-medium text-text-secondary">新人探索进度</span><span className="font-semibold text-text-primary">{completedCount} / 6 站 · {overallPercent}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/75"><div className="h-full rounded-full bg-[linear-gradient(90deg,#C97466,#B44C3E)] animate-progress-grow" style={{ width: `${overallPercent}%` }} /></div>
            </div>
          </div>

          <div className="relative hidden items-end justify-center lg:flex">
            <div className="absolute bottom-4 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(228,178,127,.24),rgba(228,178,127,.06)_48%,transparent_70%)] blur-sm" />
            <div className="absolute bottom-5 h-8 w-44 rounded-full bg-[#5D3C2C]/10 blur-xl" />
            <img src="/xiaoyao/transparent/1.png" alt="小瑶欢迎你" className="xiaoyao-float relative z-10 h-[286px] w-auto object-contain object-bottom drop-shadow-[0_22px_30px_rgba(73,46,30,.12)]" />
          </div>
        </div>
      </div>
    </section>
  );
}
