import { ArrowLeft, ArrowRight, Check, Clock3, Image, Lock, MapPin, Sparkles } from "lucide-react";
import XiaoyaoDialogue from "../components/XiaoyaoDialogue";
import { learningStages, type LearningUnit } from "../data/learningData";
import { useLearningProgress, getCurrentStageId, getStageStatuses, type StageId } from "../hooks/useLearningProgress";

type StageDetailPageProps = {
  stageId: string;
  onNavigate: (path: string) => void;
};

function UnitStatus({ unit }: { unit: LearningUnit }) {
  if (unit.status === "completed") return <span className="inline-flex items-center gap-1 text-xs font-medium text-status-done"><Check size={12} strokeWidth={3} />已完成</span>;
  if (unit.status === "current") return <span className="rounded-full bg-brand-light px-2.5 py-1 text-xs font-medium text-brand">当前探索</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-text-tertiary"><Lock size={11} />待解锁</span>;
}

export default function StageDetailPage({ stageId, onNavigate }: StageDetailPageProps) {
  const { progress } = useLearningProgress();
  const baseStage = learningStages.find((item) => item.id === stageId) ?? learningStages[0];
  // Use dynamic progress status instead of static data
  const stageStatuses = getStageStatuses(progress);
  const dynamicStatus = stageStatuses[stageId as StageId] ?? baseStage.status;
  const stage = { ...baseStage, status: dynamicStatus };
  const nextStageBase = learningStages[stage.order] ?? null;
  // Apply dynamic status to next stage too
  const nextStage = nextStageBase
    ? { ...nextStageBase, status: stageStatuses[nextStageBase.id as StageId] ?? nextStageBase.status }
    : null;
  const dynamicProgress = dynamicStatus === "completed" ? 100 : dynamicStatus === "locked" ? 0 : stage.progress;
  const isLocked = stage.status === "locked";
  const currentStageId = getCurrentStageId(progress);
  const currentStageTitle = learningStages.find((s) => s.id === currentStageId)?.title ?? "当前探索";

  return (
    <div className="content-enter pb-10">
      <button onClick={() => onNavigate("home")} className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-brand">
        <ArrowLeft size={16} />返回成长地图
      </button>

      <section className="app-surface relative mb-7 overflow-hidden px-7 py-7 md:px-9 md:py-9">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_84%_14%,rgba(188,113,84,.14),transparent_33%),radial-gradient(circle_at_18%_92%,rgba(106,151,158,.12),transparent_40%)]" />
        <div className="relative grid items-center gap-7 md:grid-cols-[190px_minmax(0,1fr)]">
          <div className="relative flex min-h-[180px] items-center justify-center">
            <div className="absolute inset-10 rounded-full bg-brand/7 blur-3xl" />
            <img src={stage.badge} alt={stage.title} className={`relative h-36 w-36 shrink-0 object-contain drop-shadow-[0_12px_24px_rgba(71,45,31,.12)] ${isLocked ? "grayscale opacity-55" : ""}`} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-text-tertiary">
              <MapPin size={13} />新人入职成长旅程
              <span className="h-1 w-1 rounded-full bg-border-subtle" />
              <span>{stage.order} / 6</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-[32px] font-semibold tracking-[-.035em] text-text-primary">{stage.title}</h2>
              <UnitStatus unit={{ id: "stage", title: "", summary: "", duration: "", remember: "", status: stage.status }} />
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-text-secondary">{stage.description}</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="h-1.5 w-64 max-w-[60%] overflow-hidden rounded-full bg-white/72"><div className="h-full rounded-full bg-[linear-gradient(90deg,#b44c3e,#d78b68)]" style={{ width: `${dynamicProgress}%` }} /></div>
              <span className="text-sm font-medium text-text-primary">{dynamicProgress}%</span>
            </div>
          </div>
        </div>
      </section>

      {!isLocked && (
        <div className="mt-10 mb-8">
          <XiaoyaoDialogue
            title={stage.voiceTitle}
            sceneKey={stage.voiceSceneKey}
            layout="horizontal"
            fullBody
            paragraphs={stage.voiceParagraphs}
          />
        </div>
      )}

      {isLocked ? (
        <section className="app-surface flex min-h-[360px] flex-col items-center justify-center px-8 py-12 text-center">
          <div className="mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-bg-subtle text-text-tertiary"><Lock size={26} /></div>
          <h3 className="text-xl font-semibold text-text-primary">这一站还没有开放</h3>
          <p className="mt-3 max-w-md text-sm leading-7 text-text-secondary">先完成「{currentStageTitle}」，小瑶会陪你继续往前走。你仍然可以在成长地图上预览后续旅程。</p>
          <button onClick={() => onNavigate(`stage/${currentStageId}`)} className="app-button-primary mt-6">继续当前探索<ArrowRight size={16} /></button>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="app-surface p-7 md:p-8">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.12em] text-brand">Explore</p>
                <h3 className="mt-2 text-xl font-semibold text-text-primary">本关探索路线</h3>
                <p className="mt-1 text-sm text-text-secondary">按顺序完成各部分内容，逐步解锁下一关。</p>
              </div>
              <span className="text-sm font-medium text-text-secondary">{stage.units.filter((unit) => unit.status === "completed").length} / {stage.units.length} 完成</span>
            </div>

            <div className="overflow-hidden rounded-[24px] border border-white/75 bg-white/42 px-5 shadow-[inset_0_1px_0_rgba(255,255,255,.82)]">
              {stage.units.map((unit, index) => (
                <article key={unit.id} className={`group relative grid grid-cols-[46px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border-faint py-5 transition-all last:border-0 ${unit.status === "current" ? "-mx-2 rounded-2xl bg-[#f4e4de]/72 px-2 shadow-[0_10px_26px_rgba(176,69,58,.05)]" : "hover:bg-white/45"} ${unit.status === "locked" ? "opacity-55" : ""}`}>
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl text-sm font-semibold ${unit.status === "completed" ? "bg-[#dfe9c9] text-status-done" : unit.status === "current" ? "bg-[#df9b78] text-white" : "bg-[#eee9e2] text-text-tertiary"}`}>
                    {unit.status === "completed" ? <Check size={18} strokeWidth={3} /> : unit.status === "locked" ? <Lock size={15} /> : String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h4 className="font-semibold text-text-primary">{unit.title}</h4><UnitStatus unit={unit} /></div>
                    <p className="mt-1 text-sm leading-6 text-text-secondary">{unit.summary}</p>
                    <p className="mt-1.5 text-xs text-text-tertiary">记住：{unit.remember}</p>
                  </div>
                  <div className="ml-3 flex items-center gap-2 text-xs text-text-tertiary"><Clock3 size={13} />{unit.duration}</div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="app-surface overflow-hidden p-5">
              <div className="flex aspect-[4/3] items-center justify-center rounded-2xl border border-dashed border-border-subtle bg-[linear-gradient(145deg,rgba(245,241,235,.9),rgba(238,243,242,.8))]">
                <div className="px-5 text-center">
                  <Image size={24} className="mx-auto text-text-tertiary" />
                  <p className="mt-3 text-sm font-medium text-text-secondary">媒体内容区</p>
                  <p className="mt-1 max-w-[220px] text-xs leading-5 text-text-tertiary">本关视频、图片等媒体内容将在这里呈现。</p>
                </div>
              </div>
              <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#fbf7f2] p-3">
                <Sparkles size={15} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-xs leading-5 text-text-secondary">完成学习后，可回顾本关重点内容与学习记录。</p>
              </div>
            </section>
          </aside>
        </div>
      )}

      {!isLocked && nextStage && (
        <div className="mt-7 flex items-center justify-between rounded-2xl border border-border-faint bg-white/55 px-5 py-4">
          <span className="text-sm text-text-secondary">下一关：<strong className="font-semibold text-text-primary">{nextStage.title}</strong></span>
          <button disabled={nextStage.status === "locked"} onClick={() => onNavigate(`stage/${nextStage.id}`)} className="app-button-secondary disabled:cursor-not-allowed disabled:opacity-45">{nextStage.status === "locked" ? "完成本关后解锁" : "进入下一关"}<ArrowRight size={15} /></button>
        </div>
      )}
    </div>
  );
}
