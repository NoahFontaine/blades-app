import { useState, useEffect } from "react";
import { Stack, Title, Text, Box } from "@mantine/core";
import TopBar from "./components/layout/TopBar";
import { useAuth } from "../Auth";
import { addUser, findUserFromName } from "./functions/userFunctions";


export default function Crew() {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const { user: signInUser, signout } = useAuth();
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
    setRole(newRole); // optimistic update
    setUpdatingRole(true);
    try {
      await addUser(signInUser, newRole);
    } catch (err) {
      console.error("Role update failed:", err);
      setRole(prev); // revert on failure
    } finally {
      setUpdatingRole(false);
    }
  }

  return (
    <Box style={{ minHeight: "100vh", background: "white", position: "relative" }}>
      <TopBar
        user={signInUser}
        signout={signout}
        role={role}
        roleOptions={roleOptions}
        onRoleChange={handleRoleChange}
      />
    <div style={{ height: 100 }} />
      <Stack p="xl">
        <Title order={2}>Crew</Title>
        <Text c="dimmed" size="sm">
          Crew overview coming soon. (Add roster, role management, leaderboards,
          etc.)
        </Text>
      </Stack>
    </Box>
  );
}
