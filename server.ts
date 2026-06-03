import express from "express";
import path from "path";
import dns from "dns";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

dotenv.config();

// Workaround for Node's local resolution in ESM/CJS bundles
const __dirname = path.resolve();

// Initialize Firebase on Server
let db: any = null;
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized on server successfully.");
  } else {
    console.warn("firebase-applet-config.json not found on server.");
  }
} catch (err) {
  console.error("Failed to initialize Firebase on server:", err);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini client
let geminiCooldownUntil = 0;

function checkGeminiHealth(): boolean {
  if (Date.now() < geminiCooldownUntil) {
    const secondsLeft = Math.ceil((geminiCooldownUntil - Date.now()) / 1000);
    console.log(`[Gemini Resiliency] Circuit breaker active. Skipping Gemini API for another ${secondsLeft} seconds.`);
    return false;
  }
  return true;
}

function triggerGeminiCooldown(seconds = 120) {
  geminiCooldownUntil = Date.now() + seconds * 1000;
  console.warn(`[Gemini Resiliency] Activated circuit breaker/cooldown for ${seconds} seconds to handle quota limits or high demand.`);
}

let aiInstance: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI | null {
  if (!checkGeminiHealth()) {
    return null;
  }
  if (aiInstance) return aiInstance;
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY") {
    console.warn("GEMINI_API_KEY not supplied or is placeholder. Using robust offline scenarios.");
    return null;
  }
  try {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    return aiInstance;
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
    return null;
  }
}

