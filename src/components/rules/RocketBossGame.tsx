import { useEffect, useRef, useState } from "react";
import { rocketWords } from "../../data/rulesGameData";

type RocketStatus = { label: string };
type RocketRuntime = { destroy: () => void; restart?: () => void };
type RocketMountOptions = {
  root: HTMLElement;
  negativeWords: { id: string; text: string }[];
  positiveWords: { id: string; text: string }[];
  completed: boolean;
  onStatus: (status: RocketStatus) => void;
  onComplete: () => void;
};

declare global {
  interface Window {
    CFXZRocketGame?: { mount: (options: RocketMountOptions) => RocketRuntime };
  }
}

let rocketLoader: Promise<void> | null = null;
function loadRocketEngine() {
  if (window.CFXZRocketGame) return Promise.resolve();
  if (rocketLoader) return rocketLoader;
  rocketLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-cfxz-rocket-engine]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("rocket engine failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "/legacy/rocket-game.js";
    script.async = true;
    script.dataset.cfxzRocketEngine = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("rocket engine failed"));
    document.head.appendChild(script);
  });
  return rocketLoader;
}

export default function RocketBossGame({ completed, onComplete }: { completed: boolean; onComplete: () => void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const completionRef = useRef(onComplete);
  const [status, setStatus] = useState(completed ? "已通关" : "准备开始");
  const [loadError, setLoadError] = useState(false);

  useEffect(() => { completionRef.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let runtime: RocketRuntime | null = null;
    let disposed = false;
    loadRocketEngine().then(() => {
      if (disposed || !rootRef.current || !window.CFXZRocketGame) return;
      runtime = window.CFXZRocketGame.mount({
        root: rootRef.current,
        negativeWords: rocketWords.filter((word) => word.negative).map(({ id, text }) => ({ id, text })),
        positiveWords: rocketWords.filter((word) => !word.negative).map(({ id, text }) => ({ id, text })),
        completed,
        onStatus: (next) => setStatus(next.label),
        onComplete: () => completionRef.current(),
      });
    }).catch(() => setLoadError(true));
    return () => {
      disposed = true;
      runtime?.destroy();
    };
  }, []);

  return (
    <div className="rules-game-panel" data-game="rocketBoss">
      <div className="rules-game-panel-head"><div><span>GAME 01</span><h3>制度守卫战</h3></div><strong>{status}</strong></div>
      <p className="rules-game-intro">识别两波违规行为敌机，主动发射导弹，最终击败「秩序破坏者·违规机甲」。</p>
      {loadError ? <div className="rules-game-error">射击舞台加载失败，请返回大厅后重试。</div> : <div ref={rootRef} className="rules-rocket-root" />}
      <p className="rules-game-help">桌面端：A / D 或方向键移动，空格发射；移动端拖动火箭并点击发射。Boss 血量只由真实子弹碰撞减少。</p>
    </div>
  );
}
