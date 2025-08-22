import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export function SignupForm({ className, ...props }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [sentCode, setSentCode] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  // Live validation
  useEffect(() => {
    const newErrors = {};

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
  }, [email, password, confirmPassword]);

  // Send verification code
  const handleSendCode = async () => {
    if (errors.email) return;

    try {
      await axios.post("/api/send-code", { email });
      setSentCode(true);
      alert("Verification code sent to your email.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to send code");
    }
  };

  // Verify code and create account
  const handleVerifyCode = async () => {
    if (Object.keys(errors).length > 0) return;
    if (!code) {
      alert("Please enter the verification code.");
      return;
    }

    try {
      const res = await axios.post("/api/verify-code", { email, password, code });
      alert(res.data.message);
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
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
          <form className="grid gap-6">
            {/* Email */}
            <div className="grid gap-3">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={errors.email ? "border-red-500" : ""}
                disabled={sentCode}
              />
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            {!sentCode && (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={errors.password ? "border-red-500" : ""}
                  />
                  {errors.password && (
                    <p className="text-red-600 text-xs mt-1">{errors.password}</p>
                  )}
                </div>

                <div className="grid gap-3">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={errors.confirmPassword ? "border-red-500" : ""}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="button"
                  className="w-full"
                  onClick={handleSendCode}
                  disabled={Object.keys(errors).length > 0 || !email || !password || !confirmPassword}
                >
                  Send Verification Code
                </Button>
              </>
            )}

            {/* Verification Code Input */}
            {sentCode && (
              <>
                <div className="grid gap-3">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    placeholder="Enter code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleVerifyCode}
                  disabled={!code}
                >
                  Verify & Sign Up
                </Button>
              </>
            )}

            <div className="text-center text-xs mt-2" onClick={() => navigate("/login")}>
              Already have an account?{" "}
              <a href="#" className="underline underline-offset-4">
                Login
              </a>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="text-white text-center text-xs mt-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a> and{" "}
        <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
