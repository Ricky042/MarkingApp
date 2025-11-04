import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import api from "../utils/axios";
import { useNavigate, useSearchParams } from "react-router-dom";

export function LoginForm({ className, ...props }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  // 如果有重定向参数，保存到 sessionStorage
  useEffect(() => {
    if (redirect) {
      console.log('Found redirect parameter:', redirect);
      sessionStorage.setItem('loginRedirect', redirect);
    }
  }, [redirect]);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // 1. Perform login
      const res = await api.post("/login", { username, password });

      if (!res.data.token) {
        alert(res.data.message || "Login failed: No token received.");
        setIsLoading(false);
        return;
      }

      // 2. Set authentication artifacts
      localStorage.setItem("token", res.data.token);
      if (res.data.user) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      // 3. 检查是否有重定向路径
      const redirectPath = sessionStorage.getItem('loginRedirect') || sessionStorage.getItem('pendingInviteToken');
      
      if (redirectPath) {
        console.log('Redirecting after login to:', redirectPath);
        sessionStorage.removeItem('loginRedirect');
        sessionStorage.removeItem('pendingInviteToken');
        
        // 如果是 pendingInviteToken，构造完整的 URL
        if (redirectPath.startsWith('/join-team')) {
          navigate(redirectPath);
        } else {
          // 如果是 token，构造 join-team URL
          navigate(`/join-team?token=${redirectPath}`);
        }
      } else {
        // 4. 没有重定向路径，使用默认行为
        console.log('No redirect path, using default behavior');
        window.dispatchEvent(new Event("authChange"));
      }

    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-0">
        <CardHeader className="items-start">
          <div className="relative h-11 pl-1 flex items-start justify-start">
            <img src="/logo_black.png" alt="Logo" className="w-[140px] h-fit object-contain" />
          </div>
       
          
          <div className="text-sm text-muted-foreground">
            Login to your assignment marking portal
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <div className="grid gap-6">
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="border-0"
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="border-0"
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div
                className="text-center text-xs cursor-pointer underline underline-offset-4"
                onClick={() => navigate("/forgetpassword")}
              >
                Forget your password?
              </div>

              <Button type="submit" className="w-full cursor-pointer bg-[#201f30] hover:bg-[#201f30]/80" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <div
                className="text-center text-xs cursor-pointer"
                onClick={() => navigate("/signup")}
              >
                Don&apos;t have an account?{" "}
                <span className="underline underline-offset-4">Sign up</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-white text-center text-xs mt-4">
        By clicking continue, you agree to our{" "}
        <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}