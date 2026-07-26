import { Award, BookOpen, ClipboardList, History, Home, Lock, Map, User, X } from "lucide-react";
import { useLearningProgress } from "../hooks/useLearningProgress";

type SidebarProps = {
  active: string;
  onNavigate: (path: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
};

const onboardingNav = [
  { icon: Home, label: "首页", id: "home", path: "home" },
  { icon: Map, label: "新人成长地图", id: "map", path: "map" },
  { icon: ClipboardList, label: "我的任务", id: "tasks", path: "tasks" },
  { icon: Award, label: "入职认证", id: "certification", path: "certification", locked: true },
];

const secondaryNav = [
  { icon: History, label: "学习记录", id: "history", path: "history" },
  { icon: User, label: "个人中心", id: "profile", path: "profile" },
];

export default function Sidebar({ active, onNavigate, isOpen, onClose }: SidebarProps) {
  const { progress } = useLearningProgress();
  const learningWorldUnlocked = progress.learningWorldUnlocked;
  return (
    <aside className={`app-sidebar ${isOpen ? "is-open" : ""} flex h-full flex-col border-r border-border-nav/60 bg-bg-nav`}>
      <button
        type="button"
        className="mobile-sidebar-close"
        onClick={onClose}
        aria-label="关闭菜单"
      >
        <X size={20} />
      </button>

      <div className="pointer-events-none absolute left-0 top-0 h-[140px] w-full bg-[radial-gradient(ellipse_at_50%_0%,rgba(211,154,112,.12),transparent_72%)]" />

      <button onClick={() => onNavigate("home")} className="relative flex items-center gap-3 px-6 pb-6 pt-7 text-left">
        <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl">
          <img
            src="/logo/cfxz-logo-brown.png"
            alt="长发小寨"
            className="h-9 w-9 object-contain drop-shadow-[0_2px_6px_rgba(73,50,35,.08)]"
            draggable={false}
          />
        </span>
        <span><span className="block text-base font-semibold leading-tight tracking-tight text-text-primary">学习成长</span><span className="mt-0.5 block text-[11px] leading-tight text-text-tertiary">长发小寨 · 成长系统</span></span>
      </button>

      <nav className="flex-1 overflow-y-auto px-3">
        <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[.12em] text-text-tertiary/80">入职探索</p>
        <ul className="mb-6 space-y-0.5">
          {onboardingNav.map((item) => {
            const Icon = item.icon;
            const selected = active === item.id || (item.id === "home" && active === "stage");
            const locked = item.id === "certification" ? !progress.rules.completed : item.locked;
            return <li key={item.id}><button onClick={() => { if (locked) return; onNavigate(item.path); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${selected ? "bg-bg-nav-active text-text-nav-active shadow-[0_1px_2px_rgba(176,69,58,.06)]" : "text-text-nav hover:bg-bg-nav-hover hover:text-text-primary"}`}><Icon size={18} /><span className="flex-1 text-left">{item.label}</span>{locked && <Lock size={12} className="text-text-tertiary/50" />}</button></li>;
          })}
        </ul>

        <div className="mb-1.5 px-3"><div className="h-px bg-border-nav/80" /></div>
        <p className="mb-1.5 px-3 text-[10px] font-medium uppercase tracking-[.12em] text-text-tertiary/80">学习天地</p>
        {learningWorldUnlocked ? (
          <button onClick={() => onNavigate("learning-world")} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${active === "learning-world" ? "bg-bg-nav-active text-text-nav-active shadow-[0_1px_2px_rgba(176,69,58,.06)]" : "text-text-nav hover:bg-bg-nav-hover hover:text-text-primary"}`}><BookOpen size={18} /><span className="flex-1 text-left">学习天地</span></button>
        ) : (
          <button onClick={() => onNavigate("learning-world")} className={`flex w-full items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 text-[13px] font-medium transition-all ${active === "learning-world" ? "border-brand/20 bg-brand-light/45 text-brand" : "border-border-nav text-text-tertiary/65 hover:border-border-subtle hover:bg-bg-nav-hover/60"}`}><Lock size={17} /><span className="flex-1 text-left">完成认证后开启</span></button>
        )}
      </nav>

      <div className="px-5 py-3"><div className="h-px bg-border-nav/80" /></div>
      <nav className="px-3 pb-5"><ul className="space-y-0.5">{secondaryNav.map((item) => { const Icon = item.icon; return <li key={item.id}><button onClick={() => onNavigate(item.path)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${active === item.id ? "bg-bg-nav-active text-text-nav-active" : "text-text-nav hover:bg-bg-nav-hover hover:text-text-primary"}`}><Icon size={18} /><span>{item.label}</span></button></li>; })}</ul></nav>
    </aside>
  );
}
