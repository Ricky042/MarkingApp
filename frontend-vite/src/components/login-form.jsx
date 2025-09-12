import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import api from "../utils/axios";
import { useNavigate } from "react-router-dom";

export function LoginForm({ className, ...props }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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

      // 3. Notify the app that authentication has changed
      // App.jsx will now handle the redirect automatically.
      window.dispatchEvent(new Event("authChange"));

    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Login failed");
      setIsLoading(false); // Ensure loading is stopped on error
    }
    // No need to set isLoading to false here, as the component will unmount upon successful redirect.
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-start">
          <img src="/Deakin_logo.png" alt="App Logo" className="h-15 w-auto" />
          <div className="flex flex-col gap-4 text-2xl font-bold">Login</div>
          <div className="text-sm text-muted-foreground">
            Login to assignment marking portal
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
                />
              </div>

              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 -translate-x-1 text-sm text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                  disabled={isLoading}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              <div
                className="text-center text-xs cursor-pointer underline underline-offset-4"
                onClick={() => navigate("/forgetpassword")}
              >
                Forget your password?
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
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