import { ArrowRight, MessageCircle, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { CultureExhibitId } from "../hooks/useLearningProgress";

type CultureXiaoyaoDialogueProps = {
  exhibitId: CultureExhibitId;
  completed: boolean;
  onEnterContent?: () => void;
};

type DialogueScene = {
  opening: string[];
  option: string;
  response: string[];
  action: string;
};

const dialogueScenes: Record<CultureExhibitId, DialogueScene> = {
  "long-hair": {
    opening: [
      "欢迎来到红瑶文化展区。",
      "在这里，我们先不急着了解品牌，而是先看看一根长发背后的故事。",
    ],
    option: "看看红瑶女性的三种发式",
    response: [
      "你发现了吗？",
      "在红瑶文化里，头发不仅是一种外在形象，也记录着女性不同的人生阶段。",
    ],
    action: "开始了解三种发式",
  },
  "logo-story": {
    opening: [
      "刚刚看到的发型，你有没有觉得有一点熟悉？",
      "接下来，我们从乌龙盘发的轮廓里发现一个品牌秘密。",
    ],
    option: "看看轮廓里的秘密",
    response: [
      "品牌视觉不是凭空出现的装饰。",
      "沿着发式轮廓继续观察，你会看见它如何与品牌 Logo 建立连接。",
    ],
    action: "进入 Logo 故事",
  },
  "rice-water": {
    opening: [
      "这一站，我们来分清两个听起来很像的概念。",
      "普通淘米水，并不等于传统发酵淘米水技艺。",
    ],
    option: "沿着工艺路径看看",
    response: [
      "先不要急着记结论。",
      "沿着取米、淘洗、发酵、检查和提取，一步步看清完整技艺。",
    ],
    action: "开始工艺探索",
  },
  "technology-museum": {
    opening: [
      "欢迎来到中国长发科技馆展区。",
      "这里连接的不只是展品，还有文化、技艺、科研与社会价值。",
    ],
    option: "看看科技馆连接了什么",
    response: [
      "科技馆不是把内容分别摆进展柜。",
      "它让文化被看见、技艺被传播，也让当代成果得到清楚表达。",
    ],
    action: "进入科技馆展区",
  },
};

export default function CultureXiaoyaoDialogue({ exhibitId, completed, onEnterContent }: CultureXiaoyaoDialogueProps) {
  const [open, setOpen] = useState(!completed);
  const [step, setStep] = useState<0 | 1>(0);
  const scene = useMemo(() => dialogueScenes[exhibitId], [exhibitId]);

  useEffect(() => {
    setStep(0);
    setOpen(!completed);
  }, [completed, exhibitId]);

  const continueDialogue = () => {
    if (step === 0) {
      setStep(1);
      return;
    }
    setOpen(false);
    onEnterContent?.();
  };

  return (
    <>
      {/* Inline entry button — NOT fixed, NOT portal.
          The global XiaoyaoCompanion already occupies bottom-right.
          This inline button sits inside the exhibit content flow. */}
      {!open && !completed && (
        <button type="button" onClick={() => setOpen(true)} className="culture-dialogue-entry-inline" aria-label="打开小瑶场景对话">
          <span className="xiaoyao-avatar is-large" aria-hidden="true" />
          <span><strong><MessageCircle size={14} />小瑶陪你逛展</strong><small>点击继续当前场景对话</small></span>
        </button>
      )}

      {/* Overlay modal — still portal to body for proper stacking */}
      {open && createPortal(
        <div className="culture-dialogue-overlay" role="dialog" aria-modal="true" aria-label="小瑶场景引导">
          <button type="button" className="culture-dialogue-backdrop" onClick={() => setOpen(false)} aria-label="关闭小瑶引导" />
          <div className="culture-dialogue-shell content-enter">
            <img src="/xiaoyao/transparent/1.png" alt="小瑶" className="culture-dialogue-character" />
            <section className="culture-dialogue-card">
              <button type="button" onClick={() => setOpen(false)} className="culture-dialogue-close" aria-label="关闭对话"><X size={21} /></button>
              <div className="culture-dialogue-identity">
                <div><strong>小瑶</strong><small>新人成长伙伴</small></div>
              </div>
              <div className="culture-dialogue-messages">
                {(step === 0 ? scene.opening : scene.response).map((message) => <p key={message} className="zh-body" data-typography-check>{message}</p>)}
              </div>
              <button type="button" onClick={continueDialogue} className="culture-dialogue-option">
                {step === 0 ? scene.option : scene.action}<ArrowRight size={16} />
              </button>
            </section>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
