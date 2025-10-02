import { useState, useEffect } from "react";
import { Button, TextInput, Stack, Card, Title, Modal, Group } from "@mantine/core";
import { Select, NumberInput } from "@mantine/core";
import { DateInput, TimePicker } from "@mantine/dates";

export default function MyWorkouts() {
  const [distance, setDistance] = useState("");
  const [type, setType] = useState("");
  const [sport, setSport] = useState("");
  const [date, setDate] = useState("");
  const [intensity, setIntensity] = useState("");
  const [duration, setDuration] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [opened, setOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadWorkouts = async () => {
    try {
      const res = await fetch("https://bladeapi.onrender.com/workouts");
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch {
      // ignore for now
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const addWorkout = async () => {
    if (!distance) return;
    setSubmitting(true);
    try {
      await fetch("https://bladeapi.onrender.com/enter_workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance: Number(distance),
            date: new Date().toISOString(),
        }),
      });
      setDistance("");
      await loadWorkouts();
      setOpened(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack>
      <Group justify="flex-end">
        <Button onClick={() => setOpened(true)} variant="light">
          New Workout
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={<Title order={4}>Log Workout</Title>}
        centered
        overlayProps={{ opacity: 0.75, blur: 3 }}
        radius="lg"
      >
        <Stack gap="sm">
          <Select
            label="Sport"
            placeholder="Choose sport"
            data={["Rowing", "Cycling", "Running", "Walking", "Climbing", "OTHER"]}
            value={sport}
            onChange={setSport}
            searchable
            nothingFoundMessage="No sport"
          />
          <Select
            label="Workout Type"
            placeholder="e.g. Steady, Intervals..."
            data={["Steady", "Intervals", "Tempo", "Test", "Recovery"]}
            value={type}
            onChange={setType}
            searchable
          />
          <Stack gap={4}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Intensity</span>
            <Group gap="xs">
              {["very low", "low", "medium", "high", "very high"].map((lvl) => {
                const color =
                  lvl === "very high"
                    ? "red"
                    : lvl === "high"
                    ? "orange"
                    : lvl === "medium"
                    ? "yellow"
                    : lvl === "low"
                    ? "teal"
                    : "green";
                return (
                  <Button
                    key={lvl}
                    size="xs"
                    variant={intensity === lvl ? "filled" : "light"}
                    color={color}
                    onClick={() => setIntensity(intensity === lvl ? "" : lvl)}
                  >
                    {lvl
                      .split(" ")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </Button>
                );
              })}
            </Group>
          </Stack>
          <NumberInput
            label="Distance (m)"
            placeholder="e.g. 5000"
            value={distance}
            onChange={(v) => setDistance(v ? String(v) : "")}
            min={0}
            thousandSeparator=","
          />
          <TimePicker
            label="Duration (hr:min)"
            value={duration}
            onChange={setDuration}
            min={0}
          />
          <DateInput
            label="Date"
            value={date}
            onChange={setDate}
            placeholder="Pick date"
            valueFormat="YYYY-MM-DD"
            clearable
          />
          <Group justify="flex-end" gap="sm" mt="sm">
            <Button variant="subtle" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button
              onClick={addWorkout}
              disabled={
                !distance ||
                !date ||
                !sport ||
                !type ||
                !duration ||
                !intensity ||
                submitting
              }
              loading={submitting}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

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
    </Stack>
  );
}
