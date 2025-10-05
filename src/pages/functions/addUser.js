import { useAuth } from "../../Auth";

export async function addUser(user, user_squad) {

  if (!user) {
    throw new Error("No authenticated user");
  }

  const payload = {
    email: user.email || "",
    name: user.name || "",
    squad: user_squad || "",
  };

  const res = await fetch("https://bladeapi.onrender.com/add_user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Add user failed: ${res.status} ${text}`);
  }

  try {
    return await res.json();
  } catch {
    return null;
  }
}
