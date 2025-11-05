import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "../utils/axios";

export default function CreateTeam() {
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreateTeam = async () => {
    if (!name.trim()) {
      alert("Team name is required.");
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await api.post(
        "/create-team",
        { name },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Team created:", res.data);

      // Redirect to the new team's dashboard
      const newTeamId = res.data.team.id;
      navigate(`/team/${newTeamId}/dashboard`);
    } catch (err) {
      console.error("Failed to create team:", err);
      alert(err.response?.data?.message || "Failed to create team.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-deakinTeal/50 bg-cover bg-center relative"
    >
      <div className={cn("flex flex-col gap-6 w-[500px]")}>
        <Card className="border-0">
          <CardHeader className="items-start">
            <div className="relative h-11 pl-1 flex items-start justify-start">
              <img src="/logo_black.png" alt="Logo" className="w-[140px] h-fit object-contain" />
            </div>
            <div className="text-sm text-muted-foreground">
              Create a new team for your assignment marking portal
            </div>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCreateTeam();
              }}
            >
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="teamName">Team Name</Label>
                  <Input
                    id="teamName"
                    type="text"
                    placeholder="Enter team name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isLoading}
                    className="border-0"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full cursor-pointer bg-[#201f30] hover:bg-[#201f30]/80" 
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Team..." : "Create Team"}
                </Button>

               
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
