import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Gamepad2, LockKeyhole, Play, ShieldCheck, Sparkles, Volume2 } from "lucide-react";
import RocketBossGame from "../components/rules/RocketBossGame";
import RulesQuizGame from "../components/rules/RulesQuizGame";
import ValueCatchGame from "../components/rules/ValueCatchGame";
import ValueMatchGame from "../components/rules/ValueMatchGame";
import { learningStages } from "../data/learningData";
import { culturePairs, rocketWords, rulesFoundation } from "../data/rulesGameData";
import { type RulesGameKey, useLearningProgress } from "../hooks/useLearningProgress";
import XiaoyaoDialogue from "../components/XiaoyaoDialogue";

type RulesStagePageProps = { onNavigate: (path: string) => void };

const stage = learningStages.find((item) => item.id === "organization")!;
const gameCards: { key: RulesGameKey; code: string; title: string; summary: string; tone: string }[] = [
  { key: "rocketBoss", code: "01", title: "制度守卫战", summary: "驾驶火箭识别违规行为，击败违规机甲。", tone: "clay" },
  { key: "valueMatch", code: "02", title: "价值观对对碰", summary: "通过记忆翻牌，把价值观与真实行为配成一组。", tone: "moss" },
  { key: "valueCatch", code: "03", title: "小瑶接价值观", summary: "移动小瑶接住正向词，避开负面词。", tone: "sky" },
  { key: "quiz", code: "04", title: "制度知识问答", summary: "逐题练习制度与工作场景，答错后重新选择。", tone: "sand" },
];

