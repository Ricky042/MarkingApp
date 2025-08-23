import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const navigate = useNavigate();

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
