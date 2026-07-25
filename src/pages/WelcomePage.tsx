import { ArrowRight, Check, Sparkles } from "lucide-react";
import XiaoyaoDialogue from "../components/XiaoyaoDialogue";
import { useLearningProgress } from "../hooks/useLearningProgress";

type WelcomePageProps = { onNavigate: (path: string) => void };

const JOURNEY_STAGES = [
  { order: 1, title: "欢迎加入", badge: "/stages/stage-01-welcome.png" },
  { order: 2, title: "认识长发小寨", badge: "/stages/stage-02-brand-origin.png" },
  { order: 3, title: "认识品牌与非遗文化", badge: "/stages/stage-03-museum.png" },
  { order: 4, title: "认识产品与核心技术", badge: "/stages/stage-04-org.png" },
  { order: 5, title: "认识组织与基础制度", badge: "/stages/stage-05-rules.png" },
  { order: 6, title: "完成新人认证", badge: "/stages/stage-06-certificate.png" },
];

const PURPOSE_CARDS = [
  {
    icon: "/welcome-icons/collab.png",
    title: "从哪里来",
    desc: "认识长发小寨的创立故事与品牌源头。",
  },
  {
    icon: "/welcome-icons/culture.png",
    title: "文化背后",
    desc: "理解红瑶长发文化、非遗淘米水与品牌传承。",
  },
  {
    icon: "/welcome-icons/science.png",
    title: "产品为什么这样被创造",
    desc: "从\"头皮不老\"这一理念出发，认识产品背后的逻辑。",
  },
  {
    icon: "/welcome-icons/museum.png",
    title: "公司如何协作",
    desc: "了解组织架构与日常制度，知道遇到问题时该找谁。",
  },
];

export default function WelcomePage({ onNavigate }: WelcomePageProps) {
  const { completeWelcomeStage } = useLearningProgress();
  const handleStart = () => {
    completeWelcomeStage();
    onNavigate("stage/company");
  };
  return (
    <div className="welcome-page">
      {/* ── 第一屏｜欢迎进入 ── */}
      <section className="welcome-hero">
        <div className="welcome-hero-bg" aria-hidden="true" />
        <div className="welcome-hero-logo" aria-hidden="true">
          <span className="welcome-hero-logo-glow" />
          <div className="welcome-hero-logo-coin">
            <div className="welcome-hero-logo-face welcome-hero-logo-face--front">
              <img src="/logo/cfxz-logo-brown.png" alt="" draggable={false} />
            </div>
            <div className="welcome-hero-logo-face welcome-hero-logo-face--back">
              <img src="/logo/cfxz-logo-brown.png" alt="" draggable={false} />
            </div>
          </div>
        </div>
        <div className="welcome-hero-body">
          <p className="welcome-hero-kicker">
            <Sparkles size={15} /> 长发小寨 · 新员工入职学习系统
          </p>
          <h1 className="welcome-hero-title">欢迎加入<br />长发小寨</h1>
          <p className="welcome-hero-sub">
            从这一刻起，你不再只是"新同事"——<br />
            你是长发小寨正在书写的故事里，最新的一页。
          </p>
        </div>
      </section>

      {/* ── 小瑶正式出场（统一对话组件：人物 + 文字 + 轻量音频合一）── */}
      <section className="welcome-voice-guide">
        <XiaoyaoDialogue
          title="你好，我是小瑶"
          layout="horizontal"
          fullBody
          sceneKey="home_welcome"
          paragraphs={[
            "这套新人学习旅程，是专门为每一位新伙伴准备的。",
            "在你正式投入工作之前，我会先陪你认识一下自己刚刚加入的地方。",
            "我们会一起看看长发小寨从哪里出发，在做什么，为什么这样做产品，以及以后和大家一起工作时，需要知道哪些事情。",
            "不用急着一次记住所有内容。接下来，我会陪你一步一步走完六个成长节点。",
            "准备好了吗？我们一起出发吧！",
          ]}
        />
      </section>

      {/* ── 内容正文区 ── */}
      <section className="welcome-purpose">
        <div className="welcome-purpose-head">
          <p className="welcome-purpose-kicker">Why this journey</p>
          <h2>进入一家新的公司，不只是知道自己坐在哪里、做什么工作。</h2>
        </div>
        <div className="welcome-purpose-grid">
          {PURPOSE_CARDS.map((card) => (
            <div key={card.title} className="welcome-purpose-item">
              <img className="welcome-purpose-icon" src={card.icon} alt={card.title} draggable={false} />
              <strong>{card.title}</strong>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 第四屏｜六关旅程预览 ── */}
      <section className="welcome-journey">
        <div className="welcome-journey-head">
          <p className="welcome-purpose-kicker">Your path</p>
          <h2>你的新人成长路线</h2>
          <p className="welcome-journey-desc">
            按顺序完成 6 站探索，获得入职认证后，即可解锁专属你的「学习天地」。
          </p>
        </div>
        <div className="welcome-journey-flow">
          {JOURNEY_STAGES.map((stage, index) => (
            <div key={stage.order} className="welcome-journey-node-wrap">
              <div className="welcome-journey-node">
                <div className="welcome-journey-badge">
                  <img src={stage.badge} alt={stage.title} />
                  {index === 0 && <span className="welcome-journey-badge-check"><Check size={12} strokeWidth={3} /></span>}
                </div>
                <div className="welcome-journey-node-info">
                  <span className="welcome-journey-node-num">第 {stage.order} 站</span>
                  <strong>{stage.title}</strong>
                </div>
              </div>
              {index < JOURNEY_STAGES.length - 1 && (
                <div className="welcome-journey-connector">
                  <span className="welcome-journey-arrow">↓</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── 底部行动区 ── */}
      <section className="welcome-start">
        <div className="welcome-start-card">
          <p className="welcome-start-text">
            准备好了吗？从这里开始，正式走进长发小寨的世界。
          </p>
          <button
            type="button"
            className="welcome-start-btn"
            onClick={handleStart}
          >
            开启旅程<ArrowRight size={18} />
          </button>
        </div>
      </section>
    </div>
  );
}
