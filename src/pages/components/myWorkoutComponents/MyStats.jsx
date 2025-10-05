import { Card, Title, Group, Text, SimpleGrid, Badge, Stack, Divider } from "@mantine/core";
import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

export default function MyStats({ workouts }) {
  const {
    hoursPerSport,
    hoursPerIntensity,
    hoursPerIntensityWeek,
    totalHours,
    totalDistanceM,
    avgHoursPerWeek,
  } = useMemo(() => {
    if (!Array.isArray(workouts) || workouts.length === 0) {
      return {
        hoursPerSport: [],
        hoursPerIntensity: [],
        hoursPerIntensityWeek: [],
        totalHours: 0,
        totalDistanceM: 0,
        avgHoursPerWeek: 0,
      };
    }

    const valid = workouts.filter(
      (w) =>
        w &&
        w.date &&
        !isNaN(new Date(w.date)) &&
        w.duration &&
        !isNaN(Number(w.duration))
    );

    if (valid.length === 0) {
      return {
        hoursPerSport: [],
        hoursPerIntensity: [],
        hoursPerIntensityWeek: [],
        totalHours: 0,
        totalDistanceM: 0,
        avgHoursPerWeek: 0,
      };
    }

    // Aggregations
    const sportMap = {};
    const intensityMap = {};
    const intensityWeekMap = {};
    let totalMinutes = 0;
    let totalDistanceM = 0;

    const dates = [];

    // Week boundaries (Monday start)
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = (now.getDay() + 6) % 7; // 0 = Monday
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    valid.forEach((w) => {
      const d = new Date(w.date);
      dates.push(d);
      const minutes = Number(w.duration);
      if (!isNaN(minutes) && minutes > 0) {
        totalMinutes += minutes;
        if (w.sport) {
          sportMap[w.sport] = (sportMap[w.sport] || 0) + minutes;
        }
        if (w.intensity) {
            intensityMap[w.intensity] = (intensityMap[w.intensity] || 0) + minutes;
        }
        // This week?
        if (d >= startOfWeek && d < endOfWeek && w.intensity) {
          intensityWeekMap[w.intensity] =
            (intensityWeekMap[w.intensity] || 0) + minutes;
        }
      }
      if (w.distance && !isNaN(Number(w.distance))) {
        totalDistanceM += Number(w.distance);
      }
    });

    dates.sort((a, b) => a - b);
    const first = dates[0];
    const last = dates[dates.length - 1];

    const spanWeeks =
      Math.max(
        1,
        (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 7)
      );

    const toHoursArray = (obj) =>
      Object.entries(obj)
        .map(([k, v]) => ({
          name: k,
          hours: +(v / 60).toFixed(2),
        }))
        .sort((a, b) => b.hours - a.hours);

    const hoursPerSport = toHoursArray(sportMap);
    const hoursPerIntensity = toHoursArray(intensityMap);
    const hoursPerIntensityWeek = toHoursArray(intensityWeekMap);

    return {
      hoursPerSport,
      hoursPerIntensity,
      hoursPerIntensityWeek,
      totalHours: +(totalMinutes / 60).toFixed(2),
      totalDistanceM,
      avgHoursPerWeek: +(totalMinutes / 60 / spanWeeks).toFixed(2),
    };
  }, [workouts]);

  const formatDistance = (m) => {
    if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
    return `${m} m`;
  };

  const empty = !workouts || workouts.length === 0;

  return (
    <Stack>
      <Card withBorder padding="lg" radius="lg">
        <Group justify="space-between" mb="sm">
          <Title order={2} mb={0}>
            My Stats
          </Title>
          {!empty && (
            <Badge radius="sm" variant="light" color="indigo">
              {workouts.length} workout{workouts.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </Group>
        {empty ? (
          <Text c="dimmed" size="sm">
            No workouts logged yet.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="xs">
            <Stat label="Total Hours" value={totalHours} suffix="h" />
            <Stat label="Avg Hours / Week" value={avgHoursPerWeek} suffix="h" />
            <Stat
              label="Total Distance"
              value={formatDistance(totalDistanceM)}
              valueRaw={totalDistanceM}
            />
            <Stat
              label="Sports Logged"
              value={hoursPerSport.length}
              suffix=""
            />
            <Stat
              label="Intensities Used"
              value={hoursPerIntensity.length}
              suffix=""
            />
            <Stat
              label="Intensities (This Week)"
              value={hoursPerIntensityWeek.length}
              suffix=""
            />
          </SimpleGrid>
        )}
      </Card>

      {!empty && (
        <>
          <Card withBorder padding="lg" radius="lg">
            <Title order={4} mb="sm">
              Hours per Sport
            </Title>
            {hoursPerSport.length === 0 ? (
              <Text size="sm" c="dimmed">
                No duration data.
              </Text>
            ) : (
              <ChartWrapper>
                <BarChart data={hoursPerSport}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={40} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#4c6ef5" radius={4} />
                </BarChart>
              </ChartWrapper>
            )}
          </Card>

            <Card withBorder padding="lg" radius="lg">
            <Title order={4} mb="sm">
              Hours per Intensity (Overall)
            </Title>
            {hoursPerIntensity.length === 0 ? (
              <Text size="sm" c="dimmed">
                No intensity data.
              </Text>
            ) : (
              <ChartWrapper>
                <BarChart data={hoursPerIntensity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={40} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hours" fill="#12b886" radius={4} />
                </BarChart>
              </ChartWrapper>
            )}
          </Card>

          <Card withBorder padding="lg" radius="lg">
            <Title order={4} mb="sm">
              Hours per Intensity (This Week)
            </Title>
            {hoursPerIntensityWeek.length === 0 ? (
              <Text size="sm" c="dimmed">
                No workouts this week.
              </Text>
            ) : (
              <ChartWrapper>
                <BarChart data={hoursPerIntensityWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis width={40} />
                  <Tooltip />
                  <Bar dataKey="hours" fill="#fd7e14" radius={4} />
                </BarChart>
              </ChartWrapper>
            )}
          </Card>
        </>
      )}
    </Stack>
  );
}

function Stat({ label, value, suffix, valueRaw }) {
  return (
    <Card padding="sm" radius="md" withBorder>
      <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4} lh={1.2}>
        {label}
      </Text>
      <Text fw={600} size="lg">
        {value}
        {typeof suffix === "string" ? suffix : ""}
      </Text>
    </Card>
  );
}

function ChartWrapper({ children }) {
  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
