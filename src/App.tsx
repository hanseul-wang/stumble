import { getAppsInTossGlobals, graniteEvent, getTossShareLink, share } from "@apps-in-toss/web-framework";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { getResultIndex, QUESTIONS } from "./questions";
import { getResult } from "./results";
import "./App.css";

// 토스 네이티브 런타임(WebView) 안에서 실행 중인지 판별해요.
// 일반 웹 브라우저면 false — graniteEvent·share 등 네이티브 브릿지는
// 이 안에서만 호출해야 "ReactNativeWebView is not available" throw를 피해요.
// (getOperationalEnvironment()는 웹에서 자체적으로 throw하므로 쓰지 않아요.)
const isInToss = () =>
  typeof window !== "undefined" && "ReactNativeWebView" in window;

// 설문 문항·채점 로직은 src/questions.ts, 결과 메타는 src/results.ts에서 관리해요.

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
    // 웹 브라우저엔 네이티브 뒤로가기 버튼이 없고, 브릿지 호출 시 throw가 나요.
    // 토스 런타임 안에서만 backEvent를 구독해요. (웹은 브라우저 뒤로가기가 동작)
    if (!isInToss()) return;
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
  const result = getResult(typeIndex);
  const isOwn = sessionStorage.getItem("isOwnResult") === "true";

  const handleShare = async () => {
    const shareMessage = `${name ? `${name}은 ` : ""}${result.subtitle}이에요. 나도 해볼래요?`;

    // 웹 브라우저 폴백: 토스 공유 브릿지 대신 Web Share API → 클립보드.
    // 현재 URL(?t=...&name=...)이 결과를 그대로 재현하므로 그걸 공유해요.
    if (!isInToss()) {
      const url = window.location.href;
      try {
        if (navigator.share) {
          await navigator.share({ text: shareMessage, url });
        } else {
          await navigator.clipboard.writeText(`${shareMessage}\n${url}`);
          window.alert("결과 링크를 복사했어요!");
        }
      } catch (e) {
        console.error("[share:web] failed:", e);
      }
      return;
    }

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
      const shareText = `${shareMessage}\n${tossShareLink}`;
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
