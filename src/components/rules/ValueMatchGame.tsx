import { useMemo, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { culturePairs } from "../../data/rulesGameData";

type MatchCard = { id: string; pairId: string; kind: "value" | "behavior"; label: string; text: string };

function shuffle<T>(source: T[]) {
  const next = [...source];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [next[index], next[swap]] = [next[swap], next[index]];
  }
  return next;
}

function makeCards(): MatchCard[] {
  return shuffle(culturePairs.flatMap((pair) => [
    { id: `${pair.id}-value`, pairId: pair.id, kind: "value" as const, label: "价值观", text: pair.value },
    { id: `${pair.id}-behavior`, pairId: pair.id, kind: "behavior" as const, label: "对应行为", text: pair.behavior },
  ]));
}

export default function ValueMatchGame({ matchedPairs, onMatch, onReset }: { matchedPairs: string[]; onMatch: (pairId: string) => void; onReset: () => void }) {
  const [cards, setCards] = useState(makeCards);
  const [selected, setSelected] = useState<string[]>([]);
  const [mismatch, setMismatch] = useState<string[]>([]);
  const [flips, setFlips] = useState(0);
  const [feedback, setFeedback] = useState("翻开两张牌，找到价值观与对应行为。");
  const resolving = useRef(false);
  const lookup = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards]);

  const choose = (card: MatchCard) => {
    if (resolving.current || matchedPairs.includes(card.pairId) || selected.includes(card.id)) return;
    const nextSelected = [...selected, card.id];
    setSelected(nextSelected);
    setFlips((value) => value + 1);
    if (nextSelected.length < 2) return;
    resolving.current = true;
    const first = lookup.get(nextSelected[0]);
    const second = lookup.get(nextSelected[1]);
    const correct = Boolean(first && second && first.pairId === second.pairId && first.kind !== second.kind);
    if (correct && first) {
      onMatch(first.pairId);
      setFeedback("匹配成功，这组价值观已经点亮。");
      setSelected([]);
      resolving.current = false;
      return;
    }
    setMismatch(nextSelected);
    setFeedback("这两张不是一组，稍后会翻回去。");
    window.setTimeout(() => {
      setSelected([]);
      setMismatch([]);
      resolving.current = false;
    }, 680);
  };

  const reset = () => {
    onReset();
    setCards(makeCards());
    setSelected([]);
    setMismatch([]);
    setFlips(0);
    setFeedback("牌面已经重新洗牌，从第一组开始。");
  };

  return (
    <div className="rules-game-panel" data-game="valueMatch">
      <div className="rules-game-panel-head">
        <div><span>GAME 02</span><h3>价值观对对碰</h3></div>
        <strong>已配对 {matchedPairs.length}/{culturePairs.length} · 翻牌 {flips} 次</strong>
      </div>
      <p className="rules-game-intro">标准记忆翻牌：只有 `pairId` 相同且一张是价值观、一张是行为解释时才算匹配。</p>
      <div className="rules-memory-grid">
        {cards.map((card) => {
          const revealed = selected.includes(card.id) || matchedPairs.includes(card.pairId);
          const matched = matchedPairs.includes(card.pairId);
          return (
            <button key={card.id} type="button" data-match-card={card.id} onClick={() => choose(card)} className={`rules-memory-card ${revealed ? "is-revealed" : ""} ${matched ? "is-matched" : ""} ${mismatch.includes(card.id) ? "is-mismatch" : ""}`}>
              <span className="rules-memory-back">?</span>
              <span className="rules-memory-face"><small>{card.label}</small><strong>{card.text}</strong>{matched && <Check size={17} />}</span>
            </button>
          );
        })}
      </div>
      <div className="rules-game-feedback"><span>{feedback}</span><button type="button" onClick={reset}><RotateCcw size={14} />重新洗牌</button></div>
    </div>
  );
}
