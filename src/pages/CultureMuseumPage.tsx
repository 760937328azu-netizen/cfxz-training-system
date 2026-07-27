import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Landmark, Lock, Sparkles } from "lucide-react";
import XiaoyaoDialogue from "../components/XiaoyaoDialogue";
import { cultureExhibits, type CultureExhibit } from "../data/cultureStageData";
import { useLearningProgress, type CultureExhibitId } from "../hooks/useLearningProgress";

type CultureMuseumPageProps = { onNavigate: (path: string) => void };

function FactStrip({ exhibit }: { exhibit: CultureExhibit }) {
  return (
    <section className="culture-knowledge-strip" aria-label="核心知识点">
      {exhibit.facts.map((fact) => (
        <article key={fact.label}>
          <div className="flex items-center gap-2">
            <h4 data-typography-check className="zh-title">{fact.label}</h4>
          </div>
          <p data-typography-check className="zh-body">{fact.detail}</p>
        </article>
      ))}
    </section>
  );
}

const hairstyles = [
  {
    name: "闺中秀",
    subtitle: "少女时期的长发记忆",
    description: "在红瑶传统文化中，未婚少女会将长发盘起，并用黑色刺绣头巾包裹。这时的长发被珍藏起来，记录着少女阶段独有的时光。",
    memory: "长发藏于头巾之中，记录少女时光。",
    className: "is-maiden",
    image: "/hairstyles/guizhongxiu-uniform.png",
  },
  {
    name: "螺丝发",
    subtitle: "进入婚姻后的身份变化",
    description: "出嫁后的红瑶女性，会将长发盘绕在头部，形成独特的螺旋状盘发。从隐藏在头巾里的长发，到被看见的盘发，发式也记录着人生阶段的变化。",
    memory: "长发盘成螺旋，开启人生新阶段。",
    className: "is-spiral",
    image: "/hairstyles/luosifa-uniform.png",
  },
  {
    name: "乌龙盘发",
    subtitle: "成熟人生阶段的文化印记",
    description: "乌龙盘发是红瑶传统发式中具有代表性的文化符号。它最大的特点，是额前突出的发髻，这也是区别不同人生阶段的重要特征。",
    memory: "一枚额前发髻，记录人生的重要变化。",
    className: "is-wulong",
    image: "/hairstyles/wulongpanfa-uniform.png",
  },
];

