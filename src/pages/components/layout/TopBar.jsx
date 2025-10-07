import { useState } from "react";
import {
  Box,
  UnstyledButton,
  useMantineTheme,
  Menu,
  Avatar,
  Divider,
  Image,
  Button,
  Group,
  Text,
  rem,
  Modal,
} from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";

function initialsFromUser(u) {
  const name = u?.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  const email = u?.email;
  if (email) {
    const handle = email.split("@")[0];
    const parts = handle.split(/[\.\-_]+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return "?";
}

export default function TopBar({
  user,
  signout,
  role,
  roleOptions = [],
  onRoleChange,
  showRoleSelector = true,
  logoSize = 108,
}) {
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = initialsFromUser(user);

  return (
    <>
      {/* Left logo */}
      <Box
        style={{
          position: "absolute",
          top: 12,
          left: 20,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "pointer",
        }}
        onClick={() => navigate("/home")}
        title="Home"
      >
        <Image
          src="/martlet_icon_transparent.png"
          alt="Martlet"
          w={logoSize}
          h={logoSize}
        />
      </Box>

      {/* Right user menu */}
      <Box
        style={{
          position: "absolute",
            top: 12,
            right: 14,
            zIndex: 10,
        }}
      >
        <Menu width={190} position="left-end" radius="lg" shadow="sm" withinPortal>
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
              <Avatar
                radius="xl"
                size={38}
                color="gray"
                style={{ fontSize: rem(14), fontWeight: 600 }}
              >
                {initials}
              </Avatar>
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

      {/* Profile modal */}
      <Modal
        opened={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="Profile"
        centered
        radius="lg"
        size={580}
      >
        <Group align="center" mb="md" gap="sm" wrap="nowrap">
          <Avatar
            radius="xl"
            size={56}
            color="teal"
            style={{ fontSize: rem(20), fontWeight: 600 }}
          >
            {initials}
          </Avatar>
          <Box style={{ flex: 1 }}>
            <Text fw={600}>{user?.name || "No display name"}</Text>
            <Text size="sm" c="dimmed">
              {user?.email || "No email"}
            </Text>
            {showRoleSelector && roleOptions?.length > 0 && (
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
                      onClick={() => onRoleChange && onRoleChange(r)}
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
            )}
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
    </>
  );
}