import { Card, Title, Group, Text, SimpleGrid, Badge, Stack, Divider } from "@mantine/core";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line, Cell } from "recharts";

const INTENSITY_ORDER = ["Very Low", "Low", "Medium", "High", "Very High"]; // match MyStats ordering
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

const ALL_SPORTS = Object.keys(SPORT_COLORS);

function memberLabel(u) {
	if (!u) return "Unknown";
	if (typeof u === "string") return u;
	if (typeof u === "object") {
		return u.name || u.username || u.email || "Unknown";
	}
	return "Unknown";
}

export default function TeamStats({ workouts }) {
	const {
		totalHours,
		totalDistanceM,
		workoutCount,
		memberCount,
		avgHoursPerAthlete,
		avgDistancePerAthlete,
		intensityStackData,
		sportStackData,
		weeklySeries,
		members,
	} = useMemo(() => {
		const perMember = {}; // name -> { minutes, distance, workouts }
		const perMemberIntensity = {}; // name -> intensity -> minutes
		const perMemberSport = {}; // name -> sport -> minutes
		const dates = [];

		(workouts || []).forEach(w => {
			if (!w) return;
			const label = memberLabel(w.user);
			perMember[label] = perMember[label] || { minutes: 0, distance: 0, workouts: 0 };
			perMemberIntensity[label] = perMemberIntensity[label] || Object.fromEntries(INTENSITY_ORDER.map(i => [i, 0]));
			perMemberSport[label] = perMemberSport[label] || Object.fromEntries(ALL_SPORTS.map(s => [s, 0]));
			const mins = Number(w.duration) || 0;
			const dist = Number(w.distance) || 0;
			const intensity = INTENSITY_ORDER.find(i => i.toLowerCase() === (w.intensity||"").toLowerCase()) || null;
			const sport = ALL_SPORTS.includes(w.sport) ? w.sport : "OTHER";
			if (mins > 0) {
				perMember[label].minutes += mins;
				perMember[label].workouts += 1;
				if (intensity) perMemberIntensity[label][intensity] += mins;
				perMemberSport[label][sport] += mins;
			}
			if (dist > 0) perMember[label].distance += dist;
			if (w.date) {
				const d = new Date(w.date);
				if (!isNaN(d)) dates.push(d);
			}
		});

		const members = Object.keys(perMember).sort();
		const totalMinutes = members.reduce((s,m)=> s + perMember[m].minutes, 0);
		const totalDistanceM = members.reduce((s,m)=> s + perMember[m].distance, 0);
		const workoutCount = members.reduce((s,m)=> s + perMember[m].workouts, 0);
		const memberCount = members.length || 1;
		const totalHours = +(totalMinutes/60).toFixed(2);
		const avgHoursPerAthlete = +((totalMinutes/60)/memberCount).toFixed(2);
		const avgDistancePerAthlete = totalDistanceM/memberCount;

		// Intensity stacked bar data per member
		const intensityStackData = members.map(m => {
			const row = { member: m };
			INTENSITY_ORDER.forEach(inten => {
				row[inten] = +(perMemberIntensity[m][inten]/60).toFixed(2);
				row[inten+"_m"] = perMemberIntensity[m][inten];
			});
			row.total_h = +(perMember[m].minutes/60).toFixed(2);
			return row;
		});

		// Sport stacked bar data per member
		const sportStackData = members.map(m => {
			const row = { member: m };
			ALL_SPORTS.forEach(s => {
				row[s] = +(perMemberSport[m][s]/60).toFixed(2);
				row[s+"_m"] = perMemberSport[m][s];
			});
			row.total_h = +(perMember[m].minutes/60).toFixed(2);
			return row;
		});

		// Weekly hours per member (last 5 weeks including current)
		const weeks = [];
		const currentWeekStart = new Date();
		const dow = (currentWeekStart.getDay()+6)%7; // Monday start
		currentWeekStart.setHours(0,0,0,0);
		currentWeekStart.setDate(currentWeekStart.getDate()-dow);
		for (let i=4;i>=0;i--) {
			const ws = new Date(currentWeekStart);
			ws.setDate(ws.getDate()-i*7);
			const we = new Date(ws); we.setDate(we.getDate()+7);
			const label = `${ws.getMonth()+1}/${ws.getDate()}`;
			const row = { week: label };
			members.forEach(m=> row[m]=0);
			(workouts||[]).forEach(w=>{
				if(!w?.date) return; const d=new Date(w.date); if(isNaN(d)) return;
				if (d>=ws && d<we) {
					const mins = Number(w.duration)||0; if(mins<=0) return;
					const mlabel = memberLabel(w.user);
					if (row.hasOwnProperty(mlabel)) row[mlabel] += +(mins/60).toFixed(2);
				}
			});
			weeks.push(row);
		}

		return {
			totalHours,
			totalDistanceM,
			workoutCount,
			memberCount: members.length,
			avgHoursPerAthlete,
			avgDistancePerAthlete,
			intensityStackData,
			sportStackData,
			weeklySeries: weeks,
			members,
		};
	}, [workouts]);

	const formatDistance = (m) => m >= 1000 ? `${(m/1000).toFixed(2)} km` : `${m} m`;

	const avgDistancePerAthleteLabel = formatDistance(avgDistancePerAthlete || 0);

	if (!workouts || workouts.length === 0) {
		return (
			<Card withBorder padding="lg" radius="lg">
				<Title order={2} mb="sm">Team Stats</Title>
				<Text c="dimmed" size="sm">No workouts to display.</Text>
			</Card>
		);
	}

	return (
		<Stack>
			<Card withBorder padding="lg" radius="lg">
				<Group justify="space-between" mb="sm">
					<Title order={2} mb={0}>Team Stats</Title>
					<Badge variant="light" radius="sm" color="indigo">{memberCount} member{memberCount!==1?'s':''}</Badge>
				</Group>
				<SimpleGrid cols={{ base: 2, sm: 4, md: 8 }} spacing="md">
					<Stat label="Total Hours" value={totalHours} suffix="h" />
						<Stat label="Total Distance" value={formatDistance(totalDistanceM)} />
						<Stat label="Total Workouts" value={workoutCount} />
						<Stat label="Avg Hours / Athlete" value={avgHoursPerAthlete} suffix="h" />
						<Stat label="Avg Dist / Athlete" value={avgDistancePerAthleteLabel} />
						<Stat label="Avg Workouts / Athlete" value={ memberCount ? (workoutCount/memberCount).toFixed(1): 0 } />
						<Stat label="Members" value={memberCount} />
						<Stat label="Hours / Member (Range)" value={""} suffix={""} />
				</SimpleGrid>
				<Text size="xs" c="dimmed" mt={6}>Stacked charts below show composition by intensity and sport.</Text>
			</Card>

			<SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
				<Card withBorder padding="lg" radius="lg">
					<Title order={4} mb="xs">Hours per Member (Stacked by Intensity)</Title>
					<ChartWrapper height={members.length>8? 420: 360}>
						<BarChart data={intensityStackData} stackOffset="none">
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="member" hide={members.length>8} />
							<YAxis width={50} />
							<Tooltip content={<MemberIntensityTooltip />} />
							<Legend />
							{INTENSITY_ORDER.map(inten => (
								<Bar key={inten} dataKey={inten} stackId="intensity" fill={INTENSITY_COLORS[inten]} />
							))}
						</BarChart>
					</ChartWrapper>
				</Card>
				<Card withBorder padding="lg" radius="lg">
					<Title order={4} mb="xs">Hours per Member (Stacked by Sport)</Title>
					<ChartWrapper height={members.length>8? 420: 360}>
						<BarChart data={sportStackData}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="member" hide={members.length>8} />
							<YAxis width={50} />
							<Tooltip content={<MemberSportTooltip />} />
							<Legend />
							{ALL_SPORTS.map(s => (
								<Bar key={s} dataKey={s} stackId="sport" fill={SPORT_COLORS[s]} />
							))}
						</BarChart>
					</ChartWrapper>
				</Card>
			</SimpleGrid>

			<Card withBorder padding="lg" radius="lg">
				<Title order={4} mb="xs">Weekly Hours per Member</Title>
				<ChartWrapper height={260}>
					<LineChart data={weeklySeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" />
						<XAxis dataKey="week" />
						<YAxis width={40} />
						<Tooltip />
						<Legend />
						{members.map((m,i)=> (
							<Line key={m} type="monotone" dataKey={m} stroke={memberColor(m,i)} strokeWidth={2} dot={false} />
						))}
					</LineChart>
				</ChartWrapper>
			</Card>
		</Stack>
	);
}

function memberColor(name, idx) {
	const palette = ["#4c6ef5","#228be6","#12b886","#fab005","#fd7e14","#fa5252","#7048e8","#868e96"]; 
	return palette[idx % palette.length];
}

function MemberIntensityTooltip({ active, payload, label }) {
	if (!active || !payload || payload.length===0) return null;
	const row = payload[0].payload;
	const total = INTENSITY_ORDER.reduce((s,i)=> s + (row[i+"_m"] || row[i]*60 || 0), 0);
	return (
		<div style={tooltipBox}>
			<div style={tooltipTitle}>{row.member}</div>
			{INTENSITY_ORDER.map(inten => {
				const mins = row[inten+"_m"] || (row[inten]||0)*60;
				const pct = total ? (mins/total)*100 : 0;
				return (
					<div key={inten} style={{ ...tooltipLine, color: INTENSITY_COLORS[inten] }}>
						<span>{inten}</span>
						<span>{mins>0 ? `${(mins/60).toFixed(2)}h • ${pct.toFixed(1)}%` : '0h • 0%'}</span>
					</div>
				);
			})}
			<div style={tooltipFooter}>Total: {(total/60).toFixed(2)}h</div>
		</div>
	);
}

function MemberSportTooltip({ active, payload }) {
	if (!active || !payload || payload.length===0) return null;
	const row = payload[0].payload;
	const total = ALL_SPORTS.reduce((s,sport)=> s + (row[sport+"_m"] || row[sport]*60 || 0), 0);
	return (
		<div style={tooltipBox}>
			<div style={tooltipTitle}>{row.member}</div>
			{ALL_SPORTS.map(sport => {
				const mins = row[sport+"_m"] || (row[sport]||0)*60;
				const pct = total ? (mins/total)*100 : 0;
				return (
					<div key={sport} style={{ ...tooltipLine, color: SPORT_COLORS[sport] }}>
						<span>{sport}</span>
						<span>{mins>0 ? `${(mins/60).toFixed(2)}h • ${pct.toFixed(1)}%` : '0h • 0%'}</span>
					</div>
				);
			})}
			<div style={tooltipFooter}>Total: {(total/60).toFixed(2)}h</div>
		</div>
	);
}

const tooltipBox = {
	background: "white",
	border: "1px solid #eee",
	padding: "0.5rem 0.75rem",
	borderRadius: 6,
	fontSize: 12,
};
const tooltipTitle = { fontWeight: 600, marginBottom: 4 };
const tooltipLine = { display: "flex", justifyContent: "space-between", gap: 8, whiteSpace: "nowrap" };
const tooltipFooter = { marginTop: 4, borderTop: "1px solid #eee", paddingTop: 4, fontWeight: 500 };

function Stat({ label, value, suffix }) {
	return (
		<Card padding="sm" radius="md" withBorder>
			<Text size="xs" c="dimmed" fw={500} tt="uppercase" mb={4} lh={1.2}>{label}</Text>
			<Text fw={600} size="lg">{value}{suffix||""}</Text>
		</Card>
	);
}

function ChartWrapper({ children, height=300 }) {
	return (
		<div style={{ width: '100%', height }}>
			<ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
		</div>
	);
}
