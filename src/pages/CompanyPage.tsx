import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Clock3, Play, Sparkles } from "lucide-react";
import XiaoyaoDialogue from "../components/XiaoyaoDialogue";
import { useLearningProgress } from "../hooks/useLearningProgress";

type CompanyPageProps = { onNavigate: (path: string) => void };

/* ── 企业历程时间线 ── */
const TIMELINE_EVENTS = [
  { year: "2017", title: "创始人走进长发村", desc: "创始人史旭军深入广西红瑶腹地，走访「天下第一长发村」。在古老瑶寨中，他发现红瑶女头发不脱不白的奥秘，正是源于世代相传的淘米水养发古法。这一发现，成为长发小寨的起点。", phase: "起点" },
  { year: "2018", title: "科研合作与品牌注册", desc: "与四川大学、桂林理工大学等八大院校达成科研合作，创建桂林市重点实验室；「长发小寨」商标注册成功。", phase: "探索" },
  { year: "2019", title: "破译养发秘密", desc: "首次破译红瑶淘米水养发秘密——含有三大头皮益生菌（嗜酸乳杆菌、长双歧杆菌、戊糖片球菌），已被中国微生物菌种管理中心保藏。科技馆项目获桂林市政府批复。", phase: "发现" },
  { year: "2020", title: "科研认可与专利", desc: "被评为桂林市重大科研项目，获 200 万元科研奖励。淘米水产品获「防脱发」「乌发」「对抗头皮老化」「头皮控油柔顺双效」「长效去屑止痒」五项国家发明专利。", phase: "验证" },
  { year: "2021", title: "科技馆落成 · 产品投产", desc: "长发科技馆正式落成开馆，成为展示科技成果与传统文化的重要窗口。淘米水洗护产品正式投产，解决 300 多个就业岗位。获龙胜县政府官方授权，成为唯一可使用正宗红瑶淘米水非遗发酵技艺的品牌。", phase: "转化" },
  { year: "2022", title: "品牌与科普双认可", desc: "荣获「品牌强国十大消费者满意品牌」。长发科技馆被评定为「桂林市科普教育基地」，淘米水养发从民俗走向科学普及。", phase: "认可" },
  { year: "2023", title: "国家级资质", desc: "获批国家级「高新技术企业」。获「漓江学者」设岗单位（桂林市此批唯一民企）。助力红瑶女成功挑战「最长的梳发长链」世界纪录。", phase: "进阶" },
  { year: "2024", title: "国际影响力", desc: "受邀出席第五届中国品牌走进联合国系列活动，获「国际行业影响力品牌奖」。获评国家级专精特新「小巨人」企业。", phase: "标杆" },
  { year: "2025", title: "市场突破", desc: "荣登抖音 618 个人护理行业 TOP9，斩获「新锐品牌奖」。通过国家高新技术企业复审。", phase: "突破" },
  { year: "2026", title: "线上冠军", desc: "登榜 2025 年度线上销售 TOP1，斩获两项洗护发品类线上销售冠军。", phase: "领先" },
];

/* ── 组织架构 ── */
type Department = {
  name: string;
  desc: string;
  directions?: { name: string; desc: string }[];
};

