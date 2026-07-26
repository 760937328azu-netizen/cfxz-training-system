import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { AdminApp } from "./admin/AdminApp";
import CurrentStation from "./components/CurrentStation";
import GrowthMap from "./components/GrowthMap";
import LearningWorldPreview from "./components/LearningWorldPreview";
import MyTasks from "./components/MyTasks";
import Sidebar from "./components/Sidebar";
import WelcomeArea from "./components/WelcomeArea";
import XiaoyaoCompanion from "./components/XiaoyaoCompanion";
import { learningStages } from "./data/learningData";
import { useHashRoute } from "./hooks/useHashRoute";
import { useLearningProgress, getCurrentStageId, getStorageKey, useProgressSync } from "./hooks/useLearningProgress";
import { useCurrentUser, isLoggedIn as checkIsLoggedIn } from "./hooks/useCurrentUser";
import CertificationPage from "./pages/CertificationPage";
import CompanyPage from "./pages/CompanyPage";
import HistoryPage from "./pages/HistoryPage";
import LearningWorldPage from "./pages/LearningWorldPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import StageDetailPage from "./pages/StageDetailPage";
import CultureMuseumPage from "./pages/CultureMuseumPage";
import RulesStagePage from "./pages/RulesStagePage";
import ProductStagePage from "./pages/ProductStagePage";
import TasksPage from "./pages/TasksPage";
import WelcomePage from "./pages/WelcomePage";

function Header({ onMenuToggle, menuOpen }: { onMenuToggle: () => void; menuOpen: boolean }) {
  const { name: userName, firstChar, subtitle } = useCurrentUser();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between md:justify-end border-b border-border-faint bg-bg-canvas/80 px-4 md:px-8 backdrop-blur-md">
      <button
        type="button"
        className="mobile-menu-btn md:hidden"
        onClick={onMenuToggle}
        aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
        aria-expanded={menuOpen}
      >
        {menuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-accent-blue text-sm font-semibold text-accent-blue-dark">{firstChar}</div><div className="hidden sm:block"><p className="text-sm font-medium leading-tight text-text-primary">{userName}</p><p className="text-xs leading-tight text-text-secondary">{subtitle}</p></div></div>
    </header>
  );
}

function HomePage({ onNavigate }: { onNavigate: (path: string, intent?: "top" | "restore") => void }) {
  const { progress } = useLearningProgress();
  const currentStageId = getCurrentStageId(progress);
  const currentPath = `stage/${currentStageId}`;
  return (
    <div className="content-enter">
      <WelcomeArea onContinue={() => onNavigate(currentPath, "restore")} onEnterLearningWorld={() => onNavigate("learning-world")} />
      <div id="growth-map"><GrowthMap onStageSelect={(stageOrder) => { const stage = learningStages.find((item) => item.order === stageOrder); if (stage) onNavigate(`stage/${stage.id}`); }} /></div>
      <div data-visual="mission-task-grid" className="mb-8 grid grid-cols-1 items-stretch gap-6 lg:grid-cols-3"><div className="h-full lg:col-span-2"><CurrentStation onContinue={() => onNavigate(currentPath, "restore")} onEnterLearningWorld={() => onNavigate("learning-world")} /></div><div className="h-full"><MyTasks onViewAll={() => onNavigate("tasks")} /></div></div>
      <LearningWorldPreview onOpen={() => onNavigate("learning-world")} />
      <div className="h-10" />
    </div>
  );
}

export default function App() {
  const { route } = useHashRoute();

  // ── Admin routing: short-circuit to AdminApp ──
  // Must be the only hook call in App so hook counts stay consistent across routes.
  if (route.name === "admin") {
    return <AdminApp />;
  }

  return <MainApp />;
}

