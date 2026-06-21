// ┌─────────────────────────────────────────────────────────────────────┐
// │ 설문 문항 + 채점 로직을 한 곳에서 관리해요.                            │
// │                                                                       │
// │ 문항 카피를 바꿀 땐 QUESTIONS만 고치면 돼요.                           │
// │ 결과 인덱스(0~7) → 텍스트·UI 매핑은 src/results.ts가 담당.             │
// └─────────────────────────────────────────────────────────────────────┘

// 3개의 독립 축으로 취향을 측정해요. 각 질문은 한 축에만 기여하고,
// A 선택지가 항상 그 축의 "앞쪽 극(pole 0)"을 가리켜요.
//   social    : A=혼자(0)   ↔ B=함께(1)
//   mood      : A=깊이(0)   ↔ B=분위기(1)
//   discovery : A=우연(0)   ↔ B=계획(1)
// 축당 3문항(홀수)이라 무승부 없이 부호가 정해져요.
export type Axis = "social" | "mood" | "discovery";

export type Question = {
  /** 질문 본문 (\n으로 줄바꿈) */
  text: string;
  /** 이 질문이 기여하는 축 */
  axis: Axis;
  /** A 선택지 (해당 축의 앞쪽 극 0) */
  a: string;
  /** B 선택지 (해당 축의 뒤쪽 극 1) */
  b: string;
};

export const QUESTIONS: Question[] = [
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

// 축별로 A(true) 개수를 세서 다수결로 부호를 정해요.
// 결과 인덱스는 social/mood/discovery 비트를 합쳐 0~7로 만들어요.
// (나중에 장소 추천을 붙일 땐 이 축 점수 벡터를 그대로 매칭에 쓰면 돼요.)
//   index = social*4 + mood*2 + discovery  → src/results.ts의 배열 순서와 일치
export function getResultIndex(answers: boolean[]): number {
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
