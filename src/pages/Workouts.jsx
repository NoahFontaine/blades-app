import { useState, useEffect } from "react";
import {
  Box,
  Container,
  UnstyledButton,
  useMantineTheme,
  rem,
  Menu,
  Avatar,
  Modal,
  Text,
  Group,
  Button,
  Divider,
  Image,
} from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import MyWorkouts from "./components/MyWorkouts";
import TeamWorkouts from "./components/TeamWorkouts";
import { addUser, findUserFromName } from "./functions/userFunctions";
import { useAuth } from "../Auth";

export default function Home() {
  const [view, setView] = useState("my");
  const [profileOpen, setProfileOpen] = useState(false);
  const theme = useMantineTheme();
  const { user: signInUser, signout } = useAuth();
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const [updatingRole, setUpdatingRole] = useState(false);

  const roleOptions = [
    "M1",
    "M2",
    "M3",
    "M4",
    "W1",
    "W2",
    "W3",
    "W4",
    "Coach",
    "None",
  ];

  // Fetch role once user is available
  useEffect(() => {
    if (!signInUser) return;
    let cancelled = false;
    async function fetchRole() {
      setLoadingRole(true);
      try {
        const user_email = encodeURIComponent(signInUser?.email || "");
        const res = await fetch(
          `https://bladeapi.onrender.com/users?email=${user_email}`
        );
        if (!res.ok) throw new Error("Failed role fetch");
        const data = await res.json();
        if (!cancelled) {
          setRole(data[0]?.squad || "None");
        }
      } catch {
        if (!cancelled) setRole("None");
      } finally {
        if (!cancelled) setLoadingRole(false);
      }
    }
    fetchRole();
    return () => {
      cancelled = true;
    };
  }, [signInUser]);

  async function handleRoleChange(newRole) {
    if (newRole === role || updatingRole) return;
    const prev = role;
    setRole(newRole);            // optimistic update
    setUpdatingRole(true);
    try {
      await addUser(signInUser, newRole);
    } catch (err) {
      console.error("Role update failed:", err);
      setRole(prev);             // revert on failure
    } finally {
      setUpdatingRole(false);
    }
  }

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
              : theme.colors.blue[7] // : theme.colors.indigo[0]
            : "white",
          border: active
            ? value === "my"
              ? `2px solid ${theme.colors.teal[7]}`
              : "2px solid transparent" // : `2px solid ${theme.colors.indigo[7]}`
            : "2px solid transparent",
          color: active
            ? value === "my"
              ? theme.colors.teal[7]
              : "white" // : theme.colors.indigo[7]
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
        position: "relative",
      }}
    >
      {/* Top-left martlet icon */}
      <Box
        style={{
          position: "absolute",
          top: 12,
          left: 20,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
        onClick={() => setView("my")}
        title="Go to My Workouts"
      >
        <Image
          src="/martlet_icon_transparent.png"
          alt="Club Martlet"
          w={108}
          h={108}
        />
      </Box>

      {/* Existing top-right user menu */}
      <Box
        style={{
          position: "absolute",
          top: 12,
          right: 14,
          zIndex: 10,
        }}
      >
        <Menu
          width={190}
          position="left-end"
          radius="lg"
          shadow="sm"
          withinPortal
        >
          <Menu.Target>
            <UnstyledButton
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.4rem 0.4rem",
                background: "white",
                borderRadius: 999,
                cursor: "pointer",
                transition: "background-color 120ms,border-color 120ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = theme.colors.gray[2])
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "white")
              }
            >
              {(() => {
                const initials = (() => {
                  const name = signInUser?.name?.trim();
                  if (name) {
                    const parts = name.split(/\s+/).filter(Boolean);
                    if (parts.length === 1)
                      return parts[0].slice(0, 2).toUpperCase();
                    return (
                      parts[0][0] + parts[parts.length - 1][0]
                    ).toUpperCase();
                  }
                  const email = signInUser?.email;
                  if (email) {
                    const handle = email.split("@")[0];
                    const parts = handle.split(/[\.\-_]+/).filter(Boolean);
                    if (parts.length === 0) return "?";
                    if (parts.length === 1)
                      return parts[0].slice(0, 2).toUpperCase();
                    return (
                      parts[0][0] + parts[parts.length - 1][0]
                    ).toUpperCase();
                  }
                  return "?";
                })();
                return (
                  <Avatar
                    radius="xl"
                    size={38}
                    color="gray"
                    style={{ fontSize: rem(14), fontWeight: 600 }}
                  >
                    {initials}
                  </Avatar>
                );
              })()}
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item
              leftSection={<IconUser size={16} />}
              onClick={() => setProfileOpen(true)}
            >
              Profile
            </Menu.Item>
            <Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={async () => {
                await signout();
                }}
                >
                Sign out
                </Menu.Item>
                </Menu.Dropdown>
              </Menu>
              </Box>

              <Container fluid py="lg" px="lg">
                <Box
                role="tablist"
                aria-label="Workout views"
                style={{
                  position: "relative",
                  width: "100vw",
                  maxWidth: "100%",
                  height: "3.6rem",
                  margin: "1rem auto 2.5rem",
                }}
                >
                {/* Center vertical divider */}
                <Box
                  aria-hidden="true"
                  style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "2px",
                  height: "2.5rem",
                  backgroundColor: theme.colors.gray[3],
                  borderRadius: "1px",
                  }}
                />
                {/* My Workouts pill at 35% */}
                <Box
                  style={{
                  position: "absolute",
                  left: "35%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  }}
                >
                  <Pill value="my" label="My Workouts" />
                </Box>
                {/* Team Workouts pill at 65% */}
                <Box
                  style={{
                  position: "absolute",
                  left: "65%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  }}
                >
                  <Pill value="team" label="Team Workouts" />
                </Box>
                </Box>

                <Box role="tabpanel" hidden={view !== "my"}>
                {view === "my" && <MyWorkouts signInUser={signInUser} role={role} />}
                </Box>
                <Box role="tabpanel" hidden={view !== "team"}>
                {view === "team" && (
                  <TeamWorkouts signInUser={signInUser} role={role} />
                )}
                </Box>
              </Container>

              <Modal
                opened={profileOpen}
                onClose={() => setProfileOpen(false)}
                title="Profile"
                centered
                radius="lg"
                size={580}
              >
              <Group align="center" mb="md" gap="sm" wrap="nowrap">
                {(() => {
            const initials = (() => {
              const name = signInUser?.name?.trim();
              if (name) {
                const parts = name.split(/\s+/).filter(Boolean);
                if (parts.length === 1)
                  return parts[0].slice(0, 2).toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              }
              const email = signInUser?.email;
              if (email) {
                const handle = email.split("@")[0];
                const parts = handle.split(/[\.\-_]+/).filter(Boolean);
                if (parts.length === 0) return "?";
                if (parts.length === 1)
                  return parts[0].slice(0, 2).toUpperCase();
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
              }
              return "?";
            })();
            return (
              <Avatar
                radius="xl"
                size={56}
                color="teal"
                style={{ fontSize: rem(20), fontWeight: 600 }}
              >
                {initials}
              </Avatar>
            );
          })()}
          <Box style={{ flex: 1 }}>
            <Text fw={600}>{signInUser?.name || "No display name"}</Text>
            <Text size="sm" c="dimmed">
              {signInUser?.email || "No email"}
            </Text>
            <Group gap={6} mt={8} wrap="nowrap">
              {roleOptions.map((r) => {
                const active = (r === "None" && role == null) || role === r;
                return (
                  <Button
                    key={r}
                    size="compact-xs"
                    radius="xl"
                    variant={active ? "filled" : "outline"}
                    color={
                      r.startsWith("M")
                        ? "teal"
                        : r.startsWith("W")
                        ? "blue"
                        : r === "Coach"
                        ? "grape"
                        : "gray"
                    }
                    px={10}
                    onClick={() => handleRoleChange(r)}
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      height: 26,
                      minWidth: 40,
                    }}
                  >
                    {r}
                  </Button>
                );
              })}
            </Group>
          </Box>
        </Group>
        <Button
          variant="light"
          color="red"
          fullWidth
          onClick={async () => {
            await signout();
            setProfileOpen(false);
          }}
        >
          Sign out
        </Button>
      </Modal>
    </Box>
  );
}
