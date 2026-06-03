import React, { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import {
  Award,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  KeyRound,
  Eye,
  EyeOff
} from "lucide-react";

export default function AuthScreen() {
  const {
    signIn,
    signUp,
    verifyOTP,
    isPlaceholderFirebase
  } = useAuth();

  const [view, setView] = useState<"login" | "register" | "otp">("login");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>("");
  
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Login handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("請填寫信箱與密碼！");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        setSuccess("解鎖登入成功，準備進入智庫...");
      } else {
        setError(res.error || "登入失敗，請重試。");
      }
    } catch (err: any) {
      setError("連線出錯，請再試一次。");
    } finally {
      setLoading(false);
    }
  };

  // Register handler (Generates & Sends Email OTP)
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("請填寫註冊信箱與設定密碼！");
      return;
    }

    if (password.length < 6) {
      setError("安全密碼長度必須大於 6 位數。");
      return;
    }

    setLoading(true);
    try {
      const res = await signUp(email, password);
      if (res.success && res.loggedIn) {
        setSuccess("帳號建立成功！正在登入...");
      } else if (res.success && res.unverified) {
        setSuccess(res.info || `認證碼已成功寄送至：${email}，請至信箱收取。`);
        setView("otp");
      } else {
        setError(res.error || "註冊失敗，請重試。");
      }
    } catch (err: any) {
      setError("註冊流程出錯，請確認格式或重試。");
    } finally {
      setLoading(false);
    }
  };

  // OTP Verification Code verify
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otpCode || otpCode.trim().length !== 6) {
      setError("請輸入正確的 6 位數數位驗證碼。");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(email, otpCode);
      if (res.success) {
        setSuccess("驗證完成！歡迎加入 CHRONOS 會員！");
      } else {
        setError(res.error || "對比驗證碼不正確，請重新檢查。");
      }
    } catch (err: any) {
      setError("驗證程序出錯，請再試一次。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-root" className="bg-[#080b11] text-gray-200 min-h-screen font-sans antialiased flex flex-col items-center justify-center p-4 relative selection:bg-amber-500 selection:text-black">
      
      {/* 🌌 Atmospheric background glows */}
      <div id="auth-gold-glow" className="absolute top-1/4 right-1/4 w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[90px] pointer-events-none" />
      <div id="auth-blue-glow" className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        id="auth-card"
        className="bg-[#0b0e17]/90 border border-slate-800/80 rounded-2xl p-6 md:p-8 max-w-md w-full shadow-3xl backdrop-blur-md relative z-10"
      >
        {/* Branding header */}
        <div className="flex flex-col items-center gap-3 text-center mb-6">
          <div className="w-12 h-12 border border-amber-500/30 rounded-xl flex items-center justify-center p-2 bg-[#0f1424] text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)] font-mono">
            <Award className="w-full h-full text-amber-400 stroke-[1.5]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-widest bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              CHRONOS
            </h1>
            <p className="text-xs font-mono text-amber-600/80 tracking-wider mt-0.5 uppercase">
              DIPLOMATIC COUNCIL PORTAL
            </p>
          </div>
        </div>

        {/* Placeholder Warning Banner */}
        {isPlaceholderFirebase && (
          <div className="mb-5 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col gap-1 text-[11px] text-amber-400 text-left">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span>本機離線智庫測試模式已啟用</span>
            </div>
            <p className="leading-relaxed opacity-85 mt-0.5">
              提示：目前 Firebase 尚未配置專屬雲端連結。您可以正常使用所有註冊與登入流程（數據皆直接保存於本地）。
              如欲啟用全球雲端資料儲存，請執行 Firebase 整合指令。
            </p>
          </div>
        )}

        {/* Notifications */}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2 text-xs text-emerald-400"
          >
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </motion.div>
        )}

        {/* Form elements */}
        {view === "login" && (
          <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-100 text-center border-b border-slate-800/60 pb-3">
              智庫參謀權限登入
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                電子信箱 (EMAIL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs text-gray-150 focus:outline-none transition-all placeholder-slate-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                安全登密碼 (PASSWORD)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs text-gray-150 focus:outline-none transition-all placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 focus:outline-none cursor-pointer p-0.5 flex items-center justify-center bg-transparent border-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all outline-none hover:shadow-lg active:scale-95 cursor-pointer border-none"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>授權登入系統</span>
                </>
              )}
            </button>

            <div className="text-center mt-3 border-t border-slate-800/40 pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setView("register");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs text-amber-500/80 hover:text-amber-400 font-medium hover:underline cursor-pointer bg-transparent border-none outline-none"
              >
                尚未取得決策權限？ 註冊新參謀
              </button>
            </div>
          </form>
        )}

        {view === "register" && (
          <form onSubmit={handleSignUpSubmit} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-100 text-center border-b border-slate-800/60 pb-3">
              智庫新參謀註冊流程
            </h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                帳號信箱 (EMAIL)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your-name@example.com"
                disabled={loading}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs text-gray-150 focus:outline-none transition-all placeholder-slate-600"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-400 font-mono flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                設定安全密碼 (6位數以上)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-3 pr-10 py-2 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl text-xs text-gray-150 focus:outline-none transition-all placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-500 focus:outline-none cursor-pointer p-0.5 flex items-center justify-center bg-transparent border-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all outline-none hover:shadow-lg active:scale-95 cursor-pointer border-none"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  <span>確認註冊並啟用帳號</span>
                </>
              )}
            </button>

            <div className="text-center mt-3 border-t border-slate-800/40 pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setView("login");
                  setError("");
                  setSuccess("");
                }}
                className="text-xs text-slate-400 hover:text-amber-400 font-medium hover:underline cursor-pointer bg-transparent border-none outline-none"
              >
                已經擁有決策權限？ 立即登入
              </button>
            </div>
          </form>
        )}

        {view === "otp" && (
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-100 text-center border-b border-slate-800/60 pb-3 flex items-center justify-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-500" />
              輸入 6 位數寄信認證碼
            </h2>

            <p className="text-xs text-slate-400 text-center leading-relaxed">
              智庫安全系統已將 6 位數一體型密碼碼寄送至您的信箱：
              <span className="block font-semibold text-amber-400/90 break-all">{email}</span>
            </p>

            <div className="flex flex-col gap-1.5 mt-2">
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="填入驗證碼 (例如: 123456)"
                disabled={loading}
                className="w-full text-center tracking-[0.5em] px-3 py-3 bg-slate-900 border border-slate-800 focus:border-amber-500/60 rounded-xl text-lg font-bold text-amber-400 focus:outline-none transition-all placeholder:tracking-normal placeholder:text-xs placeholder:text-slate-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-50 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all outline-none hover:shadow-lg active:scale-95 cursor-pointer border-none"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <span>確認匹配並啟用帳號</span>
              )}
            </button>

            <div className="flex items-center justify-between mt-3 border-t border-slate-800/40 pt-4">
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setView("register");
                  setError("");
                  setOtpCode("");
                }}
                className="text-xs text-slate-400 hover:text-slate-300 font-medium cursor-pointer bg-transparent border-none outline-none"
              >
                變更註冊信箱
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleSignUpSubmit}
                className="text-xs text-amber-500/80 hover:text-amber-400 font-semibold cursor-pointer bg-transparent border-none outline-none"
              >
                重新寄送碼
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
