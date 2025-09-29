import { useState, useEffect } from "react";
import { Button, TextInput, Stack, Card, Title } from "@mantine/core";

export default function MyWorkouts() {
  const [distance, setDistance] = useState("");
  const [workouts, setWorkouts] = useState([]);

  useEffect(() => {
    fetch("https://bladeapi.onrender.com/workouts")
      .then((res) => res.json())
      .then(setWorkouts);
  }, []);

  const addWorkout = async () => {
    await fetch("https://bladeapi.onrender.com/enter_workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        distance: Number(distance),
        date: new Date().toISOString(),
      }),
    });
    setDistance("");
    const res = await fetch("https://bladeapi.onrender.com/workouts");
    setWorkouts(await res.json());
  };

  return (
    <Stack>
      <Card shadow="md" radius="lg" withBorder padding="lg">
        <Title order={3} mb="md">
          Log Workout
        </Title>
        <TextInput
          label="Distance (m)"
          value={distance}
          onChange={(e) => setDistance(e.currentTarget.value)}
        />
        <Button mt="md" onClick={addWorkout} variant="filled" color="blue">
          Add Workout
        </Button>
      </Card>

      <Card shadow="md" radius="lg" withBorder padding="lg">
        <Title order={3} mb="md">
          My Past Workouts
        </Title>
        {workouts.length === 0 ? (
          <p>No workouts logged yet.</p>
        ) : (
          <ul>
            {workouts.map((w, i) => (
              <li key={i}>
                {w.date.slice(0, 10)} – {w.distance}m
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Stack>
  );
}
