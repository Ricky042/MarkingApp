import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react";
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
    if (Object.keys(errors).length > 0 || !email || !password || !confirmPassword) return;
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

  const handleResetPassword = async () => {
      try {
        const res = await axios.put("/api/forgetpassword", { username, newPassword });
        alert(res.data.message);
        navigate("/login");
      } catch (err) {
        alert(err.response?.data?.message || "Password reset failed");
      }
    };




















  

return (
    (<div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-start">
          <img src="/Deakin_logo.png" alt="App Logo" className="h-15 w-auto" />

          <div className="flex flex-col gap-4 text-2xl font-bold">
            Reset Password
          </div>
          <div className="text-sm text-muted-foreground">Reset your account password</div>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid gap-6">
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="m@example.com" required value={username} onChange={(e) => setUsername(e.target.value)}/>
                </div>
                {/* <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Enter your Password</Label>
                  </div>
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>
                 <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Confirm your Password</Label>
                  </div> -->
                  <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}/>
                </div>*/}
                <Button type="submit" className="w-full" onClick={handleResetPassword}>
                  Send 6 digits varification code through email
                </Button>
              </div>
              <div className="text-center text-xs" onClick={() => navigate("/login")}>
                Recall your password?{" "}
                <a href="#" className="underline underline-offset-4">
                  Login
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div
        className="text-white *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>)
  );
}
