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
      console.log("=== Login started ===");
      console.log("Current localStorage token:", localStorage.getItem("token"));
      console.log("Current localStorage user:", localStorage.getItem("user"));

      // Login request
      const res = await api.post("/login", { username, password });
      console.log("Login response:", res.data);

      if (!res.data.token) {
        console.warn("No token received in login response.");
        alert(res.data.message || "No token received");
        return;
      }

      const token = res.data.token;
      console.log("Storing token in localStorage:", token);
      localStorage.setItem("token", token);

      if (res.data.user) {
        console.log("Storing user in localStorage:", res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      } else {
        console.warn("No user object received from login response.");
        localStorage.removeItem("user");
      }

      window.dispatchEvent(new Event("authChange"));
      console.log("Auth change event dispatched.");

      // Check for pending invite
      const pendingInviteToken = sessionStorage.getItem("pendingInviteToken");
      console.log("Pending invite token in sessionStorage:", pendingInviteToken);

      if (pendingInviteToken) {
        console.log("Redirecting to join-team page for pending invite.");
        navigate(`/join-team?token=${pendingInviteToken}`);
        sessionStorage.removeItem("pendingInviteToken"); // ✅ prevent router from overriding
        return;
      }

      // If no pending invite, check if user has a team
      console.log("No pending invite. Checking user's teams...");
      const teamRes = await api.get("/my-team", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Team check response:", teamRes.data);

      if (teamRes.data.hasTeams && teamRes.data.teams.length > 0) {
        const firstTeamId = teamRes.data.teams[0].id;
        console.log("Navigating to first team dashboard:", firstTeamId);
        navigate(`/team/${firstTeamId}/dashboard`);
      } else {
        console.log("No teams found. Navigating to create-team page.");
        navigate("/create-team");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
      console.log("=== Login finished ===");
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