// Helper function to call Gemini with retry and robust model fallback on high demand
async function generateContentWithRetry(client: GoogleGenAI, params: any, maxRetries = 2): Promise<any> {
  const originalModel = params.model || "gemini-3.5-flash";
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      params.model = originalModel;
      const response = await client.models.generateContent(params);
      return response;
    } catch (err: any) {
      lastError = err;
      const errMsg = err?.message || String(err);
      
      const isQuotaError = errMsg.includes("429") || 
                           errMsg.includes("RESOURCE_EXHAUSTED") || 
                           errMsg.toLowerCase().includes("quota") || 
                           errMsg.toLowerCase().includes("limit");

      const isUnavailable = errMsg.includes("503") || 
                            errMsg.includes("UNAVAILABLE") || 
                            errMsg.toLowerCase().includes("high demand") || 
                            errMsg.toLowerCase().includes("temporary");

      if (isQuotaError) {
        console.log(`[Gemini Resiliency] Quota limit reached (429/RESOURCE_EXHAUSTED). Activating 120-second circuit breaker to seamlessly use high-fidelity offline modes.`);
        triggerGeminiCooldown(120); // cooldown for 120s
        throw new Error("QUOTA_LIMIT_REACHED");
      }

      if (isUnavailable && attempt === maxRetries) {
        console.log(`[Gemini Resiliency] Service temporarily unavailable (503/UNAVAILABLE). Activating 60-second circuit breaker to seamlessly use high-fidelity offline modes.`);
        triggerGeminiCooldown(60); // cooldown for 60s
      }

      console.log(`[Gemini Resiliency Info] Gemini generation attempt ${attempt}/${maxRetries} original model returned state: ${errMsg}`);
      
      // If we observe a 503 / high demand / UNAVAILABLE error, immediately fallback to "gemini-3.1-flash-lite"
      if (isUnavailable) {
        console.log(`[Gemini Resiliency] Detected high demand on original model. Attempting immediate fallback to "gemini-3.1-flash-lite"...`);
        try {
          params.model = "gemini-3.1-flash-lite";
          const response = await client.models.generateContent(params);
          return response;
        } catch (fallbackErr: any) {
          console.log(`[Gemini Resiliency Info] Fallback to "gemini-3.1-flash-lite" also returned: ${fallbackErr?.message || fallbackErr}`);
        }
      }

      if (attempt < maxRetries) {
        // Wait 1.0s before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Ultimate backup model: try "gemini-3.1-flash-lite" if we haven't already succeeded
  console.log(`[Gemini Resiliency] Final fallback to model "gemini-3.1-flash-lite" as robust backup...`);
  try {
    params.model = "gemini-3.1-flash-lite";
    const response = await client.models.generateContent(params);
    return response;
  } catch (fallbackErr: any) {
    console.log(`[Gemini Resiliency Info] Gemini backup model generateContent also returned: ${fallbackErr?.message || fallbackErr}`);
    throw lastError || fallbackErr;
  }
}

// Exact starting scenario from the image
const INITIAL_SCENARIO = {
  title: "全球貿易戰升級：如何應對中國關稅反制？",
  subtext: "中國宣布對美國商品的加徵關稅作為反制措施，此舉可能會影響美國經濟和全球供應鏈穩定。",
  diplomaticImpact: "高",
  trumpQuote: "顧問，我們正面臨一個重要的決策時刻。這個決定將影響美中關係的未來走向。你的建議是？",
  dateString: "2025年5月28日",
  daysOfPresidency: 150,
  options: [
    {
      id: "A",
      title: "強硬反制",
      description: "對中國進口商品加徵更多關稅，展示美國的強硬立場。",
      impacts: { economy: 5, diplomacy: -15, publicOpinion: 10, industry: 5, market: -10, military: 0 }
    },
    {
      id: "B",
      title: "談判協商",
      description: "主動尋求對話，尋求雙方都妥協的解決方案。",
      impacts: { economy: 10, diplomacy: 5, publicOpinion: 5, industry: 2, market: 5, military: 0 }
    },
    {
      id: "C",
      title: "尋求盟友支持",
      description: "聯合盟友共同應對，對中國施加更多壓力。",
      impacts: { economy: 8, diplomacy: 15, publicOpinion: 5, industry: 5, market: 2, military: 2 }
    }
  ]
};

// High-fidelity offline backup scenarios in case Gemini API is not working or key is empty
const BACKUP_SCENARIOS = [
  {
    title: "鋼鐵加徵關稅：復興美國重工業",
    subtext: "歐盟與加拿大反對美國可能對進口鋼鋁採取的配額保護政策。鋼鐵大亨們要求給予全額關稅抵免。",
    diplomaticImpact: "中",
    trumpQuote: "我們的重工業正在崛起！顧問，賓夕法尼亞州的鋼鐵工人指望著我們。要不要簽署這個關稅行政命令？",
    options: [
      {
        id: "A",
        title: "簽署配額命令",
        description: "對世界主要進口鋼鐵加徵 25% 關稅，重振鐵鏽帶重工業。",
        impacts: { economy: -5, military: 0, diplomacy: -10, publicOpinion: 15, industry: 15, market: -5 }
      },
      {
        id: "B",
        title: "豁免盟友關稅",
        description: "給予歐盟與加拿大特殊配額豁免，換取更靈活的國防防衛承諾。",
        impacts: { economy: 5, military: 5, diplomacy: 10, publicOpinion: -5, industry: 2, market: 5 }
      },
      {
        id: "C",
        title: "全面推遲關稅",
        description: "暫緩推動六個月，轉由國會審查聽證，舒緩 market 波動。",
        impacts: { economy: 8, military: 0, diplomacy: 5, publicOpinion: -10, industry: -5, market: 10 }
      }
    ],
    daysAdvance: 15
  },
  {
    title: "北約防務支出危機：敦促盟友承擔責任",
    subtext: "歐洲大部分北約成員國的國防軍費支出未達到國民生產總值的 2% 目標。這引發了美國納稅人的不滿。",
    diplomaticImpact: "高",
    trumpQuote: "北約長期靠我們保護，這簡直不公平！他們有的是錢，必須支付他們該付的份。我們該採取強硬策略嗎？",
    options: [
      {
        id: "A",
        title: "發出最後通牒",
        description: "威脅減少美國駐軍派遣，若其不在下季度補齊國防比例經費。",
        impacts: { economy: 5, military: -15, diplomacy: -20, publicOpinion: 15, industry: -2, market: 0 }
      },
      {
        id: "B",
        title: "倡導軍工合資",
        description: "提供先進的美國愛國者防空技術，要求他們採購更多美製導彈及核能裝備。",
        impacts: { economy: 10, military: 10, diplomacy: 5, publicOpinion: 5, industry: 15, market: 5 }
      },
      {
        id: "C",
        title: "召開特別首腦峰會",
        description: "在戴維營閉門開會，宣佈共同發表《北大西洋戰略防務安全宣言》以和緩外交。",
        impacts: { economy: 2, military: 5, diplomacy: 15, publicOpinion: -2, industry: 5, market: 2 }
      }
    ],
    daysAdvance: 20
  },
  {
    title: "矽谷科技制裁：出口管教與晶片限制",
    subtext: "商務部擬加碼禁止高端AI加速晶片流出。科技巨頭代表強烈抗議，稱此舉會大幅降低營收。",
    diplomaticImpact: "中",
    trumpQuote: "矽谷的科技非常厲害，但我們不能讓先進技術隨便流出去。顧問，既要保證美國科技賺大錢，又要卡死對手，你有何妙計？",
    options: [
      {
        id: "A",
        title: "實施嚴格禁令",
        description: "對所有非友好陣營施加完全禁封，切斷半導體供應鏈。",
        impacts: { economy: -10, military: 15, diplomacy: -10, publicOpinion: 8, industry: 15, market: -15 }
      },
      {
        id: "B",
        title: "發放有限許可證",
        description: "允許科技巨頭以限制算力版（閹割版）晶片出口，維持高額利潤。",
        impacts: { economy: 15, military: 5, diplomacy: 2, publicOpinion: 5, industry: 10, market: 10 }
      },
      {
        id: "C",
        title: "補助本土晶片廠",
        description: "發放額外500億美元聯邦補貼在德州與俄亥俄州建廠，拒絕考慮任何出口寬限。",
        impacts: { economy: 5, military: 10, diplomacy: 5, publicOpinion: 10, industry: 20, market: 5 }
      }
    ],
    daysAdvance: 18
  },
  {
    title: "邊境牆物資爭議：重振國土防衛預算",
    subtext: "國會正為美墨邊境物資、工程承包和資金撥款展開激烈辯論。若無法獲批，政府可能再次面臨停擺危機。",
    diplomaticImpact: "低",
    trumpQuote: "完美的邊境牆！我們需要安全的國家。沒有安全的邊境，就沒有美麗的國家。我們是繼續施壓撥款，還是暫時和解？",
    options: [
      {
        id: "A",
        title: "堅守預算到底",
        description: "拒簽預算案，若邊境撥款不滿，即使面臨短期政府停擺也在所不惜。",
        impacts: { economy: -8, military: 10, diplomacy: -2, publicOpinion: 12, industry: 5, market: -5 }
      },
      {
        id: "B",
        title: "兩黨妥協折衷",
        description: "以削減太空軍研發預算為代價，換取國會對邊境警備牆一攬子 150 億資金通過。",
        impacts: { economy: 8, military: -5, diplomacy: 0, publicOpinion: 5, industry: 5, market: 5 }
      },
      {
        id: "C",
        title: "宣佈緊急戰術授權",
        description: "調用五角大樓現有國防工程雜項維修儲備金進行築牆，避免停擺。",
        impacts: { economy: 5, military: 5, diplomacy: -5, publicOpinion: 8, industry: 10, market: 5 }
      }
    ],
    daysAdvance: 12
  }
];

// Helper to advance formatted date
function advanceDate(currentDateStr: string, daysToAdvance: number): string {
  try {
    const match = currentDateStr.match(/(\d+)年(\d+)月(\d+)日/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1; 
      const day = parseInt(match[3]);
      const date = new Date(year, month, day);
      date.setDate(date.getDate() + daysToAdvance);
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
  } catch (e) {
    console.error("Date formatting error:", e);
  }
  // Fallback
  return "2025年6月15日";
}

// SMTP API for sending OTP registration verification codes via Google App Password
app.post("/api/auth/send-otp", async (req, res) => {
  const { recipient, code } = req.body;

  if (!recipient || !code) {
    res.status(400).json({ success: false, error: "缺少收件人或驗證碼。" });
    return;
  }

  const senderEmail = process.env.GMAIL_SENDER_EMAIL;
  const senderAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!senderEmail || !senderAppPassword) {
    res.status(500).json({ 
      success: false, 
      error: "發送系統尚未配置發信信箱或密碼。請在 AI Studio 中設定 GMAIL_SENDER_EMAIL 與 GMAIL_APP_PASSWORD 環境變數。" 
    });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: senderEmail,
        pass: senderAppPassword
      }
    });

    const mailOptions = {
      from: `"CHRONOS 歷史政策智庫" <${senderEmail}>`,
      to: recipient,
      subject: "CHRONOS 歷史政策智庫 - 智庫新參謀註冊驗證碼",
      html: `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; background-color: #080b11; color: #f3f4f6; padding: 32px 16px; margin: 0; min-height: 100%;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #0a0d16; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; text-align: center; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
            <div style="display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #f59e0b; border-bottom: 2px solid #f59e0b; padding-bottom: 8px; margin-bottom: 24px;">CHRONOS</div>
            <h2 style="font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 16px; margin-top: 0;">智庫政策會商授權檢驗</h2>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; text-align: left;">
              參謀智囊您好！感謝您登錄白宮戰略防務諮詢委員會。為了保障國家重大外交決策與重工業、經濟關市數據之安全性，請輸入以下 6 位數認證碼以完成註冊：
            </p>
            <div style="background-color: #111827; border: 1px solid #e2e8f0; border-radius: 12px; font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 18px; margin: 24px 0; color: #f59e0b; font-family: monospace;">
              ${code}
            </div>
            <p style="font-size: 11px; color: #64748b; margin-top: 24px;">本重組通訊由 CHRONOS 歷史政策智庫高級加密機制發出，驗證碼於 10 分鐘內有效。</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err: any) {
    console.error("Nodemailer send SMTP email failed:", err);
    res.status(500).json({ success: false, error: err.message || "發送 SMTP 電子郵件過程出錯。" });
  }
});

// Load local events helper
function loadEvents() {
  try {
    const eventsPath = path.join(process.cwd(), "src", "events.json");
    if (fs.existsSync(eventsPath)) {
      return JSON.parse(fs.readFileSync(eventsPath, "utf-8"));
    }
  } catch (err) {
    console.error("Failed to load events.json:", err);
  }
  return [];
}

// Convert JSON event to Frontend Scenario schema
function mapEventToScenario(event: any, currentDate: string, daysOfPresidency: number, trumpQuote: string) {
  let diplomaticImpact: "高" | "中" | "低" = "中";
  if (["中美關係", "台海危機", "烏俄戰爭"].includes(event.category)) {
    diplomaticImpact = "高";
  } else if (["關稅戰", "科技競爭", "伊朗與中東衝突", "AI與晶片競爭"].includes(event.category)) {
    diplomaticImpact = "中";
  } else {
    diplomaticImpact = "低";
  }

  const titles = ["強勢主動對策", "務實和緩磋商", "多邊協調機制"];

  const options = event.choices.map((choice: any, idx: number) => {
    const ids: ("A" | "B" | "C")[] = ["A", "B", "C"];
    return {
      id: ids[idx],
      title: titles[idx] || "行動方案",
      description: choice.text,
      impacts: {
        economy: choice.effects.economy ?? 0,
        military: choice.effects.military ?? 0,
        diplomacy: choice.effects.diplomacy ?? 0,
        publicOpinion: choice.effects.approval ?? 0,
        industry: choice.effects.industry ?? 0,
        market: choice.effects.stockMarket ?? 0
      }
    };
  });

  return {
    title: event.title,
    subtext: `【${event.category}】${event.description}`,
    diplomaticImpact,
    trumpQuote,
    dateString: currentDate,
    daysOfPresidency,
    options
  };
}

// --- Advisor Team System Helpers ---
function getOfflineAdvisors(title: string, subtext: string, category: string): any[] {
  const isMilitary = ["台海危機", "烏俄戰爭", "伊朗與中東衝突", "北約"].includes(category) || 
    title.includes("軍事") || title.includes("防務") || title.includes("突襲") || title.includes("兵力") || title.includes("演習");
  
  const isEconomic = ["關稅戰", "科技競爭", "AI與晶片競爭"].includes(category) || 
    title.includes("關稅") || title.includes("晶片") || title.includes("貿易") || title.includes("股市") || title.includes("預算") || title.includes("補貼");

  const pool = [
    {
      title: "國防部長",
      position: "軍事強硬",
      icon: "Shield",
      advice: `應在該區展現決定性威懾。強硬姿態是防止衝突和誤判的最佳保障，必須站穩立場。`,
      risk: `過度的軍事施壓或摩擦升級，可能引致對手戰術性反制，使全球局勢升溫。`
    },
    {
      title: "國務卿",
      position: "外交談判",
      icon: "Handshake",
      advice: `建立美方主導的會商框架。以談判作為施壓槓桿進行戰略協商，謀求利益與主權最大化。`,
      risk: `盟友可能藉此免費搭便車分攤其防務開支，需防範陷入冗長且空洞的對話。`
    },
    {
      title: "財政部長",
      position: "市場穩定",
      icon: "TrendingUp",
      advice: `首重美國本土供應鏈韌性與關市、股市穩定。施壓時須精確打擊，確保美股平穩執政。`,
      risk: `激進的加稅或封鎖措施，恐引致短線市場恐慌與關鍵原材料供應鏈部分中斷。`
    },
    {
      title: "CIA局長",
      position: "情報風險",
      icon: "Eye",
      advice: `最新情資顯示敵方正評估我方防禦底線。應加大網路與供應鏈穿透式監密，建立預警屏障。`,
      risk: `情勢瞬息萬變，對手常採取非常規不對稱反制。不可輕信敵方承諾與暫時性退讓。`
    }
  ];

  let selected: any[] = [];
  if (isMilitary) {
    selected = [pool[0], pool[1], pool[3]];
  } else if (isEconomic) {
    selected = [pool[2], pool[1], pool[3]];
  } else {
    selected = [pool[0], pool[1], pool[2]];
  }

  return selected.map(adv => {
    let customizedAdvice = adv.advice;
    let customizedRisk = adv.risk;

    if (adv.title === "國防部長") {
      if (title.includes("關稅") || title.includes("貿易")) {
        customizedAdvice = `經濟戰與國安密不可分。應將貿易通道列為核心生命線，不排除以海岸實力捍衛航運安全。`;
        customizedRisk = `經緯爭端若過度擴大到威懾層面，可能給地緣對手藉口提高軍事挑釁機率。`;
      } else if (title.includes("晶片") || title.includes("科技") || title.includes("AI")) {
        customizedAdvice = `高端半導體直接關係到精準打擊與軍事優勢。應當徹底切斷先進技術，防範關鍵軍工科技外流。`;
        customizedRisk = `過度防堵也可能迫使對方加速推進不對稱的秘密軍事網絡研發與滲透。`;
      }
    } else if (adv.title === "國務卿") {
      if (title.includes("關稅") || title.includes("貿易")) {
        customizedAdvice = `可試圖以多邊經貿架構對盟國施加整合壓力。利用核心盟友體系對對手實施合圍與關稅圍堵。`;
        customizedRisk = `單邊談判如果操之過急，容易讓歐洲夥伴轉向與對手暗中妥協，損害美方團結。`;
      } else if (title.includes("晶片") || title.includes("科技") || title.includes("AI")) {
        customizedAdvice = `應召集七大工業國與晶片同盟，聯合建立出口審查標準。透過協議鎖死關鍵半導體與高新算力。`;
        customizedRisk = `國際協調往往拖延過久，部分盟國可能私下放寬出口尺度以牟取其國家本身暴利。`;
      }
    } else if (adv.title === "財政部長") {
      if (title.includes("台海") || title.includes("衝突") || title.includes("戰爭")) {
        customizedAdvice = `地緣局勢對大盤有重大衝擊。應備妥金融防禦與外匯限制措施，嚴防外資流出與通膨加劇。`;
        customizedRisk = `衝突一旦升級為局部對抗，避險性大跌恐波及多個實體製造業骨幹，破壞經濟復甦。`;
      }
    } else if (adv.title === "CIA局長") {
      if (title.includes("台海") || title.includes("衝突") || title.includes("戰爭")) {
        customizedAdvice = `對手戰區兵力與網絡動向高度異常。建議加強實施情報電子監測，並隨時做好特急撤僑備案。`;
        customizedRisk = `敵方可能展開隱蔽的灰色地帶騷擾或虛假訊息攻勢，切忌盲目涉入，保持靈活反制。`;
      } else if (title.includes("關稅") || title.includes("貿易")) {
        customizedAdvice = `情資證實對方正經由第三方中轉管道非法避稅與傾銷。應協調商務部徹查供應鏈多重溯源。`;
        customizedRisk = `高壓審查將引致各國貿易體制不滿，甚至引發技術性黑客干擾金融網絡報復。`;
      }
    }

    return {
      ...adv,
      advice: customizedAdvice,
      risk: customizedRisk
    };
  });
}

async function getAdvisorsWithGemini(title: string, subtext: string, category: string, options: any[], stats: any): Promise<any[]> {
  const client = getGemini();
  if (!client) {
    console.log("[Advisors] Gemini client not available, returning offline backup advisors.");
    return getOfflineAdvisors(title, subtext, category);
  }

  try {
    const optsStr = options.map(o => `【選項 ${o.id} - ${o.title}】：${o.description}`).join("\n");
    const statsStr = `經濟 ${stats?.economy ?? 50}%, 軍事 ${stats?.military ?? 50}%, 外交 ${stats?.diplomacy ?? 50}%, 民意 ${stats?.publicOpinion ?? 50}%, 產業 ${stats?.industry ?? 50}%, 股市 ${stats?.market ?? 50}%`;

    const prompt = `
您是白宮戰略控制室的高級智囊協調官。目前美國總統正面臨一項關乎國家命運的重大戰略決策：
事件名稱：「${title}」
情境簡介：「${subtext}」
本回合候選策略：
${optsStr}

當前美利堅各項核心指標：
${statsStr}

請代表 3 位白宮顧問，為玩家提供不同視角的內部建議與風險報告。
你可以從以下四位顧問中，挑選最合適、最能產生觀點碰撞的「3 位」顧問：
1. 國防部長 (立場：軍事強硬，對應 icon 名稱必需是 "Shield")
2. 國務卿 (立場：外交談判，對應 icon 名稱必需是 "Handshake")
3. 財政部長 (立場：市場穩定，對應 icon 名稱必需是 "TrendingUp")
4. CIA局長 (立場：情報風險，對應 icon 名稱必需是 "Eye")

【嚴格控制規則】：
1. 必須全部使用繁體中文（台灣習慣用語，例如「加徵關稅」、「高科技晶片」、「內閣防務」等）。
2. 只需生成包含 3 個元素的 JSON 數組。
3. 每個顧問的 recommendations 包含以下五個屬性：
   - title: 顧問職稱 (例如 "國防部長"、"國務卿"、"財政部長"、"CIA局長")
   - position: 立場 (例如 "軍事強硬"、"外交談判"、"市場穩定"、"情報風險")
   - icon: 對應的 icon 名稱 (必須是 "Shield", "Handshake", "TrendingUp", "Eye" 之一，首字母大寫且與顧問完全對應)
   - advice: 建議內容（極為簡短且生動，繁體中文，限制在 50 字以內）
   - risk: 風險提醒（極為簡短，揭示該傾向的隱形成本，限制在 50 字以內）
4. 絕對不可直接顯示或透露具體的數值加減（例如不可寫「這會增加經濟 10%」）。
5. 絕對不要推薦任何特定的選項，也不要告訴玩家哪個選項最好，保持客觀參謀的本位，只陳述各領域的觀點和潛在代價。

請以此 JSON 格式輸出：
[
  {
    "title": "國防部長",
    "position": "軍事強硬",
    "icon": "Shield",
    "advice": "建議展示決定性力量威懾，防範對手誤判本屆政府底線。",
    "risk": "過於強硬的防務表態可能加劇局勢升溫，推高偶發衝突風險。"
  },
  ...
]
`;

    const response = await generateContentWithRetry(client, {
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              position: { type: Type.STRING },
              icon: { type: Type.STRING },
              advice: { type: Type.STRING },
              risk: { type: Type.STRING }
            },
            required: ["title", "position", "icon", "advice", "risk"]
          }
        }
      }
    });

    const parsed = JSON.parse(response.text.trim());
    if (Array.isArray(parsed) && parsed.length === 3) {
      console.log(`[Advisors] Successfully generated 3 advisor recommendations via Gemini for "${title}".`);
      return parsed;
    }
    console.warn("[Advisors] Gemini output did not return exactly 3 advisors, fallback to offline.");
  } catch (err: any) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg === "QUOTA_LIMIT_REACHED") {
      console.log("[Advisors] Gemini quota limits active. Seamlessly reverting to high-fidelity offline advisors.");
    } else {
      console.warn("[Advisors] Gemini advisors generation failed, fallback to offline. Error info:", errMsg);
    }
  }

  return getOfflineAdvisors(title, subtext, category);
}

// 1. Get initial scenario from events.json
app.get("/api/game/start", async (req, res) => {
  const allEvents = loadEvents();
  if (!allEvents.length) {
    res.status(500).json({ success: false, error: "No events configured yet." });
    return;
  }

  // Draw first random event
  const firstEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
  const trumpQuote = `顧問！我第二任期的白宮戰略控制室正式交給起航。現在各項數據是完美的 50 點。這一次，我們正面臨來自「${firstEvent.category}」領域的緊急事態「${firstEvent.title}」！發揮你的Tremendous智慧，大膽做出最有利的對策吧，讓美國再次偉大！`;
  
  const scenario = mapEventToScenario(firstEvent, "2025年5月28日", 150, trumpQuote);
  const advisors = await getAdvisorsWithGemini(scenario.title, scenario.subtext, firstEvent.category, scenario.options, {
    economy: 50,
    military: 50,
    diplomacy: 50,
    publicOpinion: 50,
    industry: 50,
    market: 50
  });

  res.json({
    stats: {
      economy: 50,
      military: 50,
      diplomacy: 50,
      publicOpinion: 50,
      industry: 50,
      market: 50
    },
    scenario: {
      ...scenario,
      advisors
    }
  });
});

// 2. Generate next scenario from events.json based on history mapping (not repeating, reshuffling if fully exhausted)
app.post("/api/game/next", async (req, res) => {
  const { 
    stats, 
    history, 
    choiceId, 
    currentDate, 
    daysOfPresidency,
    turn,
    currentScenario,
    choiceTitle,
    choiceDescription,
    choiceImpacts
  } = req.body;

  const allEvents = loadEvents();

  if (!allEvents.length) {
    res.status(500).json({ success: false, error: "No events configured yet." });
    return;
  }

  // Extract titles of scenario played before to avoid duplicates
  const playedTitles = new Set((history || []).map((h: any) => h.scenarioTitle));

  // Filter out any event whose title matches any played scenario title
  let available = allEvents.filter((e: any) => !playedTitles.has(e.title));

  if (available.length === 0) {
    console.log("All events have been played. Reshuffling full event list.");
    available = allEvents;
  }

  // Draw next event using the Step 7 Event Chain System (relevance scoring)
  const prevEvent = allEvents.find((e: any) => e.title === currentScenario?.title);
  const prevCategory = prevEvent ? prevEvent.category : "";

  const scoredAvailable = available.map((event: any) => {
    let score = 0;

    // 1. Same category continuity (Event chain logic)
    if (prevCategory && event.category === prevCategory) {
      score += 15;
    }

    // High compatibility category pairings
    if (prevCategory === "中美關係" && (event.category === "台海危機" || event.category === "關稅戰")) {
      score += 8;
    }
    if (prevCategory === "台海危機" && event.category === "中美關係") {
      score += 8;
    }
    if (prevCategory === "科技競爭" && event.category === "AI與晶片競爭") {
      score += 10;
    }
    if (prevCategory === "AI與晶片競爭" && event.category === "科技競爭") {
      score += 10;
    }

    // 2. Choice-driven correlation
    if (choiceId === "A") {
      // Aggressive choice: favor military or sovereignty crises
      if (["台海危機", "中美關係", "烏俄戰爭", "伊朗與中東衝突"].includes(event.category)) {
        score += 10;
      }
      // Favor events with aggressive/patriotic option values
      const maxMil = Math.max(...event.choices.map((c: any) => c.effects?.military ?? 0));
      if (maxMil > 10) score += 5;
    } else if (choiceId === "B") {
      // Compromise/Trade choice: favor tariffs, tech trade, and economics
      if (["關稅戰", "科技競爭", "AI與晶片競爭"].includes(event.category)) {
        score += 10;
      }
      const maxEco = Math.max(...event.choices.map((c: any) => c.effects?.economy ?? 0));
      if (maxEco > 10) score += 5;
    } else if (choiceId === "C") {
      // Multilateral/Alliance choice: favor European security or international alliances
      if (["烏俄戰爭", "北約", "中美關係"].includes(event.category)) {
        score += 8;
      }
      if (event.description?.includes("盟友") || event.description?.includes("多邊") || event.description?.includes("聯合國")) {
        score += 10;
      }
    }

    // 3. GameState responsive triggers (Crisis mode)
    if (stats) {
      // If economy is low, we prioritize economic restoration opportunities
      if ((stats.economy ?? 50) < 40) {
        if (["關稅戰", "科技競爭"].includes(event.category)) {
          score += 12;
        }
      }
      // If military defense capability is low, prioritize direct military operations
      if ((stats.military ?? 50) < 40) {
        if (["台海危機", "烏俄戰爭", "伊朗與中東衝突"].includes(event.category)) {
          score += 12;
        }
      }
      // If diplomacy falls too low, trigger major alliance meetings or negotiation windows
      if ((stats.diplomacy ?? 50) < 40) {
        if (event.category === "中美關係" || event.description?.includes("盟會") || event.description?.includes("協商")) {
          score += 10;
        }
      }
    }

    // 4. Turn-based scalability
    const currentRound = turn || 1;
    if (currentRound <= 3) {
      if (["關稅戰", "邊境對峙", "台海危機"].includes(event.category)) {
        score += 8;
      }
    } else {
      if (["科技競爭", "AI與晶片競爭", "伊朗與中東衝突"].includes(event.category)) {
        score += 8;
      }
    }

    return { event, score };
  });

  scoredAvailable.sort((a: any, b: any) => b.score - a.score);
  const nextEvent = scoredAvailable[0].event;

  let trumpReaction = "";
  if (choiceId === "A") {
    trumpReaction = `顧問，這項決策真是太棒了！那些假新聞媒體和反對人士都要驚呼瘋狂了！我們再次用實力證明了美國的強大！現在，白宮控制室剛剛接到這項關於「${nextEvent.category}」的緊急簡報，你必須馬上告訴我對策：`;
  } else if (choiceId === "B") {
    trumpReaction = `顧問，你上輪堅持的一對一和緩磋商，做得還算有些意思。雖然我是那種極致合約締造者（Dealmaker），但我認可我們取得了一點利益。此時手頭關於「${nextEvent.category}」的主題，又冒出了一個全新的深水危機：`;
  } else {
    trumpReaction = `顧問，攜手多邊盟友在一定程度上能夠分攤些風險，雖然那些盟友總是喜歡免費消費我們的安全資源，非常不地道。無論如何，「${nextEvent.category}」方面的重磅決策消息剛剛送達白宮，看看我們該如何回應：`;
  }

  const daysAdvance = 15;
  const nextDaysOfPresidency = (daysOfPresidency || 150) + daysAdvance;
  const nextDateString = advanceDate(currentDate || "2025年5月28日", daysAdvance);

  const scenario = mapEventToScenario(nextEvent, nextDateString, nextDaysOfPresidency, trumpReaction);
  const advisors = await getAdvisorsWithGemini(scenario.title, scenario.subtext, nextEvent.category, scenario.options, stats);

  // Call Gemini to generate AI news based on current decision
  let news = null;
  const client = getGemini();
  if (client && currentScenario && choiceTitle) {
    try {
      const prompt = `
您是白宮最高戰略新聞分析官，請為剛剛達成的戰略決策生成一份權威的新聞快訊。
目前是第 ${turn || 1} 回合。
事件名稱：「${currentScenario.title}」
事件描述：「${currentScenario.subtext}」
玩家所做的決策方案：「【選項 ${choiceId}】${choiceTitle} - ${choiceDescription || ""}」
此決策帶來的即時指標變化：經濟 ${choiceImpacts?.economy ?? 0}%, 軍事 ${choiceImpacts?.military ?? 0}%, 外交 ${choiceImpacts?.diplomacy ?? 0}%, 民意 ${choiceImpacts?.publicOpinion ?? choiceImpacts?.approval ?? 0}%, 產業 ${choiceImpacts?.industry ?? 0}%, 股市關市 ${choiceImpacts?.market ?? choiceImpacts?.stockMarket ?? 0}%。
更新後的各項屬性（總值 0~100）：經濟 ${stats?.economy ?? 50}, 軍事 ${stats?.military ?? 50}, 外交 ${stats?.diplomacy ?? 50}, 民意 ${stats?.publicOpinion ?? stats?.approval ?? 50}, 產業 ${stats?.industry ?? 50}, 股市 ${stats?.market ?? stats?.stockMarket ?? 50}。

請根據上述數據與情境，生成以下五個部分的內容：
1. 即時新聞標題 (headline)
2. 新聞內容 (content)
3. 國際反應 (internationalReaction)
4. 股市反應 (marketReaction)
5. 民意反應 (publicReaction)

【嚴格限制】：
1. 全部內容必須使用 繁體中文（台灣習慣用語，例如「加徵關稅」、「高科技晶片」、「白宮幕僚」等）。
2. 文字總字數（這五部分文字內容的總和，不包括 JSON key，全部漢字與標點符號的總長度）必須嚴格控制在 120 至 180 字之間，極度客觀簡練。
3. 報導風格必須像 CNN、BBC 或 Reuters，屬於權威硬性新聞報導，客觀冷靜、不帶有小說色彩、也不要太過誇張煽情。
4. 絕對不可改變或捏造任何 GameState 數據。
5. 只負責生成文字結果。

請以此 JSON 格式輸出：
{
  "headline": "即時新聞標題",
  "content": "新聞內容",
  "internationalReaction": "國際反應",
  "marketReaction": "股市反應",
  "publicReaction": "民意反應"
}
`;

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: { type: Type.STRING },
              content: { type: Type.STRING },
              internationalReaction: { type: Type.STRING },
              marketReaction: { type: Type.STRING },
              publicReaction: { type: Type.STRING }
            },
            required: ["headline", "content", "internationalReaction", "marketReaction", "publicReaction"]
          }
        }
      });
      news = JSON.parse(response.text.trim());
    } catch (e: any) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg === "QUOTA_LIMIT_REACHED") {
        console.log("[News] Gemini news generator skipped due to quota limitations. Seamlessly using offline news fallback.");
      } else {
        console.warn("Gemini AI News Generator query was skipped or failed, running fallback generator. Error info:", errMsg);
      }
    }
  }

  if (!news) {
    // Generate static robust realistic fallback news matching character limits
    const scTitle = currentScenario ? currentScenario.title : "全球貿易";
    const chTitle = choiceTitle || "最新決策";
    const imp = choiceImpacts || {};
    
    const headline = `美中博弈新動向：白宮宣佈「${chTitle}」措施`;
    const content = `白宮今日正式推動關於「${scTitle}」的關鍵行動。參謀透露本項政策旨在鞏固核心安全及產業優勢。`;
    const intl = (imp.diplomacy ?? 0) < 0 ? `多國外長發表聯合聲明表示遺憾。` : `歐洲與亞太同盟對此舉深表肯定與期待。`;
    const market = (imp.market ?? imp.stockMarket ?? 0) < 0 ? `避險浪潮席捲重工大盤，華爾街微跌。` : `科技與出口板塊全線暴升，市場反應正面。`;
    const pub = (imp.publicOpinion ?? imp.approval ?? 0) > 0 ? `最新全國民調顯示過半選民贊同此策略。` : `中產及環保智庫發文質疑其政策代價。`;
    
    news = {
      headline: headline.slice(0, 45),
      content: content.slice(0, 110),
      internationalReaction: intl.slice(0, 70),
      marketReaction: market.slice(0, 70),
      publicReaction: pub.slice(0, 70)
    };
  }

  res.json({
    success: true,
    scenario: {
      ...scenario,
      advisors
    },
    news
  });
});

// New: AI endpoint to generate end-game Historical Review & News Frontpage
app.post("/api/game/generate-report", async (req, res) => {
  const { history, finalStats, endingName, rating, personalityTitle } = req.body;

  if (!finalStats) {
    res.status(400).json({ success: false, error: "缺少最終統計數值。" });
    return;
  }

  const client = getGemini();

  if (client) {
    try {
      const log = (history || []).map((h: any, idx: number) => `* 第 ${idx + 1} 回合 (總統第 ${h.daysOfPresidency} 天):「${h.scenarioTitle}」玩家選擇了「${h.chosenOptionTitle}」。`).join("\n");
      const prompt = `
您是冷靜、睿智且文字造詣極高的「CHRONOS 歷史政策智庫」白宮資深歷史編撰學家，同時也是一名頂尖的普立茲新聞獎得主。
請根據本局玩家擔任白宮最高決策顧問的完整執政歷程，生成一份極具歷史厚重感與文學張力的「歷史評價」以及「新聞頭版快報」。

本局最終治理數據：
- 終局名稱：${endingName || "綜合執政評定"}
- 總統評級：${rating || "B"}
- 最終核心六項國家數值：
  * 經濟與金融：${finalStats.economy}%
  * 國防軍事：${finalStats.military}%
  * 外交同盟：${finalStats.diplomacy}%
  * 民意與支持：${finalStats.publicOpinion}%
  * 重工與產業：${finalStats.industry}%
  * 關市與貿易：${finalStats.market}%
- 最終執政風格性格：${personalityTitle || "平衡務實內閣"}

玩家所經歷的重大決策歷程（共 ${history?.length || 0} 個事件）：
${log}

【請生成以下資訊：】
1. **歷史評價 (historicalReview)**：
    - 字數約 200~300 字。
    - 風格需有歷史學家的嚴肅、厚重感，深入剖析該顧問在此任期採取的施政路線（強硬、溫和或聯合多邊）、在哪些核心戰略上取得絕對勝局、或在哪些領域留下了致命隱患。
    - 請在歷史評價中特別深入探討和融合該屆白宮所突出的「${personalityTitle || "平衡務實內閣"}」執政風格，解釋這一性格特徵是如何貫穿其面對關稅風暴、軍事安全與外交博弈時的決策考量。
    - 分析其總統評級 ${rating || "B"} 與終局 ${endingName || ""} 的歷史本意、國家遺產（Legacy）。字句優美，富含政治哲學與宏觀格局。

2. **新聞頭版快報 (newsFrontpage)**：
   - 模擬具備百年歷史之《紐約論壇報》或《華盛頓戰略環球報》的完滿收官頭條。
   - **即時新聞頭版標題 (headline)**：震撼、高張力，字數 15~25 字之內。例如「關稅風暴下的新帝國：川普內閣對全球地緣的多邊合圍與勝盤」
   - **副標題 (subtext)**：精煉，50 字內，概括本屆內閣在多領域留下的歷史烙印。
   - **導語主文 (leadParagraph)**：約 150 字，以權威新聞社（Reuters等）冷靜、第三人稱、快訊風格報導白宮最後一回合的結案大會，及參眾兩院、歷史學家對該屆政府治理成果的終極概括。
   - **國際盟友/對手反應 (internationalQuote)**：引用一位虛擬國際政要的真實口吻質疑或盛讚，字數 60 字內。
   - **美利堅本土反應 (domesticQuote)**：引用實體選民、鐵鏽帶工人或華爾街分析師的肺腑名言，字數 60 字內。

【嚴格控制限制】：
1. 必須全部使用繁體中文（台灣習慣用語）。
2. 只輸出指定之 JSON 格式。
3. 嚴禁編造或修改玩家的實際指標數值，不可有妄想。

輸出 JSON 格式：
{
  "historicalReview": "...",
  "newsFrontpage": {
    "headline": "...",
    "subtext": "...",
    "leadParagraph": "...",
    "internationalQuote": "...",
    "domesticQuote": "..."
  }
}
`;

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              historicalReview: { type: Type.STRING },
              newsFrontpage: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING },
                  subtext: { type: Type.STRING },
                  leadParagraph: { type: Type.STRING },
                  internationalQuote: { type: Type.STRING },
                  domesticQuote: { type: Type.STRING }
                },
                required: ["headline", "subtext", "leadParagraph", "internationalQuote", "domesticQuote"]
              }
            },
            required: ["historicalReview", "newsFrontpage"]
          }
        }
      });

      const reportData = JSON.parse(response.text.trim());
      res.json({ success: true, ...reportData });
      return;
    } catch (e: any) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg === "QUOTA_LIMIT_REACHED") {
        console.log("[Report] Gemini report generator skipped due to quota limitations. Seamlessly using offline report fallback.");
      } else {
        console.warn("Gemini report generation failed, running backup generator. Error info:", errMsg);
      }
    }
  }

  // Robust realistic fallback reports based on Rating
  let historicalReview = "";
  let newsHeadline = "";
  let newsSubtext = "";
  let newsLead = "";
  let intQuote = "";
  let domQuote = "";

  const r = rating || "B";
  if (r === "S") {
    historicalReview = `這是一段堪稱偉大的國家復興史詩。決策顧問在面對美中激烈的大國博弈中，以近乎無瑕的精準手腕，同時鞏固了美國的實體工業基石與股市大盤。不僅科技革命霸權地位被牢牢確立，且實體經濟在低通膨、高成長下完成了百年難得一見的全盛擴張。此任期的宏觀戰略規劃將成為後世白宮顧問的黃金聖經，為自由世界樹立了高不可攀的卓越治理典範。`;
    newsHeadline = "黃金美利堅勝景：白宮完成歷史上最強百日結業大盤！";
    newsSubtext = "六項關鍵國家指標全部衝破高峰，華爾街與鐵鏽帶同聲歡慶「川普黃金盛世」";
    newsLead = "智庫特別報導：白宮與CHRONOS決策團隊今日公布了最終任期的國家大盤報告。在史無前例的地緣政治逆風下，美利堅在晶片自給率、雙邊關稅談判與同盟軍事防衛上取得了全方位的壓倒性勝利，締造了本世紀最驚人的大國復興奇蹟。";
    intQuote = "「美國展現了令人折服的國家意志與科技護城河。」——歐洲安全理事會高級特使";
    domQuote = "「我們工廠的訂單能排到五年後，這全靠白宮強硬的產業回流政策！」——俄亥俄州重工業代表";
  } else if (r === "A") {
    historicalReview = `本屆政府的施政路線成果極其耀眼。顧問秉持極高的務實主義（Realism），在多維度的關稅對壘、地緣局勢及矽谷高科技出口禁令中，為國家爭取到了最具實質利益的談判結果。民意與支持以及關市貿易保持強勁優勢，美國不僅在地緣政治博弈中奪取了主動性，也實質推動了本土高端產業重組。這是一任成就顯赫的功勳內閣。`;
    newsHeadline = "地緣制勝與務實繁榮：美利堅多邊博弈奪標！";
    newsSubtext = "雙邊關稅落合與科技禁運收效顯著，核心產業就業率達近年新高";
    newsLead = "本報訊：首席戰略顧問協助川普總統在多項關鍵地緣角力中取得突破性成果。在剛閉幕的白宮內閣全體商務與防務大會上，學者指出該團隊有效化解了多場海外供應鏈安全危機，並在關稅博弈中捍衛了美國消費市場。";
    intQuote = "「美方策略雖極具進攻性，但成功的談判重塑了地緣秩序。」——北約軍事安全高級觀察員";
    domQuote = "「大市全天盤整，科技和重工基金爆出史詩級買單，市場投下信任票。」——華爾街首席合夥人";
  } else if (r === "C" || r === "D") {
    historicalReview = `本屆政府的執政歷程可謂驚濤駭浪、步步艱辛。顧問一連串極具爭議的決策，導致多個關鍵領域浮現結構性失衡。部分核心屬性跌入致命邊緣，不僅國內通膨逆風致使中產和民眾疑慮重重，地緣局勢與盟友互信亦受至沉重打擊。其留下的政治遺產在多大程度上動搖了國家根基，正引發歷史學與政策界的激烈辯論。`;
    newsHeadline = "多維震盪與結構困局：白宮艱難度過決策結算點";
    newsSubtext = "邊境貿易不確定性增高，經濟通膨與多邊同盟信譽面臨雙重重考";
    newsLead = "華府訊：新一季國家發展綜合白皮書今日面世。數據顯示，在持續演進的全球和邊界貿易博弈中，決策顧問的多項激進策略引發了部分市場與中產團體的強烈疑慮。白宮參眾兩院已針對最新的高赤字和外交孤立召開緊急聽證會。";
    intQuote = "「過度的單邊封鎖對全球盟邦的可持續性蒙上了一層陰影。」——印太戰略盟邦特別協調官";
    domQuote = "「生活開銷和防衛壓力幾乎讓我們快透不過氣，決策需要更多理性。」——威斯康辛州青年選民代表";
  } else {
    // Grade B default
    historicalReview = `本屆內閣走完了一任驚險無波、高度平衡的戰略過渡期。顧問以務實且靈活的妥協手腕，在中美大國博弈、科技晶片限制及同盟軍費分攤等深水區游走，確保了經濟、軍事與外交大局未出大紕漏。在風起雲湧、國際博弈的極端變革時代，守住並穩固國力的基本盤已實屬不易。這是一個合格且穩健的守成政府。`;
    newsHeadline = "戰略守成與穩健過渡：白宮平穩結案百日期考！";
    newsSubtext = "各項關鍵指標驚險無波維持均衡，中美貿易及軍事威懾展現務實控制";
    newsLead = "美聯社消息：白宮防務大會今日就這段百日總統任期的決策大盤進行最終審查。在諸多地緣危機及產業外延不確定情況下，CHRONOS 決策顧問成功化解了數次元首級對壘，使得美利堅政權架構驚險無波地步入平穩過渡期。";
    intQuote = "「雖然火藥味十足，但雙方最終仍回到了理性的界限之內。」——國際戰略研究所所長";
    domQuote = "「儘管市場沒有暴漲，但對於大企業跟中小企業來說，穩定就是好消息。」——芝加哥商會高級代表";
  }

  res.json({
    success: true,
    historicalReview,
    newsFrontpage: {
      headline: newsHeadline,
      subtext: newsSubtext,
      leadParagraph: newsLead,
      internationalQuote: intQuote,
      domesticQuote: domQuote
    }
  });
});

// 3. Send final dynamic decision summary report via Email simulator
app.post("/api/game/email", async (req, res) => {
  const { history, finalStats, email } = req.body;
  
  const client = getGemini();
  const defaultRecipient = email || "library990322@gmail.com";

  if (client) {
    try {
      const log = history.map((h: any) => `* 第 ${h.daysOfPresidency} 天：「${h.scenarioTitle}」玩家選擇 A/B/C 中「${h.chosenOptionId}」即「${h.chosenOptionTitle}」。`).join("\n");
      const prompt = `
寫一封高水準、帶有幽默川普風格口吻的安全簡報電子郵件。
這封電子郵件的主題是「白宮最高戰略決策成果總結報告」。
收件人是：「${defaultRecipient}」。
這是他在 CHRONOS 歷史政策智庫擔任 首席決策顧問 的總體成績。

最終屬性狀態：
- 經濟：${finalStats.economy} %
- 軍事：${finalStats.military} %
- 外交：${finalStats.diplomacy} %
- 民意：${finalStats.publicOpinion} %
- 產業：${finalStats.industry} %
- 關市：${finalStats.market} %

玩家決策歷史軌跡：
${log}

【請生成電子郵件的：】
1. **主旨 (Subject)**：振奮人心、帶有川普式大寫或強調風格。
2. **正文 (Body)**：
   - 稱呼收件人為 顧問 或 國家安全秘書。
   - 對顧問一路上出的計策給出經典川普風格的毒舌或爆讚點評。
   - 當成績很高時（例如平均在 70-90），讚他為「天才、僅次於我的最佳戰略家、讓美國再次偉大的奇才」；如果有任何屬性爆炸了，則要幽默地說「你差點搞砸了，沒關係，沒人比我更懂止損」。
   - 用精煉、生動、川普式的政治辭藻（繁體中文）。

請直接輸出 JSON 格式：
{
  "subject": "信件主旨",
  "body": "信件內文（格式可以使用換行 \\n）"
}
`;

      const response = await generateContentWithRetry(client, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              body: { type: Type.STRING }
            },
            required: ["subject", "body"]
          }
        }
      });
      const data = JSON.parse(response.text.trim());
      res.json({ success: true, email: data });
      return;
    } catch (e: any) {
      const errMsg = e instanceof Error ? e.message : String(e);
      if (errMsg === "QUOTA_LIMIT_REACHED") {
        console.log("[Email] Gemini email generator skipped due to quota limitations. Seamlessly using offline email fallback.");
      } else {
        console.warn("Gemini Email generator error, using offline fallback: ", errMsg);
      }
    }
  }

  // Backup email text
  const averageValue = (finalStats.economy + finalStats.military + finalStats.diplomacy) / 3;
  const titleRating = averageValue > 75 ? "【特級白宮首席戰略功臣】" : "【資深白宮決策專家】";
  
  res.json({
    success: true,
    email: {
      subject: `🚨 CHRONOS 戰略會議：${titleRating} 您的國土決策白皮書！`,
      body: `親愛的 顧問 (${defaultRecipient})：

我是川普總統。我必須告訴你，你在《CHRONOS 歷史政策智庫》擔任我第二任期的戰略幕僚期間，表現簡直是太神奇、太不可思議了！

我們看看眼前的六大指標：
* 經濟：${finalStats.economy}
* 軍事：${finalStats.military}
* 外交：${finalStats.diplomacy}
* 民意：${finalStats.publicOpinion}
* 產業：${finalStats.industry}
* 關市：${finalStats.market}

那些假新聞媒體和反對派一直唱衰我們，但瞧瞧你交出來的這份巨大的成績單！我們在關稅風暴、北約同盟重整、高科技禁封的一系列硬仗中，保護了本土工作崗位，展示了什麼叫「實力外交」！

你是一個非常有智慧的人，毫無疑問，下一次戰略峰會議題，你仍然是白宮戰略控制室的核心！

祝，讓美國再次偉大！
DONALD J. TRUMP
第 47 任美國總統 簽署`
    }
  });
});

// Vite server / production routing setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend assets
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
