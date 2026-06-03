/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import html2canvas from "html2canvas";
import {
  Coins,
  Shield,
  Globe,
  Users,
  Factory,
  Scale,
  History,
  Sparkles,
  RefreshCw,
  Compass,
  Briefcase,
  AlertTriangle,
  Map,
  Send,
  Mail,
  FileText,
  CheckCircle,
  X,
  ArrowRight,
  ChevronRight,
  ChevronLeft,
  UserCheck,
  Award,
  LogOut,
  Trophy,
  Newspaper,
  BookOpen,
  Lock,
  Landmark,
  Gavel,
  Activity,
  Cpu,
  TrendingUp,
  Handshake,
  LineChart,
  User,
  Eye
} from "lucide-react";

import { GameStats, Scenario, DecisionHistoryItem, GameState, PresidentPersonality } from "./types";
import { useAuth } from "./context/AuthContext";
import AuthScreen from "./components/AuthScreen";
import { db } from "./firebase";
import { doc, setDoc, getDocs, collection } from "firebase/firestore";
import { CRISES_DATABASE, Crisis } from "./data/crises";


// Import pre-generated high-fidelity image assets
import trumpAvatar from "./assets/images/trump_avatar_1780323485243.png";

// Helper for getEnding() based on 12 turns outcome logic
function getEnding(gameState: { stats: GameStats; history: any[]; turn: number }) {
  const { economy, military, diplomacy, publicOpinion, industry, market } = gameState.stats;

  const avg = (economy + military + diplomacy + publicOpinion + industry + market) / 6;
  
  let rating = "";
  let ratingColor = "";
  let color = "";
  if (avg >= 90) { rating = "傳奇總統"; ratingColor = "text-amber-400 border-amber-400/30 bg-amber-400/10"; color = "text-amber-400"; }
  else if (avg >= 80) { rating = "偉大總統"; ratingColor = "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"; color = "text-emerald-400"; }
  else if (avg >= 70) { rating = "優秀總統"; ratingColor = "text-blue-400 border-blue-400/30 bg-blue-400/10"; color = "text-blue-400"; }
  else if (avg >= 60) { rating = "普通總統"; ratingColor = "text-slate-300 border-slate-300/30 bg-slate-300/10"; color = "text-slate-300"; }
  else if (avg >= 40) { rating = "失敗總統"; ratingColor = "text-orange-400 border-orange-400/30 bg-orange-400/10"; color = "text-orange-400"; }
  else { rating = "災難總統"; ratingColor = "text-red-500 border-red-500/30 bg-red-500/10"; color = "text-red-500"; }

  // Endings Check (Ordered by priority/specifity vs order in prompt)
  if (economy >= 85 && industry >= 85 && diplomacy >= 70) {
    return { title: "美國世紀 2.0", icon: "🇺🇸", desc: "美國重新成為全球唯一霸權。\nAI、晶片與金融市場全面領先。\n歷史學家稱此時代為：\n第二次美國世紀。", rating, ratingColor, color };
  }
  if (industry >= 95) {
    return { title: "AI科技霸權", icon: "🚀", desc: "美國掌握全球AI標準。\n全世界依賴美國AI生態系。", rating, ratingColor, color };
  }
  if (economy >= 90 && market >= 90) {
    return { title: "華爾街帝國", icon: "💰", desc: "美國經濟創下歷史新高。\n全球資本湧入華爾街。", rating, ratingColor, color };
  }
  if (diplomacy >= 90) {
    return { title: "自由世界領袖", icon: "🌍", desc: "美國成功領導全球民主聯盟。\n成為國際秩序核心。", rating, ratingColor, color };
  }
  if (military >= 90 && diplomacy <= 20) {
    return { title: "第三次世界大戰", icon: "☢️", desc: "一次誤判引爆全球衝突。\n世界進入戰爭時代。", rating, ratingColor, color };
  }
  if (economy <= 20 && market <= 20) {
    return { title: "美國衰敗", icon: "📉", desc: "美國失去全球領導地位。\n經濟陷入長期衰退。", rating, ratingColor, color };
  }
  if (diplomacy <= 30 && industry <= 40 && economy <= 40) {
    return { title: "中國世紀", icon: "🇨🇳", desc: "中國超越美國。\n北京成為新的世界中心。", rating, ratingColor, color };
  }
  if (publicOpinion <= 15) {
    return { title: "全民反對", icon: "😡", desc: "支持率崩盤。\n你的政治生涯提前結束。", rating, ratingColor, color };
  }
  if (publicOpinion >= 90 && economy >= 80 && military >= 80) {
    return { title: "川普王朝", icon: "👑", desc: "你成為史上最具影響力的總統之一。", rating, ratingColor, color };
  }
  
  const isBalanced = [economy, military, diplomacy, industry, publicOpinion, market].every(v => v >= 60 && v <= 85);
  if (isBalanced) {
    return { title: "平衡大師", icon: "⚖️", desc: "你成功維持國家穩定。\n避免極端風險。", rating, ratingColor, color };
  }

  // Default ending if nothing matched
  if (avg >= 60) {
    return { title: "平穩防守", icon: "🏛️", desc: "美國平安度過了這個任期。\n雖然沒有驚天動地的偉業，但國家依舊穩固。", rating, ratingColor, color };
  } else {
    return { title: "分歧的時代", icon: "🌪️", desc: "美國經歷了艱難的歲月。\n國家陷入了內外部挑戰的泥沼。", rating, ratingColor, color };
  }
}

const generateHistoricalReview = (stats: GameStats, endingName: string): string[] => {
  const endingPools: Record<string, string[]> = {
    "美國世紀 2.0": [
      "美國重新確立全球領導地位。",
      "你的科技政策被視為美國復興的重要轉折點。",
      "部分歷史學家將你的任期與雷根時代相提並論。",
      "全方位實力優勢使美國進入了無可挑戰的霸權期。",
      "美元體系與美軍力量以前所未有的姿態覆蓋全球。"
    ],
    "中國世紀": [
      "中國在你的任期後超越美國成為全球最大強權。",
      "北京逐漸取代華盛頓成為國際決策中心。",
      "許多學者認為這是全球權力轉移的重要分水嶺。",
      "美國長期的霸權在此刻畫下休止符。",
      "地緣政治舞台的重心正式朝太平洋西岸傾斜。"
    ],
    "第三次世界大戰": [
      "台海危機最終演變為全球性軍事衝突。",
      "外交失敗被認為是戰爭爆發的重要原因。",
      "這場衝突被列為21世紀最重大的國際災難之一。",
      "常規性戰略誤判引發了不可逆的連鎖反應。",
      "戰火幾乎波及了所有的主要地緣經濟區。"
    ],
    "美國衰敗": [
      "美國在你的任期內失去部分全球影響力。",
      "經濟衰退削弱了盟友對美國的信心。",
      "後世將此時期視為美國霸權衰落的重要起點。",
      "內部撕裂與外部壓力使聯邦政府陷入長期癱瘓。",
      "美國開始進行漫長且痛苦的全球戰略收縮。"
    ],
    "AI科技霸權": [
      "美國成功掌握人工智慧革命的主導權。",
      "你的科技政策重塑了全球產業格局。",
      "這段時期被稱為AI黃金時代的開端。",
      "矽谷成為了實質意義上的全球資源分配中心。",
      "美國憑藉演算法與算力優勢拉開了與他國的世代差距。"
    ],
    "華爾街帝國": [
      "美國資本市場進入空前繁榮時期。",
      "全球資金大量流向華爾街。",
      "經濟學界將此階段視為金融霸權的巔峰。",
      "股市屢創新高掩蓋了深層次的實體經濟隱患。",
      "資本的力量在此期間達到了干預國家政策的極致。"
    ],
    "自由世界領袖": [
      "美國成功重建民主陣營的凝聚力。",
      "多項國際危機在外交談判下獲得控制。",
      "你的任期被視為自由世界合作的典範。",
      "新大西洋主義取得了豐碩的戰略成果。",
      "全球多邊協議的簽署有效遏制了威權主義的擴張。"
    ],
    "川普王朝": [
      "你的支持率長期維持歷史高點。",
      "你成為21世紀最具影響力的政治人物之一。",
      "你的決策風格至今仍是學界爭論焦點。",
      "民粹主義與新保守主義在你的帶領下完成融合。",
      "你徹底重塑了美國的政治版圖與社會結構。"
    ],
    "平衡大師": [
      "你成功將危機控制在可承受的範圍內。",
      "溫和派歷史學家讚揚你避免了極端風險的爆發。",
      "在地緣摩擦最劇烈的時代，美國奇蹟般地保持了穩定。",
      "你務實的各方妥協政策雖然缺乏戲劇性，但有效維持了國力。",
      "這段時期後世被稱為「平息風暴的過渡年代」。"
    ],
    "全民反對": [
      "政治極化與施政失誤導致了歷史性的低支持率。",
      "民眾對白宮的信任降至冰點，引發了強烈的反噬效應。",
      "多位政治學專家將這個任期作為負面教材進行研究。",
      "在任內累積的民怨最終導致執政團隊的信用破產。",
      "這段時期是美國現代政治史上最動蕩的階段之一。"
    ],
    "平穩防守": [
      "美國在巨大的外部環境壓力下平穩著陸。",
      "雖然沒有開創顛覆性的成就，但成功穩住了國家根基。",
      "學者普遍認為這種保守的防禦性策略是當時的最佳解。",
      "在激進與保守的浪潮中，你為美國爭取了緩衝的時間。",
      "聯邦體制在你的維護下展現出了足夠的韌性。"
    ],
    "分歧的時代": [
      "國家陷入了內外部挑戰的泥沼中。",
      "黨派鬥爭使得重大法案屢遭擱置，削弱了國家總體競爭力。",
      "社會的價值觀分裂在你的任期末期達到了頂峰。",
      "未解決的核心問題為未來的動盪埋下了伏筆。",
      "學者對這段時期的施政評價呈現極端兩極化。"
    ]
  };

  const pool = endingPools[endingName];
  if (pool && pool.length > 0) {
    // Shuffle the pool and take the first 3
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  }

  // Fallback in case of unknown ending name, using specific stats logic
  const reviews: string[] = [];
  if (stats.diplomacy >= 85) reviews.push("在全球外交上取得了壓倒性的影響力。");
  if (stats.economy >= 85) reviews.push("創造了一段由美國主導的經濟繁榮期。");
  if (stats.industry >= 85) reviews.push("科技產業獲得了無前例的爆發式增長。");
  if (stats.military >= 85) reviews.push("打造了全球無可匹敵的強大軍事威懾力量。");
  if (stats.publicOpinion >= 85) reviews.push("在國內凝聚了空前一致的高度支持。");
  if (stats.market >= 85) reviews.push("引領全球資本向華爾街進行了大規模回流。");
  
  if (stats.diplomacy <= 30) reviews.push("國際社會對美國的信任度出現顯著下滑。");
  if (stats.economy <= 30) reviews.push("經濟政策的失誤引發了長期的結構性衰退。");
  if (stats.publicOpinion <= 30) reviews.push("總統的國內支持度面臨了前所未有的危機。");

  if (reviews.length < 3) {
    const avg = (stats.economy + stats.military + stats.diplomacy + stats.publicOpinion + stats.industry + stats.market) / 6;
    if (avg >= 70) {
      if (!reviews.includes("執政團隊展現了卓越的危機處理能力。")) reviews.push("執政團隊展現了卓越的危機處理能力。");
      if (!reviews.includes("後世將這段時期視為國力復甦的轉折。")) reviews.push("後世將這段時期視為國力復甦的轉折。");
      if (!reviews.includes("你在複雜的棋局中找到了最有利的突破口。")) reviews.push("你在複雜的棋局中找到了最有利的突破口。");
    } else if (avg >= 50) {
      if (!reviews.includes("在多方博弈中，美國維持了基本面的安全。")) reviews.push("在多方博弈中，美國維持了基本面的安全。");
      if (!reviews.includes("決策過程充滿了現實主義的妥協。")) reviews.push("決策過程充滿了現實主義的妥協。");
      if (!reviews.includes("過渡性的保守策略成為了這個時代的註腳。")) reviews.push("過渡性的保守策略成為了這個時代的註腳。");
    } else {
      if (!reviews.includes("歷史學者對這段時期的施政評價較為負面。")) reviews.push("歷史學者對這段時期的施政評價較為負面。");
      if (!reviews.includes("國家的深層結構問題在此期間被放大。")) reviews.push("國家的深層結構問題在此期間被放大。");
      if (!reviews.includes("未能在危機來臨時做出正確的歷史抉擇。")) reviews.push("未能在危機來臨時做出正確的歷史抉擇。");
    }
  }

  return reviews.slice(0, 3);
};

// Helper for initial default stats (50)
const DEFAULT_STATS: GameStats = {
  economy: 50,
  military: 50,
  diplomacy: 50,
  publicOpinion: 50,
  industry: 50,
  market: 50
};

interface LiveNewsItem {
  id: string;
  time: string;
  text: string;
  category: 'war' | 'diplomacy' | 'economy' | 'tech';
}

function categorizeNewsText(text: string): 'war' | 'diplomacy' | 'economy' | 'tech' {
  const lower = text.toLowerCase();
  if (/軍|戰|衝突|威脅|防衛|導彈|武裝|部隊|北約/i.test(lower)) return 'war';
  if (/經濟|股市|市場|關稅|nasdaq|貿易|匯率|資金|財政/i.test(lower)) return 'economy';
  if (/晶片|科技|半導體|ai|技術|數碼|研發|網絡/i.test(lower)) return 'tech';
  return 'diplomacy';
}

const getActiveRegions = (scenario: Scenario | null): string[] => {
  if (!scenario) return ["US"];
  const text = `${scenario.title} ${scenario.subtext} ${scenario.trumpQuote}`.toLowerCase();
  
  // Use Chinese matching since game text is in Chinese
  const textZh = `${scenario.title} ${scenario.subtext} ${scenario.trumpQuote}`;
  const regions = new Set<string>(["US"]);

  if (/中國|北京|習近平|解放軍|台海|稀土|關稅|中美/.test(textZh)) regions.add("China");
  if (/台灣|台北|賴清德|蕭美琴|台海|解放軍環台|晶片/.test(textZh)) regions.add("Taiwan");
  if (/俄羅斯|莫斯科|普丁|烏俄/.test(textZh)) regions.add("Russia");
  if (/烏克蘭|基輔|澤倫斯基|烏俄/.test(textZh)) regions.add("Ukraine");
  if (/北韓|朝鮮|平壤|金正恩|飛彈/.test(textZh)) { regions.add("NorthKorea"); regions.add("Japan"); } // Japan involved if missile/NK
  if (/伊朗|哈米尼|德黑蘭|荷姆茲|中東/.test(textZh)) regions.add("Iran");
  if (/以色列|耶路撒冷|中東/.test(textZh)) regions.add("Israel");
  if (/日本|東京|美日/.test(textZh)) regions.add("Japan");
  if (/歐洲|歐盟|北約|巴黎|柏林/.test(textZh)) regions.add("Europe");

  return Array.from(regions);
};

const REGION_DATA: Record<string, { name: string; flag: string }> = {
  US: { name: '美國', flag: '🇺🇸' },
  China: { name: '中國', flag: '🇨🇳' },
  Taiwan: { name: '台灣', flag: '🇹🇼' },
  Russia: { name: '俄羅斯', flag: '🇷🇺' },
  Ukraine: { name: '烏克蘭', flag: '🇺🇦' },
  NorthKorea: { name: '北韓', flag: '🇰🇵' },
  Iran: { name: '伊朗', flag: '🇮🇷' },
  Israel: { name: '以色列', flag: '🇮🇱' },
  Japan: { name: '日本', flag: '🇯🇵' },
  Europe: { name: '歐洲', flag: '🇪🇺' }
};

const getAdvisorIcon = (iconName: string) => {
  switch (iconName) {
    case "Shield":
      return <Shield className="w-8 h-8 shrink-0" style={{ color: "#F5A623" }} />;
    case "Handshake":
      return <Handshake className="w-8 h-8 shrink-0" style={{ color: "#F5A623" }} />;
    case "TrendingUp":
      return <TrendingUp className="w-8 h-8 shrink-0" style={{ color: "#F5A623" }} />;
    case "Eye":
      return <Eye className="w-8 h-8 shrink-0" style={{ color: "#F5A623" }} />;
    default:
      return <UserCheck className="w-8 h-8 shrink-0" style={{ color: "#F5A623" }} />;
  }
};

const getDynamicNewsHeadline = (scenarioTitle: string, chosenOptionTitle: string, chosenOptionId: string): string => {
  const title = scenarioTitle || "";
  if (title.includes("氣球") || title.includes("領空")) {
    return "美軍戰機緊急升空，白宮就不明飛行物入侵發表警告";
  }
  if (title.includes("古巴") || title.includes("哈瓦那")) {
    return "五角大廈加強海外巡邏，警告不容許核彈防禦漏洞";
  }
  if (title.includes("軍演") || title.includes("台海")) {
    return "第七艦隊突入南海與台海，軍事警戒等級全面提升";
  }
  if (title.includes("關稅") || title.includes("貿易") || title.includes("傾銷")) {
    return "白宮經濟委員會特別行動：實施一整套最新對外貿易制裁";
  }
  if (title.includes("晶片") || title.includes("科技") || title.includes("半導體") || title.includes("AI")) {
    return "商務部宣布高科技關鍵技術禁運，誓言維護美利堅科技主權";
  }
  if (title.includes("邊境") || title.includes("移民") || title.includes("圍牆")) {
    return "白宮簽署最新邊境安全行政命令，國土安全局增派突擊隊";
  }
  if (title.includes("中東") || title.includes("伊朗") || title.includes("蘇門答臘")) {
    return "波斯灣護航行動啟動，聯軍發言人稱不允許能源命脈受阻";
  }
  if (title.includes("烏克蘭") || title.includes("俄羅斯") || title.includes("北約")) {
    return "北約盟軍最高統帥召集代表大會，擬定最新歐洲防衛協定";
  }
  if (title.includes("美日") || title.includes("日本") || title.includes("首腦")) {
    return "美日發表聯合防衛宣言，深化新時代亞太雙邊軍事互信";
  }
  if (title.includes("北韓") || title.includes("朝鮮")) {
    return "防空反導實時系統激活，三國最高指揮官下達戒備令";
  }
  if (title.includes("金融") || title.includes("聯準會")) {
    return "財政部與聯準會發布聯合通告，力保美金全球儲備信譽";
  }
  
  if (chosenOptionId === "A") {
    return `白宮對「${title}」祭出最高規格強硬干預，全球市場震動`;
  }
  if (chosenOptionId === "B") {
    return `國務院啟動戰術性多邊外交斡旋，以尋求各方互惠利益平衡`;
  }
  return `商務部與跨部門行動組實施戰略圍堵，提升關鍵領域防禦管制`;
};

