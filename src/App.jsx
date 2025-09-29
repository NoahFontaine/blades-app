import { useState } from "react";
import {
  Box,
  Container,
  UnstyledButton,
  useMantineTheme,
  rem,
} from "@mantine/core";
import MyWorkouts from "./pages/MyWorkouts";
import TeamWorkouts from "./pages/TeamWorkouts";

export default function App() {
  const [view, setView] = useState("my");
  const theme = useMantineTheme();
  console.log(theme);

  const Pill = ({ value, label }) => {
    const active = view === value;
    return (
      <UnstyledButton
        role="tab"
        aria-selected={active}
        onClick={() => setView(value)}
        style={{
          flex: "0 0 auto",
          padding: "1.3rem 1.3rem",
            borderRadius: "999px",
            fontSize: rem(18),
            fontWeight: 600,
            lineHeight: 1,
            cursor: "pointer",
            backgroundColor: active
            ? value === "my"
              ? "transparent"
              : theme.colors.blue[7]// : theme.colors.indigo[0]
            : "white",
            border: active
            ? value === "my"
              ? `2px solid ${theme.colors.teal[7]}`
              : "2px solid transparent" // : `2px solid ${theme.colors.indigo[7]}`
            : "2px solid transparent",
            color: active
            ? value === "my"
              ? theme.colors.teal[7]
              : "white"              // : theme.colors.indigo[7]
            : theme.colors.gray[7],
            transition: "background-color 120ms, border-color 120ms, color 120ms",
          }}
        onMouseEnter={(e) => {
          if (!active) {
            if (value === "my") {
              e.currentTarget.style.backgroundColor = theme.colors.teal[0];
            } else {
              e.currentTarget.style.backgroundColor = theme.colors.blue[0];
            }
          }
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.backgroundColor = "white";
        }}
        >
        {label}
      </UnstyledButton>
    );
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundColor: "white",
      }}
    >
      <Container fluid py="lg" px={0}>
        {/* Pill group */}
        <Box
          role="tablist"
          aria-label="Workout views"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "10rem",
            margin: "1rem auto 1.5rem",
            width: "100%",
          }}
        >
          <Pill value="my" label="My Workouts" />
          <Box
            style={{
              width: "2px",
              height: "2.5rem",
              backgroundColor: theme.colors.gray[3],
              alignSelf: "center",
              borderRadius: "1px",
            }}
          />
          <Pill value="team" label="Team Workouts" />
        </Box>

        {/* Panels */}
        <Box role="tabpanel" hidden={view !== "my"}>
          {view === "my" && <MyWorkouts />}
        </Box>
        <Box role="tabpanel" hidden={view !== "team"}>
          {view === "team" && <TeamWorkouts />}
        </Box>
      </Container>
    </Box>
  );
}
