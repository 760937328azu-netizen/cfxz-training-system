import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, Lock } from "lucide-react";
import { useLearningProgress, getStageStatuses, getCompletedCount, type StageId } from "../hooks/useLearningProgress";

type StageStatus = "completed" | "current" | "locked";
type Stage = { id: number; stageId: StageId; title: string; subtitle: string; badge: string; status: StageStatus };
type Point = { x: number; y: number };

const STAGE_DEFS: Omit<Stage, "status">[] = [
  { id: 1, stageId: "welcome", title: "欢迎加入", subtitle: "开启新人旅程", badge: "/stages/stage-01-welcome.png" },
  { id: 2, stageId: "company", title: "认识长发小寨", subtitle: "认识品牌从哪里来", badge: "/stages/stage-02-brand-origin.png" },
  { id: 3, stageId: "culture", title: "认识品牌与非遗文化", subtitle: "探索红瑶文化与非遗技艺", badge: "/stages/stage-03-museum.png" },
  { id: 4, stageId: "product", title: "认识产品与核心技术", subtitle: "理解产品与核心技术", badge: "/stages/stage-04-org.png" },
  { id: 5, stageId: "organization", title: "认识组织与基础制度", subtitle: "熟悉组织协作与制度", badge: "/stages/stage-05-rules.png" },
  { id: 6, stageId: "certification", title: "完成新人认证", subtitle: "完成认证，开启学习天地", badge: "/stages/stage-06-certificate.png" },
];

const MAP_POINTS = [
  { x: 0.279, y: 0.768 },
  { x: 0.22, y: 0.329 },
  { x: 0.505, y: 0.407 },
  { x: 0.699, y: 0.745 },
  { x: 0.688, y: 0.334 },
  { x: 0.854, y: 0.316 },
];
const clamp = (min: number, value: number, max: number) => Math.min(max, Math.max(min, value));

