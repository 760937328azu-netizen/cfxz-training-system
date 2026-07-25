import { ArrowRight, Check, Circle, Clock3, Lock, Sparkles } from "lucide-react";
import { useLearningProgress, getCurrentStageId, getCompletedCount } from "../hooks/useLearningProgress";
import { learningStages } from "../data/learningData";

type TasksPageProps = { onNavigate: (path: string, intent?: "top" | "restore") => void };

const STAGE_TITLES: Record<string, string> = {
  welcome: "欢迎加入",
  company: "认识长发小寨",
  culture: "认识品牌与非遗文化",
  product: "认识产品与核心技术",
  organization: "认识组织与基础制度",
  certification: "完成新人认证",
};

function buildReminders(currentStageId: string, completedCount: number) {
  const currentTitle = STAGE_TITLES[currentStageId] ?? "当前探索";
  const nextStage = learningStages.find((s) => s.order === (learningStages.find((x) => x.id === currentStageId)?.order ?? 0) + 1);
  const nextTitle = nextStage ? STAGE_TITLES[nextStage.id] ?? nextStage.title : "完成新人认证";

  return [
    { label: "今天", title: `继续「${currentTitle}」`, note: "按自己的节奏前进", status: "current" },
    { label: "已完成", title: `已完成 ${completedCount} 站新人旅程`, note: "继续加油", status: "completed" },
    { label: "下一步", title: `进入「${nextTitle}」`, note: "完成当前关卡后开放", status: "locked" },
    { label: "最终目标", title: "完成入职认证，解锁学习天地", note: "完成全部 6 站后开启", status: "locked" },
  ];
}

export default function TasksPage({ onNavigate }: TasksPageProps) {
  const { progress } = useLearningProgress();
  const completedCount = getCompletedCount(progress);
  const currentStageId = getCurrentStageId(progress);
  const currentStageTitle = STAGE_TITLES[currentStageId] ?? "当前探索";
  const reminders = buildReminders(currentStageId, completedCount);

  return (
    <div className="content-enter pb-10">
      <div className="page-heading"><p className="!mt-0 text-xs font-semibold uppercase tracking-[.13em] text-brand">Growth reminders</p><h2 className="mt-2">我的成长提醒</h2><p>这里只保留与你当前新人旅程直接相关的事项，不混入推荐课程或长期学习数据。</p></div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="app-surface p-7">
          <div className="mb-7 flex items-center justify-between"><div><h3 className="text-lg font-semibold text-text-primary">当前旅程</h3><p className="mt-1 text-sm text-text-secondary">{currentStageTitle} · 进行中</p></div><span className="rounded-full bg-brand-light px-3 py-1 text-xs font-medium text-brand">进行中</span></div>
          <div className="space-y-1">
            {reminders.map((task, index) => (
              <article key={task.title} className="relative flex gap-4 px-2 py-4">
                {index < reminders.length - 1 && <span className="absolute left-[19px] top-10 h-[calc(100%-20px)] w-px bg-border-faint" />}
                <span className={`relative z-10 mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full ${task.status === "completed" ? "bg-status-done text-white" : task.status === "current" ? "bg-brand text-white ring-4 ring-brand-light" : "border border-border-subtle bg-white text-text-tertiary"}`}>
                  {task.status === "completed" ? <Check size={13} /> : task.status === "locked" ? <Lock size={11} /> : <Circle size={8} fill="currentColor" />}
                </span>
                <div className="flex-1 border-b border-border-faint pb-4">
                  <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-medium text-text-tertiary">{task.label}</p><h4 className="mt-1 font-semibold text-text-primary">{task.title}</h4></div><span className="flex items-center gap-1.5 text-xs text-text-tertiary"><Clock3 size={13} />{task.note}</span></div>
                </div>
              </article>
            ))}
          </div>
          <button onClick={() => onNavigate(`stage/${currentStageId}`, "restore")} className="app-button-primary mt-5">继续当前探索<ArrowRight size={16} /></button>
        </section>

        <aside className="app-surface h-fit p-6">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-light text-brand"><Sparkles size={19} /></span>
          <h3 className="mt-5 text-lg font-semibold text-text-primary">小瑶今天的建议</h3>
          <p className="mt-3 text-sm leading-7 text-text-secondary">先完成当前的探索，不需要一次学完整关。完成后，系统会自动点亮下一段路径。</p>
          <div className="mt-5 rounded-2xl bg-bg-elevated p-4"><div className="flex justify-between text-xs text-text-secondary"><span>当前关卡</span><span>{completedCount + 1} / 6 站</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-subtle"><div className="h-full rounded-full bg-brand" style={{ width: `${(completedCount / 6) * 100}%` }} /></div></div>
        </aside>
      </div>
    </div>
  );
}
