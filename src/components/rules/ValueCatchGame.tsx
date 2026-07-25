import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import { valueCatchWords } from "../../data/rulesGameData";

type FallingObject = {
  node: HTMLDivElement;
  word: (typeof valueCatchWords)[number];
  x: number;
  y: number;
  speed: number;
  done: boolean;
};

export default function ValueCatchGame({ caughtWords, completed, onCatch, onComplete, onReset }: {
  caughtWords: string[];
  completed: boolean;
  onCatch: (wordId: string) => void;
  onComplete: () => void;
  onReset: () => void;
}) {
  const arenaRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const catcherRef = useRef<HTMLDivElement>(null);
  const caughtRef = useRef(new Set(caughtWords));
  const objectsRef = useRef<FallingObject[]>([]);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const livesRef = useRef(3);
  const spawnCountRef = useRef(0);
  const lastFrameRef = useRef(0);
  const nextSpawnRef = useRef(0);
  const targetXRef = useRef(0);
  const currentXRef = useRef(0);
  const pointerActiveRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(caughtWords.length);
  const [feedback, setFeedback] = useState("移动小瑶接住正向词，避开负面词。");

  useEffect(() => {
    caughtRef.current = new Set(caughtWords);
    setScore(caughtWords.length);
  }, [caughtWords]);

  const stop = () => {
    runningRef.current = false;
    setRunning(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const clearObjects = () => {
    objectsRef.current.forEach((object) => object.node.remove());
    objectsRef.current = [];
    if (layerRef.current) layerRef.current.innerHTML = "";
  };

  const moveTo = (x: number) => {
    const arena = arenaRef.current;
    if (!arena) return;
    targetXRef.current = Math.min(Math.max(46, x), Math.max(46, arena.clientWidth - 46));
  };

  const spawn = (timestamp: number) => {
    const arena = arenaRef.current;
    const layer = layerRef.current;
    if (!arena || !layer) return;
    const remainingPositive = valueCatchWords.find((word) => word.positive && !caughtRef.current.has(word.id));
    let word: (typeof valueCatchWords)[number] | undefined;
    if (spawnCountRef.current % 3 === 2) {
      const negatives = valueCatchWords.filter((item) => !item.positive);
      word = negatives[spawnCountRef.current % negatives.length];
    } else {
      word = remainingPositive;
    }
    if (!word) {
      stop();
      onComplete();
      return;
    }
    const lane = (spawnCountRef.current * 2 + 1) % 3;
    const x = (lane + 0.5) * arena.clientWidth / 3;
    const node = document.createElement("div");
    node.className = `rules-falling-word ${word.positive ? "is-positive" : "is-negative"}`;
    node.textContent = word.text;
    node.dataset.catchWord = word.id;
    node.dataset.catchKind = word.positive ? "positive" : "negative";
    layer.appendChild(node);
    objectsRef.current.push({ node, word, x, y: -48, speed: word.positive ? 122 : 138, done: false });
    spawnCountRef.current += 1;
    nextSpawnRef.current = timestamp + 720;
  };

  const resolveObject = (object: FallingObject) => {
    const arena = arenaRef.current;
    if (!arena) return;
    object.done = true;
    const collided = Math.abs(object.x - targetXRef.current) <= 58 && object.y >= arena.clientHeight - 126;
    if (object.word.positive && collided) {
      caughtRef.current.add(object.word.id);
      onCatch(object.word.id);
      setScore(caughtRef.current.size);
      object.node.classList.add("is-caught");
      setFeedback(`接住了“${object.word.text}”，得分增加。`);
    } else if (object.word.positive) {
      object.node.classList.add("is-missed");
      setFeedback(`错过了“${object.word.text}”，它还会再次出现。`);
    } else if (collided) {
      livesRef.current -= 1;
      setLives(livesRef.current);
      object.node.classList.add("is-caught");
      setFeedback(`碰到了负面词“${object.word.text}”，生命减少。`);
    } else {
      object.node.classList.add("is-missed");
      setFeedback(`成功避开负面词“${object.word.text}”。`);
    }
    window.setTimeout(() => object.node.remove(), 180);
    if (caughtRef.current.size >= 6 && livesRef.current > 0) {
      stop();
      onComplete();
      setFeedback("接住了 6 个正向词，挑战完成！");
    } else if (livesRef.current <= 0) {
      stop();
      setFeedback("生命值用完了，可以重新挑战。");
    }
  };

  const loop = (timestamp: number) => {
    if (!runningRef.current) return;
    if (!lastFrameRef.current) lastFrameRef.current = timestamp;
    const delta = Math.min(34, timestamp - lastFrameRef.current) / 1000;
    lastFrameRef.current = timestamp;
    if (!nextSpawnRef.current || timestamp >= nextSpawnRef.current) spawn(timestamp);
    currentXRef.current += (targetXRef.current - currentXRef.current) * 0.18;
    if (catcherRef.current) catcherRef.current.style.transform = `translate3d(${currentXRef.current - 46}px,0,0)`;
    const arenaHeight = arenaRef.current?.clientHeight ?? 320;
    objectsRef.current = objectsRef.current.filter((object) => {
      if (object.done) return false;
      object.y += object.speed * delta;
      object.node.style.transform = `translate3d(${object.x - 44}px,${object.y}px,0)`;
      if (object.y >= arenaHeight - 98) {
        resolveObject(object);
        return false;
      }
      return true;
    });
    if (runningRef.current) rafRef.current = requestAnimationFrame(loop);
  };

  const start = () => {
    if (completed || caughtRef.current.size >= 6) {
      onComplete();
      return;
    }
    clearObjects();
    const width = arenaRef.current?.clientWidth ?? 600;
    targetXRef.current = width / 2;
    currentXRef.current = width / 2;
    livesRef.current = 3;
    spawnCountRef.current = 0;
    lastFrameRef.current = 0;
    nextSpawnRef.current = 0;
    setLives(3);
    setFeedback("游戏开始。看准词语落点，移动小瑶。");
    runningRef.current = true;
    setRunning(true);
    rafRef.current = requestAnimationFrame(loop);
    arenaRef.current?.focus();
  };

  const reset = () => {
    stop();
    clearObjects();
    caughtRef.current.clear();
    setScore(0);
    setLives(3);
    setFeedback("进度已重置，准备重新接词。");
    onReset();
  };

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (!runningRef.current) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") event.preventDefault();
      if (event.key === "ArrowLeft") moveTo(targetXRef.current - 44);
      if (event.key === "ArrowRight") moveTo(targetXRef.current + 44);
    };
    const pointerMove = (event: PointerEvent) => {
      if (!pointerActiveRef.current || !arenaRef.current) return;
      moveTo(event.clientX - arenaRef.current.getBoundingClientRect().left);
    };
    const pointerUp = () => { pointerActiveRef.current = false; };
    window.addEventListener("keydown", keydown);
    window.addEventListener("pointermove", pointerMove);
    window.addEventListener("pointerup", pointerUp);
    window.addEventListener("pointercancel", pointerUp);
    return () => {
      stop();
      clearObjects();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("pointermove", pointerMove);
      window.removeEventListener("pointerup", pointerUp);
      window.removeEventListener("pointercancel", pointerUp);
    };
  }, []);

  return (
    <div className="rules-game-panel" data-game="valueCatch">
      <div className="rules-game-panel-head"><div><span>GAME 03</span><h3>小瑶接价值观</h3></div><strong>得分 {score}/6 · 生命 {lives}</strong></div>
      <p className="rules-game-intro">正向词从顶部落下时移动小瑶接住；避开负面词。错过的正向词会继续出现。</p>
      <div className="rules-catch-score"><span>正向词 {score}/6</span><span>生命 {lives}/3</span></div>
      <div ref={arenaRef} tabIndex={0} className="rules-catch-arena" onPointerDown={(event) => { pointerActiveRef.current = true; moveTo(event.clientX - event.currentTarget.getBoundingClientRect().left); }}>
        <div className="rules-catch-lanes"><span /><span /><span /></div>
        <div ref={layerRef} className="rules-falling-layer" />
        <div ref={catcherRef} className="rules-xiaoyao-catcher"><img src="/xiaoyao/transparent/1.png" alt="小瑶" /><strong>小瑶</strong></div>
      </div>
      <div className="rules-catch-controls">
        <button type="button" onClick={() => moveTo(targetXRef.current - 66)} aria-label="向左移动"><ArrowLeft size={18} /></button>
        <button type="button" className="is-primary" onClick={start} disabled={running}>{completed ? "已通关" : running ? "挑战中" : "开始接价值观"}</button>
        <button type="button" onClick={() => moveTo(targetXRef.current + 66)} aria-label="向右移动"><ArrowRight size={18} /></button>
        <button type="button" onClick={reset}><RotateCcw size={15} />重新开始</button>
      </div>
      <p className="rules-game-feedback-text">{feedback}</p>
    </div>
  );
}
