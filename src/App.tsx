import { graniteEvent, getTossShareLink, share, TossAds } from "@apps-in-toss/web-framework";
import { useEffect, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import "./App.css";

// ─── Data ──────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    text: "주말 저녁, 뭔가 하고 싶다.",
    a: "혼자 조용히, 나만의 시간",
    b: "누군가랑 같이, 분위기 있게",
  },
  {
    text: "공연장 입장.\n어떤 자리가 더 설레?",
    a: "무대 바로 앞, 땀 냄새까지 느끼는 자리",
    b: "전체가 보이는 2층, 여유롭게 감상하는 자리",
  },
  {
    text: "전시 보는 스타일은?",
    a: "작품 옆 텍스트 다 읽고,\n작가 의도까지 파악",
    b: "느낌 오는 것 앞에서만 멈추고\n나머지는 패스",
  },
  {
    text: "좋아하는 음악 듣는 순간은?",
    a: "이어폰 꽂고 혼자 집중할 때",
    b: "사람들이랑 같이 있는 공간에\n흘러나올 때",
  },
  {
    text: "새로운 공연/전시,\n어떻게 고르고 싶어?",
    a: "내가 아는 아티스트거나 장르 확실한 것",
    b: "뭔지 모르지만 뭔가 끌리는 것",
  },
  {
    text: "운동한다면?",
    a: "음악 크게 틀고 혼자 존에 빠지는 운동\n(러닝, 웨이트)",
    b: "다같이 움직이면서 에너지 받는 운동\n(클래스, 팀 스포츠)",
  },
  {
    text: "외식할 때 더 중요한 건?",
    a: "음식 퀄리티, 그게 전부야",
    b: "공간 분위기, 거기 있는 느낌",
  },
  {
    text: "마음에 드는 공연 봤어.\n그 다음은?",
    a: "아티스트 파고들기,\n비하인드까지 다 찾아봄",
    b: "친구한테 바로 공유,\n같이 가자고 설득",
  },
  {
    text: "지금 보고 싶은 건?",
    a: "소극장 연극, 배우 숨소리까지 들리는",
    b: "대형 페스티벌, 군중과 하나 되는",
  },
  {
    text: "Stumble이 뭔가를 추천해줬어.\n아무것도 모르는 낯선 공연이야.",
    a: "일단 가봐, 그게 stumble이지",
    b: "후기 좀 찾아보고 결정할게",
  },
];

type ResultData = {
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  color: string;
};

const RESULTS: ResultData[] = [
  {
    title: "딥다이버",
    subtitle: "깊이를 아는 집중형 감상가",
    description:
      "표면보다 깊은 곳에 매력을 느끼는 사람이에요. 소극장의 긴장감, 작가의 의도, 아티스트의 서사까지 파고드는 집중형 감상가예요. 한 번 빠지면 끝까지 가는 타입.",
    tags: ["소극장 연극", "솔로 아티스트 공연", "기획 큐레이션 전시"],
    color: "#c6f135",
  },
  {
    title: "섬세한 감상가",
    subtitle: "좋은 것을 알아보는 유연한 취향가",
    description:
      "혼자서도, 함께서도 공연을 즐길 줄 알아요. 깊이와 분위기 사이에서 균형을 잡는 섬세한 감수성의 소유자예요. 취향이 뚜렷하지만 틀에 갇히지 않아요.",
    tags: ["현대 무용", "재즈/클래식 공연", "소규모 기획 전시"],
    color: "#a78bfa",
  },
  {
    title: "직관형 탐험가",
    subtitle: "끌리면 일단 가는 감각 우선주의",
    description:
      "이유가 없어도 끌리면 가요. 우연한 발견에서 인생 공연을 만나는 타입이에요. 낯선 것을 두려워하지 않고 감각을 믿는 문화 유목민이에요.",
    tags: ["팝업 공연", "미디어 아트", "복합문화공간 행사"],
    color: "#fb923c",
  },
  {
    title: "바이브 헌터",
    subtitle: "에너지와 분위기로 선택하는 소셜 메이커",
    description:
      "군중의 열기 속에서 가장 빛나는 사람이에요. 분위기를 느끼고, 에너지를 나누고, 경험을 공유하는 게 공연의 본질이라고 생각해요.",
    tags: ["뮤직 페스티벌", "대형 콘서트", "야외 공연"],
    color: "#f472b6",
  },
];

function getResultIndex(answers: boolean[]): number {
  const aCount = answers.filter(Boolean).length;
  if (aCount >= 8) return 0;
  if (aCount >= 6) return 1;
  if (aCount >= 4) return 2;
  return 3;
}

// ─── Pages ─────────────────────────────────────────────────────────────

function LandingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");

  const handleStart = () => {
    const params = name.trim() ? `?name=${encodeURIComponent(name.trim())}` : "";
    navigate(`/survey${params}`);
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
        <button className="already-btn" onClick={handleStart}>
          이미 해봤어요
        </button>
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
      sessionStorage.setItem("isOwnResult", "true");
      const nameParam = name ? `&name=${encodeURIComponent(name)}` : "";
      navigate(`/result?t=${getResultIndex(next)}${nameParam}`);
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

const BANNER_AD_GROUP_ID = "ait-ad-test-banner-id";

function ResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bannerRef = useRef<HTMLDivElement>(null);
  const [showBannerAd, setShowBannerAd] = useState(false);

  const typeIndex = Number(searchParams.get("t") ?? 3);
  const name = searchParams.get("name") ?? "";
  const result = RESULTS[typeIndex] ?? RESULTS[3];
  const isOwn = sessionStorage.getItem("isOwnResult") === "true";

  const handleShare = async () => {
    const deepLink = `intoss://stumble-taste/result?t=${typeIndex}${name ? `&name=${encodeURIComponent(name)}` : ""}`;
    const tossShareLink = await getTossShareLink(deepLink);
    const shareText = `${name ? `${name}은 ` : ""}${result.subtitle}이에요. 나도 해볼래요?\n${tossShareLink}`;
    await share({ message: shareText });
  };

  const handleRestart = () => {
    sessionStorage.removeItem("isOwnResult");
    navigate("/");
  };

  useEffect(() => {
    let attached: { destroy: () => void } | null = null;

    try {
      if (!TossAds.initialize.isSupported() || !TossAds.attachBanner.isSupported()) return;

      setShowBannerAd(true);
      TossAds.initialize({
        callbacks: {
          onInitialized: () => {
            if (!bannerRef.current) return;
            attached = TossAds.attachBanner(BANNER_AD_GROUP_ID, bannerRef.current, {
              theme: "auto",
              variant: "expanded",
            });
          },
        },
      });
    } catch {
      // 토스앱 외부 환경에서는 플레이스홀더 유지
    }

    return () => {
      attached?.destroy();
    };
  }, []);

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

      <div
        ref={bannerRef}
        className={showBannerAd ? "banner-ad-container" : "banner-ad-placeholder"}
      >
        {!showBannerAd && <span className="banner-ad-placeholder-text">AD</span>}
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
