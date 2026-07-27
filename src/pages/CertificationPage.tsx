import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Lock,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
  XCircle,
} from "lucide-react";
import { learningStages } from "../data/learningData";
import {
  CERTIFICATION_QUESTIONS,
  MAX_ATTEMPTS,
  PASSING_SCORE,
  KNOWLEDGE_AREAS,
  type CertificationQuestion,
} from "../data/certificationData";
import {
  fetchCertificationQuestions,
  submitCertificationViaApi,
  useLearningProgress,
} from "../hooks/useLearningProgress";
import { isApiMode } from "../lib/api";

type ViewState = "gate" | "exam" | "result" | "review" | "certificate";

type CertificationPageProps = { onNavigate: (path: string) => void };

const stageBadge = learningStages[5].badge;

function QuestionCard({
  q,
  index,
  total,
  selected,
  onSelect,
}: {
  q: CertificationQuestion;
  index: number;
  total: number;
  selected: number | null;
  onSelect: (i: number) => void;
}) {
  const optionLabels = ["A", "B", "C", "D"];
  return (
    <div className="certification-question-card">
      <div className="certification-question-header">
        <span className="certification-question-counter">
          第 {index + 1} / {total} 题
        </span>
        <span className="certification-question-area">{KNOWLEDGE_AREAS[q.area]}</span>
      </div>
      <h3 className="certification-question-title">{q.question}</h3>
      <div className="certification-options">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            className={`certification-option ${selected === i ? "is-selected" : ""}`}
            onClick={() => onSelect(i)}
          >
            <span className="certification-option-label">{optionLabels[i]}</span>
            <span className="certification-option-text">{opt}</span>
            {selected === i && <CheckCircle2 size={18} className="certification-option-check" />}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CertificationPage({ onNavigate }: CertificationPageProps) {
  const { progress, startCertificationAttempt, submitCertificationAttempt, resetCertification } =
    useLearningProgress();

  const unlocked = progress.rules.completed;
  const [view, setView] = useState<ViewState>(
    progress.certification.passed ? "certificate" : "gate",
  );
  const [answers, setAnswers] = useState<number[]>(
    Array(CERTIFICATION_QUESTIONS.length).fill(-1),
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [weakAreas, setWeakAreas] = useState<string[]>([]);
  const [questionVersion, setQuestionVersion] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // API 模式下预取题库版本，用于提交认证时与后端对齐
  useEffect(() => {
    if (!isApiMode()) return;
    fetchCertificationQuestions()
      .then((res) => setQuestionVersion(res.version))
      .catch(() => {});
  }, []);

  const gameCount = Object.values(progress.rules.rulesGamesCompleted).filter(Boolean).length;
  const canTakeExam = unlocked && progress.certification.attempts < MAX_ATTEMPTS;
  const hasRemainingAttempts = progress.certification.attempts < MAX_ATTEMPTS;

  const allAnswered = answers.every((a) => a !== -1);

  const examScore = useMemo(() => {
    let s = 0;
    CERTIFICATION_QUESTIONS.forEach((q, i) => {
      if (answers[i] === q.answer) s += q.points;
    });
    return s;
  }, [answers]);

  const wrongQuestions = useMemo(() => {
    return CERTIFICATION_QUESTIONS.map((q, i) => ({ q, i })).filter(
      ({ q, i }) => answers[i] !== q.answer,
    );
  }, [answers]);

  const startExam = () => {
    if (!canTakeExam) return;
    startCertificationAttempt();
    setAnswers(Array(CERTIFICATION_QUESTIONS.length).fill(-1));
    setCurrentIndex(0);
    setView("exam");
  };

  const submitExam = async () => {
    if (isSubmitting) return;
    const s = examScore;

    // Compute weak areas from wrong questions
    const areaStats: Record<string, { total: number; wrong: number }> = {};
    CERTIFICATION_QUESTIONS.forEach((q) => {
      areaStats[q.area] = areaStats[q.area] ?? { total: 0, wrong: 0 };
      areaStats[q.area].total += 1;
    });
    wrongQuestions.forEach(({ q }) => {
      areaStats[q.area].wrong += 1;
    });
    const weak = Object.entries(areaStats)
      .filter(([, stats]) => stats.wrong > 0)
      .sort((a, b) => b[1].wrong - a[1].wrong)
      .map(([area]) => KNOWLEDGE_AREAS[area as keyof typeof KNOWLEDGE_AREAS])
      .slice(0, 3);

    setScore(s);
    setWeakAreas(weak);

    // API 模式下同步提交到后端，确保后台统计、学习天地解锁、认证关卡状态一致
    if (isApiMode() && questionVersion) {
      setIsSubmitting(true);
      try {
        const apiAnswers = CERTIFICATION_QUESTIONS.map((q, i) => ({
          questionId: q.id,
          selectedOption: answers[i],
        }));
        const result = await submitCertificationViaApi(questionVersion, apiAnswers);
        submitCertificationAttempt(result.score, answers, result.weakAreas?.map((wa: string) => KNOWLEDGE_AREAS[wa as keyof typeof KNOWLEDGE_AREAS] || wa) ?? weak);
      } catch {
        // 后端提交失败时仍用本地评分保证 UI 可用
        submitCertificationAttempt(s, answers, weak);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      submitCertificationAttempt(s, answers, weak);
    }

    setView("result");
  };

  const handleSelect = (i: number) => {
    const next = [...answers];
    next[currentIndex] = i;
    setAnswers(next);
  };

  const handleNext = () => {
    if (currentIndex < CERTIFICATION_QUESTIONS.length - 1) setCurrentIndex((idx) => idx + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex((idx) => idx - 1);
  };

  const handleRetry = () => {
    if (!hasRemainingAttempts) return;
    startCertificationAttempt();
    setAnswers(Array(CERTIFICATION_QUESTIONS.length).fill(-1));
    setCurrentIndex(0);
    setView("exam");
  };

  const handleReset = () => {
    if (!window.confirm("重置将清空所有认证记录与学习天地解锁状态，确定吗？")) return;
    resetCertification();
    setView("gate");
  };

  // ── Gate View ──
  if (view === "gate") {
    return (
      <div className="content-enter pb-10" data-certification-unlocked={unlocked ? "true" : "false"}>
        <div className="page-heading">
          <p className="!mt-0 text-xs font-semibold uppercase tracking-[.14em] text-brand">Journey milestone</p>
          <h2>入职认证</h2>
          <p>完成前五关全部探索后，即可进入入职认证环节。</p>
        </div>

        <section className={`app-surface certification-gate ${unlocked ? "is-unlocked" : ""}`}>
          <div className="certification-badge-panel">
            <p>NEWCOMER CERTIFICATION</p>
            <img src={stageBadge} alt="完成新人认证徽章" className={unlocked ? "" : "is-locked"} />
            <h3>{unlocked ? "第六关已经解锁" : "你的新人认证"}</h3>
            <span>{unlocked ? "第五关四项真实练习已经全部完成。" : "完成四项制度练习后点亮本入口。"}</span>
            <em>{unlocked ? <><Sparkles size={13} />已解锁</> : <><Lock size={13} />认证暂未解锁</>}</em>
          </div>

          <div className="certification-gate-copy">
            <div className="certification-gate-title">
              <span><ShieldCheck size={22} /></span>
              <div>
                <p>{unlocked ? "STAGE 06 UNLOCKED" : "BEFORE CERTIFICATION"}</p>
                <h3>{unlocked ? "可以进入新人认证准备区" : "先完成第五关成长挑战"}</h3>
                <small>
                  {unlocked
                    ? "所有前置练习已完成，入职认证入口已为你开放。本卷共 20 题，满分 100 分，80 分通过，最多可认证 3 次。"
                    : "完成第五关全部四项练习后，入职认证入口将自动解锁。"}
                </small>
              </div>
            </div>

            <div className="certification-condition-list">
              {[
                { title: "完成第五关四项制度练习", value: `${gameCount} / 4`, done: unlocked },
                {
                  title: "新人认证正式试卷",
                  value: unlocked ? "可进入" : "待解锁",
                  done: progress.certification.attempts > 0,
                },
                {
                  title: "认证结果与薄弱项",
                  value: progress.certification.attempts > 0 ? "已生成" : "待解锁",
                  done: progress.certification.attempts > 0,
                },
                {
                  title: "学习天地",
                  value: progress.learningWorldUnlocked ? "已开放" : "通过认证后开放",
                  done: progress.learningWorldUnlocked,
                },
              ].map((condition, index) => (
                <div key={condition.title}>
                  <span className={condition.done ? "is-done" : ""}>
                    {condition.done ? <Check size={14} /> : index + 1}
                  </span>
                  <strong>{condition.title}</strong>
                  <em>{condition.value}</em>
                </div>
              ))}
            </div>

            <div className="certification-gate-actions">
              {!unlocked ? (
                <button type="button" className="app-button-primary" onClick={() => onNavigate("stage/organization")}>
                  返回第五关继续练习<ArrowRight size={16} />
                </button>
              ) : progress.certification.passed ? (
                <button type="button" className="app-button-primary" onClick={() => setView("certificate")}>
                  查看认证证书<ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className="app-button-primary"
                  onClick={startExam}
                  disabled={!canTakeExam}
                >
                  {progress.certification.attempts === 0 ? "开始认证考试" : "重新认证考试"}
                  <ArrowRight size={16} />
                </button>
              )}
              {progress.certification.attempts > 0 && (
                <button type="button" className="app-button-ghost" onClick={() => setView("result")}>
                  查看上次成绩
                </button>
              )}
            </div>

            {progress.certification.attempts > 0 && (
              <p className="certification-attempts-hint">
                已认证 {progress.certification.attempts} / {MAX_ATTEMPTS} 次
                {progress.certification.bestScore > 0 && `，历史最高分 ${progress.certification.bestScore} 分`}
              </p>
            )}
          </div>
        </section>
      </div>
    );
  }

  // ── Exam View ──
  if (view === "exam") {
    const currentQuestion = CERTIFICATION_QUESTIONS[currentIndex];
    const selected = answers[currentIndex] === -1 ? null : answers[currentIndex];

    return (
      <div className="content-enter pb-10">
        <div className="page-heading">
          <p className="!mt-0 text-xs font-semibold uppercase tracking-[.14em] text-brand">Certification exam</p>
          <h2>新人认证考试</h2>
          <p>请认真回答每一题，全部提交后统一出分。</p>
        </div>

        <div className="certification-exam-layout">
          <div className="certification-exam-progress">
            <div className="certification-exam-progress-bar">
              <div
                className="certification-exam-progress-fill"
                style={{ width: `${((currentIndex + 1) / CERTIFICATION_QUESTIONS.length) * 100}%` }}
              />
            </div>
            <span>进度 {currentIndex + 1} / {CERTIFICATION_QUESTIONS.length}</span>
          </div>

          <QuestionCard
            q={currentQuestion}
            index={currentIndex}
            total={CERTIFICATION_QUESTIONS.length}
            selected={selected}
            onSelect={handleSelect}
          />

          <div className="certification-exam-nav">
            <button
              type="button"
              className="app-button-ghost"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              <ArrowLeft size={16} />上一题
            </button>

            {currentIndex < CERTIFICATION_QUESTIONS.length - 1 ? (
              <button
                type="button"
                className="app-button-primary"
                onClick={handleNext}
                disabled={selected === null}
              >
                下一题<ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="app-button-primary"
                onClick={submitExam}
                disabled={!allAnswered}
              >
                提交试卷<Check size={16} />
              </button>
            )}
          </div>

          {!allAnswered && currentIndex === CERTIFICATION_QUESTIONS.length - 1 && (
            <p className="certification-exam-hint">还有未作答题目，请返回检查。</p>
          )}

          <button
            type="button"
            className="certification-exam-abort"
            onClick={() => setView("gate")}
          >
            退出考试，返回准备区
          </button>
        </div>
      </div>
    );
  }

  // ── Result View ──
  if (view === "result") {
    const passed = score >= PASSING_SCORE;
    const displayScore = score; // use submitted score

    return (
      <div className="content-enter pb-10">
        <div className="page-heading">
          <p className="!mt-0 text-xs font-semibold uppercase tracking-[.14em] text-brand">Certification result</p>
          <h2>认证结果</h2>
          <p>{passed ? "恭喜你通过新人认证！" : "本次认证未通过，看看哪些领域还需要加强。"}</p>
        </div>

        <div className={`certification-result-card ${passed ? "is-passed" : "is-failed"}`}>
          <div className="certification-result-score">
            {passed ? <Trophy size={48} /> : <XCircle size={48} />}
            <h3>{displayScore}<small> / 100</small></h3>
            <p>{passed ? "已通过新人认证" : "未通过，需 ≥ 80 分"}</p>
          </div>

          <div className="certification-result-detail">
            {weakAreas.length > 0 && (
              <div className="certification-weak-areas">
                <h4><BookOpen size={16} />薄弱知识领域</h4>
                <div className="certification-weak-tags">
                  {weakAreas.map((area) => (
                    <span key={area} className="certification-weak-tag">{area}</span>
                  ))}
                </div>
              </div>
            )}

            <div className="certification-result-actions">
              {wrongQuestions.length > 0 && (
                <button
                  type="button"
                  className="app-button-ghost"
                  onClick={() => setView("review")}
                >
                  <BookOpen size={16} />错题回顾 ({wrongQuestions.length} 题)
                </button>
              )}

              {!passed && hasRemainingAttempts && (
                <button type="button" className="app-button-primary" onClick={handleRetry}>
                  <RefreshCcw size={16} />重新认证
                </button>
              )}

              {passed && (
                <button type="button" className="app-button-primary" onClick={() => setView("certificate")}>
                  <Award size={16} />查看证书
                </button>
              )}

              <button type="button" className="app-button-ghost" onClick={() => onNavigate("home")}>
                <ArrowLeft size={16} />返回首页
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Review View ──
  if (view === "review") {
    return (
      <div className="content-enter pb-10">
        <div className="page-heading">
          <p className="!mt-0 text-xs font-semibold uppercase tracking-[.14em] text-brand">Review mistakes</p>
          <h2>错题回顾</h2>
          <p>针对错题重点复习，巩固薄弱知识点。</p>
        </div>

        <div className="certification-review-list">
          {wrongQuestions.map(({ q, i }) => (
            <div key={q.id} className="certification-review-card">
              <div className="certification-review-header">
                <span>第 {i + 1} 题</span>
                <span>{KNOWLEDGE_AREAS[q.area]}</span>
              </div>
              <h4>{q.question}</h4>
              <p className="certification-review-answer">
                <strong>你的答案：</strong>
                {answers[i] === -1 ? "未作答" : q.options[answers[i]]}
              </p>
              <p className="certification-review-correct">
                <strong>正确答案：</strong>
                {q.options[q.answer]}
              </p>
              <p className="certification-review-explain">{q.explanation}</p>
            </div>
          ))}
        </div>

        <div className="certification-review-actions">
          <button type="button" className="app-button-ghost" onClick={() => setView("result")}>
            <ArrowLeft size={16} />返回结果
          </button>
          {!progress.certification.passed && hasRemainingAttempts && (
            <button type="button" className="app-button-primary" onClick={handleRetry}>
              <RefreshCcw size={16} />重新认证
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Certificate View ──
  return (
    <div className="content-enter pb-10">
      <div className="page-heading">
        <p className="!mt-0 text-xs font-semibold uppercase tracking-[.14em] text-brand">Certificate</p>
        <h2>新人认证证书</h2>
        <p>你已点亮第六枚徽章，正式解锁学习天地。</p>
      </div>

      <div className="certification-certificate">
        <div className="certification-certificate-inner">
          <img src={stageBadge} alt="第六枚徽章" />
          <h3>入职认证通过</h3>
          <p className="certification-certificate-sub">
            完成六站新人成长探索，掌握品牌文化、产品认知与制度基础。
          </p>
          <div className="certification-certificate-meta">
            <span><strong>最高分</strong>{progress.certification.bestScore} 分</span>
            <span><strong>认证次数</strong>{progress.certification.attempts} 次</span>
            <span><strong>通过时间</strong>
              {progress.certification.lastAttemptAt
                ? new Date(progress.certification.lastAttemptAt).toLocaleDateString("zh-CN")
                : "--"}
            </span>
          </div>
          <div className="certification-certificate-badge">
            <Sparkles size={14} />第六枚徽章已点亮
          </div>
        </div>

        <div className="certification-certificate-actions">
          <button type="button" className="app-button-primary" onClick={() => onNavigate("learning-world")}>
            进入学习天地<ArrowRight size={16} />
          </button>
          <button type="button" className="app-button-ghost" onClick={() => onNavigate("home")}>
            <ArrowLeft size={16} />返回首页
          </button>
          <button type="button" className="certification-reset-link" onClick={handleReset}>
            重新挑战认证
          </button>
        </div>
      </div>
    </div>
  );
}
