import { Check, Clock3, History } from "lucide-react";
import { useLearningProgress, type LearningRecord } from "../hooks/useLearningProgress";

const STAGE_LABELS: Record<string, string> = {
  welcome: "欢迎加入",
  company: "认识长发小寨",
  culture: "品牌与非遗文化",
  product: "产品与核心技术",
  organization: "组织与基础制度",
  certification: "入职认证",
};

const TYPE_LABELS: Record<LearningRecord["type"], string> = {
  stage_complete: "完成关卡",
  exhibit_complete: "完成展区",
  game_complete: "完成闯关",
  section_viewed: "浏览章节",
  certification_attempt: "认证考试",
};

export default function HistoryPage() {
  const { progress } = useLearningProgress();
  const records = [...progress.learningRecords].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const totalCompleted = records.length;

  return (
    <div className="content-enter pb-10">
      <div className="page-heading">
        <p className="!mt-0 text-xs font-semibold uppercase tracking-[.13em] text-brand">Learning records</p>
        <h2 className="mt-2">学习记录</h2>
        <p>真实记录你每一次完成的新人探索内容，按时间倒序展示。</p>
      </div>
      <section className="app-surface p-7">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent-blue text-accent-blue-dark">
            <History size={20} />
          </span>
          <div>
            <h3 className="font-semibold text-text-primary">
              {totalCompleted > 0 ? "最近完成" : "学习记录"}
            </h3>
            <p className="mt-1 text-xs text-text-tertiary">
              {totalCompleted > 0
                ? `共完成 ${totalCompleted} 项新人学习内容`
                : "完成探索后，记录将自动出现在这里"}
            </p>
          </div>
        </div>

        {records.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-text-tertiary">还没有学习记录</p>
            <p className="mt-1 text-xs text-text-tertiary/60">开始你的新人探索旅程吧</p>
          </div>
        ) : (
          <div className="divide-y divide-border-faint">
            {records.map((record) => (
              <article key={record.id} className="flex items-center gap-4 py-4">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-green text-status-done">
                  <Check size={15} />
                </span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-text-primary">{record.title}</h4>
                  <p className="mt-1 text-xs text-text-tertiary flex items-center gap-2">
                    <span>{STAGE_LABELS[record.stageId] ?? record.stageId}</span>
                    <span className="w-1 h-1 rounded-full bg-border-subtle" />
                    <span>{TYPE_LABELS[record.type] ?? record.type}</span>
                  </p>
                </div>
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <Clock3 size={13} />
                    {record.time}
                  </span>
                  <span className="text-[11px] text-text-tertiary">{record.date}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