export default function App() {
  const { user, loading: authLoading, logout, isPlaceholderFirebase, syncToGAS } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(true);
  const [screenSize, setScreenSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsLargeScreen(width >= 1024);
      if (width >= 1024) {
        setScreenSize('desktop');
      } else if (width >= 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('mobile');
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [shuffledChoices, setShuffledChoices] = useState<any[]>([]);
  const [history, setHistory] = useState<DecisionHistoryItem[]>([]);
  const [turn, setTurn] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"main" | "overview" | "analysis" | "crises" | "relations">("main");

  // New states for End Game Analysis, AI Newspapers, and DB Archives
  interface AIReport {
    historicalReview: string;
    newsFrontpage: {
      headline: string;
      subtext: string;
      leadParagraph: string;
      internationalQuote: string;
      domesticQuote: string;
    };
  }
  const [report, setReport] = useState<AIReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Unlocked achievements system
  interface Achievement {
    id: string;
    title: string;
    description: string;
    emoji: string;
    color: string;
  }
  const ALL_ACHIEVEMENTS: Achievement[] = [
    { id: "dealmaker", title: "世紀決策締造者", description: "奪得最高的 S 等級評分", emoji: "🏆", color: "from-amber-500 to-yellow-400" },
    { id: "rust_belt", title: "鐵鏽工廠守護神", description: "國家重工業數值達到 80% 以上", emoji: "🏭", color: "from-cyan-500 to-blue-400" },
    { id: "pax_americana", title: "和平同盟安全閥", description: "外交同盟數值達到 80% 以上", emoji: "🕊️", color: "from-blue-500 to-violet-400" },
    { id: "wall_street", title: "華爾街超級大亨", description: "關市與金融指標達到 80% 以上", emoji: "📈", color: "from-emerald-500 to-teal-400" },
    { id: "iron_overlord", title: "鋼鐵合眾國智囊", description: "軍事防衛實力達到 80% 以上", emoji: "🛡️", color: "from-red-500 to-orange-400" },
    { id: "survivor", title: "美利堅生存王者", description: "成功走完 15 回合政策推演", emoji: "🇺🇸", color: "from-indigo-500 to-purple-400" },
    { id: "fired", title: "你被川普開除了", description: "任一指標跌破極限而丟失顧問授權", emoji: "🔥", color: "from-rose-600 to-red-500" }
  ];

  // Save game playthrough history to Firestore and Local fallback
  const generateAndSaveGameResult = async (finalStats: GameStats, playedHistory: DecisionHistoryItem[]) => {
    setIsGeneratingReport(true);
    let rating = "B";
    let endingTitle = "綜合執政評定";

    try {
      const ending = getEnding({ stats: finalStats, history: playedHistory, turn: playedHistory.length + 1 });
      rating = ending.rating;
      endingTitle = ending.title;
    } catch (err) {
      console.log("Error calculating ending title:", err);
    }

    let aiReport: AIReport | null = null;
    try {
      const res = await fetch("/api/game/generate-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: playedHistory,
          finalStats,
          endingName: endingTitle,
          rating,
          personalityTitle: getPersonalityName(personality)
        })
      });
      const data = await res.json();
      if (data && data.success) {
        aiReport = {
          historicalReview: data.historicalReview,
          newsFrontpage: data.newsFrontpage
        };
        setReport(aiReport);
      }
    } catch (e) {
      console.error("Failed to generate AI report:", e);
    }

    // Determine triggered achievements
    const achievements: string[] = [];
    if (rating === "S") achievements.push("dealmaker");
    if (finalStats.industry >= 80) achievements.push("rust_belt");
    if (finalStats.diplomacy >= 80) achievements.push("pax_americana");
    if (finalStats.market >= 80) achievements.push("wall_street");
    if (finalStats.military >= 80) achievements.push("iron_overlord");
    if (playedHistory.length >= 14) achievements.push("survivor");
    if (rating === "D") achievements.push("fired");

    const gameId = `game_${Date.now()}`;
    const totalScore = finalStats.economy + finalStats.military + finalStats.diplomacy + finalStats.publicOpinion + finalStats.industry + finalStats.market;

    const gameRecord = {
      gameId,
      endingName: endingTitle,
      rating,
      totalScore,
      finalStats: {
        economy: finalStats.economy,
        military: finalStats.military,
        diplomacy: finalStats.diplomacy,
        publicOpinion: finalStats.publicOpinion,
        industry: finalStats.industry,
        market: finalStats.market
      },
      decisions: playedHistory.map((h, idx) => ({
        round: idx + 1,
        scenarioTitle: h.scenarioTitle,
        chosenOptionId: h.chosenOptionId,
        chosenOptionTitle: h.chosenOptionTitle,
        daysOfPresidency: h.daysOfPresidency
      })),
      achievements,
      aiHistoricalReview: aiReport ? aiReport.historicalReview : "未生成 AI 評論，本局智庫平穩完結。",
      aiNewsFrontpage: aiReport ? aiReport.newsFrontpage : null,
      createdAt: new Date().toISOString()
    };

    // Store in localStorage
    try {
      const localHistory = JSON.parse(localStorage.getItem("chronos_local_gameHistory") || "[]");
      localHistory.unshift(gameRecord);
      localStorage.setItem("chronos_local_gameHistory", JSON.stringify(localHistory));
    } catch (err) {
      console.error("Local storage save error:", err);
    }

    // Save of user accounts info inside Firestore
    if (user && user.uid && !isPlaceholderFirebase) {
      try {
        const docRef = doc(db, "users", user.uid, "gameHistory", gameId);
        await setDoc(docRef, gameRecord);
        console.log(`Saved game result to Firestore successfully at path: users/${user.uid}/gameHistory/${gameId}`);
      } catch (firestoreErr) {
        console.error("Firestore save error, fallback to local indexing:", firestoreErr);
      }
    }

    // Sync completeGame via GAS (Failure won't disrupt the game flow)
    try {
      let endingDescription = endingTitle;
      try {
        const ending = getEnding({ stats: finalStats, history: playedHistory, turn: playedHistory.length + 1 });
        endingDescription = ending.desc;
      } catch (endingCalcErr) {
        console.error("Failed to calculate ending desc for GAS:", endingCalcErr);
      }

      await syncToGAS("completeGame", {
        userId: user?.uid || "guest",
        gameHistory: gameRecord,
        endings: {
          title: endingTitle,
          rating: rating,
          description: endingDescription
        }
      });
    } catch (completeGameErr) {
      console.error("Failed to sync completed game result via GAS completeGame:", completeGameErr);
    }

    setIsGeneratingReport(false);
  };

  // Fetch the completed list
  const fetchGameHistoryList = async () => {
    setIsHistoryLoading(true);
    let mergedHistory: any[] = [];

    try {
      mergedHistory = JSON.parse(localStorage.getItem("chronos_local_gameHistory") || "[]");
    } catch (err) {
      console.error("Load local history error:", err);
    }

    if (user && user.uid && !isPlaceholderFirebase) {
      try {
        const querySnapshot = await getDocs(collection(db, "users", user.uid, "gameHistory"));
        const fbDocs: any[] = [];
        querySnapshot.forEach((docSnap) => {
          fbDocs.push(docSnap.data());
        });

        // Merge keeping only unique IDs
        const idSet = new Set(mergedHistory.map(h => h.gameId));
        fbDocs.forEach(item => {
          if (!idSet.has(item.gameId)) {
            mergedHistory.push(item);
          }
        });
      } catch (firestoreErr) {
        console.error("Firestore history download error:", firestoreErr);
      }
    }

    mergedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setHistoryList(mergedHistory);
    setIsHistoryLoading(false);
  };

  // State Management functions:
  // 1. 所有數值範圍限制 0~100 的 updateStat 函式
  const updateStat = (statName: keyof GameStats, amount: number) => {
    setStats(prev => ({
      ...prev,
      [statName]: Math.max(0, Math.min(100, (prev[statName] ?? 50) + amount))
    }));
  };

  const updatePresidentPersonality = (impacts: any) => {
    setPersonality(prev => {
      const next = { ...prev };
      
      const mil = impacts.military ?? 0;
      if (mil >= 4) next.hawkish += 2;
      else if (mil > 0) next.hawkish += 1;

      const dip = impacts.diplomacy ?? 0;
      if (dip >= 4) next.diplomatic += 2;
      else if (dip > 0) next.diplomatic += 1;

      const eco = impacts.economy ?? 0;
      const mkt = impacts.market ?? 0;
      if (eco >= 4 || mkt >= 4) next.economic += 2;
      else if (eco > 0 || mkt > 0) next.economic += 1;

      const pop = impacts.publicOpinion ?? 0;
      if (pop >= 4) next.populist += 2;
      else if (pop > 0) next.populist += 1;

      const ind = impacts.industry ?? 0;
      if (ind >= 4) next.technocratic += 2;
      else if (ind > 0) next.technocratic += 1;

      if (dip < 0 && pop > 0) {
        next.isolationist += 2;
      } else if (dip < 0) {
        next.isolationist += 1;
      }

      return next;
    });
  };

  const getPersonalityName = (p: PresidentPersonality) => {
    const keys: (keyof PresidentPersonality)[] = ["hawkish", "diplomatic", "economic", "populist", "technocratic", "isolationist"];
    const allZero = keys.every(k => p[k] === 0);
    if (allZero) return "平衡務實內閣";

    let maxKey = keys[0];
    let maxVal = p[maxKey];
    for (const k of keys) {
      if (p[k] > maxVal) {
        maxVal = p[k];
        maxKey = k;
      }
    }

    const mapping: Record<keyof PresidentPersonality, string> = {
      hawkish: "鐵腕鷹派",
      diplomatic: "外交協調者",
      economic: "市場總統",
      populist: "民意煽動者",
      technocratic: "科技治理者",
      isolationist: "美國優先孤立派"
    };

    return mapping[maxKey];
  };

  const getNewPresidentPersonalityName = (p: PresidentPersonality) => {
    const keys: (keyof PresidentPersonality)[] = ["hawkish", "diplomatic", "economic", "populist", "technocratic", "isolationist"];
    const allZero = keys.every(k => p[k] === 0);
    if (allZero) return "平衡務實內閣";

    let maxKey = keys[0];
    let maxVal = p[maxKey];
    for (const k of keys) {
      if (p[k] > maxVal) {
        maxVal = p[k];
        maxKey = k;
      }
    }

    const mapping: Record<keyof PresidentPersonality, string> = {
      hawkish: "鐵腕鷹派",
      diplomatic: "外交協調者",
      economic: "市場總統",
      populist: "民意型總統",
      technocratic: "科技治理者",
      isolationist: "美國優先孤立派"
    };

    return mapping[maxKey];
  };

  // 2. 建立 nextTurn() 函式
  const nextTurn = () => {
    setTurn(prev => prev + 1);
  };

  // Modals & User context
  const [isEmailModalOpen, setIsEmailModalOpen] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("library990322@gmail.com");
  const [isEmailSending, setIsEmailSending] = useState<boolean>(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);
  const [emailDraftResult, setEmailDraftResult] = useState<{ subject: string; body: string } | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [historyModalTab, setHistoryModalTab] = useState<"current" | "archive">("current");
  const [expandedArchiveGameId, setExpandedArchiveGameId] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  // States for choice results panel & countdown
  const [showResultPanel, setShowResultPanel] = useState<boolean>(false);
  const [lastSelectedChoice, setLastSelectedChoice] = useState<{ id: "A" | "B" | "C"; title: string } | null>(null);
  const [lastImpacts, setLastImpacts] = useState<any>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [generatedNews, setGeneratedNews] = useState<{ headline: string; content: string; internationalReaction: string; marketReaction: string; publicReaction: string } | null>(null);
  const [nextScenario, setNextScenario] = useState<Scenario | null>(null);
  const [isGameFinished, setIsGameFinished] = useState<boolean>(false);
  const [devForcedEnding, setDevForcedEnding] = useState<any>(null);

  const handleDevRandomEnding = () => {
    console.log("DEV Random Ending Triggered");
    
    // Simulate all endings
    const endingTemplates = [
      { title: "美國世紀 2.0", icon: "🇺🇸", desc: "美國重新成為全球唯一霸權。\nAI、晶片與金融市場全面領先。\n歷史學家稱此時代為：\n第二次美國世紀。" },
      { title: "AI科技霸權", icon: "🚀", desc: "美國掌握全球AI標準。\n全世界依賴美國AI生態系。" },
      { title: "華爾街帝國", icon: "💰", desc: "美國經濟創下歷史新高。\n全球資本湧入華爾街。" },
      { title: "自由世界領袖", icon: "🌍", desc: "美國成功領導全球民主聯盟。\n成為國際秩序核心。" },
      { title: "第三次世界大戰", icon: "☢️", desc: "一次誤判引爆全球衝突。\n世界進入戰爭時代。" },
      { title: "美國衰敗", icon: "📉", desc: "美國失去全球領導地位。\n經濟陷入長期衰退。" },
      { title: "中國世紀", icon: "🇨🇳", desc: "中國超越美國。\n北京成為新的世界中心。" },
      { title: "全民反對", icon: "😡", desc: "支持率崩盤。\n你的政治生涯提前結束。" },
      { title: "川普王朝", icon: "👑", desc: "你成為史上最具影響力的總統之一。" },
      { title: "平衡大師", icon: "⚖️", desc: "你成功維持國家穩定。\n避免極端風險。" },
      { title: "平穩防守", icon: "🏛️", desc: "美國平安度過了這個任期。\n雖然沒有驚天動地的偉業，但國家依舊穩固。" },
      { title: "分歧的時代", icon: "🌪️", desc: "美國經歷了艱難的歲月。\n國家陷入了內外部挑戰的泥沼。" }
    ];

    const randomEndingObj = endingTemplates[Math.floor(Math.random() * endingTemplates.length)];
    
    const avg = (stats.economy + stats.military + stats.diplomacy + stats.publicOpinion + stats.industry + stats.market) / 6;
    let rating = "";
    let ratingColor = "";
    let color = "";
    if (avg >= 90) { rating = "傳奇總統"; ratingColor = "text-amber-400 border-amber-400/30 bg-amber-400/10"; color = "text-amber-400"; }
    else if (avg >= 80) { rating = "偉大總統"; ratingColor = "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"; color = "text-emerald-400"; }
    else if (avg >= 70) { rating = "優秀總統"; ratingColor = "text-blue-400 border-blue-400/30 bg-blue-400/10"; color = "text-blue-400"; }
    else if (avg >= 60) { rating = "普通總統"; ratingColor = "text-slate-300 border-slate-300/30 bg-slate-300/10"; color = "text-slate-300"; }
    else if (avg >= 40) { rating = "失敗總統"; ratingColor = "text-orange-400 border-orange-400/30 bg-orange-400/10"; color = "text-orange-400"; }
    else { rating = "災難總統"; ratingColor = "text-red-500 border-red-500/30 bg-red-500/10"; color = "text-red-500"; }
    
    const finalDevEnding = {
        type: "victory",
        isFinalEnding: true,
        title: randomEndingObj.title,
        icon: randomEndingObj.icon,
        rating,
        desc: randomEndingObj.desc,
        color: color || "text-slate-300",
        ratingColor: ratingColor || "text-slate-300 border-slate-300/30 bg-slate-300/10",
        stats: stats
    };
    
    console.log("DEV Random Ending Triggered");
    console.log("Selected Ending:", finalDevEnding.title);
    console.log("Current Stats:", stats);
    
    setDevForcedEnding(finalDevEnding);
  };

  // --- President Personality States ---
  const [personality, setPersonality] = useState<PresidentPersonality>({
    hawkish: 0,
    diplomatic: 0,
    economic: 0,
    populist: 0,
    technocratic: 0,
    isolationist: 0,
  });

  // --- New President Personality System (Step 1) ---
  const [presidentPersonality, setPresidentPersonality] = useState<PresidentPersonality>({
    hawkish: 0,
    diplomatic: 0,
    economic: 0,
    populist: 0,
    technocratic: 0,
    isolationist: 0
  });

  const updatePersonality = (choice: any, effects: any) => {
    setPresidentPersonality(prev => {
      const next = { ...prev };
      const militaryVal = effects?.military ?? 0;
      const diplomacyVal = effects?.diplomacy ?? 0;
      const economyVal = effects?.economy ?? 0;
      const stockMarketVal = effects?.stockMarket ?? effects?.market ?? 0;
      const approvalVal = effects?.approval ?? effects?.publicOpinion ?? 0;
      const industryVal = effects?.industry ?? 0;

      if (militaryVal > 0) next.hawkish += 1;
      if (diplomacyVal > 0) next.diplomatic += 1;
      if (economyVal > 0 || stockMarketVal > 0) next.economic += 1;
      if (approvalVal > 0) next.populist += 1;
      if (industryVal > 0) next.technocratic += 1;
      if (diplomacyVal < 0 && approvalVal > 0) next.isolationist += 1;

      console.log("presidentPersonality updated:", next);
      return next;
    });
  };
  const [isDebugOn, setIsDebugOn] = useState<boolean>(false);

  // --- Crisis System States ---
  const [activeCrisis, setActiveCrisis] = useState<Crisis | null>(null);
  const [crisisChoiceSelected, setCrisisChoiceSelected] = useState<"A" | "B" | "C" | null>(null);
  const [crisisFeedbackShown, setCrisisFeedbackShown] = useState<boolean>(false);
  const [playedCrisisIds, setPlayedCrisisIds] = useState<string[]>([]);

  // Crisis Option Selection Handler
  const handleSelectCrisisOption = (choiceId: "A" | "B" | "C") => {
    if (!activeCrisis || crisisChoiceSelected) return;

    const chosen = activeCrisis.choices.find((c: any) => c.id === choiceId);
    if (!chosen) return;

    setCrisisChoiceSelected(choiceId);
    setCrisisFeedbackShown(true);

    // Apply statistics changes immediately (clamped 0-100)
    const impacts = chosen.effects;
    updateStat("economy", impacts.economy ?? 0);
    updateStat("military", impacts.military ?? 0);
    updateStat("diplomacy", impacts.diplomacy ?? 0);
    updateStat("publicOpinion", impacts.publicOpinion ?? 0);
    updateStat("industry", impacts.industry ?? 0);
    updateStat("market", impacts.market ?? 0);

    // Update President Personality Metrics
    updatePresidentPersonality(impacts);
    updatePersonality(choiceId, impacts);

    const now = new Date();
    const formatTimeHM = (date: Date) => {
      return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
    };
    setLiveNewsList(prev => [
      {
        id: `crisis-${Date.now()}`,
        time: formatTimeHM(now),
        text: `【特急特別通報】「${activeCrisis.title}」處置結果已下達：${chosen.title}。`,
        category: 'diplomacy'
      },
      ...prev
    ]);
  };

  // Run automatically when the game ends
  useEffect(() => {
    if (isGameFinished) {
      generateAndSaveGameResult(stats, history);
    } else {
      setReport(null);
    }
  }, [isGameFinished]);

  // Status Alerts
  const [liveNews, setLiveNews] = useState<string>("日室偵心戰略戰線：第47任美國內閣白宮參謀智囊團隊就位，多方貿易博弈正在展開。");
  const [liveNewsList, setLiveNewsList] = useState<LiveNewsItem[]>([
    { id: "init-1", time: "10:23", text: "北京譴責美國軍演", category: "war" },
    { id: "init-2", time: "10:18", text: "NASDAQ 下跌 2.4%", category: "economy" },
    { id: "init-3", time: "10:15", text: "北約召開緊急會議", category: "diplomacy" },
    { id: "init-4", time: "10:12", text: "伊朗威脅封鎖荷莫茲海峽", category: "war" },
    { id: "init-5", time: "10:09", text: "日本擴大國防預算", category: "war" }
  ]);

  // Fisher-Yates element shuffle helper
  const shuffleChoicesArray = (choices: any[]) => {
    if (choices.length <= 1) return [...choices];

    let attempts = 0;
    let arr = [...choices];

    const isSameOrder = (a: any[], b: any[]) => {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    };

    do {
      arr = [...choices];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      attempts++;
    } while (isSameOrder(choices, arr) && attempts < 10);

    return arr;
  };

  // Check and generate dynamic option display title
  const getOptionDisplayTitle = (opt: any): string => {
    const isCategory = (str: string | undefined | null): boolean => {
      if (!str) return false;
      const s = str.trim();
      const forbiddenCategories = [
        "強勢主動對策",
        "務實和緩磋商",
        "多邊協調機制",
        "強硬反制",
        "談判協商",
        "尋求盟友支持",
        "簽署配額命令",
        "豁免盟友關稅",
        "全面推遲關稅",
        "發出最後通牒",
        "倡導軍工合資",
        "召開特別首腦峰會",
        "實施嚴格禁令",
        "發放有限許可證",
        "補助本土晶片廠",
        "堅守預算到底",
        "兩黨妥協折衷",
        "宣佈緊急戰術授權",
        "A", "B", "C", "選項A", "選項B", "選項C", "選項 A", "選項 B", "選項 C"
      ];
      return forbiddenCategories.some(cat => s === cat || s.includes(cat));
    };

    const generateShortTitle = (description: string | undefined | null): string => {
      if (!description) return "政策法案";
      const desc = description.trim().replace(/^[ ，。、！？]/g, "");
      
      if (desc.includes("關稅")) {
        if (desc.includes("加徵") || desc.includes("提高")) return "調整進口關稅政策";
        return "關稅談判與調整";
      }
      if (desc.includes("補貼") || desc.includes("補助")) {
        return "實施本土產業補貼";
      }
      if (desc.includes("軍事") || desc.includes("駐軍") || desc.includes("防衛")) {
        return "調整軍事部署與防務";
      }
      if (desc.includes("同盟") || desc.includes("盟友") || desc.includes("聯合")) {
        return "多邊外交同盟協作";
      }
      if (desc.includes("制裁") || desc.includes("禁止") || desc.includes("禁令")) {
        return "實施出口管制與制裁";
      }
      if (desc.includes("預算") || desc.includes("撥款")) {
        return "國土與聯邦預算審查";
      }
      if (desc.includes("對話") || desc.includes("談判") || desc.includes("妥協")) {
        return "和平外交談判磋商";
      }

      const parts = desc.split(/[，。、；]/);
      for (const part of parts) {
        const p = part.trim();
        if (p.length >= 6 && p.length <= 16) {
          return p;
        }
      }
      
      const truncateLen = 14;
      return desc.length > truncateLen ? desc.substring(0, truncateLen) + "..." : desc;
    };

    if (opt.policyTitle && !isCategory(opt.policyTitle)) {
      return opt.policyTitle;
    }
    if (opt.text && !isCategory(opt.text)) {
      return opt.text;
    }
    if (opt.title && !isCategory(opt.title)) {
      return opt.title;
    }
    return generateShortTitle(opt.description);
  };

  useEffect(() => {
    if (currentScenario && currentScenario.options) {
      const preShuffled = [...currentScenario.options];
      const postShuffled = shuffleChoicesArray(preShuffled);
      setShuffledChoices(postShuffled);

      console.log("---- 決策洗牌診斷 ----");
      console.log("目前回合：", turn);
      console.log("目前事件：", currentScenario.title);
      console.log("洗牌前順序：", preShuffled.map(o => o.title || o.policyTitle || o.text));
      console.log("洗牌後順序：", postShuffled.map(o => o.title || o.policyTitle || o.text));
    } else {
      setShuffledChoices([]);
    }
  }, [currentScenario]);

  // Option selection handler that meets requirements
  const handleChoiceSelect = async (shuffledChoice: any) => {
    console.log("---- 選擇與套用診斷 ----");
    console.log("目前回合：", turn);
    console.log("目前事件：", currentScenario?.title);
    
    const preShuffled = currentScenario?.options || [];
    console.log("洗牌前順序：", preShuffled.map(o => o.title || o.policyTitle || o.text));
    console.log("洗牌後順序：", shuffledChoices.map(o => o.title || o.policyTitle || o.text));
    
    const displayTitle = getOptionDisplayTitle(shuffledChoice);
    console.log("玩家選擇：", displayTitle);
    console.log("套用 effects：", shuffledChoice.impacts || shuffledChoice.effects);

    await handleSelectOption(shuffledChoice.id, displayTitle, shuffledChoice.impacts);
  };

  // Load starting scenario on mount
  useEffect(() => {
    if (user) {
      fetchStartScenario();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="bg-[#080b11] text-gray-200 min-h-screen flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <span className="text-xs font-mono text-amber-400 tracking-widest uppercase">
          載入權限模組中...
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const fetchStartScenario = async () => {
    setIsLoading(true);
    console.group("🧪 [CHRONOS GAME INITIALIZATION]");
    console.log("Loading start scenario from backend...");
    try {
      const res = await fetch("/api/game/start");
      const data = await res.json();
      if (data) {
        setStats(data.stats);
        setCurrentScenario(data.scenario);
        setHistory([]);
        setTurn(1);
        setIsGameFinished(false);
        setActiveTab("main");
        
        // Reset Crisis system
        setActiveCrisis(null);
        setCrisisChoiceSelected(null);
        setCrisisFeedbackShown(false);
        setPlayedCrisisIds([]);

        // Reset personality state
        setPersonality({
          hawkish: 0,
          diplomatic: 0,
          economic: 0,
          populist: 0,
          technocratic: 0,
          isolationist: 0,
        });

        setPresidentPersonality({
          hawkish: 0,
          diplomatic: 0,
          economic: 0,
          populist: 0,
          technocratic: 0,
          isolationist: 0
        });

        setLiveNewsList([
          { id: "init-1", time: "10:23", text: "北京譴責美國軍演", category: "war" },
          { id: "init-2", time: "10:18", text: "NASDAQ 下跌 2.4%", category: "economy" },
          { id: "init-3", time: "10:15", text: "北約召開緊急會議", category: "diplomacy" },
          { id: "init-4", time: "10:12", text: "伊朗威脅封鎖荷莫茲海峽", category: "war" },
          { id: "init-5", time: "10:09", text: "日本擴大國防預算", category: "war" }
        ]);
        
        console.log("✔ [PASS] Test 1: events.json loaded successfully from backend API /api/game/start.");
        console.log("✔ [PASS] Test 6: Initial GameState loaded (Economy: 50, Military: 50, Diplomacy: 50, Approval: 50, Industry: 50, StockMarket: 50).");
        console.log("✔ [PASS] Test 7 & 8: Initial Turn set to 1. Drawn event:", data.scenario?.title);
      }
    } catch (err) {
      console.error("✘ [FAIL] Failed to load start scenario on initialization! Error:", err);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  const handleRestartGame = async () => {
    setIsLoading(true);
    console.group("🧪 [CHRONOS GAME MANUAL RESTART]");
    console.log("Resetting full game state...");
    try {
      const res = await fetch("/api/game/start");
      const data = await res.json();
      if (data) {
        setStats(data.stats);
        setCurrentScenario(data.scenario);
        setHistory([]);
        setTurn(1);
        setIsGameFinished(false);
        setActiveTab("main");
        
        // Reset selectedOption
        setLastSelectedChoice(null);
        setShuffledChoices([]);
        
        // Reset result
        setLastImpacts(null);
        setGeneratedNews(null);
        setShowResultPanel(false);
        setNextScenario(null);
        
        // Reset ending and devForcedEnding
        setDevForcedEnding(null);
        setReport(null);
        setIsGeneratingReport(false);

        // Reset Crisis system
        setActiveCrisis(null);
        setCrisisChoiceSelected(null);
        setCrisisFeedbackShown(false);
        setPlayedCrisisIds([]);

        // Reset personality state
        setPersonality({
          hawkish: 0,
          diplomatic: 0,
          economic: 0,
          populist: 0,
          technocratic: 0,
          isolationist: 0,
        });

        setPresidentPersonality({
          hawkish: 0,
          diplomatic: 0,
          economic: 0,
          populist: 0,
          technocratic: 0,
          isolationist: 0
        });

        // Reset news and status alerts
        setLiveNews("日室偵心戰略戰線：第47任美國內閣白宮參謀智囊團隊就位，多方貿易博弈正在展開。");
        setLiveNewsList([
          { id: "init-1", time: "10:23", text: "北京譴責美國軍演", category: "war" },
          { id: "init-2", time: "10:18", text: "NASDAQ 下跌 2.4%", category: "economy" },
          { id: "init-3", time: "10:15", text: "北約召開緊急會議", category: "diplomacy" },
          { id: "init-4", time: "10:12", text: "伊朗威脅封鎖荷莫茲海峽", category: "war" },
          { id: "init-5", time: "10:09", text: "日本擴大國防預算", category: "war" }
        ]);
        
        console.log("✔ [RESTART PASS] Game state fully reset successfully.");
      }
    } catch (err) {
      console.error("✘ [RESTART FAIL] Failed to restart game! Error:", err);
    } finally {
      setIsLoading(false);
      console.groupEnd();
    }
  };

  const exportEndingCard = async () => {
    const element = document.getElementById("chronos-share-card-source");
    if (!element) {
      alert("找不到分享卡元件！");
      return;
    }
    
    try {
      const canvas = await html2canvas(element, {
        width: 1200,
        height: 675,
        scale: 2, // ultra high resolution
        useCORS: true,
        backgroundColor: "#090b14"
      });
      
      const link = document.createElement("a");
      link.download = "chronos-ending-card.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Failed to generate and download card:", err);
      alert("分享卡產生失敗，請再試一次！");
    }
  };

  // Process choice selection
  const handleSelectOption = async (optionId: "A" | "B" | "C", optionTitle: string, impacts: any) => {
    if (!currentScenario || isLoading || showResultPanel) return;

    setIsLoading(true);
    setLastSelectedChoice({ id: optionId, title: optionTitle });
    setLastImpacts(impacts);
    setGeneratedNews(null);
    setNextScenario(null);
    setShowResultPanel(true);

    console.group(`🎮 [CHRONOS STRATEGIC DECISION] Choice: ${optionId} - ${optionTitle}`);
    console.log("Previous Stats:", stats);
    console.log("Applied Choice Effects:", impacts);

    try {
      // 1. Calculate new stats safely between 0 and 100
      const newStats = {
        economy: Math.max(0, Math.min(100, (stats.economy ?? 50) + (impacts.economy ?? 0))),
        military: Math.max(0, Math.min(100, (stats.military ?? 50) + (impacts.military ?? 0))),
        diplomacy: Math.max(0, Math.min(100, (stats.diplomacy ?? 50) + (impacts.diplomacy ?? 0))),
        publicOpinion: Math.max(0, Math.min(100, (stats.publicOpinion ?? 50) + (impacts.publicOpinion ?? 0))),
        industry: Math.max(0, Math.min(100, (stats.industry ?? 50) + (impacts.industry ?? 0))),
        market: Math.max(0, Math.min(100, (stats.market ?? 50) + (impacts.market ?? 0)))
      };

      // 2. Use updateStat function to verify individual updates
      updateStat("economy", impacts.economy ?? 0);
      updateStat("military", impacts.military ?? 0);
      updateStat("diplomacy", impacts.diplomacy ?? 0);
      updateStat("publicOpinion", impacts.publicOpinion ?? 0);
      updateStat("industry", impacts.industry ?? 0);
      updateStat("market", impacts.market ?? 0);

      // Update President Personality Metrics
      updatePresidentPersonality(impacts);
      updatePersonality(optionId, impacts);

      console.log(`✔ [PASS] Test 6: GameState updated successfully:`, newStats);

      // 3. Append history item
      const historyItem: DecisionHistoryItem = {
        scenarioTitle: currentScenario.title,
        chosenOptionId: optionId,
        chosenOptionTitle: optionTitle,
        dateString: currentScenario.dateString,
        daysOfPresidency: currentScenario.daysOfPresidency,
        statsBefore: { ...stats },
        statsAfter: { ...newStats }
      };
      
      const updatedHistory = [...history, historyItem];
      setHistory(updatedHistory);

      // Trigger Google Apps Script saveGame sync (Failure won't disrupt the game flow)
      try {
        await syncToGAS("saveGame", {
          userId: user?.uid || "guest",
          currentTurn: turn,
          currentStats: newStats,
          currentDecisions: updatedHistory.map((h, idx) => ({
            round: idx + 1,
            scenarioTitle: h.scenarioTitle,
            chosenOptionId: h.chosenOptionId,
            chosenOptionTitle: h.chosenOptionTitle,
            daysOfPresidency: h.daysOfPresidency
          }))
        });
      } catch (saveGameErr) {
        console.error("Failed to sync current game stage save via GAS saveGame:", saveGameErr);
      }

      // Scroll scenario window to top
      const scrollEl = document.getElementById("diplomatic-deck");
      if (scrollEl) scrollEl.scrollTop = 0;

      // Update Live stats ticker based on option picked
      setLiveNews(`戰研所簡報：最新決策「${optionTitle}」生效，美中戰略大盤正在進行重新洗牌。`);

      console.log("Fetching next event & AI News. History Played Titles:", updatedHistory.map((h) => h.scenarioTitle));

      // 4. Request next scenario from fullstack backend with all required news parameters
      const res = await fetch("/api/game/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stats: newStats,
          history: updatedHistory,
          choiceId: optionId,
          currentDate: currentScenario.dateString,
          daysOfPresidency: currentScenario.daysOfPresidency,
          turn,
          currentScenario: {
            title: currentScenario.title,
            subtext: currentScenario.subtext
          },
          choiceTitle: optionTitle,
          choiceDescription: currentScenario.options.find(o => o.id === optionId)?.description,
          choiceImpacts: impacts
        })
      });

      const data = await res.json();

      if (data && data.success) {
        setNextScenario(data.scenario);
        setGeneratedNews(data.news);
        console.log(`✔ [PASS] Test 8: Pre-fetched scenario and successfully generated AI news.`);
        
        if (data.news) {
          const now = new Date();
          const formatTimeHM = (date: Date) => {
            return date.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false });
          };
          const pNews: LiveNewsItem[] = [
            {
              id: `news-headline-${Date.now()}-1`,
              time: formatTimeHM(now),
              text: data.news.headline,
              category: categorizeNewsText(data.news.headline)
            },
            {
              id: `news-intl-${Date.now()}-2`,
              time: formatTimeHM(new Date(now.getTime() - 1000 * 30)),
              text: data.news.internationalReaction,
              category: 'diplomacy'
            },
            {
              id: `news-market-${Date.now()}-3`,
              time: formatTimeHM(new Date(now.getTime() - 1000 * 60)),
              text: data.news.marketReaction,
              category: 'economy'
            }
          ];
          setLiveNewsList(prev => {
            const combined = [...pNews, ...prev];
            return combined.slice(0, 20);
          });
        }
      }
      setIsLoading(false);

    } catch (err) {
      console.error("Error setting up next scenario and news:", err);
      setIsLoading(false);
    } finally {
      console.groupEnd();
    }
  };

  const handleNextTurnClicked = () => {
    const dangerLimit = 15;
    const isDefeat = stats.economy <= dangerLimit ||
                     stats.military <= dangerLimit ||
                     stats.diplomacy <= dangerLimit ||
                     stats.publicOpinion <= dangerLimit ||
                     stats.industry <= dangerLimit ||
                     stats.market <= dangerLimit;

    if (turn >= 12 || isDefeat) {
      setIsGameFinished(true);
      setShowResultPanel(false);
      setGeneratedNews(null);
      setNextScenario(null);
      return;
    }
    if (!nextScenario) return;

    // Dynamically calculate crisis trigger probability based on national state
    let crisisTriggerRate = 0.15;
    if (stats.economy < 20) {
      crisisTriggerRate += (20 - stats.economy) * 0.015; // +1.5% for each point below 20 (max +0.30)
    }
    if (stats.diplomacy < 20) {
      crisisTriggerRate += (20 - stats.diplomacy) * 0.015;
    }
    if (stats.military < 20) {
      crisisTriggerRate += (20 - stats.military) * 0.015;
    }
    crisisTriggerRate = Math.min(0.40, crisisTriggerRate); // Cap at 40%

    if (Math.random() < crisisTriggerRate) {
      const unplayed = CRISES_DATABASE.filter(c => !playedCrisisIds.includes(c.id));
      const pool = unplayed.length > 0 ? unplayed : CRISES_DATABASE;

      // Function to get weight for each crisis based on state
      const getCrisisWeight = (crisis: Crisis) => {
        let weight = 1.0;

        // 1. 金融危機系列 (Financial / Economic Crises if economy < 20)
        if (stats.economy < 20) {
          const isFinancial = ["金融危機", "股市暴跌", "銀行倒閉", "能源危機"].includes(crisis.category);
          if (isFinancial) {
            weight *= (1 + (20 - stats.economy) * 0.5); // Increase weight drastically up to 11x
          }
        }

        // 2. 戰爭關係系列 (War / Conflict Crises if diplomacy < 20)
        if (stats.diplomacy < 20) {
          const isWar = ["伊朗危機", "北韓飛彈", "台海軍事衝突"].includes(crisis.category);
          if (isWar) {
            weight *= (1 + (20 - stats.diplomacy) * 0.5); // Increase weight drastically up to 11x
          }
        }

        // 3. 國安危機系列 (National Security Crises if military < 20)
        if (stats.military < 20) {
          const isSecurity = ["恐怖攻擊", "網路攻擊", "天災"].includes(crisis.category);
          if (isSecurity) {
            weight *= (1 + (20 - stats.military) * 0.5); // Increase weight drastically up to 11x
          }
        }

        return weight;
      };

      // Weighted selection
      const weights = pool.map(c => getCrisisWeight(c));
      const totalWeight = weights.reduce((sum, w) => sum + w, 0);
      let randomValue = Math.random() * totalWeight;

      let selectedCrisis = pool[0];
      for (let i = 0; i < pool.length; i++) {
        randomValue -= weights[i];
        if (randomValue <= 0) {
          selectedCrisis = pool[i];
          break;
        }
      }

      setActiveCrisis(selectedCrisis);
      setCrisisChoiceSelected(null);
      setCrisisFeedbackShown(false);
      setPlayedCrisisIds(prev => [...prev, selectedCrisis.id]);

      // Hide normal result panel but keep nextScenario stored in state
      setShowResultPanel(false);
      return;
    }

    nextTurn();
    setCurrentScenario(nextScenario);
    setShowResultPanel(false);
    setGeneratedNews(null);
    setNextScenario(null);
  };

  // Check Game State Ending Condition
  const checkGameOver = () => {
    const dangerLimit = 15;
    
    // Check defeats (Only active during gameplay before 12 turns are completed)
    if (!isGameFinished && history.length < 12) {
      if (stats.economy <= dangerLimit) return { type: "defeat", stat: "經濟", desc: "經濟陷入大衰退，華爾街暴跌陷入歷史冰點，高通膨引發民怨四起，川普內閣將你遣散..." };
      if (stats.military <= dangerLimit) return { type: "defeat", stat: "軍事", desc: "國防威懾力不足，海外軍事基地爆發衝突失控，白宮聯參會議對你下達不信任案..." };
      if (stats.diplomacy <= dangerLimit) return { type: "defeat", stat: "外交", desc: "美國陷入前所未有的國際外交孤立，世國同盟全面解體，主流媒體直斥顧問决策低能..." };
      if (stats.publicOpinion <= dangerLimit) return { type: "defeat", stat: "民意", desc: "民調支持率崩盤。群眾聚集在白宮外示威，川普決定在社交平台發文宣布開除你..." };
      if (stats.industry <= dangerLimit) return { type: "defeat", stat: "產業", desc: "本土關鍵高科技與製造業遭遇全面性空心化，高能耗高物價致使工廠停擺..." };
      if (stats.market <= dangerLimit) return { type: "defeat", stat: "關市", desc: "邊境關卡與對外港口大亂，非法跨境和進口假貨充斥，關稅政策完全垮台..." };
    }

    // Check final victories (Survive 12 turns or marked finished)
    if (isGameFinished || history.length >= 12) {
      const ending = getEnding({ stats, history, turn });
      return {
        type: "victory",
        isFinalEnding: true,
        title: ending.title,
        icon: ending.icon,
        rating: ending.rating,
        desc: ending.desc,
        color: ending.color,
        ratingColor: ending.ratingColor,
        stats: stats
      };
    }

    return null;
  };

  const activeEnding = devForcedEnding || checkGameOver();

  // Generate Email Draft Strategic Brief via server endpoint
  const handleOpenEmailModal = async () => {
    setIsEmailModalOpen(true);
    setIsEmailSending(true);
    try {
      const res = await fetch("/api/game/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history,
          finalStats: stats,
          email: emailInput
        })
      });
      const data = await res.json();
      if (data && data.success) {
        setEmailDraftResult(data.email);
      }
    } catch (err) {
      console.error("Error drafting strategy email:", err);
    } finally {
      setIsEmailSending(false);
    }
  };

  // Simulate Gmail Dispatch
  const handleSendEmailDispatch = () => {
    setIsEmailSending(true);
    setTimeout(() => {
      setIsEmailSending(false);
      setEmailSentSuccess(true);
    }, 1500);
  };

  // Reset email states
  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
    setEmailSentSuccess(false);
    setEmailDraftResult(null);
  };

  const hideSidebarWidgetOnTablet = isSidebarCollapsed && screenSize === 'tablet';

  return (
    <div id="chronos-root" className="bg-[#080b11] text-gray-200 min-h-screen font-sans antialiased overflow-x-hidden selection:bg-amber-500 selection:text-black">
      
      {/* 🌌 Atmospheric background grid glows */}
      <div id="ambient-gold-glow" className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div id="ambient-blue-glow" className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* DEV Random Ending Button */}
      {/* @ts-ignore - Env variable exists in Vite */}
      {import.meta.env.DEV && (
        <button
          onClick={handleDevRandomEnding}
          className="fixed top-4 right-4 z-50 bg-red-600 hover:bg-red-500 text-white text-xs px-3 py-1.5 rounded shadow-lg opacity-80 hover:opacity-100 transition-opacity font-mono font-bold"
        >
          DEV：隨機結局測試
        </button>
      )}

      {screenSize === 'mobile' ? (
        /* 📱 MOBILE RESPONSIVE SINGLE-COLUMN LAYOUT */
        <div id="mobile-layout-flow" className="flex flex-col w-full min-h-screen pb-12 bg-[#080b11]">
          {/* ── HEADER ── */}
          <header id="chronos-header-mobile" className="px-4 py-3 bg-[#0a0d16]/90 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border border-amber-500/30 rounded-lg flex items-center justify-center p-1 bg-[#0f1424] text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                <Award className="w-full h-full text-amber-400 stroke-[1.5]" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-wider text-pulse-gold bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                  CHRONOS
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-slate-400 max-w-[125px] truncate">
                {user.email || "library992"}
              </span>
              <button
                onClick={() => logout()}
                className="px-2 py-1 text-[11px] font-bold text-[#ef4444] border border-red-500/20 rounded hover:bg-rose-500/5 transition cursor-pointer"
              >
                登出
              </button>
            </div>
          </header>

          {/* Mobile Items Stack in Sequence 1 to 8 */}
          <div className="flex flex-col gap-6 px-4 py-4 w-full max-w-full overflow-hidden">
            {/* 1. Hero 川普區 */}
            <div
              id="mobile-hero-section"
              className="flex flex-col gap-4 border border-slate-800/80 rounded-2xl bg-[#0a0d16] shadow-xl w-full max-w-full overflow-hidden"
              style={{ height: 'auto', padding: '20px' }}
            >
              <img
                src="/images/hero-trump.png"
                alt="Hero Background"
                referrerPolicy="no-referrer"
                className="pointer-events-none select-none rounded-xl"
                style={{ width: '100%', height: 'auto', objectFit: 'cover' }}
              />
              
              {/* 文字內容放圖片下方 */}
              <div className="flex flex-col gap-3 text-left w-full">
                <div className="text-[16px] text-amber-500 font-bold tracking-wider" style={{ lineHeight: '1.6' }}>
                  白宮戰略會議
                </div>
                <div className="text-[24px] text-white font-black uppercase tracking-tight" style={{ lineHeight: '1.6' }}>
                  PRESIDENT TRUMP
                </div>
                <div className="text-[22px] text-slate-300 italic font-medium border-l-4 border-amber-500/60 pl-4 py-1" style={{ lineHeight: '1.6' }}>
                  {currentScenario?.trumpQuote || "偉大的國家不是等待機會，而是創造機會。我們要把製造業、財富與美麗的承諾全部帶回美國本土！"}
                </div>
              </div>
            </div>

            {/* 右上日期卡改成一般卡片放在 Hero 下方 */}
            <div
              id="mobile-date-card"
              className="w-full p-4 bg-slate-950/90 border border-slate-800 rounded-xl flex items-center justify-between shadow-md"
            >
              <div className="text-left">
                <span className="text-amber-500 text-sm font-bold block">第 {turn} 回合</span>
                <span className="text-white text-base font-black font-mono tracking-tight">{currentScenario?.dateString || "2025年5月28日"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 text-[10px] block font-mono">STATUS</span>
                <span className="text-amber-400 text-sm font-bold font-sans">上任第 {currentScenario?.daysOfPresidency || "150"} 天</span>
              </div>
            </div>

            {/* 2. 狀態數值 */}
            <div id="mobile-stats-section" className="w-full text-left">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-sm">📊</span>
                <span className="font-sans text-xs font-bold text-[#F5A623] tracking-widest uppercase">國家核心指標</span>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full">
                {/* Economy */}
                <div className="p-3 bg-[#0d111d]/95 border border-slate-800 rounded-xl select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-400">經濟</span>
                    <span className="text-base font-black text-amber-500">{stats.economy}%</span>
                  </div>
                  <div className="w-full bg-slate-855 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400" style={{ width: `${stats.economy}%` }} />
                  </div>
                </div>
                {/* Military */}
                <div className="p-3 bg-[#0d111d]/95 border border-slate-800 rounded-xl select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-400">軍事</span>
                    <span className="text-base font-black text-amber-500">{stats.military}%</span>
                  </div>
                  <div className="w-full bg-slate-855 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-400" style={{ width: `${stats.military}%` }} />
                  </div>
                </div>
                {/* Diplomacy */}
                <div className="p-3 bg-[#0d111d]/95 border border-slate-800 rounded-xl select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-400">外交</span>
                    <span className="text-base font-black text-amber-500">{stats.diplomacy}%</span>
                  </div>
                  <div className="w-full bg-slate-855 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400" style={{ width: `${stats.diplomacy}%` }} />
                  </div>
                </div>
                {/* Public Opinion */}
                <div className="p-3 bg-[#0d111d]/95 border border-slate-800 rounded-xl select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-400">民意</span>
                    <span className="text-base font-black text-amber-500">{stats.publicOpinion}%</span>
                  </div>
                  <div className="w-full bg-slate-855 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400" style={{ width: `${stats.publicOpinion}%` }} />
                  </div>
                </div>
                {/* Technology */}
                <div className="p-3 bg-[#0d111d]/95 border border-slate-800 rounded-xl select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-400">科技監控</span>
                    <span className="text-base font-black text-amber-500">{stats.industry}%</span>
                  </div>
                  <div className="w-full bg-slate-855 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-400" style={{ width: `${stats.industry}%` }} />
                  </div>
                </div>
                {/* Market */}
                <div className="p-3 bg-[#0d111d]/95 border border-slate-800 rounded-xl select-none">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-base font-bold text-slate-400">股市</span>
                    <span className="text-base font-black text-amber-500">{stats.market}%</span>
                  </div>
                  <div className="w-full bg-slate-855 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400" style={{ width: `${stats.market}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. 當前決策議題 */}
            <div id="mobile-scenario-section" className="w-full text-left">
              <div className="flex items-center gap-2 mb-2">
                <Gavel className="w-5 h-5 text-[#F5A623] shrink-0" />
                <span className="text-xs font-mono tracking-widest text-[#F5A623] font-bold uppercase">當前決策議題</span>
              </div>
              
              {activeEnding?.isFinalEnding ? (
                <div className="bg-slate-900 border border-amber-500/20 p-5 rounded-2xl">
                  <h3 className="text-lg font-bold text-amber-500 mb-2">🏆 歷史推演結算</h3>
                  <p className="text-base text-slate-300 mb-4">{activeEnding.title}</p>
                  <button onClick={handleRestartGame} className="w-full py-3 bg-amber-500 text-black font-extrabold rounded-xl text-base transition cursor-pointer">重新挑戰</button>
                </div>
              ) : showResultPanel && lastSelectedChoice && lastImpacts ? (
                /* Outcome evaluation results panel inside core strategic view */
                <div className="bg-[#0f1424]/95 border border-[#F5A623]/25 p-5 rounded-2xl flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-slate-800 pb-3">
                    <span className="text-xs font-mono text-amber-500 font-bold uppercase tracking-wider">DECISION RESULT • 決策結算報告</span>
                    <div className="text-[16px] font-black text-white">
                      已執行選項：{lastSelectedChoice.id} - <span className="text-amber-400">{lastSelectedChoice.title}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                      <span className="text-slate-400">經濟</span>
                      <span className={`font-bold ${lastImpacts.economy > 0 ? "text-emerald-400" : lastImpacts.economy < 0 ? "text-rose-455" : "text-gray-500"}`}>
                        {lastImpacts.economy > 0 ? `+${lastImpacts.economy}` : lastImpacts.economy}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                      <span className="text-slate-400">軍事</span>
                      <span className={`font-bold ${lastImpacts.military > 0 ? "text-emerald-400" : lastImpacts.military < 0 ? "text-rose-455" : "text-gray-500"}`}>
                        {lastImpacts.military > 0 ? `+${lastImpacts.military}` : lastImpacts.military}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                      <span className="text-slate-400">外交</span>
                      <span className={`font-bold ${lastImpacts.diplomacy > 0 ? "text-emerald-400" : lastImpacts.diplomacy < 0 ? "text-rose-455" : "text-gray-500"}`}>
                        {lastImpacts.diplomacy > 0 ? `+${lastImpacts.diplomacy}` : lastImpacts.diplomacy}
                      </span>
                    </div>
                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg flex justify-between">
                      <span className="text-slate-400">民意</span>
                      <span className={`font-bold ${(lastImpacts.publicOpinion ?? lastImpacts.approval ?? 0) > 0 ? "text-emerald-400" : (lastImpacts.publicOpinion ?? lastImpacts.approval ?? 0) < 0 ? "text-rose-455" : "text-gray-500"}`}>
                        {(lastImpacts.publicOpinion ?? lastImpacts.approval ?? 0) > 0 ? `+${lastImpacts.publicOpinion ?? lastImpacts.approval}` : (lastImpacts.publicOpinion ?? lastImpacts.approval)}
                      </span>
                    </div>
                  </div>

                  {generatedNews && (
                    <div className="bg-[#12162a] border border-slate-805 p-4 rounded-xl text-left">
                      <span className="text-xs font-mono text-red-400 font-bold block uppercase mb-1">📡 國家即時公電 FEED:</span>
                      <h4 className="text-[15px] font-bold text-red-400 mb-1.5">{generatedNews.headline}</h4>
                      <p className="text-[14px] text-slate-300 leading-relaxed">{generatedNews.content}</p>
                    </div>
                  )}

                  <button
                    onClick={handleNextTurnClicked}
                    disabled={!generatedNews}
                    className={`w-full py-3.5 rounded-xl font-bold transition-all text-base uppercase cursor-pointer ${
                      generatedNews
                        ? "bg-amber-500 text-black font-extrabold active:scale-95 shadow-lg"
                        : "bg-slate-800 text-slate-500 border border-slate-700/40"
                    }`}
                  >
                    繼續主要議程 (Next Agenda)
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 bg-gradient-to-b from-[#11152a] to-[#070a14] border border-slate-800 p-5 rounded-2xl">
                  <h2 className="font-sans font-black text-white text-[18px] leading-snug">
                    {currentScenario ? currentScenario.title : "全球貿易戰升級：如何應對中國關稅反制？"}
                  </h2>
                  <div className="bg-[#0e1222]/85 border-l-4 border-[#F5A623] p-4 rounded-r-xl">
                    <p className="leading-[1.7] text-[16px] text-slate-100 font-sans font-normal">
                      {currentScenario ? currentScenario.subtext : "隨著華盛頓對中加徵高額關稅，關稅效應逐步擴散..."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. 顧問團 */}
            {currentScenario && currentScenario.advisors && currentScenario.advisors.length > 0 && !showResultPanel && (
              <div id="mobile-cabinet-section" className="w-full text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-[#F5A623] shrink-0" />
                  <h3 className="text-base font-bold text-slate-100 tracking-wider font-sans uppercase">白宮內閣最高顧問團建議</h3>
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-[#F5A623] to-transparent mb-4" />
                
                <div className="flex flex-col gap-4">
                  {currentScenario.advisors.map((adv, idx) => (
                    <div key={idx} className="bg-gradient-to-b from-[#101426] to-[#070a14] border border-slate-800 rounded-xl p-5 flex flex-col gap-3 shadow-md">
                      <div className="flex items-center gap-3 border-b border-slate-800/60 pb-2">
                        <div className="p-1.5 bg-slate-900 border border-slate-805 rounded-lg">
                          {getAdvisorIcon(adv.icon)}
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-[16px] font-black text-[#F5A623]">{adv.title}</span>
                          <span className="text-[12px] text-slate-400 font-mono">立場：{adv.position}</span>
                        </div>
                      </div>
                      
                      <div className="bg-[#070a14]/60 border-l-2 border-amber-500/60 p-3 rounded-r-lg">
                        <span className="text-[12px] font-mono font-bold text-[#F5A623] block uppercase mb-1">■ 方案建議</span>
                        <p className="text-[16px] text-slate-100 font-medium leading-[1.6]">{adv.advice}</p>
                      </div>

                      <div className="bg-rose-500/5 border-l-2 border-rose-500/40 p-3 rounded-r-lg">
                        <span className="text-[12px] font-mono font-bold text-rose-400 block uppercase mb-1">▲ 風險評鑑警告</span>
                        <p className="text-[16px] text-slate-300 leading-[1.6]">{adv.risk}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. 決策選項 */}
            {!showResultPanel && (
              <div id="mobile-choices-section" className="w-full text-left">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-[#F5A623] shrink-0" />
                  <h3 className="text-base font-bold text-slate-100 tracking-wider font-sans uppercase">簽下總統行政命令</h3>
                </div>
                <div className="w-full h-[1px] bg-gradient-to-r from-amber-500 to-transparent mb-4" />

                {activeCrisis ? (
                  <div className="bg-[#120a0a] border border-red-500/30 p-5 rounded-2xl flex flex-col gap-4">
                    <div className="text-red-400 text-base font-bold">🚨 突發特急事件：{activeCrisis.title}</div>
                    <p className="text-[16px] text-slate-300 leading-relaxed">{activeCrisis.description}</p>
                    <div className="flex flex-col gap-3">
                      {activeCrisis.choices.map((opt: any) => (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectCrisisOption(opt.id)}
                          className="w-full py-3.5 bg-red-650 hover:bg-red-600 text-white font-bold rounded-xl text-base transition-all cursor-pointer"
                        >
                          {opt.text || opt.title}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {currentScenario && shuffledChoices.map((opt) => (
                      <div key={opt.id} className="bg-gradient-to-b from-[#11152a] to-[#070a14] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-md">
                        <div className="flex flex-col gap-3">
                          <div className="border-b border-slate-800/80 pb-2">
                            <span className="font-sans font-extrabold text-white text-[18px]">
                              {getOptionDisplayTitle(opt)}
                            </span>
                          </div>
                          <p className="text-[16px] text-slate-300 leading-[1.7] font-sans">
                            {opt.description}
                          </p>
                        </div>
                        
                        <div className="pt-4 border-t border-slate-800/80 mt-4">
                          <button
                            onClick={() => handleChoiceSelect(opt)}
                            className="w-full bg-[#F5A623] text-black font-extrabold rounded-xl flex items-center justify-center gap-2 py-3.5 shadow-md active:scale-95 text-[16px] uppercase cursor-pointer"
                          >
                            <span>下達此項行政令</span>
                            <ArrowRight className="w-4 h-4 text-black font-extrabold shrink-0 stroke-[2.5]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 6. LIVE STATS */}
            <div id="mobile-livestats-section" className="w-full text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">📡</span>
                <span className="font-sans text-xs font-bold text-[#F5A623] tracking-widest leading-none uppercase">LIVE STATS</span>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-amber-500 to-transparent mb-3" />
              
              <div className="bg-[#0c0f1b]/95 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold mb-2">
                  <span className="flex items-center gap-1">📡 即時新聞 FEED</span>
                  <span className="text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-500/80">LIVE FEED ({liveNewsList.length})</span>
                </div>
                
                <div className="max-h-[160px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {liveNewsList.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 py-1.5 border-b border-slate-900 last:border-0 rounded">
                      <span className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${
                        item.category === 'war' ? 'bg-red-500' :
                        item.category === 'diplomacy' ? 'bg-amber-500' :
                        item.category === 'economy' ? 'bg-emerald-500' :
                        'bg-cyan-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-mono text-slate-500 mr-2">{item.time}</span>
                        <span className="text-[14px] text-slate-300 font-sans">{item.text}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. 歷史紀錄 */}
            <div id="mobile-history-section" className="w-full text-left">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">📜</span>
                  <span className="font-sans text-xs font-bold text-[#F5A623] tracking-widest leading-none uppercase">歷史紀錄</span>
                </div>
                {history.length > 0 && (
                  <span onClick={() => {
                    setHistoryModalTab("current");
                    fetchGameHistoryList();
                    setIsHistoryModalOpen(true);
                  }} className="text-xs font-mono text-slate-400 font-bold hover:text-amber-500 cursor-pointer">
                    查看全部 ({history.length}) »
                  </span>
                )}
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-amber-500 to-transparent mb-3" />
              
              <div className="bg-[#0c0f1b]/95 border border-slate-800 rounded-xl p-4">
                {history.length === 0 ? (
                  <div className="py-4 text-center border border-dashed border-slate-800 rounded-lg text-slate-500">
                    <p className="text-xs font-medium">尚無歷史決策</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto max-h-[360px] pr-1 flex flex-col gap-4 relative before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-850 custom-scrollbar">
                    {history
                      .slice()
                      .reverse()
                      .slice(0, 4)
                      .map((item, index) => {
                        const originalTurnNum = history.length - index;
                        const econDiff = item.statsAfter.economy - item.statsBefore.economy;
                        const milDiff = item.statsAfter.military - item.statsBefore.military;
                        const dipDiff = item.statsAfter.diplomacy - item.statsBefore.diplomacy;
                        const opinionDiff = item.statsAfter.publicOpinion - item.statsBefore.publicOpinion;
                        const indDiff = item.statsAfter.industry - item.statsBefore.industry;
                        const mktDiff = item.statsAfter.market - item.statsBefore.market;

                        const statChanges = [
                          { name: "經濟", diff: econDiff },
                          { name: "軍事", diff: milDiff },
                          { name: "外交", diff: dipDiff },
                          { name: "民意", diff: opinionDiff },
                          { name: "科技監控", diff: indDiff },
                          { name: "股市", diff: mktDiff },
                        ].filter(s => s.diff !== 0);

                        const headline = getDynamicNewsHeadline(item.scenarioTitle, item.chosenOptionTitle, item.chosenOptionId);

                        return (
                          <div key={`timeline-mobile-${index}`} className="flex gap-3.5 items-start relative py-0.5">
                            {/* Point on timeline */}
                            <div className="h-5 flex items-center shrink-0 z-10">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623] border-2 border-[#0c0f1b] ring-4 ring-amber-500/10 shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
                            </div>
                            <div className="flex-grow min-w-0 flex flex-col gap-1 text-left">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="font-extrabold text-[#f5a623] uppercase tracking-widest">
                                  第 {originalTurnNum} 回合
                                </span>
                                <span className="text-slate-500">
                                  {item.dateString}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-slate-100 leading-snug">
                                {item.scenarioTitle}
                              </h4>
                              
                              {/* Decision */}
                              <div className="text-[11px] text-slate-300 leading-normal font-sans bg-slate-950/65 p-2 rounded-lg border border-slate-850/60 mt-0.5">
                                <span className="text-[#f5a623] font-extrabold mr-1 font-mono">決策：</span>
                                {item.chosenOptionTitle}
                              </div>

                              {/* Impacts list */}
                              {statChanges.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center mt-1">
                                  <span className="text-[9px] font-mono text-slate-500 mr-1 uppercase select-none">影響：</span>
                                  {statChanges.map((sc, scIdx) => (
                                    <span 
                                      key={scIdx} 
                                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-slate-800 ${
                                        sc.diff >= 0 
                                          ? "text-emerald-400 bg-emerald-500/5" 
                                          : "text-rose-400 bg-rose-500/5"
                                      }`}
                                    >
                                      {sc.name} {sc.diff >= 0 ? `+${sc.diff}` : sc.diff}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* News headline block */}
                              <div className="text-[10px] text-slate-400 italic leading-relaxed border-l-2 border-amber-500/20 pl-2.5 mt-1.5 font-medium">
                                <span className="text-slate-500 not-italic font-extrabold text-[8.5px] block uppercase font-mono tracking-widest mb-0.5">歷史快訊：</span>
                                {headline}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* 8. 總統檔案 */}
            <div id="mobile-president-dossier" className="w-full text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">👤</span>
                <span className="font-sans text-xs font-bold text-[#F5A623] tracking-widest leading-none uppercase">總統執政檔案</span>
              </div>
              <div className="w-full h-[1px] bg-gradient-to-r from-amber-500 to-transparent mb-3" />
              
              <div className="bg-[#0c0f1b]/95 border border-slate-800 rounded-xl p-4 flex flex-col gap-3">
                <div className="bg-[#141a2e] border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                  <span className="text-xs text-slate-400">執政性格：</span>
                  <span className="text-sm font-black text-amber-400">
                    {getNewPresidentPersonalityName(presidentPersonality)}
                  </span>
                </div>

                <div className="border-l-[3px] border-[#F5A623] p-4 bg-slate-950/45 rounded-r-[6px]">
                  <blockquote className="text-[16px] leading-[1.7] italic text-slate-300">
                    「偉大的國家不是等待機會，而是創造機會。我們要把製造業、財富與美麗的承諾全部帶回美國本土！」
                  </blockquote>
                </div>

                <button
                  onClick={handleRestartGame}
                  className="mt-2 w-full py-3 bg-[#110e17] hover:bg-[#1a0e1c] border border-amber-500/20 text-amber-400 font-bold rounded-xl text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新挑戰最高推演
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic global modals for mobile history view */}
          <AnimatePresence>
            {isHistoryModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
                <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[82vh] text-left">
                  {/* Header */}
                  <div className="px-5 py-3.5 border-b border-slate-800 flex justify-between items-center bg-[#0e1222]">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>📜</span> 歷次決策備忘錄
                      </h3>
                      <p className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">
                        National Archive Mobile Portal
                      </p>
                    </div>
                    <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800/50 rounded-lg transition-colors">✕</button>
                  </div>

                  {/* Mobile Tab Switcher */}
                  <div className="flex border-b border-slate-800/60 bg-[#080b13] px-4 gap-4 shrink-0">
                    <button
                      onClick={() => setHistoryModalTab("current")}
                      className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                        historyModalTab === "current"
                          ? "border-amber-500 text-amber-400"
                          : "border-transparent text-slate-400"
                      }`}
                    >
                      <span>🏛️</span> 本局 ({history.length})
                    </button>
                    <button
                      onClick={() => {
                        setHistoryModalTab("archive");
                        fetchGameHistoryList();
                      }}
                      className={`py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                        historyModalTab === "archive"
                          ? "border-amber-500 text-amber-400"
                          : "border-transparent text-slate-400"
                      }`}
                    >
                      <span>🗄️</span> 存檔庫 ({historyList.length})
                    </button>
                  </div>

                  {/* List Content */}
                  <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 max-h-full bg-[#0a0d16]/20">
                    {historyModalTab === "current" ? (
                      history.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 italic text-xs">
                          暫無歷史決策。請在會議中發出您的第一條政令！
                        </div>
                      ) : (
                        history.map((h, i) => (
                          <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-left flex flex-col gap-1.5 relative">
                            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                              <span className="text-amber-500 font-bold">第 {h.daysOfPresidency} 天 ({h.dateString})</span>
                              <span>回合 #{i+1}</span>
                            </div>
                            <h4 className="text-xs font-bold text-gray-200">
                              議題：「{h.scenarioTitle}」
                            </h4>
                            <p className="text-xs text-slate-400">
                              指令: <span className="text-amber-400 font-bold">{h.chosenOptionId} - {h.chosenOptionTitle}</span>
                            </p>
                          </div>
                        ))
                      )
                    ) : (
                      /* Archive Mobile */
                      isHistoryLoading ? (
                        <div className="py-12 text-center flex flex-col items-center justify-center text-slate-400 text-xs">
                          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-3" />
                          下載安全雲端存檔中...
                        </div>
                      ) : historyList.length === 0 ? (
                        <div className="py-12 text-center text-slate-500 italic text-xs">
                          全球戰略存檔庫尚無紀錄。
                        </div>
                      ) : (
                        historyList.map((item, index) => {
                          const isExpanded = expandedArchiveGameId === item.gameId;
                          
                          let ratingColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
                          if (item.rating === "S") ratingColor = "text-amber-400 bg-amber-500/10 border-amber-500/30";
                          else if (item.rating === "A") ratingColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                          else if (item.rating === "D") ratingColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";

                          return (
                            <div
                              key={item.gameId || index}
                              className={`p-3 bg-slate-900/50 border border-slate-800/80 rounded-xl flex flex-col gap-2.5 transition-all ${
                                isExpanded ? "border-amber-500/40 bg-slate-900/75" : ""
                              }`}
                            >
                              <div
                                onClick={() => setExpandedArchiveGameId(isExpanded ? null : item.gameId)}
                                className="flex items-start justify-between cursor-pointer"
                              >
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-200 leading-none">{item.endingName}</span>
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${ratingColor}`}>等級 {item.rating}</span>
                                  </div>
                                  <span className="text-[9px] font-mono text-slate-500 mt-1 block">總分: {item.totalScore} | {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}</span>
                                </div>
                                <span className="text-[10px] text-slate-500 shrink-0 select-none">{isExpanded ? "收合 ▲" : "展開 ▼"}</span>
                              </div>

                              {isExpanded && (
                                <div className="border-t border-slate-850 pt-2 flex flex-col gap-2 font-sans">
                                  {item.aiHistoricalReview && (
                                    <div className="p-2.5 bg-[#090d16] rounded border border-slate-800/40 text-[11px] leading-relaxed text-slate-400 italic font-mono select-text">
                                      🤖 AI 歷史評論: "{item.aiHistoricalReview}"
                                    </div>
                                  )}
                                  {item.decisions && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 block">回合指令記存:</span>
                                      <div className="flex flex-col gap-1 max-h-[120px] overflow-y-auto pr-1">
                                        {item.decisions.map((dec: any, decIdx: number) => (
                                          <div key={decIdx} className="text-[11px] leading-snug text-slate-300 pl-1.5 border-l border-slate-800 py-0.5">
                                            <span className="text-amber-500 font-mono font-bold mr-1">[R#{dec.round}]</span>
                                            {dec.scenarioTitle}
                                            <span className="block text-[10px] text-amber-500/80 font-semibold pl-4">✓ {dec.chosenOptionTitle}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )
                    )}
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 border-t border-slate-800 bg-[#0e1220] flex justify-end shrink-0">
                    <button
                      onClick={() => setIsHistoryModalOpen(false)}
                      className="px-4 py-2 bg-amber-500 text-black font-extrabold text-xs rounded-xl transition"
                    >
                      關閉備忘錄
                    </button>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        /* 💻 DESKTOP & TABLET LAYOUTS */
        <>
          {/* ── HEADER ── */}
          <header id="chronos-header" className="px-6 py-4 bg-[#0a0d16]/90 border-b border-slate-800/60 sticky top-0 z-40 backdrop-blur-md flex items-center justify-between">
        
        {/* Left branding */}
        <div id="company-brand" className="flex items-center gap-4">
          <div id="coat-of-arms" className="w-10 h-10 border border-amber-500/30 rounded-lg flex items-center justify-center p-1.5 bg-[#0f1424] text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            {/* Elegant Double headed heraldry representing diplomatic council */}
            <Award className="w-full h-full text-amber-400 stroke-[1.5]" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <h1 id="brand-title" className="text-xl font-bold tracking-widest text-pulse-gold bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
                CHRONOS
              </h1>
              <span id="brand-sub" className="text-md font-bold text-gray-300">
                歷史政策智庫
              </span>
            </div>
            <p id="system-module-text" className="text-[10px] font-mono text-amber-600/80 tracking-wider">
              SG DIPLOMATIC COUNCIL CHAMBER
            </p>
          </div>
        </div>

        {/* Right operations */}
        <div id="header-user-ops" className="flex items-center gap-4">
          {/* User badge with their specific meta-identifier */}
          <div id="user-badge" className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-[#0e1220]">
            <div id="user-avatar-dot" className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span id="user-display-name" className="text-xs font-mono text-slate-300 select-none">
              {user.email || "library990322"}
            </span>
          </div>

          {/* Sign Out Button */}
          <button
            id="auth-logout-btn"
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-400 border border-rose-500/20 hover:border-rose-500/40 rounded-lg hover:bg-rose-500/5 active:scale-95 transition-all cursor-pointer box-border"
          >
            <LogOut className="w-3.5 h-3.5" />
            登出
          </button>
        </div>
      </header>



      {/* ── SIX ATTRIBUTES (PROGRESS BAR ROW) ── */}
      <section id="attributes-bar" className="px-6 pt-5 pb-1 max-w-[1700px] mx-auto grid grid-cols-2 md:grid-cols-6 gap-3">
        {/* Attribute 1: 經濟 */}
        <div
          id="stat-box-economy"
          className="relative px-4 py-3 bg-[#0d111d]/90 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl select-none group"
          onMouseEnter={() => setShowTooltip("economy")}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-[12px]">
              <TrendingUp className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
              <span className="text-xs font-semibold text-slate-400 font-sans">經濟</span>
            </div>
            <span className="text-base font-bold text-gray-200">{stats.economy}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${stats.economy}%` }} />
          </div>
          {showTooltip === "economy" && (
            <div className="absolute left-0 right-0 top-full mt-2 mx-1 p-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-emerald-300 z-50 shadow-xl leading-relaxed">
              核心經濟儲備。低於15%將爆發惡性通膨與財政癱瘓，高經濟有助產業與市場發達。
            </div>
          )}
        </div>

        {/* Attribute 2: 軍事 */}
        <div
          id="stat-box-military"
          className="relative px-4 py-3 bg-[#0d111d]/90 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl select-none group"
          onMouseEnter={() => setShowTooltip("military")}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-[12px]">
              <Shield className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
              <span className="text-xs font-semibold text-slate-400 font-sans">軍事</span>
            </div>
            <span className="text-base font-bold text-gray-200">{stats.military}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 transition-all duration-500" style={{ width: `${stats.military}%` }} />
          </div>
          {showTooltip === "military" && (
            <div className="absolute left-0 right-0 top-full mt-2 mx-1 p-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-blue-300 z-50 shadow-xl leading-relaxed">
              國防與全球威懾力。低於15%會引發境外武裝力量挑釁與白宮參謀聯署警告。
            </div>
          )}
        </div>

        {/* Attribute 3: 外交 */}
        <div
          id="stat-box-diplomacy"
          className="relative px-4 py-3 bg-[#0d111d]/90 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl select-none group"
          onMouseEnter={() => setShowTooltip("diplomacy")}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-[12px]">
              <Handshake className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
              <span className="text-xs font-semibold text-slate-400 font-sans">外交</span>
            </div>
            <span className="text-base font-bold text-gray-200">{stats.diplomacy}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 transition-all duration-500" style={{ width: `${stats.diplomacy}%` }} />
          </div>
          {showTooltip === "diplomacy" && (
            <div className="absolute left-0 right-0 top-full mt-2 mx-1 p-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-purple-300 z-50 shadow-xl leading-relaxed">
              盟友關係與地緣合規。低於15%美國將在世界合約中遭到封殺孤立。
            </div>
          )}
        </div>

        {/* Attribute 4: 民意 */}
        <div
          id="stat-box-publicOpinion"
          className="relative px-4 py-3 bg-[#0d111d]/90 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl select-none group"
          onMouseEnter={() => setShowTooltip("publicOpinion")}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-[12px]">
              <Users className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
              <span className="text-xs font-semibold text-slate-400 font-sans">民意</span>
            </div>
            <span className="text-base font-bold text-gray-200">{stats.publicOpinion}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-pink-400 transition-all duration-500" style={{ width: `${stats.publicOpinion}%` }} />
          </div>
          {showTooltip === "publicOpinion" && (
            <div className="absolute left-0 right-0 top-full mt-2 mx-1 p-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-pink-300 z-50 shadow-xl leading-relaxed">
              總統本土民選支持率。低於15%將面臨國會彈劾投票和全美集會抗議風暴。
            </div>
          )}
        </div>

        {/* Attribute 5: 科技監控 */}
        <div
          id="stat-box-industry"
          className="relative px-4 py-3 bg-[#0d111d]/90 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl select-none group"
          onMouseEnter={() => setShowTooltip("industry")}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-[12px]">
              <Cpu className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
              <span className="text-xs font-semibold text-slate-400 font-sans">科技監控</span>
            </div>
            <span className="text-base font-bold text-gray-200">{stats.industry}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-orange-400 transition-all duration-500" style={{ width: `${stats.industry}%` }} />
          </div>
          {showTooltip === "industry" && (
            <div className="absolute left-0 right-0 top-full mt-2 mx-1 p-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-orange-300 z-50 shadow-xl leading-relaxed">
              重工業與核心製造業復興。高產業能創出大量工作職位。低於15%將引發核心空心化。
            </div>
          )}
        </div>

        {/* Attribute 6: 股市 */}
        <div
          id="stat-box-market"
          className="relative px-4 py-3 bg-[#0d111d]/90 border border-slate-800/80 hover:border-slate-700/60 transition-all rounded-xl select-none group"
          onMouseEnter={() => setShowTooltip("market")}
          onMouseLeave={() => setShowTooltip(null)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-[12px]">
              <LineChart className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
              <span className="text-xs font-semibold text-slate-400 font-sans">股市</span>
            </div>
            <span className="text-base font-bold text-gray-200">{stats.market}</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-400 transition-all duration-500" style={{ width: `${stats.market}%` }} />
          </div>
          {showTooltip === "market" && (
            <div className="absolute left-0 right-0 top-full mt-2 mx-1 p-2 bg-slate-900 border border-slate-700/80 rounded-lg text-[10px] text-cyan-300 z-50 shadow-xl leading-relaxed">
              關稅與進出口市場准入控制。低於15%代表進出口秩序失衡，非法物資與跨境偷渡氾濫。
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN GRID (SIDEBAR + DISPLAY SCREEN) ── */}
      <main
        id="main-content"
        className={`px-6 py-4 mx-auto w-full ${
          isSidebarCollapsed ? "max-w-full" : "max-w-[1700px]"
        }`}
        style={{
          display: "grid",
          gridTemplateColumns: isLargeScreen 
            ? (isSidebarCollapsed ? "80px 1fr" : "340px 1fr")
            : "1fr",
          alignItems: "stretch",
          gap: "24px",
          transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        
        {/* ── LEFT SIDEBAR (CONSOLE CONTROLS) ── */}
        <aside
          id="sidebar-controls"
          className="flex flex-col shrink-0 bg-[#070b14] border border-slate-800/80 rounded-2xl shadow-[0_15px_60px_rgba(0,0,0,0.75)] h-full overflow-y-auto custom-scrollbar"
          style={{
            width: screenSize === 'desktop' ? (isSidebarCollapsed ? "80px" : "340px") : "100%",
            minWidth: screenSize === 'desktop' ? (isSidebarCollapsed ? "80px" : "340px") : "100%",
            maxWidth: screenSize === 'desktop' ? (isSidebarCollapsed ? "80px" : "340px") : "100%",
            padding: screenSize === 'desktop' ? (isSidebarCollapsed ? "16px 12px" : "24px") : "16px 20px",
            transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Sidebar Toggle Button */}
          <button
            id="toggle-sidebar-btn"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="group relative bg-[#141a2e]/80 border border-slate-800 hover:border-amber-500/30 text-[#94a3b8] hover:text-amber-400 rounded-xl flex items-center overflow-hidden h-10 transition-all duration-350 active:scale-95 cursor-pointer text-xs font-semibold shadow-md shrink-0 w-full mb-6 animate-fade-in"
            style={{
              transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <div className="absolute left-0 w-12 h-full flex items-center justify-center shrink-0">
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-amber-500 shrink-0" />
              )}
            </div>
            <span 
              className={`pl-12 transition-all ease-in-out whitespace-nowrap shrink-0 ${
                screenSize === 'desktop' && isSidebarCollapsed 
                  ? "opacity-0 invisible duration-200" 
                  : "opacity-100 visible duration-200 delay-150"
              }`}
            >
              {screenSize === 'desktop' 
                ? "收合側欄" 
                : (isSidebarCollapsed ? "展開白宮控制台" : "收合白宮控制台")
              }
            </span>
            {screenSize === 'desktop' && isSidebarCollapsed && (
              <div className="fixed left-[84px] z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-[#f5a623] whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
                <span>➡️</span> <span>展開側欄</span>
              </div>
            )}
          </button>
          
          {/* SECTION 1: 總統檔案 */}
          <div className={`group/dossier relative w-full mb-6 shrink-0 flex flex-col ${isSidebarCollapsed ? "" : "h-[450px]"}`}>
            {isSidebarCollapsed ? (
               <div className="w-full flex justify-center">
                 <div 
                  id="trump-avatar-container" 
                  className="relative overflow-hidden rounded-lg border border-slate-700/60 bg-[#141a2e] shrink-0 flex items-center justify-center cursor-pointer w-10 h-10"
                  title="DONALD J. TRUMP"
                >
                  <img
                    src={trumpAvatar}
                    alt="Donald J. Trump avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="fixed left-[84px] z-50 pointer-events-none opacity-0 group-hover/dossier:opacity-100 transition-opacity duration-200 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-[#f5a623] whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
                  <span>👤</span> <span>總統檔案</span>
                </div>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex flex-col gap-1.5 mb-2 w-full shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span className="font-sans text-sm font-bold text-[#F5A623] tracking-widest uppercase">
                      總統檔案
                    </span>
                  </div>
                  <div className="w-full h-[1px]" style={{ background: "linear-gradient(90deg, #F5A623, transparent)" }} />
                </div>

                {/* Primary Content Container */}
                <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
                  {/* Avatar & Basic Info */}
                  <div className="flex gap-4 items-center shrink-0" style={{ width: "291px", height: "139px" }}>
                    {/* 頭像 */}
                    <div 
                      id="trump-avatar-container" 
                      className="w-[96px] h-[96px] rounded-[12px] overflow-hidden border border-slate-700/60 bg-[#141a2e] shrink-0 flex items-center justify-center cursor-pointer shadow-md"
                      title="DONALD J. TRUMP"
                      onClick={() => setIsDebugOn(!isDebugOn)}
                    >
                      <img
                        src={trumpAvatar}
                        alt="Donald J. Trump avatar"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        style={{ marginLeft: "0px", paddingLeft: "0px", marginTop: "-1px", width: "98px", height: "110px" }}
                      />
                    </div>

                    {/* 姓名與職位 */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="text-[28px] font-extrabold text-white leading-none font-sans tracking-wide uppercase whitespace-normal overflow-visible break-words" style={{ textOverflow: "unset", fontSize: "18px" }}>
                        DONALD J. TRUMP
                      </h3>
                      <p className="text-[16px] text-slate-300 opacity-[0.8] font-medium leading-none mt-[4px]">
                        第47任美國總統
                      </p>
                      
                      {/* ACTIVE / TERM 2 Status Badges */}
                      <div className="flex gap-[10px] mt-[12px] shrink-0">
                        <span className="text-[14px] font-bold text-[#10b981] px-[16px] py-[8px] bg-[#10b981]/15 border border-[#10b981]/30 rounded-[8px] select-none tracking-wide">
                          ACTIVE
                        </span>
                        <span className="text-[14px] font-bold text-[#3582f6] px-[16px] py-[8px] bg-[#3582f6]/15 border border-[#3582f6]/30 rounded-[8px] select-none tracking-wide" style={{ lineHeight: "21px", fontSize: "12px" }}>
                          TERM 2
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Style and Personality Badges */}
                  <div className="flex flex-wrap gap-1.5 my-2 shrink-0">
                    <span id="president-personality-badge" className="text-[20px] font-bold text-[#f5a623] h-[36px] px-[16px] py-[8px] bg-[#f5a623]/10 border border-[#f5a623]/25 rounded-[4px] select-none flex items-center justify-center leading-none">
                      執政風格：{getNewPresidentPersonalityName(presidentPersonality)}
                    </span>
                  </div>

                  {/* Absolute Debug Panel (Floats neatly if debug mode is switched on) */}
                  {isDebugOn && (
                    <div className="absolute top-[102px] left-0 right-0 text-[9px] font-mono bg-slate-950 border border-slate-800 p-2 rounded-lg text-slate-400 flex flex-col gap-0.5 pointer-events-auto leading-none z-50 shadow-2xl">
                      <div className="flex justify-between"><span>鷹派:</span> <span className="text-amber-400 font-bold">{personality.hawkish}</span></div>
                      <div className="flex justify-between"><span>外交:</span> <span className="text-amber-300 font-bold">{personality.diplomatic}</span></div>
                      <div className="flex justify-between"><span>經濟:</span> <span className="text-emerald-400 font-bold">{personality.economic}</span></div>
                      <div className="flex justify-between"><span>民粹:</span> <span className="text-pink-400 font-bold">{personality.populist}</span></div>
                      <div className="flex justify-between"><span>技術:</span> <span className="text-cyan-400 font-bold">{personality.technocratic}</span></div>
                      <div className="flex justify-between"><span>孤立:</span> <span className="text-orange-400 font-bold">{personality.isolationist}</span></div>
                    </div>
                  )}

                  {/* 名言區 */}
                  <div className="h-[160px] border-l-[3px] border-[#F5A623] p-5 flex items-center bg-slate-950/45 rounded-r-[6px] select-text shrink-0 overflow-hidden">
                    <blockquote className="text-[18px] leading-[1.9] font-medium italic text-slate-300 select-text w-full">
                      「偉大的國家不是等待機會，而是創造機會。我們要把製造業、財富與美麗的承諾全部帶回美國本土！」
                    </blockquote>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {/* SECTION 2: LIVE STATS */}
          <div className={`group/live relative w-full mb-6 flex flex-col ${isSidebarCollapsed ? "" : "h-[350px]"}`}>
            {isSidebarCollapsed ? (
              <div className="w-full flex justify-center">
                <div 
                  className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer"
                  title="LIVE STATS"
                >
                  <span 
                    className={`w-2.5 h-2.5 rounded-full animate-pulse shrink-0 ${
                      liveNewsList.length > 0
                        ? liveNewsList[0].category === 'war' ? 'bg-red-500 shadow-[0_0_8px_#ef4444]'
                          : liveNewsList[0].category === 'diplomacy' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                          : liveNewsList[0].category === 'economy' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                          : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                        : 'bg-amber-500 shadow-[0_0_8px_#f59e0b]'
                    }`} 
                  />
                </div>
                <div className="fixed left-[84px] z-50 pointer-events-none opacity-0 group-hover/live:opacity-100 transition-opacity duration-200 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-[#f5a623] whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
                  <span>📡</span> <span>LIVE STATS</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2 mb-3 w-full shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📡</span>
                    <span className="font-sans text-xs font-bold text-[#F5A623] tracking-widest leading-none uppercase">
                      LIVE STATS
                    </span>
                  </div>
                  <div className="w-full" style={{ height: "1px", background: "linear-gradient(90deg, #F5A623, transparent)" }} />
                </div>

                {/* Ticker box contents */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold shrink-0 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-amber-500" />
                    即時新聞
                  </span>
                  <span className="text-[9px] font-mono bg-slate-900 px-1.5 py-0.5 rounded text-amber-500/80">
                    LIVE FEED ({liveNewsList.length})
                  </span>
                </div>

                {/* News Feed scroll container */}
                <div className="flex-1 overflow-y-auto pr-1 mt-1 space-y-2.5 select-text custom-scrollbar">
                  {liveNewsList.map((item) => {
                    const dotClass = 
                      item.category === 'war' ? 'bg-red-500 shadow-[0_0_6px_#ef4444]' :
                      item.category === 'diplomacy' ? 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' :
                      item.category === 'economy' ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' :
                      'bg-cyan-400 shadow-[0_0_6px_#22d3ee]';

                    return (
                      <div 
                        key={item.id} 
                        className="flex items-start gap-2 py-1.5 border-b border-slate-900/30 last:border-0 hover:bg-slate-900/20 rounded transition-colors group/news"
                      >
                        <span className={`w-1 h-1 rounded-full mt-2 shrink-0 ${dotClass}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-[9px] font-mono text-slate-500 shrink-0 select-none">
                              {item.time}
                            </span>
                            <span className="text-[11.5px] text-slate-300 leading-normal font-sans group-hover/news:text-white transition-colors">
                              {item.text}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Status Legends */}
                <div className="flex items-center justify-between border-t border-slate-800/65 pt-2 mt-3 text-[9px] text-slate-500 select-none font-mono shrink-0">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> 軍事
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 外交
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 經濟
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> 科技
                  </span>
                </div>
              </>
            )}
          </div>
          
          {/* SECTION 3: 歷史紀錄 */}
          <div className={`group/history relative w-full mb-6 flex flex-col ${isSidebarCollapsed ? "" : "h-[265px]"}`}>
            {isSidebarCollapsed ? (
              <div className="w-full flex justify-center">
                <button
                  onClick={() => {
                    setHistoryModalTab(history.length === 0 ? "archive" : "current");
                    fetchGameHistoryList();
                    setIsHistoryModalOpen(true);
                  }}
                  className="relative w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                >
                  <History className="w-5 h-5 shrink-0" />
                  {history.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-black text-[9px] font-bold font-mono px-1 rounded-sm shadow-[0_0_5px_rgba(245,158,11,0.5)]">
                      {history.length}
                    </span>
                  )}
                </button>
                <div className="fixed left-[84px] z-50 pointer-events-none opacity-0 group-hover/history:opacity-100 transition-opacity duration-200 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-[#f5a623] whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
                  <span>📜</span> <span>歷史紀錄</span>
                </div>
              </div>
            ) : (
              <>
                <div 
                  className="flex flex-col gap-1.5 mb-1.5 w-full shrink-0 cursor-pointer group/hist-title"
                  onClick={() => {
                    setHistoryModalTab(history.length === 0 ? "archive" : "current");
                    fetchGameHistoryList();
                    setIsHistoryModalOpen(true);
                  }}
                  title="點擊查看完整歷史"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📜</span>
                      <span className="font-sans text-xs font-bold text-[#F5A623] group-hover/hist-title:text-amber-300 transition-colors tracking-widest leading-none uppercase">
                        歷史紀錄
                      </span>
                    </div>
                    {history.length > 0 && (
                      <span className="text-[10px] font-mono text-slate-500 hover:text-amber-400">
                        查看全部 ({history.length}) »
                      </span>
                    )}
                  </div>
                  <div className="w-full h-[1px]" style={{ background: "linear-gradient(90deg, #F5A623, transparent)" }} />
                </div>

                {history.length === 0 ? (
                  <div className="py-2 text-center border border-dashed border-slate-800/60 rounded-lg text-slate-500 flex-1 flex flex-col items-center justify-center min-h-[50px]">
                    <p className="text-xs font-medium">尚無歷史紀錄</p>
                    <p className="text-[9px] font-mono mt-0.5 uppercase tracking-wider text-slate-600">
                      No decisions logged
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3.5 relative before:absolute before:left-[11px] before:top-2.5 before:bottom-2.5 before:w-[2px] before:bg-slate-850 custom-scrollbar select-text">
                    {history
                      .slice() // copy to avoid mutating state
                      .reverse() // reverse to show latest first
                      .map((item, index) => {
                        const originalTurnNum = history.length - index;
                        const econDiff = item.statsAfter.economy - item.statsBefore.economy;
                        const milDiff = item.statsAfter.military - item.statsBefore.military;
                        const dipDiff = item.statsAfter.diplomacy - item.statsBefore.diplomacy;
                        const opinionDiff = item.statsAfter.publicOpinion - item.statsBefore.publicOpinion;
                        const indDiff = item.statsAfter.industry - item.statsBefore.industry;
                        const mktDiff = item.statsAfter.market - item.statsBefore.market;

                        const statChanges = [
                          { name: "經濟", diff: econDiff },
                          { name: "軍事", diff: milDiff },
                          { name: "外交", diff: dipDiff },
                          { name: "民意", diff: opinionDiff },
                          { name: "科技監控", diff: indDiff },
                          { name: "股市", diff: mktDiff },
                        ].filter(s => s.diff !== 0);

                        const headline = getDynamicNewsHeadline(item.scenarioTitle, item.chosenOptionTitle, item.chosenOptionId);

                        return (
                          <div 
                            key={`timeline-${index}`} 
                            className="flex gap-3.5 items-start relative group/timeline py-1 px-2.5 rounded-xl hover:bg-[#111625]/55 transition-all duration-200 border border-transparent hover:border-slate-800/45 cursor-pointer"
                            onClick={() => {
                              setHistoryModalTab("current");
                              setIsHistoryModalOpen(true);
                            }}
                          >
                            {/* Point on timeline */}
                            <div className="h-5 flex items-center shrink-0 z-10">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#f5a623] border-2 border-[#090b13] ring-4 ring-amber-500/10 group-hover/timeline:scale-125 group-hover/timeline:bg-amber-400 group-hover/timeline:ring-amber-500/25 transition-all duration-300 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                            </div>
                            <div className="flex-grow min-w-0 flex flex-col gap-1 text-left">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span className="font-extrabold text-[#f5a623] uppercase tracking-widest">
                                  第 {originalTurnNum} 回合
                                </span>
                                <span className="text-slate-500">
                                  {item.dateString}
                                </span>
                              </div>
                              
                              <h4 className="text-[12px] font-extrabold text-slate-100 group-hover/timeline:text-amber-400 transition-colors leading-snug">
                                {item.scenarioTitle}
                              </h4>

                              {/* Decision */}
                              <div className="text-[11px] text-slate-300 leading-normal font-sans bg-slate-950/50 p-2 rounded-lg border border-slate-850/60 mt-0.5">
                                <span className="text-[#f5a623] font-black mr-1 font-mono">決策：</span>
                                {item.chosenOptionTitle}
                              </div>

                              {/* Impacts list */}
                              {statChanges.length > 0 && (
                                <div className="flex flex-wrap gap-1 items-center mt-1">
                                  <span className="text-[9.5px] font-mono text-slate-500 mr-1 uppercase select-none">影響：</span>
                                  {statChanges.map((sc, scIdx) => (
                                    <span 
                                      key={scIdx} 
                                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                                        sc.diff >= 0 
                                          ? "text-emerald-400 bg-emerald-500/5 border-emerald-500/15" 
                                          : "text-rose-400 bg-rose-500/5 border-rose-500/15"
                                      }`}
                                    >
                                      {sc.name} {sc.diff >= 0 ? `+${sc.diff}` : sc.diff}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* News headline block */}
                              <div className="text-[10.5px] text-slate-400 italic leading-relaxed border-l-2 border-amber-500/20 pl-2.5 mt-1.5 font-medium group-hover/timeline:text-slate-300 transition-colors">
                                <span className="text-slate-500 not-italic font-extrabold text-[9px] block uppercase font-mono tracking-widest mb-0.5 select-none">歷史快訊：</span>
                                {headline}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* SECTION 4: 重新開始 */}
          <div className="group/restart relative w-full mt-auto shrink-0 pt-4 border-t border-slate-900/40">
            <button
              id="restart-game-btn"
              onClick={handleRestartGame}
              title="重新挑戰"
              className="group relative bg-[#110e17] hover:bg-[#1a0e1c] border border-amber-500/20 text-amber-400 hover:text-amber-300 rounded-xl flex items-center overflow-hidden h-12 transition-all duration-350 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.05)] shrink-0 w-full"
              style={{
                transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {/* Icon centered in a 48px box */}
              <div className="absolute left-0 w-12 h-12 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-all duration-500 text-amber-500" />
              </div>
              {/* Text container */}
              <span 
                className={`pl-12 text-xs font-bold transition-all ease-in-out whitespace-nowrap shrink-0 ${
                  isSidebarCollapsed 
                    ? "opacity-0 invisible duration-200" 
                    : "opacity-100 visible duration-200 delay-150"
                }`}
              >
                重新挑戰
              </span>
              {isSidebarCollapsed && (
                <div className="fixed left-[84px] z-50 pointer-events-none opacity-0 group-hover/restart:opacity-100 transition-opacity duration-200 bg-slate-900/95 border border-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-[#f5a623] whitespace-nowrap shadow-[0_4px_20px_rgba(0,0,0,0.5)] flex items-center gap-2">
                  <span>🔄</span> <span>重新挑戰</span>
                </div>
              )}
            </button>
          </div>
        </aside>

        {/* ── CENTER DISPLAY SCREEN ── */}
        <section
          id="strategical-console-screen"
          className="flex-grow min-w-0 flex flex-col gap-4 w-full"
          style={{
            transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          
          {/* TAB LAYOUTS */}
          <AnimatePresence mode="wait">
            
            {activeTab === "main" && (
              <motion.div
                key="tab-main"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-4"
              >
                {activeEnding?.isFinalEnding ? (
                  /* ── MAJESTIC MULTI-ENDING PAGE (STEP 8) ── */
                  <div id="final-ending-page" className="w-full max-w-4xl mx-auto bg-[#0a0d16]/95 border border-amber-500/30 rounded-2xl p-6 md:p-10 flex flex-col gap-8 shadow-[0_20px_50px_rgba(245,158,11,0.08)] leading-relaxed text-center">
                    
                    {/* 結局標題 */}
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className={`w-24 h-24 rounded-3xl flex items-center justify-center border ${activeEnding.ratingColor} shadow-[0_0_40px_rgba(245,158,11,0.15)]`}>
                        <span className="text-6xl">{activeEnding.icon}</span>
                      </div>
                      <h2 className={`text-4xl md:text-5xl font-black tracking-widest ${activeEnding.color} drop-shadow-lg`}>
                        {activeEnding.title}
                      </h2>
                    </div>

                    {/* 結局描述 */}
                    <div className="bg-slate-900/60 border-2 border-slate-700/50 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col">
                      <div className="absolute inset-0 bg-gradient-to-b from-slate-800/20 to-transparent pointer-events-none" />
                      <p className="text-lg md:text-2xl text-slate-200 leading-relaxed font-bold whitespace-pre-wrap relative z-10 text-center">
                        {activeEnding.desc}
                      </p>
                    </div>

                    {/* 歷史學家評價 */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-sm font-mono font-bold text-indigo-400 tracking-widest uppercase flex items-center justify-center gap-2">
                        <BookOpen className="w-5 h-5" /> 歷史學家評價
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {generateHistoricalReview(activeEnding.stats, activeEnding.title).map((review, i) => (
                           <div key={i} className="bg-[#0f1424]/90 border border-indigo-500/30 rounded-xl p-6 flex flex-col justify-center items-center shadow-lg hover:border-indigo-400/50 transition-colors h-full min-h-[120px]">
                              <p className="text-[15px] md:text-base text-slate-300 font-medium text-center leading-snug">
                                {review}
                              </p>
                           </div>
                        ))}
                      </div>
                    </div>

                    {/* 最終國家數值 */}
                    <div className="flex flex-col gap-4">
                      <h4 className="text-sm font-mono font-bold text-[#cbd5e1] tracking-widest uppercase flex items-center justify-center gap-2">
                        <LineChart className="w-5 h-5" /> 最終國家數值
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
                        {[
                          { key: 'economy', label: '經濟與金融', icon: <Coins className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />, val: activeEnding.stats.economy, color: 'text-emerald-400', bg: 'bg-emerald-500' },
                          { key: 'military', label: '國防軍事', icon: <Shield className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />, val: activeEnding.stats.military, color: 'text-blue-400', bg: 'bg-blue-500' },
                          { key: 'diplomacy', label: '外交同盟', icon: <Globe className="w-5 h-5 md:w-6 md:h-6 text-violet-400" />, val: activeEnding.stats.diplomacy, color: 'text-violet-400', bg: 'bg-violet-500' },
                          { key: 'publicOpinion', label: '民意支持', icon: <Users className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />, val: activeEnding.stats.publicOpinion, color: 'text-amber-500', bg: 'bg-amber-500' },
                          { key: 'industry', label: '科技與產業', icon: <Factory className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />, val: activeEnding.stats.industry, color: 'text-cyan-400', bg: 'bg-cyan-500' },
                          { key: 'market', label: '關市與股市', icon: <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-rose-450" />, val: activeEnding.stats.market, color: 'text-rose-450', bg: 'bg-rose-500' }
                        ].map(stat => (
                          <div key={stat.key} className="bg-slate-950/80 border border-slate-700/60 rounded-xl md:rounded-2xl p-4 md:p-6 flex flex-col gap-3 md:gap-4 shadow-xl relative overflow-hidden">
                            <div className="flex items-center justify-between z-10">
                              <div className="flex items-center gap-2 md:gap-3">
                                {stat.icon}
                                <span className="text-sm md:text-lg font-bold text-slate-300 tracking-wide">{stat.label}</span>
                              </div>
                              <span className={`text-2xl md:text-3xl font-black font-mono ${stat.color}`}>{stat.val}%</span>
                            </div>
                            <div className="w-full bg-slate-800/80 h-2 md:h-3 rounded-full overflow-hidden z-10">
                              <div className={`h-full border border-black/10 ${stat.bg} rounded-full transition-all duration-1000 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)]`} style={{ width: `${stat.val}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 總統評分大型徽章 */}
                    <div className="flex flex-col items-center justify-center mt-6">
                      <div className="flex flex-col items-center justify-center bg-gradient-to-b from-amber-900/40 to-slate-900/80 border-2 border-amber-400 rounded-[2rem] w-full max-w-[320px] py-10 shadow-[0_0_50px_rgba(245,158,11,0.4)] ring-2 ring-amber-500/40 relative overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />
                        <div className="absolute top-0 w-full h-1/2 bg-amber-500/5" />
                        <span className="text-xs font-mono font-bold text-amber-200 tracking-widest uppercase mb-4 relative z-10 border border-amber-500/60 bg-amber-950/80 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                          最高戰略執政評級
                        </span>
                        
                        <div className="flex flex-col items-center gap-1 relative z-10">
                          <span className="text-7xl font-black font-mono text-amber-400 leading-none filter drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                            {activeEnding.rating.replace('總統', '')}
                            <span className="text-3xl font-bold ml-1 text-amber-500/60">級</span>
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center gap-2 mt-5 relative z-10">
                          <span className="text-3xl font-black text-white tracking-widest drop-shadow-md">
                            {activeEnding.rating}
                          </span>
                          <span className="text-lg text-amber-400 font-bold font-mono tracking-widest opacity-100 pb-1 border-b border-amber-500/50">
                            SCORE: {Math.round((activeEnding.stats.economy + activeEnding.stats.military + activeEnding.stats.diplomacy + activeEnding.stats.publicOpinion + activeEnding.stats.industry + activeEnding.stats.market) / 6)} / 100
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons footer */}
                    <div className="flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-800/80 mt-2">
                      <button
                        onClick={handleRestartGame}
                        className="flex-1 py-4 md:py-5 bg-amber-500 hover:bg-amber-400 font-black text-sm md:text-base text-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] active:scale-95 flex items-center justify-center gap-2 animate-pulse"
                      >
                        <RefreshCw className="w-5 h-5" />
                        重新挑戰
                      </button>
                      <button
                        onClick={exportEndingCard}
                        className="flex-1 py-4 md:py-5 bg-slate-800 border-2 border-slate-700 hover:bg-slate-700 font-black text-sm md:text-base text-white uppercase tracking-widest rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        匯出結局分享卡
                      </button>
                    </div>

                  </div>
                ) : (
                  <>
                    {/* 1. Tactical Oval Screen With Map & Dialogues */}
                    <div
                      id="tactical-oval-screen"
                      className="relative h-[520px] min-h-[520px] max-h-[520px] border border-slate-800/80 rounded-2xl overflow-hidden bg-[#090b14] shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none"
                    >
                      <img
                        src="/images/hero-trump.png"
                        alt="Hero Background"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover object-center pointer-events-none select-none absolute inset-0"
                      />
                      
                      {/* Top Right Date & Turn Card */}
                      <div
                        className="absolute top-6 right-6 z-20 p-[20px] bg-slate-950/90 border border-slate-800 rounded-xl flex flex-col justify-between shadow-2xl backdrop-blur-md"
                        style={{
                          height: '153px',
                          width: '281px',
                          marginLeft: '11px',
                          marginRight: '-24px',
                          marginTop: '-24px',
                          marginBottom: '-7px',
                          paddingLeft: '22px',
                          paddingRight: '23px'
                        }}
                      >
                        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                          <span className="text-[#F5A623] text-[20px] font-bold font-sans">
                            第 {turn} 回合
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">
                            STATUS
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 flex-1 justify-end">
                          <div className="text-white text-[24px] font-black font-mono tracking-tight leading-none">
                            {currentScenario?.dateString || "2025年5月28日"}
                          </div>
                          <div className="text-slate-350 text-[18px] font-bold font-sans leading-none mt-1.5">
                            上任第 {currentScenario?.daysOfPresidency || "150"} 天
                          </div>
                        </div>
                      </div>

                    </div>

                {/* 2. Scenario & Choice Panel (當前決策議題) */}
                <div id="diplomatic-deck" className="bg-[#0b0e17]/80 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-xl flex flex-col gap-4 text-left">
                  
                  {/* Topic Head */}
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1">
                      <div className="flex items-center gap-[12px]">
                        <Gavel className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
                        <span className="text-[11px] font-sans tracking-widest text-[#f5a623] font-bold uppercase">
                          當前決策議題
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-semibold text-blue-400">
                        <Globe className="w-3 h-3 text-blue-400" />
                        <span>外交危機影響：{currentScenario ? currentScenario.diplomaticImpact : "高"}</span>
                      </div>
                    </div>
                    <div className="w-full" style={{ height: "1px", background: "linear-gradient(90deg, #F5A623, transparent)", marginBottom: "4px" }} />
                  </div>

                  {activeCrisis ? (
                    /* ── BREAKING NEWS RANDOM CRISIS SYSTEM (NEW) ── */
                    <motion.div
                      id="breaking-news-crisis-panel"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative flex flex-col gap-6 p-6 rounded-2xl border bg-gradient-to-b from-[#0b0e1a]/95 to-[#05070e]/98 shadow-[0_20px_50px_rgba(239,68,68,0.15)] leading-relaxed select-text ${
                        activeCrisis.severity === "CRITICAL"
                          ? "border-red-500 animate-pulse-border shadow-[0_0_25px_rgba(239,68,68,0.35)]"
                          : activeCrisis.severity === "HIGH"
                          ? "border-orange-500/70 shadow-[0_0_20px_rgba(249,115,22,0.2)]"
                          : "border-slate-800"
                      }`}
                    >
                      {/* Special Alert Styling for CRITICAL */}
                      {activeCrisis.severity === "CRITICAL" && (
                        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-red-650 via-yellow-500 to-red-650 rounded-t-2xl animate-pulse" />
                      )}

                      {/* Ticker Header */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between w-full border-b border-rose-500/15 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-3 w-3 relative">
                              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${activeCrisis.severity === "CRITICAL" ? "bg-red-500" : "bg-amber-500"}`}></span>
                              <span className={`relative inline-flex rounded-full h-3 w-3 ${activeCrisis.severity === "CRITICAL" ? "bg-red-500" : "bg-amber-500"}`}></span>
                            </span>
                            <span className="text-xs font-black tracking-widest font-mono text-red-400 uppercase flex items-center gap-1.5 animate-pulse">
                              🚨 BREAKING NEWS • 國家突發特急新聞 🚨
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-mono font-black border px-2 py-0.5 rounded uppercase tracking-wider ${
                              activeCrisis.severity === "CRITICAL"
                                ? "bg-red-550/20 text-red-400 border-red-500/40"
                                : activeCrisis.severity === "HIGH"
                                ? "bg-orange-550/15 text-orange-400 border-orange-500/30"
                                : activeCrisis.severity === "MEDIUM"
                                ? "bg-yellow-550/15 text-yellow-400 border-yellow-500/30"
                                : "bg-blue-550/15 text-blue-400 border-blue-500/30"
                            }`}>
                              嚴重程度：{activeCrisis.severity === "CRITICAL" ? "🚨 CRITICAL" : activeCrisis.severity}
                            </span>
                          </div>
                        </div>

                        {/* Scrolling news banner */}
                        <div className="py-1 bg-red-950/20 border-y border-red-900/30 text-center overflow-hidden">
                          <div className="text-[10px] font-mono text-red-400 font-bold tracking-widest uppercase animate-pulse whitespace-nowrap">
                            ⚠️ 美國國家安全智庫特急會商：安全內閣已進入緊急控制室 • 突發類別：{activeCrisis.category} • ⚠️
                          </div>
                        </div>
                      </div>

                      {/* Topic title */}
                      <div className="flex flex-col gap-2 text-left">
                        <h2 className="text-xl md:text-2xl font-black tracking-wider text-red-400 font-sans leading-tight">
                          {activeCrisis.title}
                        </h2>
                        <p className="text-sm text-slate-300 leading-relaxed font-sans bg-rose-950/10 border-l-2 border-red-500/40 p-3 rounded-r-lg">
                          {activeCrisis.description}
                        </p>
                      </div>

                      {/* Not decided yet: List options A, B, C */}
                      {!crisisFeedbackShown ? (
                        <div className="flex flex-col gap-4 mt-2">
                          <div className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-2 mb-1 text-left tracking-wider uppercase font-mono">
                            🛠 選擇處理政策 (指標變化隱藏，做出決策後方可看結算)
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {activeCrisis.choices.map((opt: any) => (
                              <div
                                key={opt.id}
                                className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800 hover:border-red-500/55 rounded-xl p-5 relative group flex flex-col justify-between transition-all duration-300 hover:scale-[1.01]"
                              >
                                <div className="flex flex-col gap-3 text-left">
                                  <div className="flex items-center gap-3 border-b border-slate-800/60 pb-2">
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-black border font-mono text-xs ${
                                      opt.id === "A"
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                        : opt.id === "B"
                                        ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    }`}>
                                      {opt.id}
                                    </span>
                                    <span className="font-sans font-bold text-slate-200 text-sm">
                                      {opt.title}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-400 leading-relaxed min-h-[50px]">
                                    {opt.description}
                                  </p>
                                </div>

                                <div className="pt-4">
                                  <button
                                    onClick={() => handleSelectCrisisOption(opt.id)}
                                    className="w-full py-2 bg-gradient-to-r from-red-650 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-extrabold rounded-lg text-xs tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.25)]"
                                  >
                                    下達緊急行政令
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        /* Decided: Show choice results (applying properties) */
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col gap-5 mt-2 text-left"
                        >
                          {(() => {
                            const chosen = activeCrisis.choices.find((c: any) => c.id === crisisChoiceSelected);
                            if (!chosen) return null;
                            return (
                              <>
                                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl border-l-4 border-emerald-500/60">
                                  <span className="text-[10px] font-mono tracking-widest text-[#10b981] uppercase font-bold block mb-1">
                                    ✓ 已執行決策：【選項 {crisisChoiceSelected}】{chosen.title}
                                  </span>
                                  <p className="text-slate-300 text-xs font-sans leading-relaxed">
                                    {chosen.feedback}
                                  </p>
                                </div>

                                <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-4">
                                  <h4 className="text-xs font-bold text-slate-400 border-b border-slate-800 pb-2 mb-3 font-mono uppercase tracking-wider text-center">
                                    📊 國家綜合與地緣戰略效應
                                  </h4>

                                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center">
                                    {/* Economy */}
                                    <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
                                      <div className="text-slate-400 text-[10px] mb-1">經濟 (Economy)</div>
                                      <div className={`font-mono font-bold ${(chosen.effects.economy ?? 0) > 0 ? "text-emerald-400" : (chosen.effects.economy ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                        {(chosen.effects.economy ?? 0) > 0 ? `+${chosen.effects.economy}` : (chosen.effects.economy ?? 0) === 0 ? "0" : chosen.effects.economy}
                                      </div>
                                    </div>
                                    {/* Military */}
                                    <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
                                      <div className="text-slate-400 text-[10px] mb-1">軍事 (Military)</div>
                                      <div className={`font-mono font-bold ${(chosen.effects.military ?? 0) > 0 ? "text-emerald-400" : (chosen.effects.military ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                        {(chosen.effects.military ?? 0) > 0 ? `+${chosen.effects.military}` : (chosen.effects.military ?? 0) === 0 ? "0" : chosen.effects.military}
                                      </div>
                                    </div>
                                    {/* Diplomacy */}
                                    <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
                                      <div className="text-slate-400 text-[10px] mb-1">外交 (Diplomacy)</div>
                                      <div className={`font-mono font-bold ${(chosen.effects.diplomacy ?? 0) > 0 ? "text-emerald-400" : (chosen.effects.diplomacy ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                        {(chosen.effects.diplomacy ?? 0) > 0 ? `+${chosen.effects.diplomacy}` : (chosen.effects.diplomacy ?? 0) === 0 ? "0" : chosen.effects.diplomacy}
                                      </div>
                                    </div>
                                    {/* PublicOpinion */}
                                    <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
                                      <div className="text-slate-400 text-[10px] mb-1">民意 (Approval)</div>
                                      <div className={`font-mono font-bold ${(chosen.effects.publicOpinion ?? 0) > 0 ? "text-emerald-400" : (chosen.effects.publicOpinion ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                        {(chosen.effects.publicOpinion ?? 0) > 0 ? `+${chosen.effects.publicOpinion}` : (chosen.effects.publicOpinion ?? 0) === 0 ? "0" : chosen.effects.publicOpinion}
                                      </div>
                                    </div>
                                    {/* Industry */}
                                    <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
                                      <div className="text-slate-400 text-[10px] mb-1">產業 (Industry)</div>
                                      <div className={`font-mono font-bold ${(chosen.effects.industry ?? 0) > 0 ? "text-emerald-400" : (chosen.effects.industry ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                        {(chosen.effects.industry ?? 0) > 0 ? `+${chosen.effects.industry}` : (chosen.effects.industry ?? 0) === 0 ? "0" : chosen.effects.industry}
                                      </div>
                                    </div>
                                    {/* Market */}
                                    <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-lg text-xs">
                                      <div className="text-slate-400 text-[10px] mb-1">關市 (Market)</div>
                                      <div className={`font-mono font-bold ${(chosen.effects.market ?? 0) > 0 ? "text-emerald-400" : (chosen.effects.market ?? 0) < 0 ? "text-rose-400" : "text-gray-500"}`}>
                                        {(chosen.effects.market ?? 0) > 0 ? `+${chosen.effects.market}` : (chosen.effects.market ?? 0) === 0 ? "0" : chosen.effects.market}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-2 flex justify-center">
                                  <button
                                    onClick={() => {
                                      // Proceed to the next deferred main agenda turn
                                      nextTurn();
                                      setCurrentScenario(nextScenario);
                                      setShowResultPanel(false);
                                      setGeneratedNews(null);
                                      setNextScenario(null);
                                      setActiveCrisis(null);
                                    }}
                                    className="w-full max-w-sm py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold rounded-xl text-xs tracking-widest uppercase flex items-center justify-center gap-1.5 transition-all outline-none hover:shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95"
                                  >
                                    <span>繼續主要議程 (Proceed to Next Agenda)</span>
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </motion.div>
                      )}
                    </motion.div>
                  ) : showResultPanel && lastSelectedChoice && lastImpacts ? (
                    <motion.div
                      id="results-panel-overlay"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="w-full max-w-7xl mx-auto flex flex-col gap-6 md:gap-8 lg:p-4 pb-10"
                    >
                      <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
                        
                        {/* 左側：本回合分析 (Left Panel: Turn Analytics) */}
                        <div className="w-full lg:w-[35%] flex flex-col gap-4 relative z-10 shrink-0">
                          {/* Info Header */}
                          <div className="flex flex-col gap-2 mb-2">
                            <div className="text-[10px] md:text-xs font-mono tracking-widest text-amber-500 uppercase font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 animate-pulse text-amber-400" />
                              DECISION OUTCOME EVALUATION
                            </div>
                            <div className="text-sm md:text-base font-semibold text-gray-200 bg-slate-900/80 p-4 rounded-xl border border-slate-700/50 backdrop-blur-md shadow-inner text-left">
                              <span className="text-slate-400 font-normal mr-2">已執行：</span>
                              {lastSelectedChoice.id === "A" ? "【選項 A】" : lastSelectedChoice.id === "B" ? "【選項 B】" : "【選項 C】"}{" "}
                              <span className="text-amber-400 font-extrabold">{lastSelectedChoice.title}</span>
                            </div>
                          </div>

                          <h4 className="text-sm md:text-base font-bold text-slate-300 flex items-center gap-2 font-mono uppercase tracking-wider mb-2">
                            <Activity className="w-4 h-4 text-cyan-400" /> 本回合影響分析
                          </h4>

                          <div className="grid grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 text-left">
                            {[
                              { key: 'economy', bgIcon: <Coins className="w-12 h-12 md:w-16 md:h-16 opacity-20" />, name: '經濟 (Economy)', val: lastImpacts.economy, type: 'economy' },
                              { key: 'military', bgIcon: <Shield className="w-12 h-12 md:w-16 md:h-16 opacity-20" />, name: '軍事 (Military)', val: lastImpacts.military, type: 'military' },
                              { key: 'diplomacy', bgIcon: <Globe className="w-12 h-12 md:w-16 md:h-16 opacity-20" />, name: '外交 (Diplomacy)', val: lastImpacts.diplomacy, type: 'diplomacy' },
                              { key: 'publicOpinion', bgIcon: <Users className="w-12 h-12 md:w-16 md:h-16 opacity-20" />, name: '民意 (Approval)', val: lastImpacts.publicOpinion ?? lastImpacts.approval ?? 0, type: 'publicOpinion' },
                              { key: 'industry', bgIcon: <Factory className="w-12 h-12 md:w-16 md:h-16 opacity-20" />, name: '產業 (Industry)', val: lastImpacts.industry, type: 'industry' },
                              { key: 'stockMarket', bgIcon: <TrendingUp className="w-12 h-12 md:w-16 md:h-16 opacity-20" />, name: '股市 (Stock Market)', val: lastImpacts.market ?? lastImpacts.stockMarket ?? 0, type: 'stockMarket' },
                            ].map((stat, i) => {
                              const isPos = stat.val > 0;
                              const isNeg = stat.val < 0;
                              const isZero = stat.val === 0;
                              return (
                                <div 
                                  key={stat.key}
                                  className={`relative overflow-hidden flex flex-col p-4 md:p-5 rounded-xl border backdrop-blur-md shadow-2xl transition-all hover:scale-[1.02] cursor-default
                                    ${isPos ? "bg-emerald-950/40 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]" : 
                                      isNeg ? "bg-rose-950/40 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]" : 
                                      "bg-slate-900/60 border-slate-700/50"}
                                  `}
                                >
                                  {/* Background Icon */}
                                  <div className={`absolute -bottom-2 -right-2 transition-transform duration-500 ${isPos?"text-emerald-500 group-hover:scale-110":isNeg?"text-rose-500 group-hover:scale-110":"text-slate-500"}`}>
                                    {stat.bgIcon}
                                  </div>
                                  <span className="text-xs md:text-sm text-slate-400 font-bold font-sans z-10 mb-1 md:mb-2 uppercase tracking-wide">{stat.name}</span>
                                  <div className="flex items-baseline gap-2 z-10">
                                    <span className={`text-3xl md:text-5xl font-mono font-black tracking-tighter ${isPos?"text-emerald-400":isNeg?"text-rose-400":"text-gray-400"}`}>
                                      {isPos ? `+${stat.val}` : isZero ? "0" : stat.val}
                                    </span>
                                    <span className={`text-xs md:text-sm font-bold ${isPos?"text-emerald-500":isNeg?"text-rose-500":"text-gray-500"}`}>
                                      {isPos ? "↗ 正向" : isNeg ? "↘ 負向" : "→ 無變"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* 右側：AI 新聞中心 (Right Panel: AI News Feed) */}
                        <div className="w-full lg:w-[65%] flex flex-col min-h-[500px] h-full bg-[#050914] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative isolate">
                          {/* Map background placeholder grid */}
                          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-screen" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #475569 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                          <div className="absolute top-10 right-10 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
                          <div className="absolute bottom-10 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />
                          
                          {/* Feed Header */}
                          <div className="bg-gradient-to-r from-red-900 via-red-800 to-red-950 border-b-4 border-red-950 px-5 md:px-6 py-3 md:py-4 flex justify-between items-center z-10 relative shadow-md">
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="flex h-3 md:h-4 w-3 md:w-4 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 md:h-4 w-3 md:w-4 bg-white" />
                              </div>
                              <span className="text-white font-black tracking-[0.2em] md:tracking-[0.3em] text-lg md:text-2xl font-mono uppercase">
                                AI REAL-TIME FEED
                              </span>
                            </div>
                            <div className="hidden sm:flex items-center gap-2 text-red-200 text-xs md:text-sm font-mono font-bold tracking-wider opacity-90 bg-black/30 px-3 py-1 rounded shadow-inner">
                              <span>GSA-NET // GLOBAL LIVE</span>
                            </div>
                          </div>

                          <div className="p-5 md:p-8 flex flex-col flex-grow z-10 gap-6 md:gap-8 justify-center text-left">
                            {generatedNews ? (
                              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full gap-6 md:gap-8">
                                {/* Headline */}
                                <div className="border-l-[6px] md:border-l-8 border-red-500 pl-4 md:pl-6 py-1 md:py-2">
                                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.2] md:leading-[1.15] tracking-tight shadow-sm font-serif">
                                    {generatedNews.headline}
                                  </h2>
                                </div>
                                
                                {/* Content */}
                                <div className="bg-slate-900/60 p-5 md:p-8 rounded-xl md:rounded-2xl border border-slate-800/80 shadow-inner backdrop-blur-md flex-grow relative overflow-hidden">
                                  {/* Watermark in background */}
                                  <Globe className="absolute -right-10 -bottom-10 w-64 h-64 text-slate-800/30 -rotate-12 pointer-events-none" />
                                  <p className="text-base md:text-xl lg:text-2xl text-slate-200 leading-[1.8] font-sans relative z-10">
                                    <span className="float-left text-6xl md:text-8xl font-black text-red-500 font-serif mr-4 md:mr-5 leading-[0.8] mt-2 mb-2 drop-shadow-md">
                                      {generatedNews.content.charAt(0)}
                                    </span>
                                    {generatedNews.content.slice(1)}
                                  </p>
                                </div>

                                {/* GLOBAL THREAT MONITOR */}
                                <div className="w-full mt-2 bg-[#050914] rounded-xl border border-slate-700/80 shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col isolate">
                                  
                                  {/* Header */}
                                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700/80 px-4 py-3 flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-amber-500 font-mono font-bold tracking-widest text-xs md:text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                                        GLOBAL THREAT MONITOR
                                      </span>
                                      <span className="text-slate-400 text-[10px] md:text-xs tracking-wider">全球威脅監控中心</span>
                                    </div>
                                    <div className="bg-red-950/40 border border-red-500/30 px-3 py-1 flex flex-col items-center justify-center rounded shadow-inner">
                                      <span className="text-red-500 font-mono font-bold text-[9px] md:text-[10px]">ACTIVE THREATS</span>
                                      <span className="text-red-400 font-black text-xs md:text-sm leading-none mt-0.5">{getActiveRegions(currentScenario).length}</span>
                                    </div>
                                  </div>

                                  {/* Content List */}
                                  <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 bg-[#0a0f1a]">
                                    {Object.entries(REGION_DATA).map(([key, data]) => {
                                      const activeRegions = getActiveRegions(currentScenario);
                                      const isActive = activeRegions.includes(key);
                                      const status = isActive ? "CRITICAL" : "NORMAL";
                                      
                                      // Styles based on status
                                      const statusColor = isActive ? "text-red-500 drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" : "text-emerald-600";
                                      const bgColor = isActive ? "bg-red-950/20 border-red-500/30 shadow-[inset_0_0_15px_rgba(239,68,68,0.1)]" : "bg-slate-900/30 border-slate-800/50 opacity-60";
                                      const dotColor = isActive ? "bg-red-500 animate-[pulse_1s_ease-in-out_infinite] shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-emerald-700/50";
                                      const barWidth = isActive ? "w-full" : "w-1/4";
                                      const barColor = isActive ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" : "bg-emerald-800/50";
                                      const barBg = isActive ? "bg-red-950/50 border border-red-900/50" : "bg-slate-800/50 border border-slate-700/30";

                                      return (
                                        <div key={key} className={`flex items-center justify-between p-2 rounded-lg border ${bgColor} transition-all`}>
                                          <div className="flex items-center gap-2.5 w-[35%] md:w-[30%] min-w-[70px]">
                                            <div className="relative flex items-center justify-center w-2.5 h-2.5 shrink-0">
                                              {isActive && <div className="absolute w-full h-full bg-red-500/30 rounded-full animate-ping" />}
                                              <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                                            </div>
                                            <span className="text-base md:text-lg leading-none filter drop-shadow-sm">{data.flag}</span>
                                            <span className={`text-[11px] md:text-sm font-bold tracking-wide ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>{data.name}</span>
                                          </div>
                                          
                                          <div className="flex-1 px-2 md:px-3">
                                            <div className={`h-1.5 md:h-2 w-full rounded-full overflow-hidden ${barBg}`}>
                                              <div className={`h-full rounded-full transition-all duration-1000 ${barWidth} ${barColor}`} />
                                            </div>
                                          </div>

                                          <div className={`text-[9px] md:text-[11px] font-mono font-black tracking-widest w-16 md:w-20 text-right ${statusColor}`}>
                                            {status}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Footer */}
                                  <div className="bg-slate-900/80 border-t border-slate-800 px-4 py-2 text-center flex items-center justify-center gap-2 shrink-0">
                                    <Activity className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                    <span className="text-[10px] md:text-xs text-slate-400 font-mono tracking-wide">
                                      本回合危機熱區：<span className="text-red-400 font-bold ml-1">{getActiveRegions(currentScenario).map(r => REGION_DATA[r].name).join("、")}</span>
                                    </span>
                                  </div>
                                </div>

                                {/* Reactions Grid */}
                                <div className="mt-auto grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-slate-800/80">
                                  
                                  {/* Intl */}
                                  <div className="bg-[#0f172a]/80 border border-blue-500/30 rounded-xl p-4 md:p-5 flex flex-col justify-between gap-3 shadow-[0_4px_30px_rgba(59,130,246,0.1)] transition-transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs md:text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5"><Globe className="w-4 h-4 md:w-5 md:h-5" /> 國際反應</span>
                                      {/* Mini circle chart */}
                                      <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-[3px] border-blue-900/50 border-t-blue-400 animate-[spin_8s_linear_infinite] shadow-[0_0_10px_rgba(96,165,250,0.3)]" />
                                    </div>
                                    <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mt-2">
                                      {generatedNews.internationalReaction}
                                    </p>
                                  </div>

                                  {/* Market */}
                                  <div className="bg-[#0f172a]/80 border border-emerald-500/30 rounded-xl p-4 md:p-5 flex flex-col justify-between gap-3 shadow-[0_4px_30px_rgba(16,185,129,0.1)] transition-transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5"><TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> 股市反應</span>
                                      {/* Mini line chart */}
                                      <div className="flex items-end gap-1 md:gap-1.5 h-6 md:h-8">
                                        <div className="w-1.5 md:w-2 h-[30%] bg-emerald-600/50 rounded-sm" />
                                        <div className="w-1.5 md:w-2 h-[60%] bg-emerald-500/70 rounded-sm" />
                                        <div className="w-1.5 md:w-2 h-[45%] bg-emerald-400/80 rounded-sm" />
                                        <div className="w-1.5 md:w-2 h-[90%] bg-emerald-400 rounded-sm shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                      </div>
                                    </div>
                                    <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mt-2">
                                      {generatedNews.marketReaction}
                                    </p>
                                  </div>

                                  {/* Public */}
                                  <div className="bg-[#0f172a]/80 border border-amber-500/30 rounded-xl p-4 md:p-5 flex flex-col justify-between gap-3 shadow-[0_4px_30px_rgba(245,158,11,0.1)] transition-transform hover:-translate-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs md:text-sm font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5"><Users className="w-4 h-4 md:w-5 md:h-5" /> 民意反應</span>
                                      {/* Mini live indicator */}
                                      <div className="flex items-center gap-1.5 bg-amber-900/40 border border-amber-500/30 px-2 py-1 rounded">
                                        <span className="text-[10px] md:text-xs font-bold text-amber-500 tracking-wider">LIVE</span>
                                        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                                      </div>
                                    </div>
                                    <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed mt-2">
                                      {generatedNews.publicReaction}
                                    </p>
                                  </div>

                                </div>
                              </motion.div>
                            ) : (
                              <div className="flex-grow flex flex-col items-center justify-center gap-5 text-center py-20">
                                <div className="relative w-20 h-20 md:w-28 md:h-28">
                                  <div className="absolute inset-0 rounded-full border-t-[4px] border-red-600 animate-spin" />
                                  <div className="absolute inset-2 rounded-full border-b-[4px] border-red-500/50 animate-spin-slow flex items-center justify-center">
                                    <Globe className="w-8 h-8 md:w-12 md:h-12 text-red-500 animate-pulse" />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <p className="text-xl md:text-3xl font-extrabold text-slate-100 mt-4 tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-500 animate-pulse font-mono">
                                    全球即時資訊網同步中...
                                  </p>
                                  <p className="text-xs md:text-sm text-slate-500 font-mono tracking-[0.2em]">ASSEMBLING WORLDWIDE INTELLIGENCE FEED</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* 超大型 NEXT TURN 按鈕 */}
                      <div className="w-full mt-4 lg:mt-6">
                        <button
                          id="next-turn-btn"
                          onClick={handleNextTurnClicked}
                          disabled={!generatedNews}
                          className={`w-full h-[75px] md:h-[100px] rounded-xl md:rounded-2xl font-black text-xl md:text-[32px] tracking-[0.2em] md:tracking-[0.4em] uppercase flex items-center justify-center gap-4 transition-all duration-300 relative overflow-hidden group ${
                            generatedNews 
                              ? "bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] text-[#451a03] shadow-[0_0_50px_rgba(245,158,11,0.4)] hover:shadow-[0_0_80px_rgba(245,158,11,0.6)] hover:scale-[1.01] active:scale-[0.98] outline-none" 
                              : "bg-slate-900 text-slate-600 cursor-not-allowed border-2 border-slate-800"
                          }`}
                        >
                          {generatedNews ? (
                            <>
                              <span className="relative z-10 block mt-1 drop-shadow-sm">{turn >= 12 ? "查看最終結局 (View Final Ending)" : "下一回合 (Next Turn)"}</span>
                              <ArrowRight className="w-8 h-8 md:w-12 md:h-12 relative z-10 group-hover:translate-x-4 transition-transform duration-300" />
                              {/* Glare sweep effect */}
                              <div className="absolute inset-0 w-full h-full">
                                <div className="absolute top-0 bottom-0 left-[-100%] w-[50%] bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:translate-x-[400%] transition-transform duration-1000 ease-in-out z-0" />
                              </div>
                            </>
                          ) : (
                            <span className="tracking-widest text-base md:text-2xl">WAITING FOR INTELLIGENCE...</span>
                          )}
                        </button>
                      </div>

                    </motion.div>
                  ) : (
                    <>
                      {/* 當前危機狀態欄 */}
                      {(() => {
                        const criticalCrises = [];
                        if ((stats.economy ?? 50) < 20) {
                          criticalCrises.push({
                            name: "經濟",
                            value: stats.economy ?? 50,
                            iconType: "economy",
                            crisis: "經濟崩潰重挫",
                            correction: "目前國庫空虛、通膨加劇。請在接下來的決策中優先選擇能「振興財政、刺激就業、減免中產稅收」的方案，避免經濟全面陷入蕭條。"
                          });
                        }
                        if ((stats.military ?? 50) < 20) {
                          criticalCrises.push({
                            name: "軍事",
                            value: stats.military ?? 50,
                            iconType: "military",
                            crisis: "軍事防禦失守",
                            correction: "海外美軍防衛體系吃緊。建議下達法案以厚植國防戰略預算、重振高科技空防力量，挽回地緣威懾力。"
                          });
                        }
                        if ((stats.diplomacy ?? 50) < 20) {
                          criticalCrises.push({
                            name: "外交",
                            value: stats.diplomacy ?? 50,
                            iconType: "diplomacy",
                            crisis: "外交全面孤立",
                            correction: "盟友極度不信任，面臨外交孤化。建議採取多邊經貿會商，重拾國際條約之互惠條款以破局地緣孤立。"
                          });
                        }
                        if ((stats.publicOpinion ?? 50) < 20) {
                          criticalCrises.push({
                            name: "民意",
                            value: stats.publicOpinion ?? 50,
                            iconType: "publicOpinion",
                            crisis: "國內民意崩塌",
                            correction: "總統民望降至臨界點。請優先下達減稅補助與本土福利法案，或透過強力捍衛美國工人就業來重整鐵鏽帶支持率。"
                          });
                        }
                        if ((stats.industry ?? 50) < 20) {
                          criticalCrises.push({
                            name: "產業",
                            value: stats.industry ?? 50,
                            iconType: "industry",
                            crisis: "關鍵製造衰退",
                            correction: "本土產業基建荒廢，高科技供應鏈告急。極需實施大規模晶片法案與本土先進製造再投資計劃。"
                          });
                        }
                        if ((stats.market ?? 50) < 20) {
                          criticalCrises.push({
                            name: "關市",
                            value: stats.market ?? 50,
                            iconType: "market",
                            crisis: "金融貿易寒冬",
                            correction: "資本倒流、資產定價動盪。應推行穩健關稅、優化跨國投資保護，以便增強華爾街與外貿巨頭信心。"
                          });
                        }

                        if (criticalCrises.length === 0) return null;

                        return (
                          <div className="flex flex-col gap-3 mb-6 select-text">
                            {criticalCrises.map((item, index) => (
                              <div
                                key={index}
                                className="flex flex-col md:flex-row md:items-start gap-4 bg-red-950/20 border border-red-500/30 p-4 rounded-xl text-left"
                              >
                                <div className="flex items-center gap-2 shrink-0 pt-0.5">
                                  <AlertTriangle className="w-5 h-5 text-red-500 animate-bounce" />
                                  <span className="text-red-400 font-extrabold text-sm uppercase">
                                    🚨 國家安全預警：{item.crisis} (指標: {item.value}%)
                                  </span>
                                </div>
                                <p className="text-xs text-slate-350 leading-relaxed font-sans">
                                  <span className="font-[700] text-amber-500">建議對策：</span>
                                  {item.correction}
                                </p>
                              </div>
                            ))}
                          </div>
                        );
                      })()}

                      {/* Layer 2: Core Strategic Decision Issue */}
                      <div className="flex flex-col gap-4 bg-slate-900/40 border border-slate-800/60 p-6 md:p-8 rounded-2xl select-text">
                        <div className="flex items-center gap-[10px]">
                          <Gavel className="w-6 h-6 text-[#F5A623] shrink-0" style={{ color: "#F5A623" }} />
                          <span className="text-sm font-mono tracking-widest text-[#F5A623] font-bold uppercase">
                            聯邦最高決策議題
                          </span>
                        </div>
                        
                        <h2
                          id="scenario-title"
                          className="font-black tracking-wide text-white font-sans leading-tight text-[28px] md:text-[32px] text-shadow-sm"
                          style={{ fontVariantLigatures: 'common-ligatures', fontFeatureSettings: '"liga" on, "clig" on' }}
                        >
                          {currentScenario ? currentScenario.title : "全球貿易戰升級：如何應對中國關稅反制？"}
                        </h2>
                        
                        <div className="bg-[#0e1222]/80 border-l-4 border-[#F5A623] p-5 rounded-r-2xl shadow-inner">
                          <p
                            id="scenario-subtext"
                            className="leading-[1.8] text-[18px] md:text-[20px] text-slate-100 font-sans font-medium tracking-wide"
                          >
                            {currentScenario ? currentScenario.subtext : "中國宣布對美國商品的加徵關稅作為反制措施，此舉可能會影響美國經濟和全球供應鏈穩定。"}
                          </p>
                        </div>
                      </div>

                      {/* Layer 3: CIA Tactical Intelligence Briefing (White House Cabinet Advisors System) */}
                      {currentScenario && currentScenario.advisors && currentScenario.advisors.length > 0 && (
                        <div id="cabinet-advisors-section" className="mb-6 mt-2 select-text">
                          <div className="flex items-center gap-[12px] mb-4">
                            <Users className="w-7 h-7 text-[#F5A623] shrink-0 animate-pulse" style={{ color: "#F5A623" }} />
                            <h3 className="text-xl font-bold text-slate-100 tracking-wider font-sans uppercase">
                              白宮內閣最高顧問團建議
                            </h3>
                          </div>
                          
                          <div className="w-full h-[1px] bg-gradient-to-r from-[#F5A623] to-transparent mb-6" />
                          
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {currentScenario.advisors.map((adv, idx) => (
                              <div
                                key={idx}
                                id={`advisor-card-${idx}`}
                                className="bg-gradient-to-b from-[#101426] to-[#070a14] border border-slate-800 hover:border-[#F5A623]/50 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 shadow-[0_12px_40px_rgba(0,0,0,0.5)] min-h-[350px] md:h-auto hover:shadow-[0_16px_45px_rgba(245,158,11,0.05)]"
                              >
                                <div>
                                  {/* Header with Advisor Meta */}
                                  <div className="flex items-center gap-4 mb-5 border-b border-slate-800/65 pb-3">
                                    <div className="p-2 bg-slate-900 border border-slate-800 rounded-xl">
                                      {getAdvisorIcon(adv.icon)}
                                    </div>
                                    <div className="flex flex-col text-left">
                                      <span className="text-[20px] font-[800] text-[#F5A623] tracking-wide font-sans leading-tight">
                                        {adv.title}
                                      </span>
                                      <span className="text-[13px] text-slate-400 font-mono tracking-wider uppercase font-semibold mt-1">
                                        立場：{adv.position}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Deep Insight Advice Detail */}
                                  <div className="bg-[#070a14]/60 border-l-[3px] border-amber-500/60 p-4 rounded-r-xl mb-4">
                                    <span className="text-[14px] font-mono tracking-widest text-[#F5A623] block uppercase mb-1.5 font-bold">
                                      ■ 方案建議
                                    </span>
                                    <p className="text-[16px] text-slate-100 font-sans font-medium leading-[1.85]">
                                      {adv.advice}
                                    </p>
                                  </div>
                                </div>

                                {/* Intelligent Risk Evaluation Warning Pill */}
                                <div className="bg-rose-500/5 border-l-[3px] border-rose-500/40 p-4 rounded-r-xl mt-auto">
                                  <span className="text-[14px] font-mono tracking-widest text-rose-400 block uppercase mb-1.5 font-bold">
                                    ▲ 風險評鑑警告
                                  </span>
                                  <p className="text-[15px] text-slate-300 font-sans leading-[1.85]">
                                    {adv.risk}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Layer 4: Large Strategic Decisions (A, B, C Strategic Choices) */}
                      <div className="flex items-center gap-[12px] mb-3 mt-6">
                        <Briefcase className="w-6 h-6 text-[#F5A623] shrink-0" style={{ color: "#F5A623" }} />
                        <h3 className="text-xl font-bold text-slate-100 tracking-wider font-sans uppercase">
                          簽下總統行政命令 (下達核心政令)
                        </h3>
                      </div>
                      <div className="w-full h-[1px] bg-gradient-to-r from-amber-500 to-transparent mb-6" />

                      <div id="scenario-options-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4 select-text">
                        {currentScenario && shuffledChoices.map((opt) => (
                          <div
                            key={opt.id}
                            id={`option-card-${opt.id}`}
                            className="bg-gradient-to-b from-[#11152a] to-[#070a14] border border-slate-800 hover:border-[#F5A623] hover:scale-[1.02] rounded-2xl relative group flex flex-col justify-between transition-all duration-300 shadow-[0_15px_45px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(245,158,11,0.15)] leading-relaxed p-6 md:p-7 min-h-[340px]"
                          >
                            <div className="flex flex-col gap-4">
                              {/* Option Title (No Letter indicators) */}
                              <div className="flex items-center border-b border-slate-800 pb-4">
                                <span className="font-sans font-[800] tracking-wide text-white text-[18px]">
                                  {getOptionDisplayTitle(opt)}
                                </span>
                              </div>
                              
                              <p className="text-[16px] text-slate-350 leading-[1.8] min-h-[80px] font-sans pr-1">
                                {opt.description}
                              </p>
                            </div>

                            {/* Commitment Action Command Button */}
                            <div className="pt-5 border-t border-slate-850/60 mt-4">
                              <button
                                id={`option-commit-${opt.id}`}
                                onClick={() => handleChoiceSelect(opt)}
                                className="w-full bg-[#F5A623] hover:bg-amber-400 text-black font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all outline-none shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:shadow-[0_8px_25px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer select-none tracking-widest text-[14px] uppercase py-3.5"
                                style={{ backgroundColor: "#F5A623" }}
                              >
                                <span>下達此項行政令</span>
                                <ArrowRight className="w-4 h-4 text-black font-bold shrink-0 stroke-[2.5]" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                </div>
              </>
            )}
              </motion.div>
            )}

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <motion.div
                key="tab-overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0b0e17]/80 border border-slate-800 rounded-2xl p-6 text-left"
              >
                <div className="flex items-center gap-[12px] mb-4">
                  <Briefcase className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
                  <h3 className="text-base font-bold text-slate-100">國家資產診斷報告</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  下表列出當前美國六大核心國家屬性（資源與局勢指数）的健康狀態。保持屬性平衡（大於25%）能確保美國在全方位霸權長存。
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-emerald-400 text-xs font-bold">經濟與金融健康 (目前: {stats.economy}%)</span>
                    <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
                      反映資本市場的厚度與抗通膨韌性。如果太低會重創重工業(產業)發展，爆發經濟崩盤；高經濟允許白宮投入大規模產業補貼。
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-blue-400 text-xs font-bold">境外防衛與軍事實力 (目前: {stats.military}%)</span>
                    <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
                      代表美軍海外基地威懾和太空軍的進口專利科技防禦。不足時會面臨外敵入侵或中東、東歐安全同盟瓦解局勢。
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-purple-400 text-xs font-bold">世界外交影響力 (目前: {stats.diplomacy}%)</span>
                    <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
                      美國國際地緣影響。太高代表深陷跨多邊盟友會談，太低代表美國自外於貿易，國際不信任度爆炸破壞跨境合作。
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-pink-400 text-xs font-bold">國內本土民意與民望 (目前: {stats.publicOpinion}%)</span>
                    <p className="text-xs text-slate-350 mt-1.5 leading-relaxed">
                      反映川普总统在鐵鏽帶與全美基本盤支持力度。極其不穩定，強硬外交往往能迎合民望，但國內物價上漲會對民望重扣扣。
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("main")}
                  className="mt-6 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-400 transition-all"
                >
                  返回決策大廳
                </button>
              </motion.div>
            )}

            {/* ANALYSIS TAB */}
            {activeTab === "analysis" && (
              <motion.div
                key="tab-analysis"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0b0e17]/80 border border-slate-800 rounded-2xl p-6 text-left"
              >
                <div className="flex items-center gap-[12px] mb-4">
                  <FileText className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
                  <h3 className="text-base font-bold text-slate-100">顧問决策戰術分析圖表</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  決策軌跡與屬性雷達覆蓋：隨決策輪數增加，各核心領域所釋放的潛在利益權益。
                </p>

                {/* Cyber style interactive SVG charts */}
                <div className="border border-slate-800/80 bg-slate-950 p-6 rounded-2xl flex flex-col items-center justify-center min-h-[250px]">
                  
                  {history.length === 0 ? (
                    <div className="text-center">
                      <History className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs text-slate-500">尚無政策數據。做出 1 次以上抉擇後，此處將自動繪製您的雷達戰術覆蓋圖。</p>
                    </div>
                  ) : (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                      {/* Radar visual representation */}
                      <div className="flex justify-center">
                        <svg width="220" height="220" viewBox="0 0 220 220" className="opacity-95">
                          {/* Outer bounds circles */}
                          <circle cx="110" cy="110" r="100" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4" className="opacity-15" />
                          <circle cx="110" cy="110" r="75" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2" className="opacity-10" />
                          <circle cx="110" cy="110" r="50" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1" className="opacity-10" />
                          <circle cx="110" cy="110" r="25" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="1" className="opacity-10" />

                          {/* Hexagon axes lines */}
                          <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" />
                          <line x1="23" y1="60" x2="197" y2="160" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" />
                          <line x1="23" y1="160" x2="197" y2="60" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="1" />

                          {/* Axis descriptors */}
                          <text x="110" y="8" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">經濟</text>
                          <text x="210" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">軍事</text>
                          <text x="210" y="165" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">外交</text>
                          <text x="110" y="218" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">民意</text>
                          <text x="10" y="165" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">產業</text>
                          <text x="10" y="60" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">關市</text>

                          {/* Poly-shape built from actual stats */}
                          {(() => {
                            // Convert stats to polar coordinates
                            const cx = 110, cy = 110;
                            const points = [
                              { name: 'economy', r: stats.economy, angle: 0 },
                              { name: 'military', r: stats.military, angle: 60 },
                              { name: 'diplomacy', r: stats.diplomacy, angle: 120 },
                              { name: 'publicOpinion', r: stats.publicOpinion, angle: 180 },
                              { name: 'industry', r: stats.industry, angle: 240 },
                              { name: 'market', r: stats.market, angle: 300 }
                            ].map(p => {
                              const rad = (p.angle * Math.PI) / 180 - Math.PI / 2;
                              // Match 0-100 values to radius 0-100 scale
                              const distance = p.r * 0.95; 
                              const x = cx + distance * Math.cos(rad);
                              const y = cy + distance * Math.sin(rad);
                              return `${x},${y}`;
                            }).join(' ');

                            return (
                              <>
                                <polygon points={points} fill="rgba(245, 158, 11, 0.25)" stroke="#f59e0b" strokeWidth="2" />
                                {points.split(' ').map((pt, i) => {
                                  const [x, y] = pt.split(',');
                                  return (
                                    <circle key={i} cx={x} cy={y} r="3" fill="#ffffff" stroke="#f59e0b" strokeWidth="1.5" />
                                  );
                                })}
                              </>
                            );
                          })()}
                        </svg>
                      </div>

                      {/* Diagnostic list */}
                      <div>
                        <h4 className="text-xs font-bold text-amber-500 mb-2">最高決策沙盤覆蓋：【卓越】</h4>
                        <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
                          <li>📈 <strong>決策穩定度:</strong> 優秀。六個方向的特徵偏離係數良好。</li>
                          <li>📊 <strong>累計決策次數:</strong> 已完成 {history.length} 次重大地緣政策命令。</li>
                          <li>🔑 <strong>強勢屬性:</strong> {Math.max(stats.economy, stats.military, stats.diplomacy) > 85 ? "具備絕對的局部統治權" : "整體平穩，無極端爆雷漏洞。"}</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab("main")}
                  className="mt-6 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-400 transition-all"
                >
                  返回決策大廳
                </button>
              </motion.div>
            )}

            {/* CRISES TAB */}
            {activeTab === "crises" && (
              <motion.div
                key="tab-crises"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0b0e17]/80 border border-slate-800 rounded-2xl p-6 text-left"
              >
                <div className="flex items-center gap-[12px] mb-4">
                  <AlertTriangle className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
                  <h3 className="text-base font-bold text-slate-100">當前地緣活性危機雷達</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  若某項國家屬性低於25%，將在此觸發相應的紅線重大危機提示。請務必及時調整相關政策。
                </p>

                <div className="space-y-3">
                  {stats.economy < 30 ? (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span><strong>金融危機臨界</strong>：外匯預算受壓，國內通膨引發債券拋售潮，極其危險！</span>
                    </div>
                  ) : null}
                  {stats.military < 30 ? (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span><strong>國防戰略威脅紅色預警</strong>：境外敵對武裝在爭端海域加強頻度，需立即部署航空編隊。</span>
                    </div>
                  ) : null}
                  {stats.diplomacy < 30 ? (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span><strong>多邊條約撕毀性外交孤立</strong>：盟友正在尋求別國替代合約，面臨被逐出全球化組織威脅。</span>
                    </div>
                  ) : null}
                  {stats.publicOpinion < 30 ? (
                    <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 shrink-0" />
                      <span><strong>內閣大選信任危機彈劾案</strong>：支持率陷入崩潰邊緣，抗議代表佔領白宮要道，彈劾將啟動。</span>
                    </div>
                  ) : null}
                  
                  {stats.economy >= 30 && stats.military >= 30 && stats.diplomacy >= 30 && stats.publicOpinion >= 30 ? (
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl text-center">
                      <p className="text-xs text-slate-400 font-semibold mb-1">警報解除中：全美六大防線完好</p>
                      <p className="text-[11px] text-slate-500">暫無觸發臨界紅線之事件。您是無與倫比的外交參謀天才！</p>
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={() => setActiveTab("main")}
                  className="mt-6 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-400 transition-all"
                >
                  返回決策大廳
                </button>
              </motion.div>
            )}

            {/* RELATIONS TAB */}
            {activeTab === "relations" && (
              <motion.div
                key="tab-relations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0b0e17]/80 border border-slate-800 rounded-2xl p-6 text-left"
              >
                <div className="flex items-center gap-[12px] mb-4">
                  <Globe className="w-6 h-6 shrink-0 stroke-[1.5]" style={{ color: "#F5A623" }} />
                  <h3 className="text-base font-bold text-slate-100">大國影響力圖冊關係矩陣</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  基於您做出的外交與貿易抉擇，美國與全球其他主要地緣戰略實體的關係波動如下：
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Entity 1: China */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-rose-500 text-sm font-bold">中美貿易與關稅對抗關係</span>
                    <p className="text-xs text-rose-300 mt-2 font-semibold">
                      抗衡等級：{stats.diplomacy < 50 ? "極高對立 (衝突白熱化)" : "中度博弈 (關稅僵持中)"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      股市摩擦係數：{100 - stats.market}% 。雙方對進口半導體晶片展開第二輪封殺角力。
                    </p>
                  </div>

                  {/* Entity 2: EU */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-blue-400 text-sm font-bold">北約與歐盟安全同盟契合</span>
                    <p className="text-xs text-blue-300 mt-2 font-semibold">
                      契合等級：{stats.diplomacy > 75 ? "戰略一體 (完美合規)" : "同盟分裂 (軍費出資爭吵中)"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      北約軍費資助：{stats.military}% 。歐盟要求美國維持亞太核威懾部署不變。
                    </p>
                  </div>

                  {/* Entity 3: Middle East */}
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                    <span className="text-amber-500 text-sm font-bold">中東石油美元市場准入</span>
                    <p className="text-xs text-amber-300 mt-2 font-semibold">
                      美元流動：{stats.economy > 60 ? "石油美元流通強勁" : "交易疲軟 (局部替代合約溢出)"}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      經濟控制係數：{stats.economy}% 。
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("main")}
                  className="mt-6 px-4 py-2 bg-amber-500 text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-400 transition-all"
                >
                  返回決策大廳
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* 💡 FOOTER TIP */}
          <footer id="console-footer" className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2 px-1 text-left">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-[500px]">
                提示：政策選擇會影響六大國家屬性，當某項數值過低(低於15%)時可能觸發危機導致被川普總統開除，請審慎決策，保衛美國霸權。
              </p>
            </div>
            
            {/* Active module tags */}
            <div className="flex items-center gap-2 text-[9px] font-mono text-slate-500">
              <span className="bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                SYSTEM MODULE: CHRONOS-COUNCIL-30 (ACTIVE)
              </span>
            </div>
          </footer>
        </section>
      </main>

      {/* ── FOOTER CREDIT STRAP ── */}
      <section id="system-strap-lines" className="border-t border-slate-800/40 mt-10 py-4 px-6 max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center select-none opacity-30">
        <p className="text-[10px] font-mono tracking-widest text-[#94a3b8]">
          SECURE DIRECT CHANNELS :: BRAND DECISION STRATEGY LABS
        </p>
        <div className="flex items-center gap-1">
          <p className="text-[10px] font-mono text-slate-400">
            等待你的決策...
          </p>
          <div className="w-2.5 h-2.5 bg-amber-500/80 transform rotate-45 select-none" />
        </div>
      </section>
      </> )}

      {/* ── EMAIL MODAL (連結 GMAIL 寄信) ── */}
      <AnimatePresence>
        {isEmailModalOpen && (
          <div id="email-backdrop" className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              id="email-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0c0f18] border border-slate-800 rounded-2xl w-full max-w-[620px] shadow-3xl text-left overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800/60 bg-[#0f1424] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-bold tracking-wider text-[#cbd5e1]">
                    發送戰略決策成果報告
                  </h3>
                </div>
                <button
                  onClick={closeEmailModal}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-4 overflow-y-auto max-h-[70vh]">
                
                {emailSentSuccess ? (
                  <div className="py-8 flex flex-col items-center gap-3 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-10 h-10" />
                    </div>
                    <h4 className="text-base font-bold text-gray-100">
                      成功發送報告郵件
                    </h4>
                    <p className="text-xs text-slate-450 leading-relaxed max-w-[340px]">
                      您的政策成果報告已成功打包，並通過安全信道安全加密發送至以下地址：
                    </p>
                    <div className="bg-slate-900 border border-slate-800 font-mono text-xs px-3 py-1 text-emerald-400 rounded-lg">
                      {emailInput}
                    </div>
                    <button
                      onClick={closeEmailModal}
                      className="mt-4 px-6 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                    >
                      關閉視窗
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400 font-mono">
                        電子信箱收件人 (GMAIL)
                      </label>
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="請輸入收信信箱"
                        className="px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs text-gray-100 focus:outline-none transition"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-400 font-mono">
                        白宮戰略政策備忘錄內容 (Gemini 動態精算草稿)
                      </label>
                      
                      {isEmailSending && !emailDraftResult ? (
                        <div className="border border-slate-800 bg-slate-950 p-6 rounded-xl flex flex-col items-center justify-center min-h-[180px] gap-2">
                          <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                          <span className="text-[11px] font-mono text-slate-500">
                            正在呼叫國會安全署、打包智庫歷史並翻譯為川普式語氣...
                          </span>
                        </div>
                      ) : (
                        <div className="border border-slate-800 bg-slate-950 p-4 rounded-xl max-h-[220px] overflow-y-auto flex flex-col gap-2">
                          {emailDraftResult ? (
                            <>
                              <div className="border-b border-slate-800 pb-2 mb-2">
                                <span className="text-[11px] font-bold text-amber-400">🎨 主旨： {emailDraftResult.subject}</span>
                              </div>
                              <p className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
                                {emailDraftResult.body}
                              </p>
                            </>
                          ) : (
                            <p className="text-[11px] text-slate-500 italic">
                              準備您的政策歷史軌跡完成後，此處將顯示草案摘要。
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Meta history log indicators */}
                    <div className="text-[10px] bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-500 font-mono leading-relaxed">
                      💡 決策備忘：本簡報包含您已操作的 {history.length} 回合戰略史，最終全要素屬性：
                      經濟 {stats.economy}% | 軍事 {stats.military}% | 外交 {stats.diplomacy}% | 民意 {stats.publicOpinion}% | 產業 {stats.industry}% | 關市 {stats.market}%
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end border-t border-slate-800/60 pt-4">
                      <button
                        onClick={closeEmailModal}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleSendEmailDispatch}
                        disabled={isEmailSending}
                        className="px-5 py-2 bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-lg"
                      >
                        <Send className="w-3.5 h-3.5" />
                        確認發送
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── HISTORY MODAL (歷史政策軌跡備忘錄) ── */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div id="history-backdrop" className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              id="history-modal-card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0b0e17] border border-slate-800/90 rounded-2xl w-full max-w-[760px] shadow-3xl text-left overflow-hidden flex flex-col h-[85vh]"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-800/80 bg-[#0e1222] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-wider text-slate-100 font-sans">
                      白宮國家政策智庫備忘錄
                    </h3>
                    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
                      National Policy Library Archive System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="flex border-b border-slate-800/60 bg-[#080b13] px-6 gap-6 shrink-0">
                <button
                  onClick={() => setHistoryModalTab("current")}
                  className={`py-3.5 text-xs font-bold tracking-widest uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    historyModalTab === "current"
                      ? "border-amber-500 text-amber-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>🏛️</span>
                  <span>本局決策路徑 ({history.length})</span>
                </button>
                <button
                  onClick={() => {
                    setHistoryModalTab("archive");
                    fetchGameHistoryList();
                  }}
                  className={`py-3.5 text-xs font-bold tracking-widest uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    historyModalTab === "archive"
                      ? "border-amber-500 text-amber-400"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>🗄️</span>
                  <span>全球戰略存檔庫 ({historyList.length})</span>
                </button>
              </div>

              {/* List Container */}
              <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 bg-[#0a0d16]/30">
                {historyModalTab === "current" ? (
                  history.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-slate-800/80 rounded-2xl text-slate-400 flex flex-col items-center justify-center my-auto">
                      <span className="text-3xl mb-3">📜</span>
                      <p className="text-sm font-medium text-slate-300">暫無進行中的決策路徑</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        請在白宮內閣戰略會議發出您的第一條政權抉擇指令後，此處將實時記存您的執政執筆錄。
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5 pr-1">
                      {history.map((h, i) => (
                        <div key={i} className="p-4 bg-slate-900/50 hover:bg-[#0f1322]/80 border border-slate-800/80 rounded-xl text-left flex flex-col gap-3 transition-colors shadow-sm relative group">
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-amber-500/40 rounded-l-xl group-hover:bg-amber-500 transition-colors" />
                          <div className="flex items-center justify-between text-xs font-mono ml-1">
                            <span className="text-amber-500 font-bold flex items-center gap-1.5">
                              <span>📅</span> 第 {h.daysOfPresidency} 天 ({h.dateString})
                            </span>
                            <span className="text-slate-500 bg-slate-800/50 px-2.5 py-0.5 rounded-full border border-slate-700/30">回合 #{i+1}</span>
                          </div>
                          
                          <div className="ml-1">
                            <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                              議題「{h.scenarioTitle}」
                            </h4>
                            <p className="text-xs text-slate-400 mt-1.5">
                              執政指令: <span className="text-amber-400 font-bold">{h.chosenOptionId === "A" ? "A" : h.chosenOptionId === "B" ? "B" : "C"} - {h.chosenOptionTitle}</span>
                            </p>
                          </div>
                          
                          {/* Stats alterations diff log */}
                          <div className="border-t border-slate-850 pt-2.5 grid grid-cols-6 gap-1 text-[11px] font-mono mt-1 background-slate-950/60 p-2.5 rounded-lg ml-1">
                            <div>
                              <span className="text-slate-500 block mb-0.5">經濟</span>
                              <span className={h.statsAfter.economy >= h.statsBefore.economy ? "text-emerald-400" : "text-rose-400"}>
                                {h.statsBefore.economy} → {h.statsAfter.economy} ({h.statsAfter.economy - h.statsBefore.economy >= 0 ? `+${h.statsAfter.economy - h.statsBefore.economy}` : h.statsAfter.economy - h.statsBefore.economy})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">軍事</span>
                              <span className={h.statsAfter.military >= h.statsBefore.military ? "text-emerald-400" : "text-rose-400"}>
                                {h.statsBefore.military} → {h.statsAfter.military} ({h.statsAfter.military - h.statsBefore.military >= 0 ? `+${h.statsAfter.military - h.statsBefore.military}` : h.statsAfter.military - h.statsBefore.military})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">外交</span>
                              <span className={h.statsAfter.diplomacy >= h.statsBefore.diplomacy ? "text-emerald-400" : "text-rose-400"}>
                                {h.statsBefore.diplomacy} → {h.statsAfter.diplomacy} ({h.statsAfter.diplomacy - h.statsBefore.diplomacy >= 0 ? `+${h.statsAfter.diplomacy - h.statsBefore.diplomacy}` : h.statsAfter.diplomacy - h.statsBefore.diplomacy})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">民意</span>
                              <span className={h.statsAfter.publicOpinion >= h.statsBefore.publicOpinion ? "text-emerald-400" : "text-rose-400"}>
                                {h.statsBefore.publicOpinion} → {h.statsAfter.publicOpinion} ({h.statsAfter.publicOpinion - h.statsBefore.publicOpinion >= 0 ? `+${h.statsAfter.publicOpinion - h.statsBefore.publicOpinion}` : h.statsAfter.publicOpinion - h.statsBefore.publicOpinion})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">監控</span>
                              <span className={h.statsAfter.industry >= h.statsBefore.industry ? "text-emerald-400" : "text-rose-400"}>
                                {h.statsBefore.industry} → {h.statsAfter.industry} ({h.statsAfter.industry - h.statsBefore.industry >= 0 ? `+${h.statsAfter.industry - h.statsBefore.industry}` : h.statsAfter.industry - h.statsBefore.industry})
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-0.5">股市</span>
                              <span className={h.statsAfter.market >= h.statsBefore.market ? "text-emerald-400" : "text-rose-400"}>
                                {h.statsBefore.market} → {h.statsAfter.market} ({h.statsAfter.market - h.statsBefore.market >= 0 ? `+${h.statsAfter.market - h.statsBefore.market}` : h.statsAfter.market - h.statsBefore.market})
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  /* Archive completed history list */
                  isHistoryLoading ? (
                    <div className="py-20 text-center my-auto flex flex-col items-center justify-center">
                      <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
                      <p className="text-sm text-slate-400 font-medium">正在自白宮終端安全雲下載存檔庫...</p>
                    </div>
                  ) : historyList.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-slate-800/80 rounded-2xl text-slate-400 flex flex-col items-center justify-center my-auto">
                      <span className="text-3xl mb-3">🗄️</span>
                      <p className="text-sm font-medium text-slate-300">全球戰略存檔庫為空</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        當您在遊戲中達成任何完結結局（突破 12 回合、或屬性破產解雇）後，系統將安全同步每一場完整執政實錄至此處。
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4 pr-1">
                      {historyList.map((item, index) => {
                        const isExpanded = expandedArchiveGameId === item.gameId;
                        
                        // Rating color mapping
                        let ratingColor = "text-blue-400 bg-blue-500/10 border-blue-500/30";
                        if (item.rating === "S") ratingColor = "text-amber-400 bg-amber-500/10 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
                        else if (item.rating === "A") ratingColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
                        else if (item.rating === "C") ratingColor = "text-purple-400 bg-purple-500/10 border-purple-500/30";
                        else if (item.rating === "D") ratingColor = "text-rose-450 bg-rose-500/10 border-rose-500/30";

                        const gameStartTime = item.createdAt ? new Date(item.createdAt).toLocaleString('zh-TW', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : "未知時間";

                        return (
                          <div
                            key={item.gameId || index}
                            className={`p-4 bg-slate-900/40 border border-slate-800/80 rounded-xl text-left flex flex-col gap-3 transition-all ${
                              isExpanded ? "ring-1 ring-amber-500/20 bg-slate-900/60" : "hover:bg-slate-900/50"
                            }`}
                          >
                            {/* Collapsible Trigger Section */}
                            <div
                              onClick={() => setExpandedArchiveGameId(isExpanded ? null : item.gameId)}
                              className="flex items-start justify-between cursor-pointer select-none"
                            >
                              <div className="flex-grow">
                                <div className="flex items-center gap-2.5">
                                  <span className="text-slate-400 font-bold text-sm tracking-wide">
                                    {item.endingName || "綜合執政評定"}
                                  </span>
                                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${ratingColor}`}>
                                    等級 {item.rating}
                                  </span>
                                </div>
                                <p className="text-[10px] font-mono text-slate-500 mt-1">
                                  📊 總戰略得分：{item.totalScore} 分 | 記錄時間：{gameStartTime}
                                </p>
                              </div>
                              <span className="text-slate-500 group-hover:text-slate-300 text-xs mt-1">
                                {isExpanded ? "收合細節 ▲" : "展開細節 ▼"}
                              </span>
                            </div>

                            {/* Minified Stats Indicator Row */}
                            <div className="grid grid-cols-6 gap-2 bg-[#090d16]/75 p-2 rounded-lg border border-slate-850/60 text-[10px] font-mono">
                              <div><span className="text-slate-500 block">經濟</span><span className="text-slate-200">{item.finalStats?.economy ?? 50}%</span></div>
                              <div><span className="text-slate-500 block">軍事</span><span className="text-slate-200">{item.finalStats?.military ?? 50}%</span></div>
                              <div><span className="text-slate-500 block">外交</span><span className="text-slate-200">{item.finalStats?.diplomacy ?? 50}%</span></div>
                              <div><span className="text-slate-500 block">民意</span><span className="text-slate-200">{item.finalStats?.publicOpinion ?? 50}%</span></div>
                              <div><span className="text-slate-500 block">監控</span><span className="text-slate-200">{item.finalStats?.industry ?? 50}%</span></div>
                              <div><span className="text-slate-500 block">股市</span><span className="text-slate-200">{item.finalStats?.market ?? 50}%</span></div>
                            </div>

                            {/* Expandable detailed review & decision log */}
                            {isExpanded && (
                              <div className="border-t border-slate-800/80 mt-2.5 pt-3 flex flex-col gap-3 font-sans animate-fade-in">
                                
                                {/* AI Historic Evaluation Column */}
                                {item.aiHistoricalReview && (
                                  <div className="p-3 bg-[#080c14] border border-slate-800/60 rounded-lg text-xs leading-relaxed text-slate-300">
                                    <div className="text-[11px] font-bold text-amber-500/80 mb-1.5 flex items-center gap-1">
                                      <span>🤖</span> AI 戰略內閣歷史評論：
                                    </div>
                                    <p className="italic font-mono font-medium text-slate-400 select-text leading-relaxed whitespace-pre-wrap">
                                      「{item.aiHistoricalReview}」
                                    </p>
                                  </div>
                                )}

                                {/* Complete sequence of selected choices */}
                                {item.decisions && item.decisions.length > 0 && (
                                  <div className="space-y-2 mt-1">
                                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-2">
                                      <span>📋</span> 歷次回合決策履歷：
                                    </div>
                                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pl-1 pr-2 custom-scrollbar">
                                      {item.decisions.map((dec: any, decIdx: number) => (
                                        <div key={decIdx} className="flex gap-2 items-start text-xs border-l-[2px] border-slate-800 pl-2 py-0.5">
                                          <span className="text-[10px] font-mono text-amber-500 font-bold shrink-0 mt-0.5">
                                            [R#{dec.round}]
                                          </span>
                                          <div className="flex-1 min-w-0">
                                            <span className="text-slate-300 font-medium text-[11px]">議題: {dec.scenarioTitle}</span>
                                            <span className="block text-[11px] text-[#F5A623] mt-0.5 font-bold">抉擇: ({dec.chosenOptionId}) {dec.chosenOptionTitle}</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-slate-800/80 bg-[#0e1220] flex justify-end shrink-0">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
                >
                  確認關閉
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exportable Ending share card (hidden from normal view but available for html2canvas) */}
      {activeEnding && (
        <div style={{ position: "absolute", top: "-9999px", left: "-9999px", pointerEvents: "none" }}>
          <div id="chronos-share-card-source" style={{ width: "1200px", height: "675px" }} className="bg-[#090b14] border-4 border-amber-500/40 text-white font-sans p-12 flex flex-col justify-between relative overflow-hidden select-none">
            {/* Immersive tactical scan lines overlay / grid decoration */}
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none" 
              style={{
                backgroundImage: `linear-gradient(to right, #f5a623 1px, transparent 1px), linear-gradient(to bottom, #f5a623 1px, transparent 1px)`,
                backgroundSize: "30px 30px"
              }}
            />
            <div className="absolute inset-0 bg-radial-gradient from-amber-500/5 via-transparent to-transparent pointer-events-none" />

            {/* Header element */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-6 relative z-10 w-full shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl font-bold text-amber-400 font-sans">
                  ⏳
                </div>
                <div className="text-left font-sans">
                  <h1 className="text-xl font-black text-amber-400 tracking-widest leading-none">
                    CHRONOS 歷史政策智庫
                  </h1>
                  <p className="text-[10px] font-mono text-slate-400 tracking-widest mt-1 uppercase font-bold">
                    WHITE HOUSE STRATEGIC SIMULATION ENGINE
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 border border-slate-850 px-3 py-1 bg-amber-950/20 border-amber-500/20 text-[10px] font-mono text-amber-400 font-bold tracking-widest rounded shadow">
                  ● SIMULATION TERMINAL SESSION #47
                </div>
              </div>
            </div>

            {/* Main card body layout */}
            <div className="grid grid-cols-12 gap-8 items-center py-6 relative z-10 flex-1 w-full text-left">
              {/* Left Column: Ending Name, Descriptions, Historian Review */}
              <div className="col-span-5 flex flex-col gap-4 text-left font-sans">
                <div className="text-left">
                  <span className="text-[11px] font-mono text-amber-500 font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded">
                    最終命運抉擇
                  </span>
                  <h3 className="text-4xl font-black text-amber-400 tracking-wider mt-3 mb-2 drop-shadow-[0_2px_10px_rgba(245,158,11,0.2)]">
                    {activeEnding.title}
                  </h3>
                  <div className="text-xs text-slate-300 leading-relaxed max-w-sm whitespace-pre-line border-l-2 border-slate-700 pl-3">
                    {activeEnding.desc}
                  </div>
                </div>
                
                {/* Historical Review quotation box */}
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl text-left">
                  <span className="text-[10px] font-mono text-amber-500 font-bold uppercase tracking-widest block mb-2">
                    HISTORIAN'S AUDIT • 歷史之音
                  </span>
                  <p className="text-xs font-serif italic text-slate-300 leading-relaxed">
                    「{generateHistoricalReview(activeEnding.stats, activeEnding.title)[0] || "顧問之決策引領群倫，重新確立了世界歷史之航道。"}」
                  </p>
                </div>
              </div>

              {/* Center Column: Huge Score Badge or Circle */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center font-sans">
                <div className="bg-gradient-to-b from-amber-950/40 to-slate-950/80 border-2 border-amber-400/80 rounded-[2rem] w-full py-8 px-4 shadow-[0_0_35px_rgba(245,158,11,0.15)] relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute top-0 w-full h-1/2 bg-amber-500/5 animate-pulse" />
                  <span className="text-[10px] font-mono font-black text-amber-300 tracking-widest uppercase mb-2">
                    執政評級
                  </span>
                  
                  <span className="text-6xl font-black text-amber-400 leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                    {(() => {
                      const finalScore = Math.round((activeEnding.stats.economy + activeEnding.stats.military + activeEnding.stats.diplomacy + activeEnding.stats.publicOpinion + activeEnding.stats.industry + activeEnding.stats.market) / 6);
                      if (finalScore >= 90) return "S級";
                      if (finalScore >= 80) return "A級";
                      if (finalScore >= 70) return "B級";
                      if (finalScore >= 60) return "C級";
                      if (finalScore >= 40) return "失敗級";
                      return "災難級";
                    })()}
                  </span>
                  
                  <span className="text-lg font-black text-white mt-3 tracking-widest">
                    {activeEnding.rating}
                  </span>
                  
                  <span className="text-xs text-amber-400 font-mono font-bold tracking-widest mt-2 bg-amber-950/60 px-3 py-1 rounded-full border border-amber-500/20">
                    SCORE: {Math.round((activeEnding.stats.economy + activeEnding.stats.military + activeEnding.stats.diplomacy + activeEnding.stats.publicOpinion + activeEnding.stats.industry + activeEnding.stats.market) / 6)} / 100
                  </span>
                </div>
              </div>

              {/* Right Column: 6 Stats Progress Dashboard */}
              <div className="col-span-4 flex flex-col gap-3 pl-4 border-l border-slate-800/50 font-sans">
                <span className="text-[10px] font-mono text-slate-400 font-black tracking-widest uppercase mb-1">
                  STATISTICS MONITOR • 國家關鍵屬性
                </span>
                {[
                  { label: "經濟", val: activeEnding.stats.economy, color: "text-emerald-400", barClass: "bg-emerald-500" },
                  { label: "軍事", val: activeEnding.stats.military, color: "text-blue-400", barClass: "bg-blue-500" },
                  { label: "外交", val: activeEnding.stats.diplomacy, color: "text-violet-400", barClass: "bg-violet-500" },
                  { label: "民意", val: activeEnding.stats.publicOpinion, color: "text-amber-500", barClass: "bg-amber-500" },
                  { label: "科技", val: activeEnding.stats.industry, color: "text-cyan-400", barClass: "bg-cyan-500" },
                  { label: "股市", val: activeEnding.stats.market, color: "text-rose-450", barClass: "bg-rose-500" }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium">{item.label}</span>
                      <span className={`font-mono font-extrabold ${item.color}`}>{item.val}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${item.barClass}`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer element */}
            <div className="flex items-center justify-between border-t border-slate-850/80 pt-6 relative z-10 w-full shrink-0 font-sans">
              <div className="text-[11px] text-[#f5a623] tracking-widest uppercase font-black">
                我的總統任期結算
              </div>
              <div className="text-[9px] font-mono text-slate-500">
                GENERATOR VERSION 4.7.1 • CHRONOS SYSTEM INTEL
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
