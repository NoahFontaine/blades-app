import React, { useState } from "react";
import {
  Paper,
  Title,
  Text,
  Button,
  Center,
  Stack,
  Divider,
  TextInput,
  PasswordInput,
  Group,
  Checkbox,
  LoadingOverlay,
  Notification,
  Avatar,
  Space,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconBrandGoogle,
  IconMail,
  IconUser,
  IconLock,
  IconAlertCircle,
  IconCheck,
} from "@tabler/icons-react";
import { useAuth } from "../Auth";
import { useNavigate } from "react-router-dom";

export default function SignOn() {
  const { signinWithGoogle, signinWithEmail, signupWithEmail, sendResetEmail } =
    useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // signin | signup | reset
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);

  const form = useForm({
    initialValues: { name: "", email: "", password: "", remember: true },
    validate: {
      email: (v) => (/^\S+@\S+$/.test(v) ? null : "Invalid email"),
      password: (v) =>
        mode === "reset" ? null : v.length >= 6 ? null : "Min 6 chars",
      name: (v) => (mode === "signup" ? (v.trim() ? null : "Required") : null),
    },
  });

  function showNotice(type, message) {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 6000);
  }

  async function handleGoogle() {
    setLoading(true);
    try {
      await signinWithGoogle();
      navigate("/home", { replace: true });
    } catch (err) {
      showNotice("error", err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(values) {
    setLoading(true);
    try {
      if (mode === "signin") {
        await signinWithEmail(values.email, values.password);
      } else if (mode === "signup") {
        await signupWithEmail(values.email, values.password);
        // Optionally use updateProfile to set displayName if you captured name
      }
      navigate("/home", { replace: true });
    } catch (err) {
      console.error(err);
      const code = err?.code || "";
      if (code.includes("wrong-password") || code.includes("user-not-found"))
        showNotice("error", "Invalid email or password.");
      else if (code.includes("email-already-in-use"))
        showNotice("error", "Email already in use.");
      else showNotice("error", "Authentication failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(values) {
    setLoading(true);
    try {
      await sendResetEmail(values.email);
      showNotice("success", "Password reset email sent. Check your inbox.");
      setMode("signin");
    } catch (err) {
      console.error(err);
      showNotice("error", "Unable to send reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Center style={{ minHeight: "100vh", background: "#f6f9fc" }}>
      <Paper
        radius="lg"
        p="lg"
        withBorder
        style={{ width: 520, position: "relative" }}
      >
        {" "}
        <LoadingOverlay visible={loading} />{" "}
        <Stack spacing="sm">
          {" "}
          <Title order={2} align="center">
            {mode === "signin" && "Sign in"}
            {mode === "signup" && "Create account"}
            {mode === "reset" && "Reset password"}{" "}
          </Title>{" "}
          <Text align="center" color="dimmed">
            Access BLADES
          </Text>
          {notice && (
            <Notification
              icon={
                notice.type === "error" ? <IconAlertCircle /> : <IconCheck />
              }
              color={notice.type === "error" ? "red" : "teal"}
            >
              {notice.message}
            </Notification>
          )}
          <Button
            leftIcon={<IconBrandGoogle size={18} />}
            variant="outline"
            radius="md"
            onClick={handleGoogle}
            fullWidth
          >
            Continue with Google
          </Button>
          <Divider label="Or" labelPosition="center" />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const values = form.values;
              if (mode === "reset") return handleReset(values);
              const validation = form.validate();
              if (Object.keys(validation.errors).length === 0)
                handleSubmit(values);
            }}
          >
            <Stack>
              {mode === "signup" && (
                <TextInput
                  label="Full name"
                  placeholder="Your name"
                  icon={<IconUser size={14} />}
                  {...form.getInputProps("name")}
                />
              )}

              <TextInput
                required
                label="Email"
                placeholder="you@example.com"
                icon={<IconMail size={14} />}
                {...form.getInputProps("email")}
              />
              {mode !== "reset" && (
                <PasswordInput
                  required
                  label="Password"
                  placeholder="Password"
                  icon={<IconLock size={14} />}
                  {...form.getInputProps("password")}
                />
              )}

              {mode === "signin" && (
                <Group position="apart" align="center">
                  <Checkbox
                    label="Remember me"
                    {...form.getInputProps("remember", { type: "checkbox" })}
                  />
                  <Button variant="subtle" onClick={() => setMode("reset")}>
                    Forgot password?
                  </Button>
                </Group>
              )}

              <Button type="submit" radius="md" fullWidth>
                {mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                  ? "Create account"
                  : "Send reset email"}
              </Button>

              <Group position="apart" spacing="xs">
                {mode === "signin" ? (
                  <Text size="sm">
                    Don't have an account?{" "}
                    <Button
                      variant="subtle"
                      onClick={() => setMode("signup")}
                      compact
                    >
                      Sign up
                    </Button>
                  </Text>
                ) : mode === "signup" ? (
                  <Text size="sm">
                    Already have an account?{" "}
                    <Button
                      variant="subtle"
                      onClick={() => setMode("signin")}
                      compact
                    >
                      Sign in
                    </Button>
                  </Text>
                ) : (
                  <Button
                    variant="subtle"
                    onClick={() => setMode("signin")}
                    compact
                  >
                    Back to sign in
                  </Button>
                )}
              </Group>
            </Stack>
          </form>
          <Space h="xs" />
          <Text size="xs" color="dimmed" align="center">
            By continuing you agree to my terms. Lol are you actually reading this?
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}
