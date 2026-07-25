import { Landmark, Swords, Award, ChevronRight, Lock } from "lucide-react";
import { useLearningProgress, getCurrentStageId, getStageStatuses, type StageId } from "../hooks/useLearningProgress";

type Task = {
  id: string;
  title: string;
  type: "explore" | "challenge" | "cert";
  typeLabel: string;
  due: string;
  urgent?: boolean;
  locked?: boolean;
  stageId?: string;
};

const STAGE_TASKS: Record<string, { title: string; type: Task["type"]; typeLabel: string; due: string }> = {
  welcome: { title: "点击「开启旅程」正式进入", type: "explore", typeLabel: "探索", due: "从这里开始" },
  company: { title: "浏览公司介绍三个板块", type: "explore", typeLabel: "探索", due: "今日建议完成" },
  culture: { title: "完成 4 个非遗文化展区", type: "explore", typeLabel: "探索", due: "今日建议完成" },
  product: { title: "完成「产品与核心技术」学习", type: "explore", typeLabel: "探索", due: "今日建议完成" },
  organization: { title: "制度闯关 · 4 个子任务", type: "challenge", typeLabel: "闯关", due: "完成前一站后解锁" },
  certification: { title: "完成入职认证申请", type: "cert", typeLabel: "认证", due: "完成全部探索后解锁" },
};

const STAGE_LABELS_SHORT: Record<string, string> = {
  welcome: "欢迎加入",
  company: "认识长发小寨",
  culture: "品牌与非遗文化",
  product: "产品与核心技术",
  organization: "组织与基础制度",
  certification: "入职认证",
};

const typeConfig: Record<
  Task["type"],
  { icon: React.ReactNode; bg: string; text: string }
> = {
  explore: {
    icon: <Landmark size={14} />,
    bg: "bg-accent-pink/60",
    text: "text-accent-pink-dark",
  },
  challenge: {
    icon: <Swords size={14} />,
    bg: "bg-accent-blue/60",
    text: "text-accent-blue-dark",
  },
  cert: {
    icon: <Award size={14} />,
    bg: "bg-accent-green/60",
    text: "text-status-done",
  },
};

function buildTasks(currentStageId: StageId, statuses: Record<StageId, "completed" | "current" | "locked">): Task[] {
  const tasks: Task[] = [];
  const currentTask = STAGE_TASKS[currentStageId];

  // Task 1: Current stage (urgent, not locked)
  tasks.push({
    id: "current",
    title: currentTask.title,
    type: currentTask.type,
    typeLabel: currentTask.typeLabel,
    due: currentTask.due,
    urgent: true,
    stageId: currentStageId,
  });

  // Task 2: Next locked stage (if exists and not certification)
  const stageOrder: StageId[] = ["welcome", "company", "culture", "product", "organization", "certification"];
  const currentIdx = stageOrder.indexOf(currentStageId);
  if (currentIdx < stageOrder.length - 1) {
    const nextStageId = stageOrder[currentIdx + 1];
    const nextStatus = statuses[nextStageId];
    if (nextStatus === "locked") {
      const nextTask = STAGE_TASKS[nextStageId];
      tasks.push({
        id: "next",
        title: `进入「${STAGE_LABELS_SHORT[nextStageId]}」`,
        type: nextTask.type,
        typeLabel: nextTask.typeLabel,
        due: "完成当前关卡后解锁",
        locked: true,
        stageId: nextStageId,
      });
    }
  }

  // Task 3: Certification (if not current)
  if (currentStageId !== "certification") {
    tasks.push({
      id: "cert",
      title: "完成入职认证，解锁学习天地",
      type: "cert",
      typeLabel: "认证",
      due: "完成全部 6 站后开启",
      locked: true,
      stageId: "certification",
    });
  }

  return tasks;
}

type MyTasksProps = { onViewAll?: () => void };

export default function MyTasks({ onViewAll }: MyTasksProps) {
  const { progress } = useLearningProgress();
  const currentStageId = getCurrentStageId(progress);
  const statuses = getStageStatuses(progress);
  const visibleTasks = buildTasks(currentStageId, statuses);

  return (
    <section className="flex flex-col">
      <div className="mb-4 flex h-8 items-center justify-between">
        <h3 className="text-lg font-semibold text-text-primary">我的任务</h3>
        <button onClick={onViewAll} className="text-sm text-text-secondary hover:text-brand transition-colors duration-200">
          查看全部
        </button>
      </div>

      {/* 轻量容器 — 弱化卡片感 */}
      <div className="app-surface flex flex-col overflow-hidden p-2">
        <div className="flex flex-col">
          {visibleTasks.map((task, idx) => {
            const cfg = typeConfig[task.type];
            const isLast = idx === visibleTasks.length - 1;
            return (
              <div
                key={task.id}
                className={`group flex min-h-[72px] items-center gap-3 rounded-xl px-3 py-3.5 transition-all duration-200 ${
                  task.locked
                    ? "opacity-40 cursor-not-allowed hover:opacity-55"
                    : "hover:bg-bg-canvas/50 cursor-pointer"
                } ${!isLast ? "border-b border-border-faint" : ""}`}
              >
                {/* 图标 — 更轻 */}
                <div
                  className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 ${cfg.text}`}
                >
                  {task.locked ? <Lock size={13} /> : cfg.icon}
                </div>

                {/* 内容 */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium leading-snug mb-0.5 ${
                      task.locked ? "text-text-secondary" : "text-text-primary"
                    }`}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`font-medium ${task.locked ? "text-text-tertiary" : cfg.text}`}>
                      {task.locked ? "锁定" : task.typeLabel}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-border-subtle" />
                    <span
                      className={
                        task.urgent && !task.locked
                          ? "text-brand font-medium"
                          : "text-text-tertiary"
                      }
                    >
                      {task.due}
                    </span>
                  </div>
                </div>

                {/* 箭头 */}
                {!task.locked && (
                  <ChevronRight
                    size={16}
                    className="text-text-tertiary/60 group-hover:text-brand group-hover:translate-x-0.5 shrink-0 transition-all duration-200"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