const ORG_GROUPS = [
  {
    id: "function",
    title: "职能与专业支持",
    desc: "为公司的日常运转、产品创新和专业能力提供支持。",
    units: [
      { name: "财务部", desc: "为公司的财务管理、经营数据和资金运转提供专业支持。" },
      { name: "人力资源部", desc: "负责人才加入、发展与员工体验，陪伴每一位伙伴持续成长。" },
      { name: "行政部", desc: "为日常办公与团队协作提供稳定、顺畅的运营保障。" },
      { name: "AI 数据部", desc: "探索 AI 与数据能力，帮助更多团队用更智能的方式提升工作效率。" },
      { name: "采购部", desc: "连接业务需求与外部资源，为产品和公司经营提供供应支持。" },
      { name: "研发部", desc: "围绕头皮养护、养发技术与相关专业领域持续开展研究。" },
      {
        name: "市场部",
        desc: "让长发小寨的品牌、产品和故事，被更多消费者看见、理解和记住。",
        directions: [
          { name: "品牌", desc: "建立统一、清晰的品牌表达。" },
          { name: "文案策划", desc: "围绕品牌和产品进行内容策划与创意表达。" },
          { name: "视觉设计", desc: "通过设计与视觉创意，让品牌和产品被更好地看见。" },
        ],
      },
      { name: "产品部", desc: "连接消费者需求与产品创新，让一个想法逐步成为真正的产品。" },
      { name: "会员社群部", desc: "通过持续沟通和服务，与用户建立更长期、更深入的连接。" },
      { name: "科学传播", desc: "把专业的头皮、养发与产品知识，转化成更准确、更容易理解的内容。" },
    ],
  },
  {
    id: "sales",
    title: "业务与增长",
    desc: "面向市场与消费者，让品牌和产品持续触达更多用户。",
    units: [
      { name: "抖音运营部", desc: "通过内容与直播，在抖音平台持续连接消费者、推动业务增长。" },
      { name: "抖音商城", desc: "负责抖音商城的商品运营与平台经营，让消费者拥有更顺畅的购买体验。" },
      { name: "商务部", desc: "连接达人、合作伙伴与商业资源，推动更多优质合作落地。" },
      { name: "媒介部", desc: "连接优质内容创作者与合作资源，让更多消费者认识长发小寨。" },
      { name: "传统电商部", desc: "负责主流电商平台的经营与用户服务，持续提升品牌在线上的经营表现。" },
      { name: "小红书", desc: "通过内容与用户沟通，让品牌、产品与养发知识被更多消费者真实地看见。" },
      { name: "客服部", desc: "直接连接消费者，为用户提供咨询与服务，也是公司倾听真实用户声音的重要窗口。" },
      { name: "分销渠道", desc: "拓展更多合适的合作渠道，让产品触达不同的消费场景。" },
      { name: "视频号运营部", desc: "围绕视频号开展内容、直播与经营，探索新的用户连接和增长方式。" },
      { name: "私域部", desc: "通过持续的用户沟通与服务，与消费者建立更长期的连接。" },
      { name: "TK 运营部", desc: "探索海外短视频及相关平台业务，让品牌走向更多市场。" },
      { name: "线下事业部", desc: "拓展线下业务与消费场景，让消费者在线下也能够认识和体验长发小寨。" },
    ],
  },
];

