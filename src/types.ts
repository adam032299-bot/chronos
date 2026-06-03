export interface GameStats {
  economy: number;       // 經濟
  military: number;      // 軍事
  diplomacy: number;     // 外交
  publicOpinion: number; // 民意
  industry: number;      // 產業
  market: number;        // 關市
}

export interface ScenarioImpact {
  economy?: number;
  military?: number;
  diplomacy?: number;
  publicOpinion?: number;
  industry?: number;
  market?: number;
}

export interface ScenarioOption {
  id: "A" | "B" | "C";
  title: string;
  description: string;
  impacts: ScenarioImpact;
}

export interface Advisor {
  title: string;       // 國防部長, 國務卿, 財政部長, CIA局長
  position: string;    // 軍事強硬, 外交談判, 市場穩定, 情報風險
  icon: "Shield" | "Handshake" | "TrendingUp" | "Eye";
  advice: string;      // 建議文字
  risk: string;        // 風險提醒
}

export interface Scenario {
  title: string;
  subtext: string;
  diplomaticImpact: "高" | "中" | "低";
  trumpQuote: string;
  options: ScenarioOption[];
  dateString: string;       // e.g. "2025年5月28日"
  daysOfPresidency: number; // e.g. 150
  advisors?: Advisor[];     // Advisory team recommendations
}

export interface DecisionHistoryItem {
  scenarioTitle: string;
  chosenOptionId: "A" | "B" | "C";
  chosenOptionTitle: string;
  dateString: string;
  daysOfPresidency: number;
  statsBefore: GameStats;
  statsAfter: GameStats;
}

export interface GameState {
  stats: GameStats;
  currentScenario: Scenario;
  history: DecisionHistoryItem[];
  isGameOver: boolean;
  gameEnding?: {
    type: "victory" | "defeat";
    title: string;
    description: string;
  };
}

export interface PresidentPersonality {
  hawkish: number;
  diplomatic: number;
  economic: number;
  populist: number;
  technocratic: number;
  isolationist: number;
}

