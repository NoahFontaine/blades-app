import { useState, useEffect } from "react";
import {
  Button,
  Stack,
  Card,
  Title,
  Modal,
  Group,
  Badge,
  Select,
  NumberInput,
} from "@mantine/core";
import { DateInput, TimePicker } from "@mantine/dates";
import { addWorkout } from "../functions/workoutFunctions";
import MyPastWorkouts from "./myWorkoutComponents/MyPastWorkouts";
import MyStats from "./myWorkoutComponents/MyStats";


export default function MyWorkouts({ signInUser, role }) {
  const [distance, setDistance] = useState("");
  const [type, setType] = useState("");
  const [sport, setSport] = useState("");
  const [date, setDate] = useState(null);
  const [intensity, setIntensity] = useState("");
  const [durationTime, setDurationTime] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [opened, setOpened] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadWorkouts = async () => {
    try {
      const res = await fetch("https://bladeapi.onrender.com/workouts");
      const data = await res.json();
      setWorkouts(Array.isArray(data) ? data : []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  // Convert durationTime (string) -> minutes (number)
  const durationMinutes = (() => {
    if (!durationTime || typeof durationTime !== "string") return 0;
    const [hh, mm] = durationTime.split(":").map(Number);
    if (Number.isNaN(hh) || Number.isNaN(mm)) return 0;
    return hh * 60 + mm;
  })();

  const handleSave = () =>
    addWorkout({
      signInUser,
      distance,
      date,
      sport,
      type,
      duration: durationMinutes,
      intensity,
      role,
      setDistance,
      setDate,
      setSport,
      setType,
      setDuration: () => setDurationTime(null),
      setIntensity,
      setSubmitting,
      loadWorkouts,
      closeModal: () => setOpened(false),
    });

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
        title={
          <Group gap="sm">
            <Title order={4} style={{ margin: 0 }}>
              Log Workout
            </Title>
            <Badge
              variant="light"
              radius="xl"
              color={
                role?.startsWith("M")
                  ? "teal"
                  : role?.startsWith("W")
                  ? "blue"
                  : role === "Coach"
                  ? "grape"
                  : "gray"
              }
            >
              {role && role !== "None" ? role : "No squad"}
            </Badge>
          </Group>
        }
        centered
        overlayProps={{ opacity: 0.75, blur: 3 }}
        radius="lg"
      >
        <Stack gap="sm">
          <Select
            label="Sport"
            placeholder="Choose sport"
            data={[
              "Rowing",
              "Cycling",
              "Weights",
              "Running",
              "Walking",
              "OTHER",
            ]}
            value={sport}
            onChange={setSport}
            searchable
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
              {["Very Low", "Low", "Medium", "High", "Very High"].map((lvl) => {
                const color =
                  lvl === "Very High"
                    ? "red"
                    : lvl === "High"
                    ? "orange"
                    : lvl === "Medium"
                    ? "yellow"
                    : lvl === "Low"
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
            label="Duration (hh:mm)"
            value={durationTime}
            onChange={setDurationTime}
            withSeconds={false}
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
              onClick={handleSave}
              disabled={
                submitting ||
                !date ||
                !sport ||
                !type ||
                !durationMinutes ||
                !intensity
              }
              loading={submitting}
            >
              Save
            </Button>
          </Group>
        </Stack>
      </Modal>

      <MyStats workouts={workouts} />
      <MyPastWorkouts workouts={workouts} />
    </Stack>
  );
}