function HairCultureStory() {
  return (
    <div data-exhibit-visual="long-hair" className="space-y-7">
      <section className="culture-story-layout is-hair">
        <div className="culture-story-visual is-photo">
          <img
            src="/images/hongyao-women-culture.png"
            alt="红瑶女性展示传统长发文化"
            loading="lazy"
            className="culture-story-photo"
          />
          <div className="culture-story-photo-overlay" aria-hidden="true" />
          <div className="culture-story-photo-caption">
            <strong className="zh-title" data-typography-check>红瑶女性与长发文化</strong>
            <span className="zh-body" data-typography-check>从真实人物与生活出发，理解红瑶长发文化。</span>
          </div>
        </div>
        <div className="culture-story-copy">
          <p className="culture-kicker">Core story</p>
          <h3 className="zh-title" data-typography-check>长发为什么不只是一种外在形象？</h3>
          <p className="zh-body culture-story-paragraph" data-typography-check>{cultureExhibits[0].story}</p>
          <div className="culture-story-takeaway"><span>先理解真实文化</span><ArrowRight size={15} /><span>再理解品牌连接</span></div>
        </div>
      </section>

      <section className="culture-hairstyle-section">
        <div className="culture-section-heading"><div><p className="culture-kicker">Life stories</p><h3 className="zh-title" data-typography-check>一缕长发，记录一生故事</h3></div><span>三种传统发式</span></div>
        <div className="culture-hairstyle-rail">
          {hairstyles.map((item) => (
            <div key={item.name} className={`culture-hairstyle-item ${item.className}`}>
              <div className="culture-hair-symbol" aria-hidden="true">
                <img src={item.image} alt={item.name} loading="lazy" />
              </div>
              <div className="culture-hairstyle-copy">
                <strong className="zh-title" data-typography-check>{item.name}</strong>
                <span className="culture-hairstyle-subtitle zh-title" data-typography-check>{item.subtitle}</span>
                <p className="culture-hairstyle-description zh-body" data-typography-check>{item.description}</p>
                <p className="culture-hairstyle-memory zh-body" data-typography-check>{item.memory}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="culture-conclusion" aria-label="文化小结">
        <p className="culture-kicker">文化小结</p>
        <p className="zh-body" data-typography-check>从少女到成熟人生阶段，一头长发也成为红瑶女性记录生命故事的一种方式。</p>
        <p className="zh-body" data-typography-check>长发小寨希望把这份东方长发文化，用新的方式传递给更多人。</p>
      </section>
    </div>
  );
}

function LogoStoryInteraction({ done, onReady }: { done: boolean; onReady: () => void }) {
  const [revealed, setRevealed] = useState(done);
  const reveal = () => { setRevealed(true); onReady(); };
  return (
    <div data-exhibit-visual="logo-story" className="space-y-7">
      <section className="culture-museum-story">
        <div><p className="culture-kicker">Core story</p><h3 className="zh-title" data-typography-check>一个从文化中生长出来的品牌符号</h3></div>
        <p className="zh-body culture-story-paragraph" data-typography-check>{cultureExhibits[1].story}</p>
      </section>
      <section className={`culture-memory-interaction ${revealed ? "is-revealed" : ""}`}>
        <div className="culture-memory-stage" aria-hidden="true">
          <div className="culture-memory-layer is-comic">
            <img src="/images/logo-origin-comic.png" alt="乌龙盘发漫画造型" />
          </div>
          <div className="culture-memory-layer is-logo">
            <img src="/logo/cfxz-logo-brown.png" alt="长发小寨品牌标识" />
          </div>
        </div>
        <div className="culture-memory-copy">
          <p className="culture-kicker">核心记忆互动</p>
          <h3 className="zh-title" data-typography-check>刚刚看到的发型，你有没有觉得有一点熟悉？</h3>
          <p className="zh-body" data-typography-check>{revealed ? "长发小寨 Logo 设计灵感来源于红瑶传统乌龙盘发。" : "点击后观察乌龙盘发漫画造型如何渐渐演化为品牌 Logo，理解它们之间的视觉连接。"}</p>
          <button type="button" onClick={reveal} className="app-button-primary mt-5">{revealed ? <Check size={15} /> : <Sparkles size={15} />}{revealed ? "已发现品牌符号" : "点击发现秘密"}</button>
        </div>
      </section>
    </div>
  );
}

const craftSteps = [
  { label: "取米", image: "/rice-steps/qu-mi.png" },
  { label: "淘洗", image: "/rice-steps/tao-xi.png" },
  { label: "发酵", image: "/rice-steps/fa-jiao.png" },
  { label: "检查", image: "/rice-steps/jian-cha.png" },
  { label: "提取", image: "/rice-steps/ti-qu.png" },
];
function RiceWaterInteraction({ done, onReady }: { done: boolean; onReady: () => void }) {
  const [step, setStep] = useState(done ? craftSteps.length : 0);
  const choose = (index: number) => {
    if (index !== step) return;
    const next = step + 1;
    setStep(next);
    if (next === craftSteps.length) onReady();
  };
  return (
    <div data-exhibit-visual="rice-water" className="space-y-7">
      <section className="culture-story-layout is-rice">
        <figure className="culture-rice-visual">
          <img
            src="/images/rice-water-comparison.jpg"
            alt="普通淘米水与传统发酵淘米水对比"
            loading="lazy"
          />
          <div className="culture-rice-visual-caption-bar">
            <figcaption>
              <span>日常概念</span>
              <strong>普通淘米水</strong>
              <em>淘洗大米后留下的水，不等同于一套传统发酵技艺</em>
            </figcaption>
            <div className="culture-rice-visual-divider" aria-hidden="true">≠</div>
            <figcaption className="is-crafted">
              <span>技艺概念</span>
              <strong>传统发酵淘米水</strong>
              <em>连续工艺，构成它与普通淘米水的关键区别</em>
            </figcaption>
          </div>
        </figure>
        <div className="culture-story-copy">
          <p className="culture-kicker">Core story</p>
          <h3 className="zh-title" data-typography-check>先理解工艺，再讨论产品启发</h3>
          <p className="zh-body culture-story-paragraph" data-typography-check>{cultureExhibits[2].story}</p>
        </div>
      </section>

      <section className="culture-process-world">
        <div className="culture-section-heading"><div><p className="culture-kicker">Process interaction</p><h3 className="zh-title" data-typography-check>沿着微缩工艺路径，一步步完成技艺认知</h3></div><span>{step} / {craftSteps.length} 已确认</span></div>
        <div className="culture-process-path" aria-label="传统发酵淘米水工艺路径">
          <svg
            className="culture-process-curve"
            viewBox="0 0 1000 450"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="riceCurveProgress" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#b87855" />
                <stop offset="100%" stopColor="#c99573" />
              </linearGradient>
            </defs>
            <path
              className="culture-process-curve-track"
              d="M100 345 C200 345 200 105 300 105 S400 345 500 345 S600 105 700 105 S800 345 900 345"
              fill="none"
              pathLength="100"
            />
            <path
              className="culture-process-curve-progress"
              d="M100 345 C200 345 200 105 300 105 S400 345 500 345 S600 105 700 105 S800 345 900 345"
              fill="none"
              pathLength="100"
              strokeDasharray="100"
              strokeDashoffset={100 - (step / craftSteps.length) * 100}
            />
          </svg>
          {craftSteps.map((item, index) => {
            const isDone = index < step;
            const isNext = index === step;
            return (
              <button key={item.label} type="button" onClick={() => choose(index)} disabled={!isNext || done} className={`culture-process-stop stop-${index + 1} ${isDone ? "is-done" : isNext ? "is-next" : "is-locked"}`}>
                <span className="culture-process-icon">
                  <img src={item.image} alt={item.label} loading="lazy" />
                  {isDone && <span className="culture-process-done-badge"><Check size={18} strokeWidth={3} /></span>}
                </span>
                <strong>{item.label}</strong>
                <small>{isDone ? "已确认" : isNext ? "点击继续" : "等待前序"}</small>
              </button>
            );
          })}
        </div>
        <p className="zh-body culture-process-guidance" data-typography-check>{step === craftSteps.length ? "路径完成：你已经看见传统发酵技艺与普通淘米水之间的关键差别。" : `下一步是“${craftSteps[step].label}”。只有完成当前环节，后续工艺节点才会开放。`}</p>
      </section>
    </div>
  );
}

const MUSEUM_ENTRY_POSTER = "/assets/museum/museum-entry-poster.png";
const MUSEUM_ENTRY_VIDEO = "/assets/museum/museum-entry.mp4";

const MUSEUM_ROUTE = [
  { no: "01", label: "入馆" },
  { no: "02", label: "序厅" },
  { no: "03", label: "一楼" },
  { no: "04", label: "二楼" },
  { no: "05", label: "品牌" },
  { no: "06", label: "收束" },
];

// 序厅
const PROLOGUE_IMAGE = "/assets/museum/visitor/01-prologue.jpg";

// 一楼：从古老的长发文化与养发智慧开始（4 幅展陈）
const FLOOR_ONE_FRAMES = [
  {
    kind: "image" as const,
    image: "/assets/museum/visitor/02-hongyao-women.jpg",
    title: "红瑶长发文化展示区",
    body: "墙上的一位位红瑶女性，拥有不同的年龄、经历和长发故事。她们让“天下第一长发村”不再只是一个称号，而成为真实可见、仍然延续在生活中的文化。",
  },
  {
    kind: "image" as const,
    image: "/assets/museum/visitor/03-hairstyles.jpg",
    title: "红瑶发型展陈",
    body: "闺中秀、螺丝发、乌龙盘发，被作为红瑶文化的重要记忆保存和展示。这里不需要重新记忆知识，只需要看见：前面认识过的文化，真实地存在于科技馆中。",
  },
  {
    kind: "image" as const,
    image: "/assets/museum/visitor/04-ancient-china.jpg",
    title: "中国古代长发文化",
    body: "从古代发式、梳妆方式，到不同历史时期对头发的理解，长发一直与审美、身份和生活方式紧密相连。科技馆从更长的历史视角，让我们看见中国长发文化并不只属于一个时代。",
  },
  {
    kind: "image" as const,
    image: "/assets/museum/visitor/05-rice-water-craft.jpg",
    title: "传统淘米水制作流程",
    body: "在长期的生活实践中，红瑶形成了属于自己的淘米水养发方法。从原料、水源到发酵与保存，这套方法并不是突然出现的，而是在一代代人的使用与传承中慢慢形成。",
  },
];

// 二楼：传统智慧走向现代科技（3 幅展陈）
// 用户未提供"解密长发"实物图片，对应位置以引述式展板呈现
const FLOOR_TWO_FRAMES: Array<
  | { kind: "image"; image: string; title: string; body: string }
  | { kind: "panel"; title: string; questions: string[]; body: string }
> = [
  {
    kind: "image",
    image: "/assets/museum/visitor/06-microscopic.jpg",
    title: "探索淘米水中的微观世界",
    body: "当淘米水进入现代研究，人们开始从更细微的角度观察其中的成分与发酵环境。蛋白质、氨基酸、维生素、微量元素、益生菌与小分子肽等方向，让传统经验拥有了被进一步理解的可能。",
  },
  {
    kind: "panel",
    title: "解密长发",
    questions: [
      "为什么有些头发能够保持强韧与健康？",
      "头皮环境、发根状态与日常养护之间，又存在怎样的关系？",
    ],
    body: "从“长发探秘”到“解密长发”，科技馆把文化中的问题，继续带进今天的研究。",
  },
  {
    kind: "image",
    image: "/assets/museum/visitor/08-bifida-yeast.jpg",
    title: "发酵与二裂酵母研究",
    body: "现代研究开始进一步关注发酵过程、微生物环境，以及其中可能产生的养护价值。二裂酵母等研究方向，让传统淘米水与今天的头皮、头发养护研究产生了新的连接。",
  },
];

// 民族品牌终章
const BRAND_IMAGE = "/assets/museum/visitor/09-national-brand.jpg";

type FloorFrame =
  | { kind: "image"; image: string; title: string; body: string; key: string }
  | { kind: "panel"; title: string; questions: string[]; body: string; key: string };

const FLOOR_ONE_FRAMES_TYPED: FloorFrame[] = FLOOR_ONE_FRAMES.map((f, i) => ({ ...f, key: `f1-${i}` }));
const FLOOR_TWO_FRAMES_TYPED: FloorFrame[] = FLOOR_TWO_FRAMES.map((f, i) => ({ ...f, key: `f2-${i}` }));

function FloorCarousel({
  frames,
  variant,
}: {
  frames: FloorFrame[];
  variant: "warm" | "tech";
}) {
  const [index, setIndex] = useState(0);
  const total = frames.length;
  const current = frames[index];
  const go = (delta: number) => {
    setIndex((prev) => (prev + delta + total) % total);
  };
  return (
    <div className={`museum-floor-carousel is-${variant}`}>
      <div className="museum-floor-stage">
        {current.kind === "image" ? (
          <figure className="museum-floor-figure">
            <div className="museum-floor-frame">
              <img src={current.image} alt={current.title} loading="lazy" />
            </div>
            <figcaption className="museum-floor-caption">
              <span className="museum-floor-tag">展品 · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
              <h4 className="zh-title" data-typography-check>{current.title}</h4>
              <p className="zh-body" data-typography-check>{current.body}</p>
            </figcaption>
          </figure>
        ) : (
          <figure className="museum-floor-figure is-panel">
            <div className="museum-floor-frame museum-floor-frame--panel">
              <div className="museum-floor-panel">
                <span className="museum-floor-tag">展品 · {String(index + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
                <h4 className="zh-title museum-floor-panel-title" data-typography-check>{current.title}</h4>
                <ul className="museum-floor-panel-questions">
                  {current.questions.map((q) => (
                    <li key={q} className="zh-body" data-typography-check>{q}</li>
                  ))}
                </ul>
                <p className="zh-body museum-floor-panel-body" data-typography-check>{current.body}</p>
              </div>
            </div>
          </figure>
        )}
      </div>
      <div className="museum-floor-controls">
        <button type="button" className="museum-floor-arrow" aria-label="上一张" onClick={() => go(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="museum-floor-dots" role="tablist">
          {frames.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`第 ${i + 1} 张`}
              className={`museum-floor-dot ${i === index ? "is-active" : ""}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
        <button type="button" className="museum-floor-arrow" aria-label="下一张" onClick={() => go(1)}>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

// Unified scroll method: targets .ambient-page, not window
function scrollToMuseumSection(sectionId: string) {
  const root = document.querySelector<HTMLElement>(".ambient-page");
  const target = document.getElementById(sectionId);
  if (!root || !target) return;
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const headerOffset = 88;
  const nextTop = root.scrollTop + targetRect.top - rootRect.top - headerOffset;
  root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
}

// Route nav index → section ID mapping (6 route items → 9 sections)
const ROUTE_SECTION_IDS = [
  "museum-entrance",
  "museum-prologue",
  "museum-floor1-intro",
  "museum-floor2-intro",
  "museum-brand",
  "museum-xiaoyao",
];

function MuseumVisit({ done, onReady, onComplete, onNavigate }: {
  done: boolean;
  onReady: () => void;
  onComplete: () => void;
  onNavigate: (path: string) => void;
}) {
  const [activeRoute, setActiveRoute] = useState(1);
  const [phase, setPhase] = useState<"cover" | "playing" | "entered">("cover");
  const [hasWatched, setHasWatched] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [entering, setEntering] = useState(false);
  const [navBusy, setNavBusy] = useState(false);
  const actRefs = useRef<(HTMLElement | null)[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoStartedRef = useRef(false);
  const videoFailTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 参观为被动体验：进入即视为可完成，避免强制任务
  const didInitReady = useRef(false);
  useEffect(() => {
    if (didInitReady.current) return;
    didInitReady.current = true;
    onReady();
  }, []);

  // Helper: double rAF then scroll
  const rafScroll = (sectionId: string, afterRender?: () => void) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToMuseumSection(sectionId);
        afterRender?.();
      });
    });
  };

  const enterFirstMuseumSection = () => {
    if (entering) return;
    setEntering(true);
    setPhase("entered");
    rafScroll("museum-prologue", () => {
      setTimeout(() => setEntering(false), 500);
    });
  };

  const goToAct = (i: number) => {
    if (navBusy) return;
    if (i === 0) {
      const v = videoRef.current;
      if (v) { try { v.pause(); } catch { /* noop */ } }
      setPhase("cover");
    }
    const sectionId = ROUTE_SECTION_IDS[i];
    if (!sectionId) return;
    setNavBusy(true);
    scrollToMuseumSection(sectionId);
    setTimeout(() => setNavBusy(false), 700);
  };

  const playEntry = () => {
    if (entering) return;
    setHasWatched(true);
    setPhase("playing");
    videoStartedRef.current = false;
    const v = videoRef.current;
    if (!v) { enterFirstMuseumSection(); return; }

    // 2s fallback: if video hasn't started, show "直接进入科技馆"
    if (videoFailTimer.current) clearTimeout(videoFailTimer.current);
    videoFailTimer.current = setTimeout(() => {
      if (!videoStartedRef.current) {
        setVideoFailed(true);
        setPhase("cover");
      }
    }, 2000);

    try {
      v.currentTime = 0;
      const p = v.play();
      if (p && typeof (p as Promise<void>).then === "function") {
        (p as Promise<void>).then(() => {
          videoStartedRef.current = true;
          if (videoFailTimer.current) { clearTimeout(videoFailTimer.current); videoFailTimer.current = null; }
        }).catch(() => {
          if (videoFailTimer.current) { clearTimeout(videoFailTimer.current); videoFailTimer.current = null; }
          setVideoFailed(true);
          setPhase("cover");
        });
      } else {
        videoStartedRef.current = true;
        if (videoFailTimer.current) { clearTimeout(videoFailTimer.current); videoFailTimer.current = null; }
      }
    } catch {
      if (videoFailTimer.current) { clearTimeout(videoFailTimer.current); videoFailTimer.current = null; }
      setVideoFailed(true);
      setPhase("cover");
    }
  };

  // Scroll helpers with navBusy guard
  const scrollWithGuard = (sectionId: string) => {
    if (navBusy) return;
    setNavBusy(true);
    rafScroll(sectionId, () => setTimeout(() => setNavBusy(false), 500));
  };

  const goToFirstFloorTop = () => scrollWithGuard("museum-floor1-intro");
  const goToFloor1Carousel = () => scrollWithGuard("museum-floor1");
  const goToSecondFloor = () => scrollWithGuard("museum-floor2-intro");
  const goToBrand = () => scrollWithGuard("museum-brand");
  const goToXiaoyao = () => scrollWithGuard("museum-xiaoyao");

  // Navigate to stage 4: complete exhibit then navigate
  const goToStage4 = () => {
    onComplete();
    onNavigate("stage/product");
  };

  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".ambient-page");
    const acts = actRefs.current.filter(Boolean) as HTMLElement[];

    const routeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const route = Number((entry.target as HTMLElement).dataset.actRoute);
            if (route) setActiveRoute(route);
          }
        });
      },
      { root, rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("in-view");
        });
      },
      { root, rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
    );
    acts.forEach((el) => { routeObserver.observe(el); revealObserver.observe(el); });
    return () => { routeObserver.disconnect(); revealObserver.disconnect(); };
  }, []);

  // Cleanup video timer
  useEffect(() => {
    return () => { if (videoFailTimer.current) clearTimeout(videoFailTimer.current); };
  }, []);

  const routeStyle = { "--route-progress": activeRoute / MUSEUM_ROUTE.length } as CSSProperties;

  return (
    <div className="museum-visit">
      {createPortal(
      <nav className="museum-route-nav" aria-label="参观路线">
        <span className="museum-route-nav-title">参观路线</span>
        <ol style={routeStyle}>
          {MUSEUM_ROUTE.map((item, i) => (
            <li key={item.no} className={activeRoute === i + 1 ? "is-active" : ""}>
              <button
                type="button"
                className="museum-route-btn"
                aria-current={activeRoute === i + 1}
                disabled={navBusy}
                onClick={() => goToAct(i)}
              >
                <span className="museum-route-no">{item.no}</span>
                <span className="museum-route-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>,
      document.body,
      )}

      {/* 第一幕 · 入馆 */}
      <section id="museum-entrance" className="museum-act museum-act--entrance" data-act-route="1" ref={(el) => { actRefs.current[0] = el; }}>
        <div className={`museum-entrance-copy${phase === "cover" ? "" : " is-hidden"}`}>
          <p className="culture-kicker">中国长发科技馆</p>
          <h2 className="zh-title" data-typography-check>中国长发科技馆</h2>
          <p className="zh-body" data-typography-check>一座从&ldquo;长发&rdquo;出发，连接文化、传统智慧与现代研究的科技馆。</p>
        </div>
        <div className={`museum-entry-media${phase === "entered" ? " is-leaving" : ""}`}>
          <img
            src={MUSEUM_ENTRY_POSTER}
            alt="中国长发科技馆"
            className={`museum-entry-poster${phase === "cover" ? " is-visible" : ""}`}
            aria-hidden={phase !== "cover"}
          />
          <video
            ref={videoRef}
            className={`museum-entry-video${phase !== "cover" ? " is-visible" : ""}`}
            src={MUSEUM_ENTRY_VIDEO}
            poster={MUSEUM_ENTRY_POSTER}
            muted
            playsInline
            preload="metadata"
            controls={false}
            onPlaying={() => { videoStartedRef.current = true; if (videoFailTimer.current) { clearTimeout(videoFailTimer.current); videoFailTimer.current = null; } }}
            onEnded={enterFirstMuseumSection}
            onError={() => { setVideoFailed(true); setPhase("cover"); }}
          />
          {phase === "playing" && !videoFailed && (
            <button type="button" className="museum-entry-skip" onClick={enterFirstMuseumSection}>
              跳过动画
            </button>
          )}
        </div>
        <div className={`museum-entrance-actions${phase === "cover" ? "" : " is-hidden"}`}>
          {!videoFailed ? (
            <button type="button" className="app-button-primary museum-start-btn" onClick={playEntry} disabled={entering}>
              {entering ? "正在进入\u2026" : (<>{hasWatched ? "再次观看入馆动画" : "开始参观"} <ArrowRight size={16} /></>)}
            </button>
          ) : (
            <button type="button" className="app-button-primary museum-start-btn" onClick={enterFirstMuseumSection} disabled={entering}>
              {entering ? "正在进入\u2026" : (<>直接进入科技馆 <ArrowRight size={16} /></>)}
            </button>
          )}
        </div>
      </section>

      {/* 第二幕 · 序厅：长发探秘 */}
      <section id="museum-prologue" className="museum-act museum-act--prologue" data-act-route="2" ref={(el) => { actRefs.current[1] = el; }}>
        <div className="museum-prologue">
          <div className="museum-prologue-text">
            <p className="culture-kicker">第一站｜长发探秘</p>
            <h2 className="zh-title museum-prologue-title" data-typography-check>从这里，开始认识一头长发背后的世界</h2>
            <p className="zh-body museum-prologue-body" data-typography-check>中国长发科技馆以长发文化、中国养发智慧与现代研究为主要内容。</p>
            <p className="zh-body museum-prologue-body" data-typography-check>在这里，我们会先回到过去，看看中国人与头发相处的历史，以及红瑶世代传承的长发文化与养发智慧。随后，我们将继续向上，看看这些传统经验如何走进今天的科学研究。</p>
            <div className="museum-prologue-actions">
              <button type="button" className="app-button-primary" onClick={goToFirstFloorTop} disabled={navBusy}>
                先去一楼看看 <ArrowRight size={15} />
              </button>
            </div>
          </div>
          <div className="museum-prologue-visual">
            <img src={PROLOGUE_IMAGE} alt="中国长发科技馆·序厅长发探秘" loading="lazy" />
          </div>
        </div>
      </section>

      {/* 第三幕 · 一楼总标题 */}
      <section id="museum-floor1-intro" className="museum-act museum-act--floor-intro is-warm" data-act-route="3" ref={(el) => { actRefs.current[2] = el; }}>
        <div className="museum-act-inner">
          <p className="culture-kicker">一楼展区</p>
          <h2 className="zh-title" data-typography-check>先回到过去，看看长发文化从哪里走来</h2>
          <blockquote className="zh-body museum-act-quote" data-typography-check>在走向现代研究之前，我们先从历史、人物、发式和传统养发方法开始。</blockquote>
          <div className="museum-act-actions">
            <button type="button" className="app-button-primary" onClick={goToFloor1Carousel} disabled={navBusy}>
              继续认识长发文化 <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 第四幕 · 一楼文化大图轮播 */}
      <section id="museum-floor1" className="museum-act museum-act--floor is-warm" data-act-route="3" ref={(el) => { actRefs.current[3] = el; }}>
        <div className="museum-act-inner">
          <FloorCarousel frames={FLOOR_ONE_FRAMES_TYPED} variant="warm" />
        </div>
      </section>

      {/* 第五幕 · 上楼转场 */}
      <section id="museum-stairway" className="museum-act museum-act--stairway" data-act-route="4" ref={(el) => { actRefs.current[4] = el; }}>
        <div className="museum-stairway">
          <p className="culture-kicker">一楼 → 二楼</p>
          <h2 className="zh-title museum-stairway-title" data-typography-check>传统，留下了经验</h2>
          <p className="zh-body museum-stairway-body" data-typography-check>一楼让我们看见，人们过去如何理解头发、照顾头发，并把经验一代代传下来。</p>
          <p className="zh-body museum-stairway-body" data-typography-check>但今天，我们还想继续追问：</p>
          <p className="zh-body museum-stairway-question" data-typography-check>这些传统方法背后究竟发生了什么？其中有哪些值得被研究和转化的养护价值？</p>
          <div className="museum-stairway-actions">
            <button type="button" className="app-button-primary" onClick={goToSecondFloor} disabled={navBusy}>
              上楼看看今天的研究 <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 第六幕 · 二楼总标题 */}
      <section id="museum-floor2-intro" className="museum-act museum-act--floor-intro is-tech" data-act-route="4" ref={(el) => { actRefs.current[5] = el; }}>
        <div className="museum-act-inner">
          <p className="culture-kicker">二楼展区</p>
          <h2 className="zh-title" data-typography-check>当传统智慧走进现代研究</h2>
          <blockquote className="zh-body museum-act-quote" data-typography-check>传统告诉我们&ldquo;人们长期在使用什么&rdquo;，科学继续研究&ldquo;它为什么可能有效&rdquo;。</blockquote>
        </div>
      </section>

      {/* 第七幕 · 二楼科技轮播 */}
      <section id="museum-floor2" className="museum-act museum-act--floor is-tech" data-act-route="4" ref={(el) => { actRefs.current[6] = el; }}>
        <div className="museum-act-inner">
          <FloorCarousel frames={FLOOR_TWO_FRAMES_TYPED} variant="tech" />
          <div className="museum-floor-next">
            <button type="button" className="app-button-primary" onClick={goToBrand} disabled={navBusy}>
              看见民族品牌的力量 <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* 第八幕 · 民族品牌终章 */}
      <section id="museum-brand" className="museum-act museum-act--brand" data-act-route="5" ref={(el) => { actRefs.current[7] = el; }}>
        <div className="museum-brand">
          <div className="museum-brand-visual">
            <img src={BRAND_IMAGE} alt="被雪藏的中国民族品牌展陈" loading="lazy" />
          </div>
          <div className="museum-brand-text">
            <p className="culture-kicker">最后一站｜民族品牌</p>
            <h2 className="zh-title museum-brand-title" data-typography-check>从传统智慧，到属于中国的品牌力量</h2>
            <p className="zh-body museum-brand-body" data-typography-check>中国近代品牌的发展，并不是一条始终平坦的道路。许多中国品牌曾在时代变化和市场竞争中经历起伏，也让人们开始重新思考：真正属于中国的文化、技术与产品，应该如何被保留下来，并继续向前。</p>
            <p className="zh-body museum-brand-body" data-typography-check>长发小寨从红瑶长发文化和传统养发智慧中出发，通过持续研究与产品探索，希望让一份来自中国的养发智慧，被更多人看见、理解和使用。</p>
            <p className="zh-body museum-brand-body" data-typography-check>这不仅是把传统做成产品。也是让文化拥有新的生命，让研究产生真实价值，并让一个中国民族品牌拥有继续成长的力量。</p>
            <blockquote className="museum-brand-finale" data-typography-check>从古老智慧出发，用今天的研究，创造属于未来的民族品牌。</blockquote>
            <div className="museum-brand-actions">
              <button type="button" className="app-button-primary" onClick={goToXiaoyao} disabled={navBusy}>
                完成科技馆参观 <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 第九幕 · 小瑶收束 */}
      <section id="museum-xiaoyao" className="museum-act museum-act--xiaoyao" data-act-route="6" ref={(el) => { actRefs.current[8] = el; }}>
        <div className="museum-act-inner">
          <div className="museum-xiaoyao-card">
            <div className="museum-xiaoyao-card-head">
              <span className="museum-xiaoyao-avatar" aria-hidden="true">
                <img src="/xiaoyao/transparent/1.png" alt="" />
              </span>
              <div>
                <p className="culture-kicker">小瑶</p>
                <h3 className="zh-title" data-typography-check>这一趟，我们从一楼走到二楼</h3>
              </div>
            </div>
            <div className="museum-xiaoyao-card-body">
              <p className="zh-body" data-typography-check>这一趟，我们从一楼的长发文化、古代发式和传统淘米水，一路走到了二楼的现代研究。</p>
              <p className="zh-body" data-typography-check>原来，传统和科技并不是彼此分开的。</p>
              <p className="zh-body" data-typography-check>正是因为有人愿意认真保存传统、理解传统，并继续研究它，过去留下来的智慧才有机会走进今天。</p>
              <p className="zh-body" data-typography-check>接下来，我们将正式进入第四关，看看这些文化与研究，最终怎样成为长发小寨今天的产品与核心技术。</p>
            </div>
            <div className="museum-visit-footer">
              <button type="button" className="app-button-primary" onClick={goToStage4}>
                {done ? <>本展区已完成 · 进入总结 <Check size={15} /></> : <>前往第四关 <ArrowRight size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const exhibitDialogues: Record<
  Exclude<CultureExhibitId, "technology-museum">,
  { title: string; paragraphs: string[]; action: string }
> = {
  "long-hair": {
    title: "小瑶 · 红瑶文化展区",
    paragraphs: [
      "欢迎来到红瑶文化展区。",
      "在这里，我们先不急着了解品牌，而是先看看一根长发背后的故事。",
      "在红瑶文化里，头发不仅是一种外在形象，也记录着女性不同的人生阶段。",
    ],
    action: "开始了解三种发式",
  },
  "logo-story": {
    title: "小瑶 · Logo 故事",
    paragraphs: [
      "刚刚看到的发型，你有没有觉得有一点熟悉？",
      "接下来，我们从乌龙盘发的轮廓里发现一个品牌秘密。",
      "品牌视觉不是凭空出现的装饰。沿着发式轮廓继续观察，你会看见它如何与品牌 Logo 建立连接。",
    ],
    action: "进入 Logo 故事",
  },
  "rice-water": {
    title: "小瑶 · 淘米水非遗技艺",
    paragraphs: [
      "这一站，我们来分清两个听起来很像的概念。",
      "普通淘米水，并不等于传统发酵淘米水技艺。",
      "先不要急着记结论。沿着取米、淘洗、发酵、检查和提取，一步步看清完整技艺。",
    ],
    action: "开始工艺探索",
  },
};

export default function CultureMuseumPage({ onNavigate }: CultureMuseumPageProps) {
  const { progress, startCultureStage, completeCultureExhibit } = useLearningProgress();
  const completed = progress.culture.completedExhibits;
  const firstIncomplete = cultureExhibits.find((item) => !completed.includes(item.id)) ?? cultureExhibits[0];
  const [activeId, setActiveId] = useState<CultureExhibitId>(firstIncomplete.id);
  const [interactionReady, setInteractionReady] = useState<Record<CultureExhibitId, boolean>>({
    "long-hair": true,
    "logo-story": completed.includes("logo-story"),
    "rice-water": completed.includes("rice-water"),
    "technology-museum": completed.includes("technology-museum"),
  });

  useEffect(() => { startCultureStage(); }, [startCultureStage]);
  const activeIndex = cultureExhibits.findIndex((item) => item.id === activeId);
  const exhibit = cultureExhibits[activeIndex];
  const isDone = completed.includes(exhibit.id);
  const isUnlocked = activeIndex === 0 || completed.includes(cultureExhibits[activeIndex - 1].id);
  const stageProgress = Math.round((completed.length / cultureExhibits.length) * 100);
  const next = cultureExhibits[activeIndex + 1];
  const canComplete = interactionReady[activeId] || isDone;
  const headerStatus = useMemo(() => progress.culture.completed ? "已完成 · 自由回顾" : `参观进度 ${completed.length} / ${cultureExhibits.length}`, [completed.length, progress.culture.completed]);
  const completionRef = useRef<HTMLElement>(null);

  // Auto-scroll to completion panel when all exhibits are completed
  useEffect(() => {
    if (progress.culture.completed && completionRef.current) {
      const root = document.querySelector<HTMLElement>(".ambient-page");
      if (!root || !completionRef.current) return;
      const timer = setTimeout(() => {
        const target = completionRef.current;
        if (!target) return;
        const rootRect = root.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const nextTop = root.scrollTop + targetRect.top - rootRect.top - 88;
        root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress.culture.completed]);

  const completeCurrent = () => {
    if (!canComplete) return;
    completeCultureExhibit(activeId);
    if (next) setActiveId(next.id);
  };

  return (
    <div className="content-enter pb-12" data-testid="culture-museum-page">
      <button type="button" onClick={() => onNavigate("home")} className="mb-5 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-brand"><ArrowLeft size={16} />返回成长地图</button>

      <section className="culture-museum-hero">
        <div><div className="flex items-center gap-2 text-xs font-medium text-[#8a7464]"><Landmark size={14} />第三关 · 数字文化馆</div><h1 data-typography-check className="zh-title">认识品牌与非遗文化</h1><p data-typography-check className="zh-body">从真实人物与生活出发，理解文化意义，再看它如何与品牌发生连接。</p><div className="mt-6 flex flex-wrap items-center gap-3"><span className="culture-progress-label">{headerStatus}</span></div></div>
        <div className="culture-hero-badge"><span className="culture-hero-glow" /><img src="/stages/stage-03-museum.png" alt="认识品牌与非遗文化徽章" /></div>
      </section>

      <div className="my-6 flex items-center gap-3"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/65"><div className="h-full rounded-full bg-[linear-gradient(90deg,#b44c3e,#d79b78)] transition-[width] duration-500" style={{ width: `${stageProgress}%` }} /></div><span className="text-sm font-semibold text-text-primary">{stageProgress}%</span></div>

      <div className="mb-6">
        {activeId !== "technology-museum" && (() => {
          const scene = exhibitDialogues[activeId];
          return (
            <XiaoyaoDialogue
              title={scene.title}
              sceneKey="museum_entry"
              layout="horizontal"
              fullBody
              paragraphs={scene.paragraphs}
              extraActions={[
                {
                  label: scene.action,
                  primary: true,
                  onClick: () => {
                    const root = document.querySelector<HTMLElement>(".ambient-page");
                    const target = document.querySelector<HTMLElement>(".culture-exhibit-stage");
                    if (!root || !target) return;
                    const rootRect = root.getBoundingClientRect();
                    const targetRect = target.getBoundingClientRect();
                    const nextTop = root.scrollTop + targetRect.top - rootRect.top - 88;
                    root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
                  },
                },
              ]}
            />
          );
        })()}
      </div>

      <div className="culture-museum-layout">
        <nav className="culture-exhibit-nav" aria-label="文化馆展区">
          <p className="px-1 text-xs font-semibold uppercase tracking-[.14em] text-text-tertiary">参观路线</p>
          {cultureExhibits.map((item, index) => {
            const itemDone = completed.includes(item.id);
            const unlocked = index === 0 || completed.includes(cultureExhibits[index - 1].id);
            return <button key={item.id} type="button" disabled={!unlocked} onClick={() => setActiveId(item.id)} className={`culture-exhibit-tab ${activeId === item.id ? "is-active" : ""} ${itemDone ? "is-done" : ""}`}><span>{itemDone ? <Check size={14} strokeWidth={3} /> : unlocked ? String(item.order).padStart(2, "0") : <Lock size={13} />}</span><div><strong data-typography-check className="zh-title">{item.title}</strong><small>{itemDone ? "已完成，可回顾" : unlocked ? "进入展区" : "完成上一展区后开放"}</small></div><ChevronRight size={15} /></button>;
          })}
        </nav>

        <main className="culture-exhibit-stage" data-active-exhibit={exhibit.id}>
          {!isUnlocked ? <div className="grid min-h-[540px] place-items-center text-center"><div><Lock className="mx-auto text-text-tertiary" /><h2 className="mt-4 text-xl font-semibold zh-title">展区尚未开放</h2><p className="mt-2 text-sm text-text-secondary">先完成上一展区，再继续参观。</p></div></div> : <>
            {exhibit.id !== "technology-museum" && (
              <header className="culture-exhibit-intro"><p className="culture-kicker">{exhibit.eyebrow}</p><h2 data-typography-check className="zh-title">{exhibit.title}</h2><p data-typography-check className="zh-body">{exhibit.intro}</p></header>
            )}
            {exhibit.id === "long-hair" && <HairCultureStory />}
            {exhibit.id === "logo-story" && <LogoStoryInteraction done={isDone} onReady={() => setInteractionReady((value) => ({ ...value, "logo-story": true }))} />}
            {exhibit.id === "rice-water" && <RiceWaterInteraction done={isDone} onReady={() => setInteractionReady((value) => ({ ...value, "rice-water": true }))} />}
            {exhibit.id === "technology-museum" ? (
              <MuseumVisit
                done={isDone}
                onReady={() => setInteractionReady((value) => ({ ...value, "technology-museum": true }))}
                onComplete={completeCurrent}
                onNavigate={onNavigate}
              />
            ) : (
              <>
                <FactStrip exhibit={exhibit} />
                <div className="culture-memory-footer"><div><p>这一站请记住</p><span data-typography-check className="zh-body">{exhibit.remember}</span></div><button type="button" disabled={!canComplete} onClick={completeCurrent} className="app-button-primary disabled:cursor-not-allowed disabled:opacity-40">{isDone ? <Check size={15} /> : next ? <ArrowRight size={15} /> : <Sparkles size={15} />}{isDone ? "本展区已完成" : next ? "完成并前往下一展区" : "完成第三关"}</button></div>
              </>
            )}
          </>}
        </main>
      </div>

      {progress.culture.completed && <section ref={completionRef} className="culture-completion-panel"><div className="relative"><span className="absolute inset-0 rounded-full bg-brand/12 blur-2xl" /><img className="relative h-28 w-28 object-contain" src="/stages/stage-03-museum.png" alt="第三关完成徽章" /></div><div className="min-w-0 flex-1"><p className="culture-kicker">Stage complete</p><h2 data-typography-check className="zh-title mt-2 text-2xl font-semibold text-text-primary">第三关探索完成</h2><p data-typography-check className="zh-body mt-2 text-sm leading-7 text-text-secondary">你已经走完四个文化展区。第三枚徽章已点亮，第四关正式开放。</p></div><div className="flex shrink-0 flex-col gap-2 sm:flex-row"><button type="button" onClick={() => onNavigate("stage/product")} className="app-button-primary">进入第四关：认识产品与核心技术<ArrowRight size={15} /></button><button type="button" onClick={() => onNavigate("home")} className="app-button-secondary">返回成长地图</button></div></section>}
    </div>
  );
}
