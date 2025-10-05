import { Card, Title } from "@mantine/core";

export default function MyPastWorkouts({ workouts }) {
  return (
    <Card withBorder padding="lg" radius="lg">
      <Title order={2} mb="md">
        My Past Workouts
      </Title>
      {workouts.length === 0 ? (
        <p style={{ margin: 0 }}>No workouts logged yet.</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
          {workouts.map((w, i) => (
            <li key={i}>
              {w.date?.slice(0, 10)} – {w.distance}m
              {w.duration && ` • ${w.duration}min`}
              {w.sport && ` • ${w.sport}`}
              {w.type && ` • ${w.type}`}
              {w.intensity && ` • ${w.intensity}`}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
