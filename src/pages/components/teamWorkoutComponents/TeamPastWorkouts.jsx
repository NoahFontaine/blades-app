import { useMemo } from "react";
import { Card, Title, Text, Group, Badge, Stack, Loader, Button } from "@mantine/core";

// Sport meta (emoji + color)
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
  if (isNaN(dt)) return (d || '').toString().slice(0,10);
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

export default function TeamPastWorkouts({
  workouts = [],
  role,
  loading = false,
  error = null,
  onRefresh,
  sort = true,
}) {

  const sortedWorkouts = useMemo(() => {
    if (!Array.isArray(workouts)) return [];
    if (!sort) return workouts;
    return [...workouts].sort((a,b) => new Date(b.date) - new Date(a.date));
  }, [workouts, sort]);

  // Aggregated stats
  const { totalDistance, totalMinutes } = useMemo(() => {
    return sortedWorkouts.reduce((acc, w) => {
      acc.totalDistance += Number(w.distance) || 0;
      acc.totalMinutes += Number(w.duration) || 0;
      return acc;
    }, { totalDistance: 0, totalMinutes: 0 });
  }, [sortedWorkouts]);

  const workoutsCount = sortedWorkouts.length;
  const totalHours = (totalMinutes/60).toFixed(1);
  const totalDistanceLabel = totalDistance >= 1000
    ? (totalDistance/1000).toFixed(1)+' km'
    : totalDistance + ' m';

  const showNoRole = !role || role === 'None';
  const showEmpty = !loading && !error && workoutsCount === 0 && !showNoRole;

  return (
    <Card radius="lg" withBorder padding="lg">
      <Group justify="space-between" align="flex-start" mb="md">
        <div>
          <Title order={2} mb={4}>Team Workouts</Title>
          <Text size="sm" c="dimmed">
            {showNoRole
              ? 'Select a squad'
              : role === 'Coach'
                ? 'All squads'
                : `Squad: ${role}`}
          </Text>
        </div>
        <Group gap={8} wrap="nowrap">
          <Badge variant="light" color="teal" radius="sm" size="sm">{workoutsCount} workouts</Badge>
            <Badge variant="light" color="blue" radius="sm" size="sm">{totalHours}h</Badge>
          <Badge variant="light" color="indigo" radius="sm" size="sm">{totalDistanceLabel}</Badge>
          {onRefresh && (
            <Button
              size="compact-xs"
              variant="subtle"
              onClick={() => onRefresh()}
              disabled={loading}
            >
              Refresh
            </Button>
          )}
        </Group>
      </Group>

      {showNoRole && (
        <Text c="dimmed" size="sm">Pick a squad in your profile to see team workouts.</Text>
      )}

      {loading && (
        <Group gap={8} align="center" mt="sm">
          <Loader size="sm" />
          <Text size="sm">Loading workouts…</Text>
        </Group>
      )}

      {error && !loading && (
        <Text size="sm" c="red" mt="sm">{error}</Text>
      )}

      {showEmpty && (
        <Text size="sm" c="dimmed" mt="sm">No workouts for this squad yet.</Text>
      )}

      {!loading && !error && workoutsCount > 0 && (
        <Stack gap="sm" mt="xs">
          {sortedWorkouts.map((w, i) => {
            const sportKey = SPORT_META[w.sport] ? w.sport : 'OTHER';
            const { icon, color } = SPORT_META[sportKey];
            const date = formatDate(w.date);
            const dLabel = formatDistance(w.distance);
            const durLabel = formatDuration(w.duration);
            const userLabel = deriveUserLabel(w.user);
            return (
              <Card
                key={w.id || w._id || i}
                padding="sm"
                radius="md"
                withBorder
                style={{ borderColor: color + '55' }}
              >
                <Group align="flex-start" gap={10} wrap="nowrap">
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      color: 'white',
                      flexShrink: 0
                    }}
                    title={sportKey}
                    aria-label={sportKey}
                  >
                    {icon}
                  </div>
                  <Stack gap={4} style={{ flex: 1 }}>
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
