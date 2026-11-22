import { useState } from "react";
import { Zap, ShieldCheck, UserRound, LogIn, UserPlus } from "lucide-react";
import Card from "../common/Card.jsx";
import { useAppStore } from "../../store/AppStore.jsx";

const TABS = [
  { id: "signin", label: "Sign In" },
  { id: "signup", label: "Create Account" },
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#ff6900] focus:outline-none focus:ring-2 focus:ring-[#ff6900]/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-500";

const labelClass =
  "mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400";

const submitClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff6900] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#e05d00] focus:outline-none focus:ring-2 focus:ring-[#ff6900]/50 dark:bg-[#ff6900] dark:hover:bg-[#ff8a33]";

const demoButtonClass =
  "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#ff6900]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800";

export default function LoginScreen() {
  const { signIn, signUp, authError, clearAuthError } = useAppStore();
  const [mode, setMode] = useState("signin");
  const [signInEmail, setSignInEmail] = useState("");
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  function switchMode(next) {
    setMode(next);
    clearAuthError();
  }

  function handleSignIn(e) {
    e.preventDefault();
    signIn(signInEmail.trim(), signInPassword);
  }

  function handleSignUp(e) {
    e.preventDefault();
    signUp({
      name: signUpName.trim(),
      email: signUpEmail.trim(),
      password: signUpPassword,
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md p-6 sm:p-8">
        {/* Brand header */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ff6900] text-white shadow-md">
            <Zap className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            CashPulse AI
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to your working-capital copilot
          </p>
        </div>

        {/* Tab switch */}
        <div
          role="tablist"
          className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
        >
          {TABS.map((tab) => {
            const selected = mode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => switchMode(tab.id)}
                className={[
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6900]/40",
                  selected
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                ].join(" ")}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Sign In form */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className={labelClass}>
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                required
                autoComplete="email"
                value={signInEmail}
                onChange={(e) => setSignInEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="signin-password" className={labelClass}>
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                required
                autoComplete="current-password"
                value={signInPassword}
                onChange={(e) => setSignInPassword(e.target.value)}
                placeholder="••••••••"
                className={inputClass}
              />
            </div>
            <button type="submit" className={submitClass}>
              <LogIn className="h-4 w-4" aria-hidden="true" />
              Sign in
            </button>
          </form>
        )}

        {/* Create Account form */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-name" className={labelClass}>
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                required
                autoComplete="name"
                value={signUpName}
                onChange={(e) => setSignUpName(e.target.value)}
                placeholder="Jane Doe"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="signup-email" className={labelClass}>
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                required
                autoComplete="email"
                value={signUpEmail}
                onChange={(e) => setSignUpEmail(e.target.value)}
                placeholder="you@company.com"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="signup-password" className={labelClass}>
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={signUpPassword}
                onChange={(e) => setSignUpPassword(e.target.value)}
                placeholder="At least 6 characters"
                className={inputClass}
              />
            </div>
            <button type="submit" className={submitClass}>
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Create account
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              New accounts start as Associates. Studio admins are assigned by an
              existing admin.
            </p>
          </form>
        )}

        {/* Error line */}
        {authError && (
          <p
            role="alert"
            className="mt-4 text-sm text-rose-600 dark:text-rose-400"
          >
            {authError}
          </p>
        )}

        {/* Demo section */}
        <div className="mt-8">
          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs font-medium uppercase tracking-wide text-slate-400 dark:bg-slate-900 dark:text-slate-500">
                Quick demo for judges
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => signIn("ravi@cashpulse.io", "admin123")}
              className={demoButtonClass}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Demo: Login as Founder (Admin)
            </button>
            <button
              type="button"
              onClick={() => signIn("priya@cashpulse.io", "team123")}
              className={demoButtonClass}
            >
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Demo: Login as Associate (Restricted)
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
