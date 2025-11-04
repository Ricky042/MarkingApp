import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import api from "../utils/axios";
import LoadingSpinner from "../components/LoadingSpinner";

export default function JoinTeam() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token"); // invite token from URL
  const navigate = useNavigate();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [responseStatus, setResponseStatus] = useState(null);
  const [isResponding, setIsResponding] = useState(false);

  useEffect(() => {
    const checkInvite = async () => {
      console.log("=== JoinTeam page started ===");
      console.log("Invite token from URL:", token);

      if (!token) {
        setError("Invalid invite link");
        setLoading(false);
        return;
      }

      const storedJWT = localStorage.getItem("token");
      console.log("Stored JWT:", storedJWT);

      const storedUserJSON = localStorage.getItem("user");
      const storedUser = storedUserJSON ? JSON.parse(storedUserJSON) : null;
      console.log("Current logged-in user:", storedUser);

      if (!storedUser) {
        console.log("Not logged in. Storing pending invite and redirecting to login/signup.");
        localStorage.removeItem("token");
        window.dispatchEvent(new Event("authChange"));
        sessionStorage.setItem("pendingInviteToken", token);
        navigate("/login");
        return;
      }

      try {
        const res = await api.get(`/team/invite/${token}`, {
          headers: { Authorization: `Bearer ${storedJWT}` },
        });

        console.log("Invite fetched:", res.data);
        setInvite(res.data);

        // Verify that the invite email matches the logged-in user
        if (storedUser.username !== res.data.invitee_email) {
            console.warn("Logged-in user does not match invitee email.");

            // Clear stored user and token
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.dispatchEvent(new Event("authChange"));

            // Save the pending invite token so user can accept after logging in
            sessionStorage.setItem("pendingInviteToken", token);

            // Redirect to login
            navigate("/login");
            return;
        }

      } catch (err) {
        if (err.response && err.response.status === 401) {
          console.log("JWT invalid/expired. Storing pending invite and redirecting to login/signup.");
          sessionStorage.setItem("pendingInviteToken", token);
          navigate("/login");
        } else {
          console.error("Error fetching invite:", err);
          setError(err.response?.data?.error || "Failed to fetch invite");
        }
      } finally {
        setLoading(false);
      }
    };

    checkInvite();
  }, [token, navigate]);

  const handleRespond = async (action) => {
    const storedJWT = localStorage.getItem("token");
    if (!storedJWT) return navigate("/login");

    setIsResponding(true);
    try {
      const res = await api.post(
        `/team/invite/${token}/respond`,
        { action },
        { headers: { Authorization: `Bearer ${storedJWT}` } }
      );

      console.log("Invite response:", res.data);
      setResponseStatus(res.data.message);

      sessionStorage.removeItem("pendingInviteToken");

      // Small delay before navigation to show success message
      setTimeout(async () => {
        if (action === "accept") {
          navigate(`/team/${invite.team_id}/dashboard`);
        } else {
          // Check if user has other teams
          try {
            const teamRes = await api.get("/my-team", {
              headers: { Authorization: `Bearer ${storedJWT}` },
            });
            if (teamRes.data.hasTeams && teamRes.data.teams.length > 0) {
              navigate(`/team/${teamRes.data.teams[0].id}/dashboard`);
            } else {
              navigate("/create-team");
            }
          } catch (err) {
            navigate("/create-team");
          }
        }
      }, 1000);
    } catch (err) {
      console.error("Failed to respond to invite:", err);
      setError(err.response?.data?.error || "Failed to respond to invite");
      setIsResponding(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-deakinTeal/50 bg-cover bg-center relative">
      <LoadingSpinner pageName="Join Team" />
    </div>
  );
  
  if (error) return (
    <div className="flex items-center justify-center min-h-screen bg-deakinTeal/50 bg-cover bg-center relative">
      <div className={cn("flex flex-col gap-6 w-[500px]")}>
        <Card className="border-0">
          <CardContent className="pt-6">
            <div className="text-red-500 text-center">{error}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
  
  if (!invite) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-deakinTeal/50 bg-cover bg-center relative">
      <div className={cn("flex flex-col gap-6 w-[500px]")}>
        <Card className="border-0">
          <CardHeader className="items-start">
            <div className="relative h-11 pl-1 flex items-start justify-start">
              <img src="/logo_black.png" alt="Logo" className="w-[140px] h-fit object-contain" />
            </div>
            <div className="text-sm text-muted-foreground">
              You've been invited to join a team
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Team Name</p>
                  <p className="text-lg font-semibold text-slate-900">{invite.team_name}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Invited by</p>
                  <p className="text-sm text-slate-600">{invite.inviter_email}</p>
                </div>
              </div>

              {responseStatus && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 text-center">{responseStatus}</p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700 text-center">{error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => handleRespond("accept")}
                  disabled={isResponding}
                  className="flex-1 cursor-pointer bg-[#201f30] hover:bg-[#201f30]/80"
                >
                  {isResponding ? "Processing..." : "Accept Invitation"}
                </Button>
                <Button
                  onClick={() => handleRespond("deny")}
                  disabled={isResponding}
                  variant="outline"
                  className="flex-1 cursor-pointer hover:bg-slate-200/80 shadow-sm"
                >
                  Decline
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
