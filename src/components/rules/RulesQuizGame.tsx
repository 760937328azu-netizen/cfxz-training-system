import { useMemo, useState } from "react";
import { Check, ChevronRight, RotateCcw, X } from "lucide-react";
import { quizQuestions } from "../../data/rulesGameData";

type QuizProps = {
  answered: string[];
  correct: string[];
  completed: boolean;
  onAnswer: (questionId: string, isCorrect: boolean) => void;
  onComplete: () => void;
  onReset: () => void;
};

export default function RulesQuizGame({ answered, correct, completed, onAnswer, onComplete, onReset }: QuizProps) {
  const initialIndex = Math.max(0, quizQuestions.findIndex((question) => !correct.includes(question.id)));
  const [questionIndex, setQuestionIndex] = useState(initialIndex);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const question = quizQuestions[questionIndex];
  const progress = useMemo(() => new Set(correct).size, [correct]);

  const submit = (optionIndex: number) => {
    if (result === "correct") return;
    setSelected(optionIndex);
    const isCorrect = optionIndex === question.answer;
    setResult(isCorrect ? "correct" : "wrong");
    onAnswer(question.id, isCorrect);
  };

  const next = () => {
    const nextCorrect = new Set([...correct, question.id]);
    const nextAnswered = new Set([...answered, question.id]);
    if (nextAnswered.size >= quizQuestions.length && nextCorrect.size >= 4) {
      onComplete();
      return;
    }
    const nextIndex = quizQuestions.findIndex((item, index) => index > questionIndex && !nextCorrect.has(item.id));
    setQuestionIndex(nextIndex >= 0 ? nextIndex : 0);
    setSelected(null);
    setResult(null);
  };

  const reset = () => {
    setQuestionIndex(0);
    setSelected(null);
    setResult(null);
    onReset();
  };

  if (completed) {
    return (
      <div className="rules-game-panel rules-quiz-complete" data-game="quiz">
        <span className="rules-complete-mark"><Check size={25} /></span>
        <p>GAME 04</p>
        <h3>制度知识问答已完成</h3>
        <span>已完成全部 5 道题，且答对不少于 4 道。</span>
        <button type="button" className="app-button-secondary" onClick={reset}><RotateCcw size={15} />重新练习</button>
      </div>
    );
  }

  return (
    <div className="rules-game-panel" data-game="quiz">
      <div className="rules-game-panel-head">
        <div><span>GAME 04</span><h3>制度知识问答</h3></div>
        <strong>{questionIndex + 1} / {quizQuestions.length}</strong>
      </div>
      <div className="rules-quiz-progress" aria-label={`已答对 ${progress} 题`}><i style={{ width: `${progress / quizQuestions.length * 100}%` }} /></div>
      <div className="rules-quiz-question">
        <p>第 {questionIndex + 1} 题</p>
        <h4>{question.question}</h4>
      </div>
      <div className="rules-quiz-options">
        {question.options.map((option, index) => {
          const picked = selected === index;
          const state = picked ? result : null;
          return (
            <button key={option} type="button" className={state ? `is-${state}` : ""} onClick={() => submit(index)} disabled={result === "correct"}>
              <span>{String.fromCharCode(65 + index)}</span><b>{option}</b>
              {state === "correct" && <Check size={17} />}{state === "wrong" && <X size={17} />}
            </button>
          );
        })}
      </div>
      {result && (
        <div className={`rules-quiz-feedback is-${result}`}>
          <strong>{result === "correct" ? "回答正确" : "这次还不对，请重新选择"}</strong>
          <p>{question.explain}</p>
          {result === "correct" && <button type="button" onClick={next}>{questionIndex === quizQuestions.length - 1 ? "完成问答" : "下一题"}<ChevronRight size={16} /></button>}
        </div>
      )}
    </div>
  );
}