function buildSmoothPath(points: Point[]) {
  if (!points.length) return "";
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return path;
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const update = () => setWidth(element.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

type StageNodeProps = {
  stage: Stage;
  point: Point;
  badgeSize: number;
  infoWidth: number;
  index: number;
  onSelect?: (stageId: number) => void;
};

function StageNode({ stage, point, badgeSize, infoWidth, index, onSelect }: StageNodeProps) {
  const isCurrent = stage.status === "current";
  const isCompleted = stage.status === "completed";
  const isLocked = stage.status === "locked";
  const status = isCurrent ? "当前探索中" : isCompleted ? "已完成" : "待解锁";
  const nodeStyle = {
    "--node-x": `${point.x}px`,
    "--node-y": `${point.y}px`,
    "--badge-size": `${badgeSize}px`,
    "--info-width": `${infoWidth}px`,
    "--enter-delay": `${100 + index * 90}ms`,
  } as CSSProperties;

  return (
    <button
      type="button"
      className={`growth-stage-node is-${stage.status}`}
      style={nodeStyle}
      data-stage-id={stage.id}
      data-stage-status={stage.status}
      onClick={() => onSelect?.(stage.id)}
      aria-label={`${stage.title}，${status}`}
    >
      <div className="stage-badge-anchor">
        <div className="stage-badge-visual">
          {isCurrent && <span className="stage-current-glow" aria-hidden="true" />}
          <img className="stage-badge-image" src={stage.badge} alt={stage.title} />
          {isCompleted && <span className="stage-badge-state is-complete" aria-label="已完成"><Check size={14} strokeWidth={3} /></span>}
          {isLocked && <span className="stage-badge-state is-locked" aria-label="待解锁"><Lock size={12} /></span>}
        </div>
      </div>

      <div className="stage-info">
        <p>{stage.subtitle}</p>
        <span className={`stage-status is-${stage.status}`}>
          {isCompleted && <Check size={11} strokeWidth={3} />}
          {isLocked && <Lock size={10} />}
          {status}
        </span>
      </div>
    </button>
  );
}

type GrowthMapProps = { onStageSelect?: (stageId: number) => void };

export default function GrowthMap({ onStageSelect }: GrowthMapProps) {
  const { progress } = useLearningProgress();
  const { ref, width } = useElementWidth<HTMLDivElement>();

  const stageStatuses = useMemo(() => getStageStatuses(progress), [progress]);
  const completedCount = useMemo(() => getCompletedCount(progress), [progress]);

  const displayStages = useMemo<Stage[]>(() =>
    STAGE_DEFS.map((def) => ({ ...def, status: stageStatuses[def.stageId] })),
    [stageStatuses]
  );

  const completedNodeCount = useMemo(() => {
    // Count how many consecutive stages from the start are completed
    let count = 0;
    for (const def of STAGE_DEFS) {
      if (stageStatuses[def.stageId] === "completed") count++;
      else break;
    }
    return count;
  }, [stageStatuses]);

  const geometry = useMemo(() => {
    const measuredWidth = width || 1040;
    const height = clamp(520, measuredWidth / 2, 720);
    const badgeSize = clamp(86, measuredWidth * 0.088, 106);
    const infoWidth = clamp(120, measuredWidth * 0.125, 150);
    const points = MAP_POINTS.map((point) => ({ x: measuredWidth * point.x, y: height * point.y }));
    return {
      width: measuredWidth,
      height,
      badgeSize,
      infoWidth,
      points,
      fullPath: buildSmoothPath(points),
      completedPath: buildSmoothPath(points.slice(0, Math.max(completedNodeCount, 1))),
    };
  }, [width, completedNodeCount]);

  return (
    <section className="mb-8" data-testid="growth-map-section">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="text-xl font-semibold text-text-primary">我的入职成长地图</h3>
            <span className="rounded-full bg-brand-light px-2.5 py-0.5 text-sm font-medium text-brand">{completedCount} / 6 站</span>
          </div>
          <p className="text-sm text-text-secondary">完成全部探索并获得入职认证，即可开启属于你的「学习天地」</p>
        </div>
      </div>

      <div className="growth-map-shell rounded-[2rem] border border-border-subtle shadow-soft highlight-top">
        <div className="growth-map-atmosphere" aria-hidden="true">
          <span className="map-haze haze-warm" />
          <span className="map-haze haze-cool" />
        </div>

        <div ref={ref} className="growth-map-canvas" style={{ height: `${geometry.height}px` }} data-map-width={Math.round(geometry.width)} data-map-height={Math.round(geometry.height)}>
          <div className="growth-map-scene" aria-hidden="true">
            <img src="/assets/growth-map/changfa-micro-world-v2-transparent.png" alt="" />
            <span className="growth-map-locked-mist" />
          </div>
          {width > 0 && (
            <svg className="growth-map-paths" width={geometry.width} height={geometry.height} viewBox={`0 0 ${geometry.width} ${geometry.height}`} aria-hidden="true">
              <defs>
                <linearGradient id="growth-path-complete" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#C4685D" />
                  <stop offset="100%" stopColor="#B0453A" />
                </linearGradient>
              </defs>
              <path className="growth-path-road-shadow" d={geometry.fullPath} />
              <path className="growth-path-road" d={geometry.fullPath} />
              <path className="growth-path-pending" d={geometry.fullPath} />
              <path className="growth-path-complete animate-path-draw" d={geometry.completedPath} pathLength="1" />
            </svg>
          )}

          {width > 0 && displayStages.map((stage, index) => (
            <StageNode key={stage.id} stage={stage} point={geometry.points[index]} badgeSize={geometry.badgeSize} infoWidth={geometry.infoWidth} index={index} onSelect={onStageSelect} />
          ))}
        </div>

        <div className="growth-map-legend">
          <div className="flex items-center gap-5 text-xs text-text-tertiary">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border border-status-done/20 bg-accent-green" />已完成</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-brand" />当前探索</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-text-tertiary/30" />待解锁</span>
          </div>
          <span className="text-xs text-text-tertiary">顺序解锁 · 不可跳过</span>
        </div>
      </div>
    </section>
  );
}
