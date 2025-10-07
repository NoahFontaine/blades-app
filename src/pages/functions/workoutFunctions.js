import { findUserFromEmail, findUserFromName } from "./userFunctions";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function addWorkout({
  signInUser,
  distance,
  date,
  sport,
  type,
  duration,      // number (minutes)
  intensity,
  role,
  notes,
  setDistance,
  setDate,
  setSport,
  setType,
  setDuration,
  setIntensity,
  setNotes,
  setSubmitting,
  loadWorkouts,
  closeModal,
}) {
  if (
    !signInUser ||
    !date ||
    !sport ||
    !type ||
    !duration ||
    !intensity
  ) {
    return;
  }

  setSubmitting(true);

  try {
    // Resolve user record from backend
    let userRecord = null;

    try {
      const byEmail = await findUserFromEmail(signInUser.email);
      userRecord = byEmail?.[0] || null;
    } catch {
      userRecord = null;
    }

    if (!userRecord) {
      try {
        const byName = await findUserFromName(signInUser.name);
        userRecord = byName?.[0] || null;
      } catch {
        userRecord = null;
      }
    }

    if (!userRecord) {
      console.warn("No backend user record found");
      return;
    }

    // Build payload
    const payload = {
      user: userRecord,
      sport,
      type,
      intensity,
      squad: role,
      distance: Number(distance),
      duration: Number(duration),              // decide on minutes
      date: date instanceof Date ? date.toISOString() : date,
      notes,
    };

    const res = await fetch(`${API_BASE}/enter_workout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Workout add failed (${res.status}) ${txt}`);
    }

    // Reset form
    setDistance("");
    setSport("");
    setType("");
    setDate(null);
    setIntensity("");
    setDuration("");
    setNotes("");
    await loadWorkouts();
    closeModal();
  } finally {
    setSubmitting(false);
  }
}
