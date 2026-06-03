import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signOut as firebaseSignOut
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { auth, db } from "../firebase";
// @ts-ignore
import firebaseConfig from "../../firebase-applet-config.json";

export interface CustomUser {
  uid: string;
  email: string;
  verified: boolean;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  authorizedSender: string | null;
  checkingSender: boolean;
  isPlaceholderFirebase: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string; unverified?: boolean; info?: string }>;
  verifyOTP: (email: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  saveSMTPConfig: (email: string, appPassword: string) => Promise<void>;
  syncToGAS: (action: string, data: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authorizedSender, setAuthorizedSender] = useState<string | null>(null);
  const [checkingSender, setCheckingSender] = useState<boolean>(true);

  // Detect whether Firebase configuration is a placeholder / remixed
  const isPlaceholderFirebase = !firebaseConfig || 
    !firebaseConfig.projectId || 
    firebaseConfig.projectId.includes("remixed-project-id") ||
    firebaseConfig.projectId.includes("placeholder");

  // Check persisted user session in localStorage on mount
  useEffect(() => {
    const checkPersistedUser = async () => {
      try {
        const stored = localStorage.getItem("chronos_user");
        if (stored) {
          const parsed = JSON.parse(stored) as CustomUser;
          if (isPlaceholderFirebase) {
            // Local fallback verification
            const localUsers = JSON.parse(localStorage.getItem("chronos_local_users") || "{}");
            const localUser = localUsers[parsed.email.toLowerCase()];
            if (localUser && localUser.verified) {
              setUser(parsed);
            } else {
              localStorage.removeItem("chronos_user");
            }
          } else {
            // Verify against Firestore to ensure it is still active/valid
            try {
              const userRef = doc(db, "chronos_users", parsed.email.toLowerCase());
              const userDoc = await getDoc(userRef);
              if (userDoc.exists() && userDoc.data()?.verified) {
                setUser(parsed);
              } else {
                localStorage.removeItem("chronos_user");
              }
            } catch (firestoreErr) {
              // If Firebase fails with offline error, fallback to local storage check
              const localUsers = JSON.parse(localStorage.getItem("chronos_local_users") || "{}");
              const localUser = localUsers[parsed.email.toLowerCase()];
              if (localUser && localUser.verified) {
                setUser(parsed);
              } else {
                console.log("Firestore offline on mount, fell back to local verification.");
              }
            }
          }
        }
      } catch (err) {
        console.log("Error loading local user session:", err);
      } finally {
        setLoading(false);
      }
    };

    checkPersistedUser();
  }, [isPlaceholderFirebase]);

  // Check general Gmail sender config on mount
  useEffect(() => {
    const fetchSenderConfig = async () => {
      try {
        if (isPlaceholderFirebase) {
          const localConfig = JSON.parse(localStorage.getItem("chronos_local_config") || "{}");
          setAuthorizedSender(localConfig.senderEmail || null);
        } else {
          try {
            const configDoc = await getDoc(doc(db, "config", "auth"));
            if (configDoc.exists()) {
              setAuthorizedSender(configDoc.data()?.senderEmail || null);
            }
          } catch (firestoreErr) {
            // If offline, check local fallback config to keep things smooth
            const localConfig = JSON.parse(localStorage.getItem("chronos_local_config") || "{}");
            setAuthorizedSender(localConfig.senderEmail || null);
            console.log("Firestore offline while fetching sender config, using local config.");
          }
        }
      } catch (err) {
        console.log("Error fetching sender config:", err);
      } finally {
        setCheckingSender(false);
      }
    };

    fetchSenderConfig();
  }, [isPlaceholderFirebase]);

  // Store Google App Password and SMTP Email in configurations doc
  const saveSMTPConfig = async (senderEmail: string, senderAppPassword: string) => {
    const email = senderEmail.trim();
    const appPassword = senderAppPassword.trim();

    if (!email || !appPassword) {
      throw new Error("信箱與應用程式密碼不能為空。");
    }

    // Always store locally as fallback
    const localConfig = {
      senderEmail: email,
      senderAppPassword: appPassword,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem("chronos_local_config", JSON.stringify(localConfig));

    if (isPlaceholderFirebase) {
      setAuthorizedSender(email);
      return;
    }

    try {
      await setDoc(doc(db, "config", "auth"), {
        senderEmail: email,
        senderAppPassword: appPassword,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setAuthorizedSender(email);
    } catch (err: any) {
      // If client is offline, fallback gracefully
      console.log("Firestore save SMTP error, saving locally only:", err);
      setAuthorizedSender(email);
    }
  };

  // General GAS action sender
  const syncToGAS = async (action: string, data: any) => {
    // Retrieve environment variable configuration, filtering out the malformed/mangled string if injected by cache or process
    const rawEnvUrl = (((import.meta as any).env?.VITE_GAS_API_URL) || "").trim();
    const GAS_API_URL = (rawEnvUrl && rawEnvUrl.startsWith("https://") && !rawEnvUrl.includes("exeuTzys"))
      ? rawEnvUrl
      : "https://script.google.com/macros/s/AKfycbx4NchHRT5L3TJlrFkHLgq5U9vnkVMho0QZiZnXuTzysFttUvHtQSCOoXhLgrC6U1W1xw/exec";

    console.log("1. Targeting GAS URL:", GAS_API_URL);
    console.log("2. Ends with /exec:", GAS_API_URL.endsWith("/exec") || GAS_API_URL.includes("/exec"));
    console.log("3. HTTP Method: POST");

    const requestBody = {
      secretToken: "CHRONOS_SUPER_SECRET_TOKEN_2026",
      action: action,
      data: data
    };

    console.log("4. Request Payload (Body):", JSON.stringify(requestBody, null, 2));

    try {
      console.log("FETCH START");
      const response = await fetch(GAS_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain" // Prevents preflight request failure on Apps Script
        },
        body: JSON.stringify(requestBody)
      });
      console.log("FETCH END");

      console.log("=== [GAS] Direct Response Details ===");
      console.log("Response Redirected:", response.redirected);
      console.log("Response Status Code:", response.status);
      console.log("Response Status OK:", response.ok);

      try {
        const text = await response.text();
        console.log("5. RAW Response Body (Text):", text);
      } catch (readErr) {
        console.log("Could not read response text body:", readErr);
      }
    } catch (error) {
      console.warn("=== [GAS] Direct CORS/Network Error. Fallback to no-cors mode ===", error);
      
      try {
        console.log("FETCH START (Fallback)");
        await fetch(GAS_API_URL, {
          method: "POST",
          mode: "no-cors",
          headers: {
            "Content-Type": "text/plain"
          },
          body: JSON.stringify(requestBody)
        });
        console.log("FETCH END (Fallback)");
        console.log("6. Fallback request sent successfully in opaque (no-cors) mode.");
      } catch (retryErr) {
        console.error("Fallback sync attempt also failed:", retryErr);
      }
    }
  };

  // Synchronize registered user to Google Sheets via Google Apps Script Web App
  const syncUserToGoogleSheet = async (
    userIdOrObj: string | { userId: string; email: string; registrationType: string },
    emailParam?: string,
    registrationTypeParam?: string
  ) => {
    console.log("同步函數已啟動");

    let userId: string;
    let email: string;
    let registrationType: string;

    if (typeof userIdOrObj === "object" && userIdOrObj !== null) {
      userId = userIdOrObj.userId;
      email = userIdOrObj.email;
      registrationType = userIdOrObj.registrationType;
    } else {
      userId = userIdOrObj as string;
      email = emailParam || "";
      registrationType = registrationTypeParam || "email";
    }

    console.log("SYNC FUNCTION STARTED", { userId, email, registrationType });

    await syncToGAS("syncUser", {
      userId,
      email,
      registrationType
    });
  };

  // Custom Sign Up with Email + Password (Direct register & Login - OTP flow is bypassed but retained in comments)
  const signUp = async (emailInput: string, passwordInput: string) => {
    const email = emailInput.trim().toLowerCase();
    
    try {
      // Create local user representation as backup/mock
      const localUsers = JSON.parse(localStorage.getItem("chronos_local_users") || "{}");
      
      if (isPlaceholderFirebase) {
        if (localUsers[email] && localUsers[email].verified) {
          return { success: false, error: "此信箱已被註冊。" };
        }
        
        // Directly register as verified
        localUsers[email] = {
          email,
          password: passwordInput,
          verified: true,
          verificationCode: "", // bypass OTP
          createdAt: new Date().toISOString()
        };
        localStorage.setItem("chronos_local_users", JSON.stringify(localUsers));

        // Directly log in the user offline
        const loggedUser: CustomUser = {
          uid: `local_${new Date().getTime()}`,
          email: email,
          verified: true
        };

        // Trigger Google Apps Script Sync BEFORE logging in / showing main dashboard
        try {
          await syncUserToGoogleSheet({
            userId: loggedUser.uid || email,
            email: email,
            registrationType: "email"
          });
        } catch (syncErr) {
          console.error("Google Apps Script registration sync failed:", syncErr);
        }
        
        setUser(loggedUser);
        localStorage.setItem("chronos_user", JSON.stringify(loggedUser));
        
        return { success: true, loggedIn: true };

        /* ── [OLD KEY-VAL OTP FLOW PRESERVED BELOW FOR FUTURE RESEND RE-ACTIVATION] ──
        const otpCode = "123456"; // Default/Fallback OTP during offline/unconfigured mode
        
        localUsers[email] = {
          email,
          password: passwordInput,
          verified: false,
          verificationCode: otpCode,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem("chronos_local_users", JSON.stringify(localUsers));
        
        // Try to trigger the real server send-otp (if SMTP has been configured e.g. at server env)
        try {
          const response = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipient: email, code: otpCode })
          });
          const resData = await response.json().catch(() => ({}));
          if (response.ok && resData.success) {
            return { success: true, unverified: true };
          }
        } catch (e) {
          // Ignore and proceed to info message
        }
        
        return { 
          success: true, 
          unverified: true, 
          info: "已啟用本地註冊！請輸入預設測試驗證碼「123456」以完成驗證。" 
        };
        */
      }

      // ── NORMAL FIREBASE WORKFLOW ──
      let userDocExists = false;
      let existingData: any = null;

      try {
        const userRef = doc(db, "chronos_users", email);
        const userSnap = await getDoc(userRef);
        userDocExists = userSnap.exists();
        existingData = userSnap.data();
      } catch (firestoreErr) {
        // Fallback to local storage if Firestore throws error (e.g. offline)
        if (localUsers[email] && localUsers[email].verified) {
          return { success: false, error: "此信箱已被註冊。" };
        }
        userDocExists = !!localUsers[email];
        existingData = localUsers[email];
      }
      
      if (userDocExists && existingData?.verified) {
        return { success: false, error: "此信箱已被註冊。" };
      }

      // Save/Update in Local Storage as verified directly
      localUsers[email] = {
        email,
        password: passwordInput,
        verified: true,
        verificationCode: "",
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("chronos_local_users", JSON.stringify(localUsers));

      // Try writing to Firestore with verified: true
      try {
        const userRef = doc(db, "chronos_users", email);
        await setDoc(userRef, {
          email,
          password: passwordInput,
          verified: true,
          verificationCode: "",
          createdAt: new Date().toISOString()
        });
      } catch (firestoreWriteErr) {
        console.log("Firestore write failed during signUp (offline fallback used):", firestoreWriteErr);
      }

      // Automatically log in the user
      const loggedUser: CustomUser = {
        uid: `custom_${new Date().getTime()}`,
        email: email,
        verified: true
      };

      // Trigger Google Apps Script Sync BEFORE logging in / showing main dashboard
      try {
        await syncUserToGoogleSheet({
          userId: loggedUser.uid || email,
          email: email,
          registrationType: "email"
        });
      } catch (syncErr) {
        console.error("Google Apps Script registration sync failed:", syncErr);
      }

      setUser(loggedUser);
      localStorage.setItem("chronos_user", JSON.stringify(loggedUser));

      return { success: true, loggedIn: true };

      /* ── [OLD FIREBASE OTP SMTP FLOW PRESERVED BELOW FOR FUTURE RESEND RE-ACTIVATION] ──
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Save/Update in Local Storage as fallback
      localUsers[email] = {
        email,
        password: passwordInput,
        verified: false,
        verificationCode: otpCode,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("chronos_local_users", JSON.stringify(localUsers));

      // Try writing to Firestore
      try {
        const userRef = doc(db, "chronos_users", email);
        await setDoc(userRef, {
          email,
          password: passwordInput,
          verified: false,
          verificationCode: otpCode,
          createdAt: new Date().toISOString()
        });
      } catch (firestoreWriteErr) {
        console.log("Firestore write failed during signUp (offline fallback used):", firestoreWriteErr);
      }

      // Send OTP via Express server SMTP endpoint
      try {
        const response = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            recipient: email,
            code: otpCode
          })
        });

        const resData = await response.json().catch(() => ({}));

        if (!response.ok || !resData.success) {
          throw new Error(resData.error || "發送信件驗證碼失敗。");
        }
      } catch (sendErr: any) {
        return {
          success: true,
          unverified: true,
          info: `已啟用離線註冊！因郵件發送服務未就緒，請使用備用認證碼「${otpCode}」進行驗證。`
        };
      }

      return { success: true, unverified: true };
      */
    } catch (err: any) {
      console.log("Sign Up error (handled):", err);
      return { success: false, error: err.message || "註冊建立程序失敗。" };
    }
  };

  // Verify the OTP code
  const verifyOTP = async (emailInput: string, code: string) => {
    const email = emailInput.trim().toLowerCase();
    try {
      const localUsers = JSON.parse(localStorage.getItem("chronos_local_users") || "{}");
      const localUserData = localUsers[email];

      if (isPlaceholderFirebase) {
        if (!localUserData) {
          return { success: false, error: "找不到註冊資訊，請重新註冊。" };
        }
        if (localUserData.verificationCode !== code.trim()) {
          return { success: false, error: "驗證碼不正確，請重新輸入。" };
        }

        localUserData.verified = true;
        localUserData.verificationCode = ""; // clear
        localUsers[email] = localUserData;
        localStorage.setItem("chronos_local_users", JSON.stringify(localUsers));

        const loggedUser: CustomUser = {
          uid: `custom_${new Date().getTime()}`,
          email: localUserData.email,
          verified: true
        };

        try {
          await syncUserToGoogleSheet({
            userId: loggedUser.uid || email,
            email: email,
            registrationType: "email"
          });
        } catch (syncErr) {
          console.error("Google Apps Script verification sync failed:", syncErr);
        }

        setUser(loggedUser);
        localStorage.setItem("chronos_user", JSON.stringify(loggedUser));

        return { success: true };
      }

      // ── NORMAL FIREBASE WORKFLOW WITH FALLBACK ──
      let fetchedData: any = null;
      let userRef: any = null;

      try {
        userRef = doc(db, "chronos_users", email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          fetchedData = userSnap.data();
        }
      } catch (firestoreErr) {
        // Fallback to local
        fetchedData = localUserData;
      }

      const activeData = fetchedData || localUserData;

      if (!activeData) {
        return { success: false, error: "找不到註冊資訊，請重新註冊。" };
      }

      if (activeData.verificationCode !== code.trim()) {
        return { success: false, error: "驗證碼不正確，請重新輸入。" };
      }

      // Update locally
      if (localUserData) {
        localUserData.verified = true;
        localUserData.verificationCode = "";
        localUsers[email] = localUserData;
        localStorage.setItem("chronos_local_users", JSON.stringify(localUsers));
      }

      // Update in Firestore
      if (userRef) {
        try {
          await updateDoc(userRef, {
            verified: true,
            verificationCode: "" // clear after use
          });
        } catch (firestoreUpdateErr) {
          console.log("Firestore verify update failed, using local instead:", firestoreUpdateErr);
        }
      }

      const loggedUser: CustomUser = {
        uid: `custom_${new Date().getTime()}`,
        email: activeData.email,
        verified: true
      };

      try {
        await syncUserToGoogleSheet({
          userId: loggedUser.uid || email,
          email: email,
          registrationType: "email"
        });
      } catch (syncErr) {
        console.error("Google Apps Script verification sync failed:", syncErr);
      }

      setUser(loggedUser);
      localStorage.setItem("chronos_user", JSON.stringify(loggedUser));

      return { success: true };
    } catch (err: any) {
      console.log("Verify OTP error (handled):", err);
      return { success: false, error: err.message || "驗證碼比對失敗。" };
    }
  };

  // Email + Password sign-in checks custom store
  const signIn = async (emailInput: string, passwordInput: string) => {
    const email = emailInput.trim().toLowerCase();
    try {
      const localUsers = JSON.parse(localStorage.getItem("chronos_local_users") || "{}");
      const localUserData = localUsers[email];

      if (isPlaceholderFirebase) {
        if (!localUserData) {
          return { success: false, error: "信箱密碼錯誤或尚未註冊。" };
        }
        if (localUserData.password !== passwordInput) {
          return { success: false, error: "密碼或信箱錯誤，請重新再試。" };
        }
        if (!localUserData.verified) {
          return { success: false, error: "該帳號尚未啟用，請重新註冊或聯絡管理員。" };
        }

        const loggedUser: CustomUser = {
          uid: `custom_${new Date().getTime()}`,
          email: localUserData.email,
          verified: true
        };

        // Record Login via GAS (Failure won't disrupt the game flow)
        try {
          await syncToGAS("recordLogin", {
            userId: loggedUser.uid,
            email: loggedUser.email,
            loginTime: new Date().toISOString()
          });
        } catch (loginErr) {
          console.error("Failed to record login to Google Sheet:", loginErr);
        }

        setUser(loggedUser);
        localStorage.setItem("chronos_user", JSON.stringify(loggedUser));

        return { success: true };
      }

      // ── NORMAL FIREBASE WORKFLOW WITH FALLBACK ──
      let fetchedData: any = null;

      try {
        const userRef = doc(db, "chronos_users", email);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          fetchedData = userSnap.data();
        }
      } catch (firestoreErr) {
        // Fallback to local
        fetchedData = localUserData;
      }

      const activeData = fetchedData || localUserData;

      if (!activeData) {
        return { success: false, error: "信箱密碼錯誤或尚未註冊。" };
      }

      if (activeData.password !== passwordInput) {
        return { success: false, error: "密碼或信箱錯誤，請重新再試。" };
      }

      if (!activeData.verified) {
        return { success: false, error: "該帳號尚未啟用，請重新註冊或聯絡管理員。" };
      }

      const loggedUser: CustomUser = {
        uid: `custom_${new Date().getTime()}`,
        email: activeData.email,
        verified: true
      };

      // Record Login via GAS (Failure won't disrupt the game flow)
      try {
        await syncToGAS("recordLogin", {
          userId: loggedUser.uid,
          email: loggedUser.email,
          loginTime: new Date().toISOString()
        });
      } catch (loginErr) {
        console.error("Failed to record login to Google Sheet:", loginErr);
      }

      setUser(loggedUser);
      localStorage.setItem("chronos_user", JSON.stringify(loggedUser));

      return { success: true };
    } catch (err: any) {
      console.log("Sign in error (handled):", err);
      return { success: false, error: err.message || "登入失敗。" };
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {}
    setUser(null);
    localStorage.removeItem("chronos_user");
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authorizedSender,
      checkingSender,
      isPlaceholderFirebase,
      signIn,
      signUp,
      verifyOTP,
      logout,
      saveSMTPConfig,
      syncToGAS
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

