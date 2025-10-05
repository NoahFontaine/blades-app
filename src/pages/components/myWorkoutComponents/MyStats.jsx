import { Card, Title, Group, Text, SimpleGrid, Badge, Stack } from "@mantine/core";
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
  Cell,
} from "recharts";

const ALL_SPORTS = ["Rowing", "Cycling", "Weights", "Running", "Walking", "OTHER"];
const INTENSITY_ORDER = ["Very Low", "Low", "Medium", "High", "Very High"];
const INTENSITY_COLORS = {
  "Very Low": "#2f9e44",
  "Low": "#12b886",
  "Medium": "#fab005",
  "High": "#fd7e14",
  "Very High": "#fa5252",
};

const SPORT_COLORS = {
  Rowing: "#4c6ef5",
  Cycling: "#228be6",
  Weights: "#7048e8",
  Running: "#12b886",
  Walking: "#fab005",
  OTHER: "#868e96",
};

function normalizeIntensity(raw) {
  if (!raw) return null;
  const t = raw
    .toLowerCase()
    .split(" ")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return INTENSITY_ORDER.includes(t) ? t : null;
}

export default function MyStats({ workouts }) {
  const {
    sportPercentData,
    sportIntensityData,
    hoursPerIntensity,
    hoursPerIntensityWeek,
    totalHours,
    totalDistanceM,
    avgHoursPerWeek,
    workoutCount,
  } = useMemo(() => {
    // Minutes buckets
    const sportTotalMinutes = Object.fromEntries(ALL_SPORTS.map(s => [s, 0]));
    const sportIntensityMinutes = {};
    ALL_SPORTS.forEach(s => {
      sportIntensityMinutes[s] = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
    });
    const intensityMinutesOverall = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
    const intensityMinutesWeek = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));

    let totalMinutes = 0;
    let totalDistanceM = 0;
    const dates = [];

    const now = new Date();
    const startOfWeek = new Date(now);
    const day = (now.getDay() + 6) % 7;
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - day);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    (workouts || []).forEach(w => {
      if (!w) return;
      const d = new Date(w.date);
      if (isNaN(d)) return;
      const mins = Number(w.duration);
      if (!isNaN(mins) && mins > 0) {
        totalMinutes += mins;
        dates.push(d);

        const sportKey = ALL_SPORTS.includes(w.sport) ? w.sport : null;
        const intensity = normalizeIntensity(w.intensity);

        if (sportKey) {
          sportTotalMinutes[sportKey] += mins;
          if (intensity) {
            sportIntensityMinutes[sportKey][intensity] += mins;
          }
        }
        if (intensity) {
          intensityMinutesOverall[intensity] += mins;
          if (d >= startOfWeek && d < endOfWeek) {
            intensityMinutesWeek[intensity] += mins;
          }
        }
      }
      if (w.distance && !isNaN(Number(w.distance))) {
        totalDistanceM += Number(w.distance);
      }
    });

    dates.sort((a, b) => a - b);
    const first = dates[0] || now;
    const last = dates[dates.length - 1] || now;
    const spanWeeks = Math.max(
      1,
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

    // Single stacked percentage bar (raw minutes)
    const sportPercentData = [
      ALL_SPORTS.reduce(
        (acc, sport) => {
          acc[sport] = sportTotalMinutes[sport];
            acc[sport + "_m"] = sportTotalMinutes[sport];
          return acc;
        },
        { name: "All Sports" }
      ),
    ];

    // Per-sport intensity stacked (convert to hours now)
    const sportIntensityData = ALL_SPORTS.map(sport => {
      const row = { sport };
      INTENSITY_ORDER.forEach(inten => {
        row[inten] = +(sportIntensityMinutes[sport][inten] / 60).toFixed(2);
        row[inten + "_m"] = sportIntensityMinutes[sport][inten];
      });
      return row;
    });

    const toHoursArray = obj =>
      INTENSITY_ORDER.map(i => ({
        name: i,
        hours: +(obj[i] / 60).toFixed(2),
      }));

    return {
      sportPercentData,
      sportIntensityData,
      hoursPerIntensity: toHoursArray(intensityMinutesOverall),
      hoursPerIntensityWeek: toHoursArray(intensityMinutesWeek),
      totalHours: +(totalMinutes / 60).toFixed(2),
      totalDistanceM,
      avgHoursPerWeek: +((totalMinutes / 60) / spanWeeks).toFixed(2),
      workoutCount: workouts ? workouts.length : 0,
    };
  }, [workouts]);

  const formatDistance = (m) =>
    m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;

  const empty = !workouts || workouts.length === 0;

  return (
    <Stack>
      <Card withBorder padding="lg" radius="lg">
        <Group justify="space-between" mb="sm">
          <Title order={2} mb={0}>My Stats</Title>
          {!empty && (
            <Badge radius="sm" variant="light" color="indigo">
              {workoutCount} workout{workoutCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </Group>
        {empty ? (
          <Text c="dimmed" size="sm">No workouts logged yet.</Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mt="sm">
            <Stat label="Total Hours" value={totalHours} suffix="h" />
            <Stat label="Avg Hours / Week" value={avgHoursPerWeek} suffix="h" />
            <Stat label="Total Distance" value={formatDistance(totalDistanceM)} />
            <Stat
              label="Sports Logged"
              value={ALL_SPORTS.filter(s => sportPercentData[0][s + "_m"] > 0).length}
            />
            <Stat
              label="Intensities Used"
              value={hoursPerIntensity.filter(i => i.hours > 0).length}
            />
            <Stat
              label="Intensities (This Week)"
              value={hoursPerIntensityWeek.filter(i => i.hours > 0).length}
            />
          </SimpleGrid>
        )}
        </Card>

      {/* Three-column analytics layout (md+). On small screens stacks vertically */}
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="lg">
        {/* Column 1: Hours per Sport (Percent) */}
        <Card withBorder padding="lg" radius="lg">
          <Title order={4} mb="sm">Hours per Sport (Percent)</Title>
          <ChartWrapper height={500}>
            <BarChart data={sportPercentData} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis width={40} tickFormatter={v => `${Math.round(v * 100)}%`} />
              <Tooltip content={<SportPercentTooltip />} />
              <Legend />
              {ALL_SPORTS.map(sport => (
                <Bar
                  key={sport}
                  dataKey={sport}
                  stackId="sports"
                  fill={SPORT_COLORS[sport]}
                  radius={[4, 4, 4, 4]}
                />
              ))}
            </BarChart>
          </ChartWrapper>
        </Card>

        <Card withBorder padding="lg" radius="lg">
          <Title order={4} mb="sm">Distance per Intensity</Title>
          <ChartWrapper height={500}>
            <BarChart data={sportPercentData} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis width={40} tickFormatter={v => `${Math.round(v * 100)}%`} />
              <Tooltip content={<SportPercentTooltip />} />
              <Legend />
              {ALL_SPORTS.map(sport => (
                <Bar
                  key={sport}
                  dataKey={sport}
                  stackId="sports"
                  fill={SPORT_COLORS[sport]}
                  radius={[4, 4, 4, 4]}
                />
              ))}
            </BarChart>
          </ChartWrapper>
        </Card>

        {/* Column 3: Column 4: Two intensity per sport charts stacked */}
        <Stack gap="lg">
        <Card withBorder padding="lg" radius="lg">
          <Title order={4} mb="sm">Intensity Hours per Sport (Overall)</Title>
          <ChartWrapper height={240}>
            <BarChart data={sportIntensityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sport" />
              <YAxis width={40} />
              <Tooltip content={<IntensityPerSportTooltip />} />
              {INTENSITY_ORDER.map(inten => (
                <Bar
                  key={inten}
                  dataKey={inten}
                  stackId="intensity"
                  fill={INTENSITY_COLORS[inten]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartWrapper>
        </Card>
        <Card withBorder padding="lg" radius="lg">
          <Title order={4} mb="sm">Intensity Hours per Sport (This Week)</Title>
          <ChartWrapper height={240}>
            <BarChart data={sportIntensityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sport" />
              <YAxis width={40} />
              <Tooltip content={<IntensityPerSportTooltip />} />
              {INTENSITY_ORDER.map(inten => (
                <Bar
                  key={inten}
                  dataKey={inten}
                  stackId="intensity"
                  fill={INTENSITY_COLORS[inten]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ChartWrapper>
        </Card>
        </Stack>

        {/* Column 4: Two intensity charts stacked */}
        <Stack gap="lg">
          <Card withBorder padding="lg" radius="lg">
            <Title order={4} mb="sm">Hours per Intensity (Overall)</Title>
            <ChartWrapper height={240}>
              <BarChart data={hoursPerIntensity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width={40} domain={[0, 20]} />
                <Tooltip />
                <Bar dataKey="hours" radius={4}>
                  {hoursPerIntensity.map(row => (
                    <Cell key={row.name} fill={INTENSITY_COLORS[row.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartWrapper>
          </Card>

          <Card withBorder padding="lg" radius="lg">
            <Title order={4} mb="sm">Hours per Intensity (This Week)</Title>
            <ChartWrapper height={240}>
              <BarChart data={hoursPerIntensityWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width={40} domain={[0, 20]} />
                <Tooltip />
                <Bar dataKey="hours" radius={4}>
                  {hoursPerIntensityWeek.map(row => (
                    <Cell key={row.name} fill={INTENSITY_COLORS[row.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartWrapper>
          </Card>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}

function SportPercentTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const totalMins = ALL_SPORTS.reduce((sum, s) => sum + (row[s + "_m"] || 0), 0);
  return (
    <div style={tooltipBox}>
      <div style={tooltipTitle}>{label}</div>
      {ALL_SPORTS.map(s => {
        const mins = row[s + "_m"] || 0;
        const pct = totalMins ? (mins / totalMins) * 100 : 0;
        return (
          <div key={s} style={{ ...tooltipLine, color: SPORT_COLORS[s] }}>
            <span>{s}</span>
            <span>
              {mins > 0
                ? `${(mins / 60).toFixed(2)}h • ${pct.toFixed(1)}%`
                : "0h • 0%"}
            </span>
          </div>
        );
      })}
      <div style={tooltipFooter}>Total: {(totalMins / 60).toFixed(2)}h</div>
    </div>
  );
}

function IntensityPerSportTooltip({ active, payload }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const totalMins = INTENSITY_ORDER.reduce(
    (sum, i) => sum + (row[i + "_m"] || row[i] * 60 || 0),
    0
  );
  return (
    <div style={tooltipBox}>
      <div style={tooltipTitle}>{row.sport}</div>
      {INTENSITY_ORDER.map(inten => {
        // hours value already stored; raw minutes in *_m (if we kept them) else derive
        const mins = row[inten + "_m"] || (row[inten] || 0) * 60;
        const pct = totalMins ? (mins / totalMins) * 100 : 0;
        return (
          <div key={inten} style={{ ...tooltipLine, color: INTENSITY_COLORS[inten] }}>
            <span>{inten}</span>
            <span>
              {mins > 0
                ? `${(mins / 60).toFixed(2)}h • ${pct.toFixed(1)}%`
                : "0h • 0%"}
            </span>
          </div>
        );
      })}
      <div style={tooltipFooter}>Total: {(totalMins / 60).toFixed(2)}h</div>
    </div>
  );
}

// Reuse existing tooltip style constants
const tooltipBox = {
  background: "white",
  border: "1px solid #eee",
  padding: "0.5rem 0.75rem",
  borderRadius: 6,
  fontSize: 12,
};
const tooltipTitle = { fontWeight: 600, marginBottom: 4 };
const tooltipLine = {
  display: "flex",
  justifyContent: "space-between",
  gap: 8,
  whiteSpace: "nowrap",
};
const tooltipFooter = {
  marginTop: 4,
  borderTop: "1px solid #eee",
  paddingTop: 4,
  fontWeight: 500,
};

function Stat({ label, value, suffix }) {
  return (
    <Card padding="sm" radius="md" withBorder>
      <Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4} lh={1.2}>
        {label}
      </Text>
      <Text fw={600} size="lg">
        {value}{suffix || ""}
      </Text>
    </Card>
  );
}

function ChartWrapper({ children, height = 260 }) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}
