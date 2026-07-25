import { Pause, RotateCcw, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { getVoiceScene } from "../data/voiceCatalog";

type XiaoyaoDialogueProps = {
  /** 小瑶对话标题（如"你好，我是小瑶"或"小瑶带你认识这一关"） */
  title: string;
  /** 对话正文，每段为独立 p 元素 */
  paragraphs: string[];
  /** 语音场景 key，用于查找音频文件 */
  sceneKey?: string;
  /** 布局变体：horizontal = 小瑶在左、对话在右；vertical = 标题在上、对话在下 */
  layout?: "horizontal" | "vertical";
  /** 是否显示完整小瑶人物（true = 全身图，false = 头像） */
  fullBody?: boolean;
  /** 额外按钮（如"我知道了"），显示在音频按钮右侧 */
  extraActions?: { label: string; onClick: () => void; primary?: boolean }[];
  /** 打字机速度（毫秒/字），默认 55 */
  typewriterSpeed?: number;
};

const DEFAULT_TYPEWRITER_SPEED = 55;

/**
 * 统一小瑶对话组件 — 人物 + 文字 + 轻量音频控制合一
 *
 * 排版规范：
 * - 每段正文为独立 <p> 元素，由容器 gap 统一控制段间距
 * - 同段落内行距由 line-height 控制，段间距 > 行距
 * - 中文断行使用 text-wrap: pretty 避免单字断行
 *
 * 打字机效果：
 * - 默认状态直接显示完整文案，便于用户不播放音频也能阅读
 * - 点击播放后从第一个字开始逐字显示，暂停时保留当前进度
 * - 音频结束或重新播放时，按当前进度继续或从头开始
 */
export default function XiaoyaoDialogue({
  title,
  paragraphs,
  sceneKey,
  layout = "horizontal",
  fullBody = false,
  extraActions = [],
  typewriterSpeed = DEFAULT_TYPEWRITER_SPEED,
}: XiaoyaoDialogueProps) {
  const scene = sceneKey ? getVoiceScene(sceneKey) : undefined;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const available = Boolean(scene?.audioSrc);

  const fullText = paragraphs.join("");
  const [typedLength, setTypedLength] = useState(fullText.length);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasStartedRef = useRef(false);

  const clearTyping = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startTyping = () => {
    clearTyping();
    intervalRef.current = setInterval(() => {
      setTypedLength((prev) => {
        if (prev >= fullText.length) {
          clearTyping();
          return fullText.length;
        }
        return prev + 1;
      });
    }, typewriterSpeed);
  };

  // 文案变化时重置为完整显示，便于新内容直接可读
  useEffect(() => {
    clearTyping();
    setTypedLength(fullText.length);
    hasStartedRef.current = false;
  }, [fullText]);

  // 根据播放状态启停打字机
  useEffect(() => {
    if (playing) {
      if (!hasStartedRef.current) {
        setTypedLength(0);
        hasStartedRef.current = true;
      }
      startTyping();
    } else {
      clearTyping();
    }
    return () => clearTyping();
  }, [playing]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    if (audio.paused) await audio.play();
    else audio.pause();
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    audio.currentTime = 0;
    setTypedLength(0);
    hasStartedRef.current = true;
    void audio.play();
  };

  const handleEnded = () => {
    setPlaying(false);
    setTypedLength(fullText.length);
  };

  // 按当前已显示字数渲染各段落，光标停留在最后可见字符之后
  const renderTypedParagraphs = () => {
    let remaining = typedLength;
    const nodes: JSX.Element[] = [];
    paragraphs.forEach((p, i) => {
      if (remaining <= 0) return;
      const visible = p.slice(0, remaining);
      const isLastVisible = remaining <= p.length;
      nodes.push(
        <p key={i}>
          {visible}
          {isLastVisible && playing && <span className="xiaoyao-typewriter-cursor" aria-hidden="true" />}
        </p>
      );
      remaining -= p.length;
    });
    return nodes;
  };

  if (layout === "horizontal") {
    return (
      <div className="xiaoyao-dialogue xiaoyao-dialogue--horizontal">
        {scene?.audioSrc && (
          <audio
            ref={audioRef}
            src={scene.audioSrc}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={handleEnded}
          />
        )}
        <div className="xiaoyao-dialogue-figure">
          {fullBody ? (
            <img src="/xiaoyao/transparent/1.png" alt="小瑶" className="xiaoyao-dialogue-body-img" />
          ) : (
            <div className="xiaoyao-dialogue-avatar" aria-hidden="true" />
          )}
        </div>
        <div className="xiaoyao-dialogue-content">
          <h3 className="xiaoyao-dialogue-title">{title}</h3>
          <div className="xiaoyao-dialogue-body">{renderTypedParagraphs()}</div>
          <div className="xiaoyao-dialogue-actions">
            {available && (
              <>
                <button onClick={togglePlay} className="xiaoyao-dialogue-audio-btn">
                  {playing ? <Pause size={14} fill="currentColor" /> : <Volume2 size={14} />}
                  {playing ? "暂停" : "听小瑶说"}
                </button>
                <button onClick={restart} className="xiaoyao-dialogue-replay-btn" aria-label="重新播放">
                  <RotateCcw size={14} />
                </button>
              </>
            )}
            {extraActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className={action.primary ? "xiaoyao-dialogue-primary-btn" : "xiaoyao-dialogue-secondary-btn"}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // vertical layout
  return (
    <div className="xiaoyao-dialogue xiaoyao-dialogue--vertical">
      {scene?.audioSrc && (
        <audio
          ref={audioRef}
          src={scene.audioSrc}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={handleEnded}
        />
      )}
      <div className="xiaoyao-dialogue-header">
        {fullBody ? (
          <img src="/xiaoyao/transparent/1.png" alt="小瑶" className="xiaoyao-dialogue-body-img-sm" />
        ) : (
          <div className="xiaoyao-dialogue-avatar" aria-hidden="true" />
        )}
        <div>
          <span className="xiaoyao-dialogue-label">小瑶</span>
          <h3 className="xiaoyao-dialogue-title">{title}</h3>
        </div>
      </div>
      <div className="xiaoyao-dialogue-body">{renderTypedParagraphs()}</div>
      <div className="xiaoyao-dialogue-actions">
        {available && (
          <>
            <button onClick={togglePlay} className="xiaoyao-dialogue-audio-btn">
              {playing ? <Pause size={14} fill="currentColor" /> : <Volume2 size={14} />}
              {playing ? "暂停" : "听小瑶说"}
            </button>
            <button onClick={restart} className="xiaoyao-dialogue-replay-btn" aria-label="重新播放">
              <RotateCcw size={14} />
            </button>
          </>
        )}
        {extraActions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={action.primary ? "xiaoyao-dialogue-primary-btn" : "xiaoyao-dialogue-secondary-btn"}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
