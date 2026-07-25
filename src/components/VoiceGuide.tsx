import { Captions, Headphones, Pause, Play, RotateCcw } from "lucide-react";
import { useRef, useState } from "react";
import { getVoiceScene } from "../data/voiceCatalog";

type VoiceGuideProps = {
  title: string;
  description: string;
  sceneKey: string;
};

export default function VoiceGuide({ title, description, sceneKey }: VoiceGuideProps) {
  const scene = getVoiceScene(sceneKey);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [showCaptions, setShowCaptions] = useState(false);
  const available = Boolean(scene?.audioSrc);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    if (audio.paused) await audio.play(); else audio.pause();
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio || !available) return;
    audio.currentTime = 0;
    void audio.play();
  };

  return (
    <aside className="app-panel p-5">
      {scene?.audioSrc && <audio ref={audioRef} src={scene.audioSrc} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />}
      <div className="flex items-start gap-3.5">
        <div className="xiaoyao-avatar is-large shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-semibold text-brand">小瑶 · 新人成长伙伴</span>
            <span className="h-1 w-1 rounded-full bg-border-subtle" />
            <span className="text-[11px] text-text-tertiary">{available ? "可播放" : "音频待接入"}</span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          <p className="mt-1.5 text-xs leading-5 text-text-secondary">{description}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={togglePlay} disabled={!available} className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-deep px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-text-tertiary/35" aria-label={available ? "播放小瑶讲解" : "音频待接入"}>
          {available ? playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" /> : <Headphones size={15} />}
          {available ? playing ? "暂停" : "播放" : "音频待接入"}
        </button>
        <button onClick={restart} disabled={!available} className="grid h-10 w-10 place-items-center rounded-xl border border-border-faint bg-white text-text-tertiary disabled:cursor-not-allowed disabled:opacity-45" aria-label="重新播放"><RotateCcw size={16} /></button>
        <button onClick={() => setShowCaptions((value) => !value)} className="grid h-10 w-10 place-items-center rounded-xl border border-border-faint bg-white text-text-tertiary" aria-label="展开字幕"><Captions size={17} /></button>
      </div>
      {showCaptions && <p className="mt-3 rounded-xl bg-bg-elevated px-3.5 py-3 text-xs leading-6 text-text-secondary">{scene?.transcript ?? "字幕与音频独立维护；当前场景逐字稿仍待正式审核。"}</p>}
    </aside>
  );
}
