import { ArrowRight, Building2, ClipboardCheck, Glasses, Lock, Package, Sparkles, TrendingUp } from "lucide-react";
import { learningWorldModules } from "../data/learningData";
import { useLearningProgress, getCompletedCount } from "../hooks/useLearningProgress";

type LearningWorldPageProps = { onNavigate: (path: string) => void };

const icons = [Package, Building2, ClipboardCheck, Glasses, TrendingUp];
const tones = ["bg-[#f3dfd6] text-[#a94a3c]", "bg-[#e5edcf] text-[#62713a]", "bg-[#f4e5b7] text-[#95722e]", "bg-[#dce8f1] text-[#58758e]", "bg-[#eadcf0] text-[#7a5c88]"];

export default function LearningWorldPage({ onNavigate }: LearningWorldPageProps) {
  const { progress } = useLearningProgress();
  const completedCount = getCompletedCount(progress);
  const isUnlocked = progress.learningWorldUnlocked;
  return (
    <div className="content-enter pb-10">
      <section className="app-surface relative overflow-hidden px-7 py-9 md:px-10 md:py-11">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(118,166,171,.17),transparent_34%),radial-gradient(circle_at_18%_82%,rgba(218,160,117,.15),transparent_40%)]" />
        <div className="pointer-events-none absolute -right-14 top-5 h-64 w-64 rounded-full border border-white/30 bg-white/10 blur-[1px]" />
        <div className="relative grid items-center gap-10 xl:grid-cols-[minmax(0,.8fr)_minmax(520px,1.2fr)]">
          <div>
            {isUnlocked ? <span className="inline-flex items-center gap-2 rounded-full border border-[#EAF2EC]/80 bg-[#EAF2EC]/62 px-3.5 py-2 text-xs font-medium text-[#4C795E] shadow-sm backdrop-blur-md"><Sparkles size={12} />学习天地已开放</span> : <span className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/62 px-3.5 py-2 text-xs font-medium text-text-secondary shadow-sm backdrop-blur-md"><Lock size={12} />完成入职认证后开启</span>}
            <p className="mt-8 text-xs font-semibold uppercase tracking-[.14em] text-brand">Your next world</p>
            <h2 className="mt-2 max-w-xl text-[42px] font-semibold leading-[1.08] tracking-[-.05em] text-text-primary">前方，是你的<br />学习天地</h2>
            <p className="mt-5 max-w-xl text-[15px] leading-8 text-text-secondary">新人旅程不是学习的终点。认证完成后，你会从“小瑶入职导游”陪伴的探索阶段，进入持续成长的长期学习空间。</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">{isUnlocked ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2EC]/75 px-3 py-1.5 text-xs font-medium text-[#4C795E]">✓ 已获得入职认证</span> : <button onClick={() => onNavigate("home")} className="app-button-primary">继续新人探索<ArrowRight size={16} /></button>}<span className="text-sm text-text-tertiary">当前进度 {completedCount} / 6 站</span></div>
          </div>

          <div className="relative min-h-[430px] rounded-[30px] border border-white/70 bg-white/38 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,.86),0_22px_68px_rgba(59,67,61,.07)] backdrop-blur-md">
            <div className="absolute left-[12%] right-[12%] top-1/2 h-px -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(135,128,118,.24),transparent)]" />
            <div className="absolute bottom-[21%] left-[18%] top-[20%] w-px bg-[linear-gradient(180deg,transparent,rgba(135,128,118,.18),transparent)]" />
            <div className="grid h-full min-h-[380px] grid-cols-2 content-center gap-4 md:grid-cols-3">
              {learningWorldModules.map((module, index) => {
                const Icon = icons[index];
                const special = index === 2;
                return (
                  <article key={module.id} className={`group relative z-10 flex min-h-[150px] flex-col rounded-[22px] border border-white/75 bg-white/68 p-4.5 shadow-[0_12px_34px_rgba(52,51,47,.06)] backdrop-blur-md transition-transform duration-300 hover:-translate-y-1 ${special ? "md:translate-y-9" : index === 1 || index === 4 ? "md:-translate-y-5" : ""}`}>
                    <div className="flex items-center justify-between"><span className={`grid h-10 w-10 place-items-center rounded-2xl ${tones[index]}`}><Icon size={18} /></span>{!isUnlocked && <Lock size={12} className="text-text-tertiary" />}</div>
                    <h3 className="mt-4 text-sm font-semibold text-text-primary">{module.title}</h3>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-text-secondary">{module.description}</p>
                  </article>
                );
              })}
              <div className="z-10 flex min-h-[150px] flex-col items-center justify-center rounded-[22px] border border-dashed border-white/85 bg-white/25 p-4 text-center md:translate-y-5">
                <Sparkles size={18} className="text-[#d39a57]" /><p className="mt-3 text-xs font-medium text-text-secondary">更多岗位成长内容<br />将由真实培训持续扩展</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
