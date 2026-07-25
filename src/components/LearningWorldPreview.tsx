import { BookOpen, Lock, Package, Building, ClipboardCheck, Glasses, TrendingUp } from "lucide-react";
import { useLearningProgress } from "../hooks/useLearningProgress";

const futureModules = [
  { icon: <Package size={16} />, label: "产品知识" },
  { icon: <Building size={16} />, label: "企业文化" },
  { icon: <ClipboardCheck size={16} />, label: "管理制度" },
  { icon: <Glasses size={16} />, label: "VR 云游" },
  { icon: <TrendingUp size={16} />, label: "岗位成长" },
];

type LearningWorldPreviewProps = { onOpen?: () => void };

export default function LearningWorldPreview({ onOpen }: LearningWorldPreviewProps) {
  const { progress } = useLearningProgress();
  const isUnlocked = progress.learningWorldUnlocked;

  return (
    <section className="mb-8">
      <button type="button" onClick={onOpen} className="relative block w-full overflow-hidden rounded-[2rem] border border-border-subtle text-left highlight-top transition-transform duration-200 hover:-translate-y-0.5">
        {/* 氛围背景 — 像透过雾看到的前方世界 */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#F6F3EE] via-[#F2EEE8] to-[#EDE8E1]" />

        {/* 柔和光晕 */}
        <div
          className="absolute top-[10%] right-[15%] w-[40%] h-[60%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(212,160,23,0.05), transparent 60%)" }}
        />
        <div
          className="absolute bottom-[0%] left-[20%] w-[30%] h-[40%] pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(74,127,193,0.025), transparent 60%)" }}
        />

        {/* 未来路径视觉 — 极淡曲线 */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.2] pointer-events-none" viewBox="0 0 1100 300" preserveAspectRatio="none" fill="none">
          <path d="M 50 250 Q 200 180, 350 220 T 700 200 T 1050 180" stroke="#C4B8A8" strokeWidth="1" strokeDasharray="3 14" />
          <path d="M 50 200 Q 250 130, 450 170 T 800 150 T 1050 120" stroke="#C4B8A8" strokeWidth="0.6" strokeDasharray="2 16" opacity="0.6" />
        </svg>

        <div className="relative px-8 py-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-text-secondary/80 mb-1.5">
                {isUnlocked ? (
                  <>学习天地已开启<span className="text-text-primary/90"> ，欢迎探索</span></>
                ) : (
                  <>完成入职探索<span className="text-text-primary/90"> ，开启你的学习天地</span></>
                )}
              </h3>
              <p className="text-sm text-text-tertiary leading-relaxed">
                {isUnlocked
                  ? "你已经获得入职认证，一个更广阔的成长世界已正式向你开放"
                  : "获得入职认证后，一个更广阔的成长世界将正式向你开放"}
              </p>
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border shrink-0 ${isUnlocked ? "bg-[#EAF2EC]/80 text-[#4C795E] border-white/60" : "text-text-tertiary bg-[#F7F5F0]/80 border-white/60"}`}>
              {isUnlocked ? <BookOpen size={12} /> : <Lock size={12} />}
              <span>{isUnlocked ? "已解锁" : "完成新人认证后解锁"}</span>
            </div>
          </div>

          {/* 未来模块 — 轻量标签，不是卡片 */}
          <div className="flex flex-wrap gap-3 mb-2">
            {futureModules.map((mod, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border backdrop-blur-sm transition-all duration-200 ${isUnlocked ? "bg-[#F7F5F0]/90 border-white/70 opacity-100 hover:opacity-90 hover:border-brand/15" : "bg-[#F7F5F0]/80 border-white/60 opacity-80 hover:opacity-100"}`}
              >
                <span className={isUnlocked ? "text-brand/80" : "text-text-tertiary/90"}>{mod.icon}</span>
                <span className="text-sm font-medium text-text-secondary">{mod.label}</span>
              </div>
            ))}
          </div>

          {/* 底部轻量提示 */}
          <p className="text-xs text-text-tertiary/60 mt-3">
            {isUnlocked
              ? "点击进入，开始你的持续学习之旅"
              : <>还有 <span className="font-medium text-text-tertiary/80">4 站</span> 即将抵达 —— 继续你的新人探索旅程</>}
          </p>
        </div>
      </button>
    </section>
  );
}
