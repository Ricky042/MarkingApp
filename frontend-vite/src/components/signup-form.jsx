import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import api from "../utils/axios";
import { useNavigate } from "react-router-dom";

export function SignupForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step, setStep] = useState(1); // 1 = enter credentials, 2 = enter code
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [cooldown, setCooldown] = useState(0); // resend cooldown
  const navigate = useNavigate();
  const [checkingEmail, setCheckingEmail] = useState(false);

  // Countdown timer for resend code
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Live validation
  useEffect(() => {
    const newErrors = {};

    // 🔹 Local validation first
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(password)) {
      newErrors.password =
        "Password must be ≥6 chars, with uppercase, lowercase, and number/symbol.";
    }
    if (confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    setErrors(newErrors);

    // Checks for duplicate email in backend when tying the password in signup page
    let delayDebounce;
    if (email && !newErrors.email) {
      delayDebounce = setTimeout(async () => {
        try {
          setCheckingEmail(true);
          const res = await api.post("/check-user", { email });
          if (res.data.exists) {
            setErrors(prev => ({ ...prev, email: "This email is already registered." }));
          }
        } catch (err) {
          console.error("Email check failed:", err);
        } finally {
          setCheckingEmail(false);
        }
      }, 500); // debounce 500ms
    }

    // Cleanup function
    return () => {
      if (delayDebounce) clearTimeout(delayDebounce);
    };
  }, [email, password, confirmPassword]);

  // Send verification code
  const sendCode = async () => {
    if (Object.keys(errors).length > 0 || !email || !password || !confirmPassword) return;
    try {
      setLoading(true);
      setServerError("");
      await api.post("/send-code", { email });
      alert("Verification code sent to your email");
      setStep(2);
      setCooldown(30); // 30s before resend
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  // Verify code and create user
  const verifyAndSignup = async () => {
    if (!code) return;
    try {
      setLoading(true);
      setServerError("");
      const res = await api.post("/verify-code", { email, password, code });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      setServerError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-start">
          <img src="/Deakin_logo.png" alt="App Logo" className="h-15 w-auto" />
          <div className="flex flex-col gap-4 text-2xl font-bold">Sign Up</div>
          <div className="text-sm text-muted-foreground">
            Create an account to access the assignment marking portal
          </div>
        </CardHeader>
        <CardContent>
          {serverError && (
            <p className="text-red-600 text-sm mb-4">{serverError}</p>
          )}

          {step === 1 && (
            <form onSubmit={e => { e.preventDefault(); sendCode(); }}>
              <div className="grid gap-6">
                {/* Email */}
                <div className="grid gap-3 relative">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>

                {/* Password */}
                <div className="grid gap-3 relative">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password"
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                      onClick={() => setShowPassword(prev => !prev)}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div className="grid gap-3 relative">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm password"
                      required
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={errors.confirmPassword ? "border-red-500" : ""}
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500"
                      onClick={() => setShowConfirm(prev => !prev)}
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || Object.keys(errors).length > 0 || !email || !password || !confirmPassword}
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>

                <div className="text-center text-xs cursor-pointer" onClick={() => navigate("/login")}>
                  Already have an account? <span className="underline underline-offset-4">Login</span>
                </div>
              </div>
            </form>
          )}


          {/* If up to entering code, display this stuff instead */}
          {step === 2 && (
            <div className="grid gap-6">
              <div className="grid gap-3 relative">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter code"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={verifyAndSignup}
                disabled={loading || !code}
              >
                {loading ? "Verifying..." : "Verify & Sign Up"}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={sendCode}
                disabled={cooldown > 0 || loading}
              >
                {cooldown > 0 ? `Resend Code (${cooldown}s)` : "Resend Code"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-white text-center text-xs mt-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
