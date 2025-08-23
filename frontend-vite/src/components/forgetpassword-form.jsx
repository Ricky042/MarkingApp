import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function ForgetPasswordForm({
  className,
  ...props
}) {
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
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (password && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(password)) {
      newErrors.password = "Password must be ≥6 chars, with uppercase, lowercase, and number/symbol.";
    }
    if (confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
  }, [email, password, confirmPassword]);
  

  // Send verification code
  const sendCode = async () => {
    if (Object.keys(errors).length > 0 || !email) return;
    try {
      setLoading(true);
      setServerError("");
      await axios.post("/api/send-code", { email });
      alert("Verification code sent to your email");
      setStep(2);
      setCooldown(30); // 30s before resend
    } catch (err) {
      setServerError(err.response?.data?.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };



  const verifyAndResetPassword = async () => {
    if (!code) return;
    try {
      setLoading(true);
      setServerError("");
      const res = await axios.post("/api/verify-code", { email, password, code });
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
          <div className="flex flex-col gap-4 text-2xl font-bold">
            Reset Password
          </div>
          <div className="text-sm text-muted-foreground">
            Change your password by entering your email and verification code
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

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading || Object.keys(errors).length > 0 || !email}
                >
                  {loading ? "Sending..." : "Send Verification Code"}
                </Button>

                <div className="text-center text-xs cursor-pointer" onClick={() => navigate("/login")}>
                  Recall your password? <span className="underline underline-offset-4">Login</span>
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
                onClick={verifyAndResetPassword}
                disabled={loading || !code}
              >
                {loading ? "Verifying..." : "Verify & Reset Password"}
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
