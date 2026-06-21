import { getAppsInTossGlobals, graniteEvent, getTossShareLink, share } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import "./App.css";

// 검수 중에는 true — 통과 후 false로 변경
const REVIEW_MODE = true;

// ─── Data ──────────────────────────────────────────────────────────────

// 3개의 독립 축으로 취향을 측정해요. 각 질문은 한 축에만 기여하고,
// A 선택지가 항상 그 축의 "앞쪽 극(pole 0)"을 가리켜요.
//   social    : A=혼자(0)   ↔ B=함께(1)
//   mood      : A=깊이(0)   ↔ B=분위기(1)
//   discovery : A=우연(0)   ↔ B=계획(1)
// 축당 3문항(홀수)이라 무승부 없이 부호가 정해져요.
type Axis = "social" | "mood" | "discovery";

type Question = {
  text: string;
  axis: Axis;
  a: string;
  b: string;
};

const QUESTIONS: Question[] = [
  {
    text: "주말 저녁, 뭔가 하고 싶다.",
    axis: "social",
    a: "혼자 조용히, 나만의 시간",
    b: "누군가랑 같이, 분위기 있게",
  },
  {
    text: "공연장 입장.\n어떤 자리가 더 설레?",
    axis: "mood",
    a: "무대 바로 앞,\n디테일 하나까지 잡는 자리",
    b: "전체가 보이는 2층,\n공기째 감상하는 자리",
  },
  {
    text: "새로운 공연/전시,\n어떻게 고르고 싶어?",
    axis: "discovery",
    a: "뭔지 모르지만\n뭔가 끌리는 것",
    b: "아는 아티스트거나\n장르 확실한 것",
  },
  {
    text: "좋아하는 음악 듣는 순간은?",
    axis: "social",
    a: "이어폰 꽂고 혼자 집중할 때",
    b: "사람들이랑 같은 공간에\n흘러나올 때",
  },
  {
    text: "전시 보는 스타일은?",
    axis: "mood",
    a: "작품 옆 텍스트 다 읽고,\n작가 의도까지 파악",
    b: "느낌 오는 것 앞에서만 멈추고\n나머지는 패스",
  },
  {
    text: "Stumble이 낯선 공연을\n하나 추천해줬어.",
    axis: "discovery",
    a: "일단 가봐, 그게 stumble이지",
    b: "후기 좀 찾아보고 결정할게",
  },
  {
    text: "공연 끝나고 나오는 길.",
    axis: "social",
    a: "여운 혼자 안고\n조용히 집으로",
    b: "근처에서 한잔하며\n같이 떠들기",
  },
  {
    text: "외식할 때 더 중요한 건?",
    axis: "mood",
    a: "음식 퀄리티, 그게 전부야",
    b: "공간 분위기, 거기 있는 느낌",
  },
  {
    text: "낯선 동네에 떨어졌어.\n하루를 보낸다면?",
    axis: "discovery",
    a: "발길 닿는 대로,\n골목으로",
    b: "가볼 곳 리스트 짜서\n동선대로",
  },
];

type ResultData = {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  color: string;
};

