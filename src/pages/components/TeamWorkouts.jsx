import { useState, useEffect } from "react";
import { Loader, Text } from "@mantine/core";
import TeamPastWorkouts from "./teamWorkoutComponents/TeamPastWorkouts";
import TeamStats from "./teamWorkoutComponents/TeamStats";

const API_BASE = import.meta.env.VITE_API_BASE;

export default function TeamWorkouts({ signInUser, role }) {
  const [teamWorkouts, setTeamWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadedRole, setLoadedRole] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!role || role === "None") return;
    if (loadedRole === role && teamWorkouts.length > 0) return; // already fetched for this role
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = role === "Coach" ? "" : `?squad=${encodeURIComponent(role)}`;
        const res = await fetch(`${API_BASE}/workouts${qs}`);
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();
        if (cancelled) return;
        // newest first
        data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setTeamWorkouts(data);
        setLoadedRole(role);
      } catch (e) {
        if (!cancelled) setError("Failed to load team workouts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [role, loadedRole, teamWorkouts.length]);

  if (!role || role === "None") {
    return <Text c="dimmed" size="sm">Select a squad/role to view team workouts.</Text>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {loading && teamWorkouts.length === 0 && <Loader size="sm" />}
      {error && <Text c="red" size="sm">{error}</Text>}
      <TeamPastWorkouts signInUser={signInUser} role={role} workouts={teamWorkouts} loading={loading} />
      <TeamStats workouts={teamWorkouts} />
    </div>
  );
}
