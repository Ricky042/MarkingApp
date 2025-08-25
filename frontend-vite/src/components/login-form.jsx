import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import axios from "axios";
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
      console.log("Attempting login..."); // Debug log
      const res = await axios.post("/api/login", { username, password });
      
      console.log("Login response:", res.data); // Debug log

      if (res.data.token) {
        // Store JWT safely
        localStorage.setItem("token", res.data.token);
        console.log("Token stored:", localStorage.getItem("token")); // Debug log

        // also store user info if backend sends it
        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
        }

        // Dispatch custom event to notify App.jsx of auth change
        window.dispatchEvent(new Event('authChange'));
        console.log("Auth change event dispatched"); // Debug log

        alert("Login successful!");
        
        // Navigate immediately - the App.jsx will handle the auth check
        navigate("/home");
        console.log("Navigate to /home called"); // Debug log
        
      } else {
        alert(res.data.message || "No token received");
      }
    } catch (err) {
      console.error("Login error:", err); // Better error logging
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
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
                  onClick={() => setShowPassword(prev => !prev)}
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