// 인덱스 = social(혼자0/함께1)*4 + mood(깊이0/분위기1)*2 + discovery(우연0/계획1)
// 순서를 바꾸면 getResultIndex의 비트 계산과 어긋나니 주의해요.
const RESULTS: ResultData[] = [
  // 0 · 혼자 · 깊이 · 우연
  {
    title: "언더그라운드 디거",
    subtitle: "남들보다 먼저 찾아내는 발굴형 감상가",
    description:
      "아무도 모르는 걸 혼자 발굴할 때 가장 짜릿해요. 낯선 무대일수록 깊게 파고들어, 남들보다 먼저 '내 아티스트'를 찾아내는 사람이에요.",
    tags: ["언더그라운드 라이브", "독립영화관", "실험 전시"],
    color: "#c6f135",
  },
  // 1 · 혼자 · 깊이 · 계획
  {
    title: "아카이브 딥다이버",
    subtitle: "한 우물을 끝까지 파는 집중형 마니아",
    description:
      "확실한 것을 골라 끝까지 파고드는 집중형 감상가예요. 소극장의 긴장감, 작가의 의도, 아티스트의 서사까지 혼자 조용히 정복해요.",
    tags: ["소극장 연극", "단독 아티스트 공연", "기획 큐레이션 전시"],
    color: "#38bdf8",
  },
  // 2 · 혼자 · 분위기 · 우연
  {
    title: "무드 드리프터",
    subtitle: "분위기 따라 혼자 흘러가는 감각파",
    description:
      "계획 없이 분위기에 몸을 맡기는 사람이에요. 혼자여도 외롭지 않고, 우연히 흘러든 골목에서 그날의 무드를 줍는 감각의 소유자예요.",
    tags: ["골목 LP바", "팝업 전시", "야경 스팟"],
    color: "#fb923c",
  },
  // 3 · 혼자 · 분위기 · 계획
  {
    title: "무드 큐레이터",
    subtitle: "검증된 분위기만 골라 즐기는 혼자만의 미식가",
    description:
      "아무 데나 가지 않아요. 검증된 공간의 분위기를 혼자 음미하는, 취향이 분명한 미식가예요. 좋은 무드를 알아보는 눈이 정확해요.",
    tags: ["시그니처 카페 공연", "재즈바", "미디어아트 상설전"],
    color: "#a78bfa",
  },
  // 4 · 함께 · 깊이 · 우연
  {
    title: "씬 익스플로러",
    subtitle: "친구와 새로운 씬을 함께 파헤치는 탐험가",
    description:
      "낯선 씬을 친구와 함께 파헤칠 때 가장 신나요. 같이 발견하고, 같이 깊게 빠지는, 호기심 넘치는 공동 탐험가예요.",
    tags: ["신스 공연", "독립 아트페어", "워크숍형 전시"],
    color: "#34d399",
  },
  // 5 · 함께 · 깊이 · 계획
  {
    title: "씬메이트",
    subtitle: "같이 보고 끝까지 곱씹는 토론형 감상가",
    description:
      "확실한 작품을 골라 함께 보고, 끝나고 나서가 진짜 시작이에요. 같이 곱씹고 토론하며 깊이를 나누는 든든한 동행이에요.",
    tags: ["시네마테크", "클래식·재즈 정기공연", "북토크"],
    color: "#fbbf24",
  },
  // 6 · 함께 · 분위기 · 우연
  {
    title: "바이브 헌터",
    subtitle: "그 순간의 열기를 좇는 즉흥 소셜러",
    description:
      "군중의 열기 속에서 가장 빛나는 사람이에요. 계획보다 그 순간의 바이브, 분위기를 느끼고 에너지를 나누는 게 전부라고 생각해요.",
    tags: ["팝업 페스티벌", "클럽·펍 라이브", "야외 파티"],
    color: "#f472b6",
  },
  // 7 · 함께 · 분위기 · 계획
  {
    title: "페스 플래너",
    subtitle: "라인업 보고 완벽하게 준비하는 무드 메이커",
    description:
      "라인업을 보고 미리 그림을 그려요. 친구들과 갈 곳을 완벽하게 세팅해, 모두가 분위기에 취하게 만드는 판의 설계자예요.",
    tags: ["뮤직 페스티벌", "대형 콘서트", "시즌 아트페어"],
    color: "#6366f1",
  },
];

// 축별로 A(true) 개수를 세서 다수결로 부호를 정해요.
// 결과 인덱스는 social/mood/discovery 비트를 합쳐 0~7로 만들어요.
// (나중에 장소 추천을 붙일 땐 이 축 점수 벡터를 그대로 매칭에 쓰면 돼요.)
function getResultIndex(answers: boolean[]): number {
  const aCount: Record<Axis, number> = { social: 0, mood: 0, discovery: 0 };
  const total: Record<Axis, number> = { social: 0, mood: 0, discovery: 0 };

  answers.forEach((isA, i) => {
    const axis = QUESTIONS[i].axis;
    total[axis] += 1;
    if (isA) aCount[axis] += 1;
  });

  // A가 과반이면 앞쪽 극(0), 아니면 뒤쪽 극(1)
  const bit = (axis: Axis) => (aCount[axis] * 2 > total[axis] ? 0 : 1);

  return bit("social") * 4 + bit("mood") * 2 + bit("discovery");
}

// ─── Pages ─────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const hasPreviousResult = localStorage.getItem("stumble_result_t") !== null;

  const handleStart = () => {
    const params = name.trim() ? `?name=${encodeURIComponent(name.trim())}` : "";
    navigate(`/survey${params}`);
  };

  const handleAlready = () => {
    const saved = localStorage.getItem("stumble_result_t");
    if (saved !== null) {
      sessionStorage.setItem("isOwnResult", "true");
      const nameParam = name.trim() ? `&name=${encodeURIComponent(name.trim())}` : "";
      navigate(`/result?t=${saved}${nameParam}`);
    } else {
      handleStart();
    }
  };

  return (
    <div className="landing">
      <div className="landing-header">
        <span className="brand-name">STUMBLE</span>
        <h1 className="main-title">
          내 취향에 꼭 맞는
          <br />
          공연장을 찾아 줄게요
        </h1>
        <p className="subtitle">
          몇 가지 질문에 답하면
          <br />
          당신의 문화 취향을 발견해요.
        </p>
      </div>

      <div className="illustration-area">
        <div className="glow-bg" />
        <div className="dot dot-green" />
        <div className="dot dot-purple" />
        <div className="cards-container">
          <div className="card card-lime" />
          <div className="card card-dark" />
          <div className="card card-cream" />
        </div>
      </div>

      <div className="cta-area">
        <input
          className="name-input"
          type="text"
          placeholder="이름을 입력해주세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          maxLength={20}
        />
        <button className="start-btn" onClick={handleStart}>
          시작해 볼게요
        </button>
        {hasPreviousResult && (
          <button className="already-btn" onClick={handleAlready}>
            이미 해봤어요
          </button>
        )}
      </div>
    </div>
  );
}

function SurveyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const name = searchParams.get("name") ?? "";

  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);

  const total = QUESTIONS.length;
  const question = QUESTIONS[currentQ];
  const progress = (currentQ / total) * 100;

  const handleAnswer = (isA: boolean) => {
    const next = [...answers, isA];
    setAnswers(next);
    if (currentQ < total - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      const resultIndex = getResultIndex(next);
      localStorage.setItem("stumble_result_t", String(resultIndex));
      sessionStorage.setItem("isOwnResult", "true");
      const nameParam = name ? `&name=${encodeURIComponent(name)}` : "";
      navigate(`/result?t=${resultIndex}${nameParam}`);
    }
  };

  useEffect(() => {
    const unsubscribe = graniteEvent.addEventListener("backEvent", {
      onEvent: () => {
        if (currentQ === 0) {
          navigate("/");
        } else {
          setCurrentQ((q) => q - 1);
          setAnswers((a) => a.slice(0, -1));
        }
      },
      onError: (e) => console.error(e),
    });
    return unsubscribe;
  }, [currentQ, navigate]);

  return (
    <div className="survey">
      <div className="survey-top">
        <span className="q-counter">
          {currentQ + 1} / {total}
        </span>
      </div>

      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="survey-body" key={currentQ}>
        <p className="q-label">Q{currentQ + 1}</p>
        <h2 className="q-text">{question.text}</h2>
      </div>

      <div className="options-area" key={`opts-${currentQ}`}>
        <button className="option-card" onClick={() => handleAnswer(true)}>
          <span className="option-badge">A</span>
          <span className="option-text">{question.a}</span>
        </button>
        <button className="option-card" onClick={() => handleAnswer(false)}>
          <span className="option-badge">B</span>
          <span className="option-text">{question.b}</span>
        </button>
      </div>
    </div>
  );
}

function ResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const typeIndex = Number(searchParams.get("t") ?? 3);
  const name = searchParams.get("name") ?? "";
  const result = RESULTS[typeIndex] ?? RESULTS[3];
  const isOwn = sessionStorage.getItem("isOwnResult") === "true";

  const handleShare = async () => {
    try {
      const { deploymentId } = getAppsInTossGlobals();

      // 정식 출시 전: intoss-private:// 스킴 사용 (deploymentId 필요)
      // 정식 출시 후: intoss://stumble-taste/ 스킴 사용
      const queryParams = encodeURIComponent(
        JSON.stringify({ t: String(typeIndex), ...(name ? { name } : {}) })
      );
      const deepLink = deploymentId
        ? `intoss-private://appsintoss/result?_deploymentId=${deploymentId}&queryParams=${queryParams}`
        : `intoss://stumble-taste/result?t=${typeIndex}${name ? `&name=${encodeURIComponent(name)}` : ""}`;

      const tossShareLink = await getTossShareLink(deepLink);
      const shareText = `${name ? `${name}은 ` : ""}${result.subtitle}이에요. 나도 해볼래요?\n${tossShareLink}`;
      await share({ message: shareText });
    } catch (e) {
      console.error("[share] failed:", e);
    }
  };

  const handleRestart = () => {
    sessionStorage.removeItem("isOwnResult");
    navigate("/");
  };

  return (
    <div className="result">
      <div
        className="result-glow"
        style={{
          background: `radial-gradient(circle, ${result.color}2e 0%, ${result.color}0f 45%, transparent 70%)`,
        }}
      />

      <div className="result-content">
        <div className="result-top">
          <span className="brand-name">STUMBLE</span>
          <p className="result-label">
            {name ? `${name}의 문화 취향 유형` : "당신의 문화 취향 유형"}
          </p>
        </div>

        <div className="result-card">
          <h1 className="result-title" style={{ color: result.color }}>
            {result.title}
          </h1>
          <p className="result-subtitle">{result.subtitle}</p>
          <div
            className="result-divider"
            style={{ backgroundColor: result.color + "44" }}
          />
          <p className="result-desc">{result.description}</p>
          <div className="result-tags">
            {result.tags.map((tag) => (
              <span
                key={tag}
                className="result-tag"
                style={{
                  borderColor: result.color + "66",
                  color: result.color,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="result-cta">
        {isOwn ? (
          REVIEW_MODE ? (
            <button
              className="start-btn"
              style={{ backgroundColor: result.color }}
              onClick={handleRestart}
            >
              다시 해보기
            </button>
          ) : (
            <div className="result-cta-row">
              <button className="share-btn" onClick={handleShare}>
                친구에게 공유하기
              </button>
              <button
                className="start-btn"
                style={{ backgroundColor: result.color }}
                onClick={handleRestart}
              >
                다시 해보기
              </button>
            </div>
          )
        ) : (
          <button
            className="start-btn"
            style={{ backgroundColor: result.color }}
            onClick={handleRestart}
          >
            나도 해볼게요
          </button>
        )}
      </div>

    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/survey" element={<SurveyPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