function MainApp() {
  const { route, navigate } = useHashRoute();
  const active = route.name === "stage" ? "stage" : route.name;

  // ── Login gate ──
  // API 模式检查 JWT token，降级模式检查 session 标记
  const [loggedIn, setLoggedIn] = useState(() => checkIsLoggedIn());

  const handleLogin = useCallback(() => {
    setLoggedIn(true);
  }, []);

  // API 模式下，登录后自动从后端同步学习进度
  useProgressSync();

  // ── Mobile navigation drawer ──
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);
  const toggleMobileMenu = useCallback(() => setMobileMenuOpen((prev) => !prev), []);

  // ── Scroll container ref ──
  // The actual scrollable element is `.ambient-page` (overflow-y-auto), NOT window.
  // All scroll reset/restore must target this container.
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // ── Navigation intent system ──
  // "top"     → reset scroll to top (default for all navigations)
  // "restore" → restore to last saved position (used by "继续学习" in Step 3)
  // null      → no intent set (e.g. browser back); defaults to "top"
  const navigationIntentRef = useRef<"top" | "restore" | null>(null);

  // Wrap navigate so callers can specify scroll intent.
  // Also saves current position before navigating away, so "继续学习" can restore it.
  const navigateWithIntent = useCallback(
    (path: string, intent: "top" | "restore" = "top") => {
      // ── Save current position before navigating away ──
      if (route.name === "stage" && route.stageId) {
        try {
          const key = getStorageKey();
          const saved = window.localStorage.getItem(key);
          const progress = saved ? JSON.parse(saved) : null;
          if (progress) {
            // Find which section is currently visible in the viewport
            let lastSection: string | undefined;
            if (scrollContainerRef.current) {
              const container = scrollContainerRef.current;
              const viewTop = container.scrollTop + 120; // offset for header
              // Check all elements with IDs inside the container that belong to this stage
              const allIds = container.querySelectorAll<HTMLElement>("[id]");
              let closestEl: HTMLElement | null = null;
              let closestDist = Infinity;
              for (const el of allIds) {
                const rect = el.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const relTop = rect.top - containerRect.top + container.scrollTop;
                const dist = Math.abs(relTop - viewTop);
                if (dist < closestDist && dist < 600) {
                  closestDist = dist;
                  closestEl = el;
                }
              }
              if (closestEl) {
                lastSection = closestEl.id || undefined;
              }
            }
            progress.lastStage = route.stageId;
            progress.lastSection = lastSection;
            progress.lastVisitedAt = new Date().toISOString();
            window.localStorage.setItem(key, JSON.stringify(progress));
          }
        } catch {
          // ignore save errors
        }
      }

      navigationIntentRef.current = intent;
      navigate(path);
    },
    [navigate, route],
  );

  // Wrapped navigate that also closes the mobile menu on route change
  const navigateWithIntentAndCloseMenu = useCallback(
    (path: string, intent: "top" | "restore" = "top") => {
      closeMobileMenu();
      navigateWithIntent(path, intent);
    },
    [closeMobileMenu, navigateWithIntent],
  );

  useEffect(() => {
    const intent = navigationIntentRef.current;
    navigationIntentRef.current = null; // consume intent

    const resetToTop = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      // Reset immediately and repeat across frames so layout shifts can't restore old position
      const doReset = () => {
        container.scrollTop = 0;
      };
      doReset();
      requestAnimationFrame(doReset);
      requestAnimationFrame(() => requestAnimationFrame(doReset));
      window.scrollTo(0, 0);
    };

    if (intent === "restore") {
      // Try to restore to the last saved scroll section
      try {
        const saved = window.localStorage.getItem(getStorageKey());
        if (saved) {
          const parsed = JSON.parse(saved);
          const lastStage = parsed?.lastStage;
          const lastSection = parsed?.lastSection;
          // Only restore if we're navigating to the same stage
          if (lastSection && route.name === "stage" && route.stageId === lastStage) {
            // Wait for DOM to render, then scroll to the saved section
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                const el = document.getElementById(lastSection);
                const container = scrollContainerRef.current;
                if (el && container) {
                  container.scrollTo({
                    top: el.offsetTop - 80, // offset for sticky header
                    behavior: "auto",
                  });
                  return;
                }
                // Fallback: scroll to top
                resetToTop();
              });
            });
            return;
          }
        }
      } catch {
        // localStorage read failed — fall through to default
      }
      // No saved position or different stage — scroll to top
      resetToTop();
    } else {
      // Default: reset the REAL scroll container to top, not just window
      resetToTop();
    }

    // Special case: navigating to #/map scrolls the ambient-page container to the growth map section
    if (window.location.hash === "#/map") {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const el = document.getElementById("growth-map");
          const container = scrollContainerRef.current;
          if (el && container) {
            container.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
          }
        });
      });
    }
  }, [route]);

  const pageTitle = route.name === "stage"
    ? learningStages.find((stage) => stage.id === route.stageId)?.title ?? "关卡详情"
    : route.name === "tasks" ? "我的成长提醒"
    : route.name === "certification" ? "入职认证"
    : route.name === "learning-world" ? "学习天地"
    : route.name === "history" ? "学习记录"
    : route.name === "profile" ? "个人中心"
    : "新人首页";

  if (!loggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-canvas">
      <div className={`mobile-nav-backdrop ${mobileMenuOpen ? "is-open" : ""}`} onClick={closeMobileMenu} aria-hidden="true" />
      <Sidebar active={active} onNavigate={navigateWithIntentAndCloseMenu} isOpen={mobileMenuOpen} onClose={closeMobileMenu} />
      <main className="relative flex min-w-0 flex-1 flex-col">
        <Header onMenuToggle={toggleMobileMenu} menuOpen={mobileMenuOpen} />
        <div ref={scrollContainerRef} className="ambient-page relative flex-1 overflow-y-auto" onClick={closeMobileMenu}>
          <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-8 md:py-7">
            {route.name === "home" && <HomePage onNavigate={navigateWithIntentAndCloseMenu} />}
            {route.name === "stage" && (route.stageId === "welcome" ? <WelcomePage onNavigate={navigateWithIntentAndCloseMenu} /> : route.stageId === "company" ? <CompanyPage onNavigate={navigateWithIntentAndCloseMenu} /> : route.stageId === "culture" ? <CultureMuseumPage onNavigate={navigateWithIntentAndCloseMenu} /> : route.stageId === "product" ? <ProductStagePage onNavigate={navigateWithIntentAndCloseMenu} /> : route.stageId === "organization" ? <RulesStagePage onNavigate={navigateWithIntentAndCloseMenu} /> : <StageDetailPage stageId={route.stageId} onNavigate={navigateWithIntentAndCloseMenu} />)}
            {route.name === "tasks" && <TasksPage onNavigate={navigateWithIntentAndCloseMenu} />}
            {route.name === "certification" && <CertificationPage onNavigate={navigateWithIntentAndCloseMenu} />}
            {route.name === "learning-world" && <LearningWorldPage onNavigate={navigateWithIntentAndCloseMenu} />}
            {route.name === "history" && <HistoryPage />}
            {route.name === "profile" && <ProfilePage />}
          </div>
        </div>
      </main>
      <XiaoyaoCompanion pageTitle={pageTitle} />
    </div>
  );
}
