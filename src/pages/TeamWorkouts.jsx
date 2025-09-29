// src/pages/TeamWorkouts.jsx
import { useState, useEffect } from "react";
import { Card, Title } from "@mantine/core";

export default function TeamWorkouts() {
  const [teamWorkouts, setTeamWorkouts] = useState([]);

  useEffect(() => {
    fetch("https://bladeapi.onrender.com/workouts")
      .then((res) => res.json())
      .then(setTeamWorkouts);
  }, []);

  return (
    <Card shadow="md" radius="lg" withBorder padding="lg">
      <Title order={3} mb="md">
        Team Workouts
      </Title>
      {teamWorkouts.length === 0 ? (
        <p>No team workouts yet.</p>
      ) : (
        <ul>
          {teamWorkouts.map((w, i) => (
            <li key={i}>
              {w.date.slice(0, 10)} – {w.distance}m by {w.user}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
