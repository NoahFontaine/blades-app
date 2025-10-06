import { useState, useEffect, useCallback } from "react";
import { Card, Title, Text, Group, Badge, Stack, Loader, Button } from "@mantine/core";

// Basic sport meta for icon + color (reuse emoji approach)
const SPORT_META = {
  Rowing: { color: '#4c6ef5', icon: '🚣' },
  Cycling: { color: '#228be6', icon: '🚴' },
  Weights: { color: '#7048e8', icon: '🏋️' },
  Running: { color: '#12b886', icon: '🏃' },
  Walking: { color: '#fab005', icon: '🚶' },
  OTHER: { color: '#868e96', icon: '⚪' },
};

function formatDate(d) {
  if (!d) return '?';
  const dt = new Date(d);
  if (isNaN(dt)) return d.slice?.(0,10) || '?';
  return dt.toISOString().slice(0,10);
}

function formatDistance(dist) {
  const n = Number(dist);
  if (isNaN(n) || n <= 0) return null;
  return n >= 1000 ? (n/1000).toFixed(2) + ' km' : n + ' m';
}

function formatDuration(mins) {
  const n = Number(mins);
  if (isNaN(n) || n <= 0) return null;
  if (n < 60) return n + ' min';
  const h = Math.floor(n/60); const r = n % 60;
  return r ? `${h}h ${r}m` : `${h}h`;
}

function deriveUserLabel(u) {
  if (!u) return 'Unknown';
  if (typeof u === 'string') return u;
  if (typeof u === 'object') return u.name || u.username || u.email || 'Unknown';
  return 'Unknown';
}

export default function TeamPastWorkouts({ signInUser, role }) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fetchedRole, setFetchedRole] = useState(null); // to avoid re-fetch loops

  const fetchWorkouts = useCallback(async (activeRole) => {
    if (!activeRole || activeRole === 'None') return; // nothing to fetch yet
    setLoading(true);
    setError(null);
    try {
      const base = 'https://bladeapi.onrender.com/workouts';
      // Attempt server-side filtering by squad if supported
      const url = activeRole === 'Coach' ? base : `${base}?squad=${encodeURIComponent(activeRole)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      let data = await res.json();
      // If server ignored filter (or role is Coach), filter client-side for non-Coach roles
      if (activeRole !== 'Coach') {
        data = data.filter(w => {
          const usr = w.user;
            if (usr && typeof usr === 'object' && usr.squad) {
              return usr.squad === activeRole;
            }
            // fallback if workout has top-level squad
            if (w.squad) return w.squad === activeRole;
            return false; // exclude if we can't match
        });
      }
      // Sort newest first
      data.sort((a,b) => new Date(b.date) - new Date(a.date));
      setWorkouts(data);
      setFetchedRole(activeRole);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when role becomes available and not yet fetched for that role
  useEffect(() => {
    if (role && role !== fetchedRole && role !== 'None') {
      fetchWorkouts(role);
    }
  }, [role, fetchedRole, fetchWorkouts]);

  // Aggregate quick stats
  const totalDistance = workouts.reduce((s,w) => s + (Number(w.distance)||0), 0);
  const totalMinutes = workouts.reduce((s,w) => s + (Number(w.duration)||0), 0);
  const workoutsCount = workouts.length;

  const totalHours = (totalMinutes/60).toFixed(1);
  const totalDistanceLabel = totalDistance >= 1000 ? (totalDistance/1000).toFixed(1)+' km' : totalDistance + ' m';

  return (
    <Card radius="lg" withBorder padding="lg">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={2} mb={4}>Team Workouts</Title>
          <Text size="sm" c="dimmed">
            {role === 'Coach' ? 'All squads' : role ? `Squad: ${role}` : 'Select a squad'}
          </Text>
        </div>
        <Group gap={8} wrap="nowrap">
          <Badge variant="light" color="teal" radius="sm" size="sm">{workoutsCount} workouts</Badge>
          <Badge variant="light" color="blue" radius="sm" size="sm">{totalHours}h</Badge>
          <Badge variant="light" color="indigo" radius="sm" size="sm">{totalDistanceLabel}</Badge>
          <Button size="compact-xs" variant="subtle" onClick={() => role && role !== 'None' && fetchWorkouts(role)} disabled={loading}>
            Refresh
          </Button>
        </Group>
      </Group>

      {role === 'None' && (
        <Text c="dimmed" size="sm">Pick a squad in your profile to see team workouts.</Text>
      )}

      {loading && (
        <Group gap={8} align="center" mt="sm"><Loader size="sm" /><Text size="sm">Loading workouts…</Text></Group>
      )}
      {error && !loading && (
        <Text size="sm" c="red" mt="sm">{error}</Text>
      )}

      {!loading && !error && workouts.length === 0 && role && role !== 'None' && (
        <Text size="sm" c="dimmed" mt="sm">No workouts for this squad yet.</Text>
      )}

      {!loading && !error && workouts.length > 0 && (
        <Stack gap="sm" mt="xs">
          {workouts.map((w, i) => {
            const sportKey = SPORT_META[w.sport] ? w.sport : 'OTHER';
            const { icon, color } = SPORT_META[sportKey];
            const date = formatDate(w.date);
            const dLabel = formatDistance(w.distance);
            const durLabel = formatDuration(w.duration);
            const userLabel = deriveUserLabel(w.user);
            return (
              <Card key={w.id || w._id || i} padding="sm" radius="md" withBorder style={{ borderColor: color+'55' }}>
                <Group align="flex-start" gap={10} wrap="nowrap">
                  <div style={{
                    width:42,height:42,borderRadius:12,background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,color:'white',flexShrink:0
                  }} title={sportKey} aria-label={sportKey}>{icon}</div>
                  <Stack gap={4} style={{ flex:1 }}>
                    <Group gap={8} wrap="wrap" align="center">
                      <Text fw={600} size="sm">{sportKey}</Text>
                      {w.type && <Badge size="xs" variant="light" color="indigo" radius="sm">{w.type}</Badge>}
                      {w.intensity && <Badge size="xs" variant="filled" color="gray" radius="sm">{w.intensity}</Badge>}
                    </Group>
                    <Group gap={14} wrap="wrap" c="dimmed" fz={12}>
                      <Text size="xs">{date}</Text>
                      {dLabel && <Text size="xs">{dLabel}</Text>}
                      {durLabel && <Text size="xs">{durLabel}</Text>}
                      <Text size="xs">by {userLabel}</Text>
                    </Group>
                  </Stack>
                </Group>
              </Card>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
