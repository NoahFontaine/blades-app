import { Center, Stack, Title, Text, Button, Group, Paper } from "@mantine/core";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Auth";

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Center style={{ minHeight: "100vh", padding: "2rem" }}>
      <Stack align="center" gap="xl" style={{ maxWidth: 560, width: "100%" }}>
        <Title order={1} ta="center">PCBC Blades</Title>
        <Text ta="center" c="dimmed">
          Welcome{user?.displayName ? `, ${user.displayName.split(" ")[0]}` : ""}. Choose where to go.
        </Text>
        <Group justify="center" gap="lg" wrap="wrap" style={{ width: "100%" }}>
          <Paper withBorder p="lg" radius="lg" style={{ width: 240 }}>
            <Title order={4} mb="xs">Workouts</Title>
            <Text size="sm" c="dimmed" mb="sm">
              Log your training, view personal and squad analytics.
            </Text>
            <Button fullWidth onClick={() => navigate("/workouts")}>Open Workouts</Button>
          </Paper>
          <Paper withBorder p="lg" radius="lg" style={{ width: 240 }}>
            <Title order={4} mb="xs">Crew</Title>
            <Text size="sm" c="dimmed" mb="sm">
              View teammates, squads, and shared progress.
            </Text>
            <Button fullWidth onClick={() => navigate("/crew")}>Open Crew</Button>
          </Paper>
        </Group>
      </Stack>
    </Center>
  );
}