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
    sportIntensityWeekData,
    distancePerIntensityData,
    hoursPerIntensity,
    hoursPerIntensityWeek,
    totalHours,
    totalDistanceM,
    totalDistanceMWeek,
    avgDistancePerWeek,
    workoutCount,
    weeklyWorkoutsCount,
    avgWorkoutsPerWeek,
    avgHoursPerWeek,
    pctLowVeryLow,
    pctMedium,
    pctHighVeryHigh,
  } = useMemo(() => {
    const sportTotalMinutes = Object.fromEntries(ALL_SPORTS.map(s => [s, 0]));
    const sportIntensityMinutes = {};
    const sportIntensityWeekMinutes = {};
    ALL_SPORTS.forEach(s => {
      sportIntensityMinutes[s] = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
      sportIntensityWeekMinutes[s] = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
    });

    const intensityMinutesOverall = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
    const intensityMinutesWeek = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
    const intensityDistanceMeters = Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));

    let totalMinutes = 0;
    let totalDistanceM = 0;
    let totalDistanceMWeek = 0;
    let workoutCount = 0;
    let weeklyWorkoutsCount = 0;

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
      const dist = Number(w.distance);
      const intensity = normalizeIntensity(w.intensity);
      const sportKey = ALL_SPORTS.includes(w.sport) ? w.sport : null;

      if (!isNaN(mins) && mins > 0) {
        totalMinutes += mins;
        workoutCount++;
        dates.push(d);

        if (d >= startOfWeek && d < endOfWeek) {
          weeklyWorkoutsCount++;
        }

        if (sportKey) {
          sportTotalMinutes[sportKey] += mins;
          if (intensity) {
            sportIntensityMinutes[sportKey][intensity] += mins;
            if (d >= startOfWeek && d < endOfWeek) {
              sportIntensityWeekMinutes[sportKey][intensity] += mins;
            }
          }
        }

        if (intensity) {
          intensityMinutesOverall[intensity] += mins;
          if (d >= startOfWeek && d < endOfWeek) {
            intensityMinutesWeek[intensity] += mins;
          }
        }
      }

      if (!isNaN(dist) && dist > 0) {
        totalDistanceM += dist;
        if (d >= startOfWeek && d < endOfWeek) {
          totalDistanceMWeek += dist;
        }
        if (intensity) {
          intensityDistanceMeters[intensity] += dist;
        }
      }
    });

    dates.sort((a, b) => a - b);
    const first = dates[0] || now;
    const last = dates[dates.length - 1] || now;
    const spanWeeks = Math.max(
      1,
      (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );

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

    const sportIntensityData = ALL_SPORTS.map(sport => {
      const row = { sport };
      INTENSITY_ORDER.forEach(inten => {
        row[inten] = +(sportIntensityMinutes[sport][inten] / 60).toFixed(2);
        row[inten + "_m"] = sportIntensityMinutes[sport][inten];
      });
      return row;
    });

    const sportIntensityWeekData = ALL_SPORTS.map(sport => {
      const row = { sport };
      INTENSITY_ORDER.forEach(inten => {
        row[inten] = +(sportIntensityWeekMinutes[sport][inten] / 60).toFixed(2);
        row[inten + "_m"] = sportIntensityWeekMinutes[sport][inten];
      });
      return row;
    });

    const distancePerIntensityData = [
      INTENSITY_ORDER.reduce(
        (acc, inten) => {
          const meters = intensityDistanceMeters[inten];
          acc[inten] = meters;
          acc[inten + "_m"] = meters;
          return acc;
        },
        { name: "All Intensities" }
      ),
    ];

    const toHoursArray = obj =>
      INTENSITY_ORDER.map(i => ({
        name: i,
        hours: +(obj[i] / 60).toFixed(2),
      }));

    const avgHoursPerWeek = +((totalMinutes / 60) / spanWeeks).toFixed(2);
    const avgDistancePerWeek = totalDistanceM / spanWeeks;
    const avgWorkoutsPerWeek = +(workoutCount / spanWeeks).toFixed(1);

    // Intensity distribution percentages (overall)
    const totalIntensityMinutes = Object.values(intensityMinutesOverall).reduce((a, b) => a + b, 0) || 1;
    const lowVeryLowMinutes = intensityMinutesOverall["Very Low"] + intensityMinutesOverall["Low"];
    const mediumMinutes = intensityMinutesOverall["Medium"];
    const highVeryHighMinutes = intensityMinutesOverall["High"] + intensityMinutesOverall["Very High"];

    const pctLowVeryLow = +( (lowVeryLowMinutes / totalIntensityMinutes) * 100 ).toFixed(1);
    const pctMedium = +( (mediumMinutes / totalIntensityMinutes) * 100 ).toFixed(1);
    const pctHighVeryHigh = +( (highVeryHighMinutes / totalIntensityMinutes) * 100 ).toFixed(1);

    return {
      sportPercentData,
      sportIntensityData,
      sportIntensityWeekData,
      distancePerIntensityData,
      hoursPerIntensity: toHoursArray(intensityMinutesOverall),
      hoursPerIntensityWeek: toHoursArray(intensityMinutesWeek),
      totalHours: +(totalMinutes / 60).toFixed(2),
      totalDistanceM,
      totalDistanceMWeek,
      avgDistancePerWeek,
      workoutCount,
      weeklyWorkoutsCount,
      avgWorkoutsPerWeek,
      avgHoursPerWeek,
      pctLowVeryLow,
      pctMedium,
      pctHighVeryHigh,
    };
  }, [workouts]);

  const formatDistance = (m) =>
    m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${m} m`;

  const empty = !workouts || workouts.length === 0;
  const totalHoursThisWeek = +hoursPerIntensityWeek
    .reduce((sum, row) => sum + (row.hours || 0), 0)
    .toFixed(2);

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
          <SimpleGrid cols={{ base: 1, sm: 3, md: 6 }} spacing="md" mt="sm">
            <Stat label="Total Hours" value={totalHours} suffix="h" />
            <Stat label="Total Hours this Week" value={totalHoursThisWeek} suffix="h" />
            <Stat label="Avg Hours / Week" value={avgHoursPerWeek} suffix="h" />
            <Stat label="Total Distance" value={formatDistance(totalDistanceM)} />
            <Stat label="Total Distance this Week" value={formatDistance(totalDistanceMWeek)} />
            <Stat label="Avg Distance / Week" value={formatDistance(avgDistancePerWeek)} />
            <Stat label="Total Workouts" value={workoutCount} />
            <Stat label="Workouts this Week" value={weeklyWorkoutsCount} />
            <Stat label="Avg Workouts / Week" value={avgWorkoutsPerWeek} />
            <Stat label="Time in Aerobic Intensity" value={pctLowVeryLow} suffix="%" />
            <Stat label="Time in Medium Intensity" value={pctMedium} suffix="%" />
            <Stat label="Time in Anaerobic Intensity" value={pctHighVeryHigh} suffix="%" />
          </SimpleGrid>
        )}
      </Card>

      {/* Three-column analytics layout (md+). On small screens stacks vertically */}
      <SimpleGrid cols={{ base: 4, md: 4 }} spacing="lg">
        {/* Column 1: Hours per Sport (Percent) */}
        <Card withBorder padding="lg" radius="lg">
          <Title order={4} mb="sm">Hours per Sport (Percent)</Title>
          <ChartWrapper height={580}>
            <BarChart data={sportPercentData} stackOffset="expand">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis width={50} tickFormatter={v => `${Math.round(v * 100)}%`} />
              <Tooltip content={<SportPercentTooltip />} />
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

        {/* Column 2: Distance per Intensity (absolute stacked single bar) */}
        <Card withBorder padding="lg" radius="lg">
          <Title order={4} mb="sm">Distance per Intensity</Title>
          <ChartWrapper height={580}>
            <BarChart data={distancePerIntensityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis
                yAxisId="right"
                orientation="right"
                width={50}
                tickFormatter={(v) => v >= 1000 ? (v / 1000).toFixed(0) + " km" : v + " km"}
              />
              <Tooltip content={<DistancePerIntensityTooltip />} />
              {INTENSITY_ORDER.map(inten => (
                <Bar
                  key={inten}
                  dataKey={inten}
                  stackId="dist"
                  yAxisId="right"
                  fill={INTENSITY_COLORS[inten]}
                  radius={[4, 4, 4, 4]}
                />
              ))}
            </BarChart>
          </ChartWrapper>
        </Card>

        {/* Column 3: Intensity per Sport (overall + week) */}
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
                    stackId="intensityOverall"
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
              <BarChart data={sportIntensityWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sport" />
                <YAxis width={40} />
                <Tooltip content={<IntensityPerSportTooltip weekly />} />
                {INTENSITY_ORDER.map(inten => (
                  <Bar
                    key={inten}
                    dataKey={inten}
                    stackId="intensityWeek"
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

function IntensityPerSportTooltip({ active, payload, weekly }) {
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

function DistancePerIntensityTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload;
  const total = INTENSITY_ORDER.reduce(
    (s, i) => s + (row[i + "_m"] || row[i] || 0),
    0
  );
  return (
    <div style={tooltipBox}>
      <div style={tooltipTitle}>{label}</div>
      {INTENSITY_ORDER.map(inten => {
        const meters = row[inten + "_m"] || row[inten] || 0;
        const pct = total ? (meters / total) * 100 : 0;
        return (
          <div key={inten} style={{ ...tooltipLine, color: INTENSITY_COLORS[inten] }}>
            <span>{inten}</span>
            <span>
              {meters > 0
                ? `${(meters / 1000).toFixed(2)} km • ${pct.toFixed(1)}%`
                : "0 km • 0%"}
            </span>
          </div>
        );
      })}
      <div style={tooltipFooter}>Total: {(total / 1000).toFixed(2)} km</div>
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