function DepartmentItem({ dept, isLast }: { dept: Department; isLast: boolean }) {
  const [open, setOpen] = useState(false);
  const hasDirections = dept.directions && dept.directions.length > 0;
  return (
    <div className={`dept-item ${isLast ? "dept-item--last" : ""}`}>
      <button
        type="button"
        className={`dept-item-toggle ${hasDirections ? "dept-item-toggle--expandable" : ""} ${open ? "is-open" : ""}`}
        onClick={() => hasDirections && setOpen((v) => !v)}
        disabled={!hasDirections}
      >
        <div className="dept-item-main">
          <strong className="dept-item-name">{dept.name}</strong>
          <span className="dept-item-desc">{dept.desc}</span>
        </div>
        {hasDirections && (
          <ChevronDown size={18} className={`dept-item-chevron ${open ? "is-open" : ""}`} />
        )}
      </button>
      {hasDirections && open && (
        <div className="dept-directions">
          {dept.directions!.map((d) => (
            <div key={d.name} className="dept-direction">
              <strong>{d.name}</strong>
              <span>{d.desc}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CompanyPage({ onNavigate }: CompanyPageProps) {
  const { progress, completeCompanyStage } = useLearningProgress();
  const isCompanyDone = progress.company.completed;
  const [expandedOrg, setExpandedOrg] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState(false);

  // ── Section-viewed tracking ──
  // User must view all 3 sections (intro + timeline + org) before completing.
  const [viewedSections, setViewedSections] = useState<Set<string>>(new Set());
  const allSectionsViewed = viewedSections.size >= 3;

  useEffect(() => {
    if (isCompanyDone) return; // Already completed — no need to track

    const root = document.querySelector(".ambient-page") as HTMLElement | null;
    if (!root) return;

    const sectionIds = ["company-intro", "company-timeline-section", "company-org-section"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setViewedSections((prev) => {
              if (prev.has(entry.target.id)) return prev;
              const next = new Set(prev);
              next.add(entry.target.id);
              return next;
            });
          }
        });
      },
      { root, rootMargin: "0px 0px -30% 0px", threshold: 0 },
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [isCompanyDone]);

  const handleNextStage = () => {
    completeCompanyStage();
    onNavigate("stage/culture");
  };

  return (
    <div className="company-page">
      {/* ── 返回导航 ── */}
      <button
        onClick={() => onNavigate("home")}
        className="mb-5 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-brand"
      >
        <ArrowLeft size={16} />返回成长地图
      </button>

      {/* ── 小瑶对话引导 ── */}
      <div className="mb-6">
        <XiaoyaoDialogue
          title="小瑶带你认识长发小寨"
          layout="horizontal"
          fullBody
          sceneKey="stage_2_intro"
          paragraphs={[
            "正式开始之前，小瑶先问你一个问题。",
            "你觉得，你刚刚加入的长发小寨，到底是一家怎样的公司？是一个洗护品牌？一家电商公司？还是一个和红瑶文化有关的品牌？",
            "其实都对，但又不完全。",
            "接下来这一站，我们会从公司的起点开始，看看文化、科研、产品、品牌和市场，是怎么一步一步连接起来的。",
            "走完这一站，你会真正知道，自己加入的是一个怎样的地方。",
          ]}
        />
      </div>

      {/* ═══════════════════════════════════════════════
          第一部分｜认识今天的长发小寨
          ═══════════════════════════════════════════════ */}
      <section id="company-intro" className="company-intro">
        <div className="company-intro-head">
          <p className="company-intro-kicker">
            <Sparkles size={15} /> 公司介绍
          </p>
          <h1 className="company-intro-title">认识今天的长发小寨</h1>
        </div>

        {/* 视频播放区 */}
        <div className="company-video-wrap">
          {!playingVideo ? (
            <div className="company-video-cover" onClick={() => setPlayingVideo(true)}>
              <img
                src="/logo/cfxz-3d-coin.png"
                alt="长发小寨品牌 Logo"
                className="company-video-poster"
              />
              <div className="company-video-play-btn">
                <Play size={28} />
              </div>
              <p className="company-video-caption">长发小寨品牌宣传片 — 点击播放</p>
            </div>
          ) : (
            <video
              className="company-video-player"
              src="/assets/videos/company-intro.mp4"
              controls
              autoPlay
              onEnded={() => setPlayingVideo(false)}
            />
          )}
        </div>

        {/* 公司简介 */}
        <div className="company-intro-card">
          <p className="zh-body" data-typography-check>
            长发小寨，扎根广西龙胜「天下第一长发村」，以红瑶世代传承的淘米水养发智慧为起点，将传统发酵经验转化为今天的头皮养护科技。
          </p>
          <p className="zh-body" data-typography-check>
            从 2017 年开始，长发小寨持续投入微生物研究与发酵技术转化，先后与四川大学、桂林理工大学等院校达成科研合作，破译淘米水中的三大头皮益生菌，并获得五项国家发明专利。
          </p>
          <p className="zh-body" data-typography-check>
            今天，长发小寨已获评国家级「高新技术企业」与专精特新「小巨人」企业，登榜 2025 年度线上销售洗护发品类冠军——从一碗来自生活的淘米水，到今天的现代养发产品。
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          第二部分｜我们从哪里走来
          ═══════════════════════════════════════════════ */}
      <section id="company-timeline-section" className="company-timeline-section">
        <div className="company-timeline-head">
          <p className="company-intro-kicker">Our journey</p>
          <h2>我们从哪里走来</h2>
          <p className="company-timeline-desc">
            从一方长发村出发，经过十年探索、验证和转化，走到今天的线上冠军。重要的不是年份，而是每个节点意味着什么。
          </p>
        </div>

        <div className="company-timeline">
          {TIMELINE_EVENTS.map((event, index) => (
            <div key={event.year} className="company-tl-node">
              {/* Left: year + phase label */}
              <div className="company-tl-left">
                <span className="company-tl-year">{event.year}</span>
                <span className="company-tl-phase">{event.phase}</span>
              </div>
              {/* Connector dot */}
              <div className="company-tl-dot-wrap">
                <span className={`company-tl-dot ${index === 0 ? "is-first" : ""} ${index === TIMELINE_EVENTS.length - 1 ? "is-last" : ""}`} />
                {index < TIMELINE_EVENTS.length - 1 && <span className="company-tl-line" />}
              </div>
              {/* Right: title + desc */}
              <div className="company-tl-right">
                <strong className="company-tl-title">{event.title}</strong>
                <p className="company-tl-desc" data-typography-check>{event.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          第三部分｜和哪些伙伴一起工作
          ═══════════════════════════════════════════════ */}
      <section id="company-org-section" className="company-org-section">
        <div className="company-org-head">
          <p className="company-intro-kicker">Today</p>
          <h2>和哪些伙伴一起工作</h2>
          <p className="company-org-desc">
            不需要记住每一个部门。先认识长发小寨主要有哪些团队，以及大家分别在解决什么问题。未来真正开始协作时，你会慢慢找到对应的伙伴。
          </p>
        </div>

        <div className="company-org-groups">
          {ORG_GROUPS.map((group) => {
            const isOpen = expandedOrg === group.id;
            return (
              <div key={group.id} className={`company-org-group ${isOpen ? "is-open" : ""}`}>
                <button
                  type="button"
                  className="company-org-group-toggle"
                  onClick={() => setExpandedOrg(isOpen ? null : group.id)}
                >
                  <div className="company-org-group-toggle-left">
                    <strong>{group.title}</strong>
                    <span>{group.desc}</span>
                  </div>
                  <ChevronDown size={20} className={`company-org-chevron ${isOpen ? "is-open" : ""}`} />
                </button>
                {isOpen && (
                  <div className="company-org-group-body">
                    <div className="dept-list">
                      {group.units.map((unit, i) => (
                        <DepartmentItem key={unit.name} dept={unit} isLast={i === group.units.length - 1} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 底部导航 ── */}
      <section className="company-completion">
        <div className="company-completion-card">
          {isCompanyDone ? (
            <>
              <p className="zh-body" data-typography-check>
                恭喜完成第二关！你对长发小寨已经有了初步的认识。
              </p>
              <button
                type="button"
                className="app-button-primary"
                onClick={handleNextStage}
              >
                进入第三关：认识品牌与非遗文化<ArrowRight size={15} />
              </button>
            </>
          ) : allSectionsViewed ? (
            <>
              <p className="zh-body" data-typography-check>
                现在你应该能回答三个问题了：长发小寨是一家什么样的公司？它经历了怎样的发展？今天有哪些团队一起推动公司向前？
              </p>
              <button
                type="button"
                className="app-button-primary"
                onClick={handleNextStage}
              >
                继续下一关：认识品牌与非遗文化<ArrowRight size={15} />
              </button>
            </>
          ) : (
            <>
              <p className="zh-body" data-typography-check>
                浏览完「公司介绍」「企业历程」「组织架构」三个部分后，就可以前往下一关继续探索。
              </p>
              <div className="flex items-center gap-2 text-sm text-text-tertiary">
                {["公司介绍", "企业历程", "组织架构"].map((label, i) => {
                  const ids = ["company-intro", "company-timeline-section", "company-org-section"];
                  const viewed = viewedSections.has(ids[i]);
                  return (
                    <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs ${viewed ? "bg-status-done/10 text-status-done" : "bg-bg-subtle text-text-tertiary"}`}>
                      {viewed ? <Check size={11} strokeWidth={3} /> : <Clock3 size={11} />}{label}
                    </span>
                  );
                })}
              </div>
              <button
                type="button"
                className="app-button-primary disabled:cursor-not-allowed disabled:opacity-45"
                disabled
              >
                请先完整浏览本关内容<ArrowRight size={15} />
              </button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
