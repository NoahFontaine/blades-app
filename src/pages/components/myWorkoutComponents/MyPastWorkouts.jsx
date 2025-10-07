import { Card, Title, Group, Text, Badge, Stack, Divider, Box, Tooltip } from "@mantine/core";

// Sport color + icon (emoji to avoid extra deps)
const SPORT_META = {
  Rowing: { color: '#4c6ef5', icon: '🚣' },
  Cycling: { color: '#228be6', icon: '🚴' },
  Weights: { color: '#7048e8', icon: '🏋️' },
  Running: { color: '#12b886', icon: '🏃' },
  Walking: { color: '#fab005', icon: '🚶' },
  OTHER: { color: '#868e96', icon: '⚪' },
};

const INTENSITY_COLORS = {
  'Very Low': '#2f9e44',
  'Low': '#12b886',
  'Medium': '#fab005',
  'High': '#fd7e14',
  'Very High': '#fa5252',
};

function formatDateHeader(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr || 'Unknown date';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDistance(dist) {
  if (dist == null || dist === '' || isNaN(Number(dist))) return null;
  const m = Number(dist);
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  return `${m} m`;
}

function formatDuration(mins) {
  if (mins == null || mins === '' || isNaN(Number(mins))) return null;
  const m = Number(mins);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

// ISO week helpers
function getISOWeekInfo(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return null;
  // Copy date and set to Thursday of current week per ISO 8601
  const tmp = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = tmp.getUTCDay() || 7; // Monday=1..Sunday=7
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
  // Week start (Monday)
  const weekStart = new Date(d);
  const diffToMonday = (weekStart.getDay() + 6) % 7; // 0 if Monday
  weekStart.setDate(weekStart.getDate() - diffToMonday);
  weekStart.setHours(0,0,0,0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return { week, year: tmp.getUTCFullYear(), weekStart, weekEnd };
}

const WEEK_COLORS = [
  '#4c6ef5',
  '#228be6',
  '#12b886',
  '#fab005',
  '#fd7e14',
  '#fa5252',
  '#7048e8',
  '#868e96',
];

export default function MyPastWorkouts({ workouts = [] }) {
  const sorted = [...workouts].filter(w => w?.date).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Group by date (YYYY-MM-DD)
  const groups = sorted.reduce((acc, w) => {
    const key = (w.date || '').slice(0, 10);
    acc[key] = acc[key] || [];
    acc[key].push(w);
    return acc;
  }, {});

  const orderedKeys = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

  return (
    <Card withBorder padding="lg" radius="lg">
      <Title order={2} mb="md">My Past Workouts</Title>
      {sorted.length === 0 ? (
        <Text c="dimmed" size="sm" m={0}>No workouts logged yet.</Text>
      ) : (
        <Stack gap="md">
          {orderedKeys.map(dateKey => {
            const dateLabel = formatDateHeader(dateKey);
            const dayWorkouts = groups[dateKey];
            const weekInfo = getISOWeekInfo(dateKey);
            let weekBadge = null;
            let weekColor = 'var(--mantine-color-gray-4)';
            if (weekInfo) {
              const hash = (weekInfo.year * 53 + weekInfo.week) % WEEK_COLORS.length;
              weekColor = WEEK_COLORS[hash];
              const rangeLabel = `${weekInfo.weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${weekInfo.weekEnd.toLocaleDateString(undefined,{month:'short',day:'numeric'})}`;
              weekBadge = (
                <Tooltip label={`Week ${weekInfo.week} (${rangeLabel})`} withArrow>
                  <Badge size="xs" variant="light" color="blue" radius="sm">
                    W{weekInfo.week}
                  </Badge>
                </Tooltip>
              );
            }
            return (
              <Box key={dateKey}>
                <Group gap={8} mb={6} align="center" wrap="nowrap">
                  <Text component="div" fw={600} size="sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {dateLabel}
                    {weekBadge}
                  </Text>
                  <Divider style={{ flex: 1 }} />
                </Group>
                <Stack gap={6}
                  style={{
                    borderLeft: `3px solid ${weekColor}`,
                    marginLeft: 4,
                    paddingLeft: 12,
                  }}
                >
                  {dayWorkouts.map((w, idx) => {
                    const sportKey = SPORT_META[w.sport] ? w.sport : 'OTHER';
                    const { color, icon } = SPORT_META[sportKey];
                    const distance = formatDistance(w.distance);
                    const duration = formatDuration(w.duration);
                    const intensity = w.intensity && INTENSITY_COLORS[w.intensity] ? w.intensity : null;
                    return (
                      <Group
                        key={idx}
                        align="flex-start"
                        wrap="nowrap"
                        style={{
                          background: 'var(--mantine-color-gray-0)',
                          border: `1px solid ${weekColor}33`,
                          borderRadius: 10,
                          padding: '8px 12px',
                          position: 'relative',
                        }}
                      >
                        {/* Sport icon circle */}
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 12,
                            background: color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 22,
                            color: 'white',
                            flexShrink: 0,
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                          }}
                          aria-label={sportKey}
                          title={sportKey}
                        >
                          {icon}
                        </div>
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Group gap={6} wrap="wrap" align="center">
                            <Text component="span" fw={600} size="sm">{w.sport || 'Other'}</Text>
                            {w.type && (
                              <Badge variant="light" size="xs" radius="sm" color="indigo">{w.type}</Badge>
                            )}
                            {intensity && (
                              <Badge variant="filled" size="xs" radius="sm" style={{ background: INTENSITY_COLORS[intensity] }}>
                                {intensity}
                              </Badge>
                            )}
                          </Group>
                          <Group gap={10} wrap="wrap" c="dimmed" fz={12}>
                            {distance && <Text component="span" size="xs">{distance}</Text>}
                            {duration && <Text component="span" size="xs">{duration}</Text>}
                            {w.notes && <Text component="span" size="xs" lineClamp={1} style={{ maxWidth: 280 }}>{`Notes: ${w.notes}`}</Text>}
                          </Group>
                        </Stack>
                      </Group>
                    );
                  })}
                </Stack>
              </Box>
            );
          })}
        </Stack>
      )}
    </Card>
  );
}
