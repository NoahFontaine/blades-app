
export async function addUser(user, user_squad) {

  const API_BASE = import.meta.env.VITE_API_BASE;

  if (!user) {
    throw new Error("No authenticated user");
  }
  const payload = {
    email: user.email || "",
    name: user.name || "",
    squad: user_squad || "",
  };
  const res = await fetch(`${API_BASE}/add_user`, {
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


export async function findUserFromName(name) {

  const API_BASE = import.meta.env.VITE_API_BASE;

  if (!name) {
    throw new Error("No name provided");
  }
  const res = await fetch(`${API_BASE}/users?name=${name}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Find user failed: ${res.status} ${text}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}


export async function findUserFromEmail(email) {

  const API_BASE = import.meta.env.VITE_API_BASE;

  if (!email) {
    throw new Error("No email provided");
  }
  const res = await fetch(`${API_BASE}/users?email=${email}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Find user failed: ${res.status} ${text}`);
  }
  try {
    return await res.json();
  } catch {
    return null;
  }
}