export default function RulesStagePage({ onNavigate }: RulesStagePageProps) {
  const { progress, updateRulesProgress } = useLearningProgress();
  const rules = progress.rules;
  const [activeGame, setActiveGame] = useState<RulesGameKey | null>(null);
  const [startedGames, setStartedGames] = useState<RulesGameKey[]>([]);
  const completedCount = useMemo(() => Object.values(rules.rulesGamesCompleted).filter(Boolean).length, [rules.rulesGamesCompleted]);
  const rulesCompletionRef = useRef<HTMLElement>(null);
  const [activePolicy, setActivePolicy] = useState<string | null>(null);

  const POLICY_DETAILS: Record<string, { title: string; details: string[] }> = {
    moka: {
      title: "Moka 系统",
      details: [
        "接下来，我们认识一下Moka系统。",
        "Moka是大家日常办公中非常重要的人事系统。你可以通过企业微信工作台进入Moka，在里面查看公司制度、个人信息、考勤记录，也可以提交请假、外出、出差、补卡、转正等申请。",
        "简单来说，和你个人考勤、流程、信息相关的事情，大多都离不开Moka。",
        "所以新人一定要记住：遇到考勤异常，不要拖；需要请假或外出，也不要口头说完就算，一定要及时在系统里提交流程。",
      ],
    },
    attendance: {
      title: "考勤制度",
      details: [
        "我们来快速了解一下考勤制度。",
        "公司上班时间是早上8点30分，中午12点到13点30分为午休时间，下午茶时间是15点30到16点，下班时间是18点。",
        "普通部门一般每日需要打3次卡，排班部门一般每日打2次卡，具体以部门安排为准。",
        "如果忘记打卡，要及时在Moka系统里处理异常或提交补卡申请。不要等到月底才想起来哦。",
        "考勤看起来是小事，但它会影响个人记录、考核和团队协作，所以一定要重视。",
      ],
    },
    leave: {
      title: "请假 / 外出 / 出差",
      details: [
        "关于请假和外出，新同伴要特别注意。",
        "请假不是简单在群里说一句\u201c我今天不来了\u201d就可以。一般情况下，需要提前在人事系统提交请假申请，并经过审批。",
        "如果是突发情况，也要先向直属上级和HR报备，并在规定时间内补流程。",
        "因公外出也一样，需要提前提交外出申请，说明外出原因、时间和地点。",
        "一句话记住：凡是会影响你正常到岗的事情，都要提前报备，并走系统流程。",
      ],
    },
    expense: {
      title: "报销与发票",
      details: [
        "现在我们来看看报销和发票。",
        "报销最重要的三个词是：真实、完整、合规。",
        "你需要准备好真实有效的发票和凭证，在云之家OA里提交报销申请。审批完成后，还要按照财务要求提交纸质单据。",
        "发票也不能随便填。公司名称、纳税人识别号、金额、服务内容等信息都要准确。错一个信息，发票都有可能无效。",
        "所以报销前一定要检查清楚。流程走对了，财务处理才会更快，你自己也少返工。",
      ],
    },
  };

  // Auto-scroll to completion section when all 4 games are done
  useEffect(() => {
    if (rules.completed && rulesCompletionRef.current) {
      const timer = setTimeout(() => {
        rulesCompletionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [rules.completed]);

  // After entering a game, auto-scroll the ambient-page container to the game section
  useEffect(() => {
    if (!activeGame) return;
    const timer = setTimeout(() => {
      const root = document.querySelector(".ambient-page") as HTMLElement | null;
      const target = document.getElementById("rules-active-game");
      if (!root || !target) return;
      const rootRect = root.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const nextTop = root.scrollTop + (targetRect.top - rootRect.top) - 24;
      root.scrollTo({ top: Math.max(0, nextTop), behavior: "smooth" });
    }, 80);
    return () => clearTimeout(timer);
  }, [activeGame]);

  const beginGame = (key: RulesGameKey) => {
    setStartedGames((current) => current.includes(key) ? current : [...current, key]);
    setActiveGame(key);
  };

  const completeGame = useCallback((key: RulesGameKey) => {
    updateRulesProgress((current) => ({
      ...current,
      rocketTargetsHit: key === "rocketBoss" ? rocketWords.filter((word) => word.negative).map((word) => word.id) : current.rocketTargetsHit,
      rulesGamesCompleted: { ...current.rulesGamesCompleted, [key]: true },
    }));
  }, [updateRulesProgress]);

  const markFoundation = (id: string) => {
    updateRulesProgress((current) => ({ ...current, foundationViewed: current.foundationViewed.includes(id) ? current.foundationViewed : [...current.foundationViewed, id] }));
  };

  const matchPair = (pairId: string) => {
    updateRulesProgress((current) => {
      const culturePairsMatched = current.culturePairsMatched.includes(pairId) ? current.culturePairsMatched : [...current.culturePairsMatched, pairId];
      return { ...current, culturePairsMatched, rulesGamesCompleted: { ...current.rulesGamesCompleted, valueMatch: culturePairsMatched.length >= culturePairs.length } };
    });
  };

  const catchWord = (wordId: string) => updateRulesProgress((current) => ({ ...current, valueCatchCorrect: current.valueCatchCorrect.includes(wordId) ? current.valueCatchCorrect : [...current.valueCatchCorrect, wordId] }));
  const answerQuiz = (questionId: string, isCorrect: boolean) => updateRulesProgress((current) => ({
    ...current,
    quizAnswered: current.quizAnswered.includes(questionId) ? current.quizAnswered : [...current.quizAnswered, questionId],
    quizCorrect: isCorrect && !current.quizCorrect.includes(questionId) ? [...current.quizCorrect, questionId] : current.quizCorrect,
  }));
  const resetGame = (key: RulesGameKey) => updateRulesProgress((current) => ({
    ...current,
    culturePairsMatched: key === "valueMatch" ? [] : current.culturePairsMatched,
    valueCatchCorrect: key === "valueCatch" ? [] : current.valueCatchCorrect,
    quizAnswered: key === "quiz" ? [] : current.quizAnswered,
    quizCorrect: key === "quiz" ? [] : current.quizCorrect,
    rulesGamesCompleted: { ...current.rulesGamesCompleted, [key]: false },
  }));

  return (
    <div className="rules-stage-page content-enter pb-12">
      <section className="rules-stage-hero app-surface">
        <div className="rules-stage-badge"><img src={stage.badge} alt={stage.title} /></div>
        <div className="rules-stage-hero-copy">
          <p>NEWCOMER JOURNEY · STAGE 05</p>
          <h2>认识组织与基础制度</h2>
          <span>聚焦日常制度与四项练习，了解工作中的规则与流程。</span>
          <div className="rules-stage-progress"><i style={{ width: `${completedCount / 4 * 100}%` }} /><b>练习完成 {completedCount}/4</b></div>
        </div>
        <div className="rules-stage-hero-status"><ShieldCheck size={21} /><strong>{rules.completed ? "第五关已完成" : "成长挑战进行中"}</strong><span>{rules.completed ? "第六关已经解锁" : "完成四项练习即可通过"}</span></div>
      </section>

      <div className="mt-10 mb-8">
        <XiaoyaoDialogue
          title="小瑶带你认识日常制度"
          layout="horizontal"
          fullBody
          sceneKey="organization_rules"
          paragraphs={[
            "欢迎来到新人工作生存指南。",
            "放心，这一关不会让你从头到尾背员工手册。",
            "接下来，我们直接过一天。从早上到公司开始，到打卡、请假、外出、报销，再到下班前可能遇到的问题，小瑶会陪你一个一个判断。",
            "你只需要记住一个原则：遇到事情先判断，遇到流程按流程，不确定的时候及时确认。",
            "好啦，新人的一天开始咯。",
          ]}
        />
      </div>

      <section className="rules-foundation-section">
        <div className="rules-section-heading"><div><p>FOUNDATION</p><h3>先了解四类常用制度入口</h3></div></div>
        <div className="rules-foundation-grid">
          {rulesFoundation.map((item, index) => {
            const viewed = rules.foundationViewed.includes(item.id);
            return (
              <article key={item.id} className={viewed ? "is-viewed" : ""}>
                <span className="rules-foundation-number">0{index + 1}</span>
                <div><h4>{item.title}</h4><p>{item.summary}</p></div>
                <button type="button" onClick={() => setActivePolicy(item.id)}>
                  {viewed ? <><Check size={15} />再次查看</> : <><Volume2 size={15} />听小瑶讲解</>}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rules-game-hall app-surface" id="rules-game-hall">
        <div className="rules-section-heading rules-game-hall-heading">
          <div><p>GROWTH CHALLENGE</p><h3>制度小游戏大厅</h3><span>完成四项练习游戏，通过第五关。</span></div>
          <div className="rules-total-progress"><strong>{completedCount}<i>/4</i></strong><span>练习完成</span></div>
        </div>
        <div className="rules-game-grid">
          {gameCards.map((game) => {
            const done = rules.rulesGamesCompleted[game.key];
            const started = startedGames.includes(game.key) || activeGame === game.key;
            const status = done ? "已完成" : started ? "进行中" : "待开始";
            return (
              <button key={game.key} type="button" data-game-entry={game.key} className={`rules-game-card tone-${game.tone} ${done ? "is-complete" : ""}`} onClick={() => beginGame(game.key)}>
                <span className="rules-game-code">GAME {game.code}</span>
                <span className="rules-game-icon">{done ? <Check size={22} /> : <Gamepad2 size={22} />}</span>
                <strong>{game.title}</strong><p>{game.summary}</p>
                <span className="rules-game-card-footer"><i>{status}</i><em>{done ? "再次查看" : "进入练习"}<ArrowRight size={15} /></em></span>
              </button>
            );
          })}
        </div>
      </section>

      {activeGame && (
        <section className="rules-active-game" id="rules-active-game">
          <div className="rules-active-game-nav"><button type="button" onClick={() => setActiveGame(null)}><ArrowLeft size={16} />返回游戏大厅</button><span>{gameCards.find((game) => game.key === activeGame)?.title}</span></div>
          {activeGame === "rocketBoss" && <RocketBossGame completed={rules.rulesGamesCompleted.rocketBoss} onComplete={() => completeGame("rocketBoss")} />}
          {activeGame === "valueMatch" && <ValueMatchGame matchedPairs={rules.culturePairsMatched} onMatch={matchPair} onReset={() => resetGame("valueMatch")} />}
          {activeGame === "valueCatch" && <ValueCatchGame caughtWords={rules.valueCatchCorrect} completed={rules.rulesGamesCompleted.valueCatch} onCatch={catchWord} onComplete={() => completeGame("valueCatch")} onReset={() => resetGame("valueCatch")} />}
          {activeGame === "quiz" && <RulesQuizGame answered={rules.quizAnswered} correct={rules.quizCorrect} completed={rules.rulesGamesCompleted.quiz} onAnswer={answerQuiz} onComplete={() => completeGame("quiz")} onReset={() => resetGame("quiz")} />}
        </section>
      )}

      <section ref={rulesCompletionRef} className={`rules-stage-completion ${rules.completed ? "is-unlocked" : ""}`} data-rules-complete={rules.completed ? "true" : "false"}>
        <span>{rules.completed ? <Sparkles size={23} /> : <LockKeyhole size={21} />}</span>
        <div><p>{rules.completed ? "STAGE 05 COMPLETED" : "NEXT MILESTONE"}</p><h3>{rules.completed ? "四项练习全部完成，第六关已解锁" : `再完成 ${4 - completedCount} 项练习，解锁新人认证`}</h3><small>依次完成制度守卫战、价值观对对碰、小瑶接价值观和制度知识问答。</small></div>
        <button type="button" className={rules.completed ? "app-button-primary" : "app-button-secondary"} onClick={() => rules.completed ? onNavigate("certification") : document.getElementById("rules-game-hall")?.scrollIntoView({ behavior: "smooth" })}>{rules.completed ? <><Play size={16} />前往新人认证</> : <><BookOpen size={16} />继续练习</>}</button>
      </section>

      {activePolicy && (() => {
        const item = rulesFoundation.find((r) => r.id === activePolicy);
        const policy = POLICY_DETAILS[activePolicy];
        if (!item || !policy) return null;
        return (
          <div className="xiaoyao-policy-dialog-overlay" onClick={() => setActivePolicy(null)}>
            <div className="xiaoyao-policy-dialog" onClick={(e) => e.stopPropagation()}>
              <XiaoyaoDialogue
                title={policy.title}
                sceneKey={item.sceneKey}
                layout="vertical"
                paragraphs={policy.details}
                extraActions={[{ label: "我知道了", onClick: () => { markFoundation(item.id); setActivePolicy(null); }, primary: true }]}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
