import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Card,
  Group,
  Button,
  Text,
  ActionIcon,
  Badge,
  Stack,
  Modal,
  TextInput,
  ScrollArea,
  FileButton,
  Divider,
  Tooltip,
  Textarea,
  useMantineTheme,
  Checkbox,
} from "@mantine/core";
import { TimeInput } from "@mantine/dates";
import {
  IconChevronLeft,
  IconChevronRight,
  IconDownload,
  IconPlus,
  IconTrash,
  IconUpload,
  IconRefresh,
} from "@tabler/icons-react";

const API_BASE = import.meta.env.VITE_API_BASE;

// ---------- Helpers (Monday week start) ----------
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function startOfWeek(d) {
  const base = startOfDay(d);
  const day = base.getDay(); // 0..6 (Sun..Sat)
  const diff = day === 0 ? -6 : 1 - day; // shift so Monday is first
  base.setDate(base.getDate() + diff);
  return base;
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function toDateInputValue(d) {
  return d.toISOString().slice(0, 10);
}
function parseTimeToDate(baseDate, timeStr) {
  const [hh, mm] = (timeStr || "00:00").split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hh || 0, mm || 0, 0, 0);
  return d;
}
function formatTime(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function formatInputTime(d) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
function roundMinutes(mins, step = 15) {
  return Math.round(mins / step) * step;
}
function minsToTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
// Simple .ics parser (SUMMARY / DTSTART / DTEND)
function parseICS(text) {
  const events = [];
  const lines = text.split(/\r?\n/);
  let current = null;
  for (const raw of lines) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") current = {};
    else if (line === "END:VEVENT") {
      if (current?.dtstart) {
        events.push({
          id: crypto.randomUUID(),
          title: current.summary || "Untitled",
          start: current.dtstart,
          end: current.dtend || new Date(current.dtstart.getTime() + 60 * 60 * 1000),
          source: "import",
        });
      }
      current = null;
    } else if (current) {
      if (line.startsWith("SUMMARY:")) current.summary = line.slice(8);
      if (line.startsWith("DTSTART")) current.dtstart = icsDateToJs(line.split(":")[1]);
      if (line.startsWith("DTEND")) current.dtend = icsDateToJs(line.split(":")[1]);
    }
  }
  return events;
}
function icsDateToJs(v) {
  if (!v) return new Date();
  if (v.length === 8) {
    const y = +v.slice(0, 4);
    const m = +v.slice(4, 6) - 1;
    const d = +v.slice(6, 8);
    return new Date(y, m, d);
  }
  const iso = v.replace(/Z$/, "");
  const y = +iso.slice(0, 4);
  const m = +iso.slice(4, 6) - 1;
  const d = +iso.slice(6, 8);
  const hh = +iso.slice(9, 11) || 0;
  const mm = +iso.slice(11, 13) || 0;
  const ss = +iso.slice(13, 15) || 0;
  return new Date(Date.UTC(y, m, d, hh, mm, ss));
}

// ---------- Component ----------
export default function TeamScheduleCalendar({ userEmail, user }) {
  const theme = useMantineTheme();

  // Week-based state
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));

  // Events & UI state
  const [events, setEvents] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [loadingRemote, setLoadingRemote] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  // Drag-to-create
  const [dragSelecting, setDragSelecting] = useState(false);
  const [dragDayIdx, setDragDayIdx] = useState(null);
  const [dragStartMin, setDragStartMin] = useState(null);
  const [dragEndMin, setDragEndMin] = useState(null);

  // Derived week days array (Mon..Sun)
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Hours (0..23)
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const slotHeight = 48; // px per hour

  // Load busy events
  useEffect(() => {
    if (!userEmail) return;
    let cancelled = false;
    (async () => {
      setLoadingRemote(true);
      setError(null);
      try {
        const res = await fetch(
          `${API_BASE}/busy_events?email=${encodeURIComponent(userEmail)}`
        );
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (cancelled) return;
        const mapped = (data || []).map((e) => ({
          id: e._id || e.id,
          title: e.title || "Busy",
          start: new Date(e.start || e.date),
          end: new Date(e.end || e.start || e.date),
          notes: e.notes || "",
          source: "busy",
          allDay: !!e.allDay,
          owner: userEmail,
        }));
        setEvents((prev) => {
          const keep = prev.filter((p) => p.source !== "busy");
          return [...keep, ...mapped];
        });
      } catch {
        if (!cancelled) setError("Could not load busy events");
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userEmail]);

  async function refreshBusy() {
    if (!userEmail) return;
    setLoadingRemote(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/busy_events?email=${encodeURIComponent(userEmail)}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      const mapped = (data || []).map((e) => ({
        id: e._id || e.id,
        title: e.title || "Busy",
        start: new Date(e.start || e.date),
        end: new Date(e.end || e.start || e.date),
        notes: e.notes || "",
        source: "busy",
        allDay: !!e.allDay,
        owner: userEmail,
      }));
      setEvents((prev) => {
        const nonBusy = prev.filter((p) => p.source !== "busy");
        return [...nonBusy, ...mapped];
      });
    } catch {
      setError("Failed to refresh");
    } finally {
      setLoadingRemote(false);
    }
  }

  function resetForm() {
    setTitle("");
    setNotes("");
    setStartTime("09:00");
    setEndTime("10:00");
    setAllDay(false);
    setEditEvent(null);
  }

  // Create busy event
  async function handleAdd() {
    const baseDay = selectedDate;
    const start = allDay ? new Date(baseDay) : parseTimeToDate(baseDay, startTime);
    const endCandidate = allDay
      ? new Date(baseDay.getTime() + 60 * 60 * 1000)
      : parseTimeToDate(baseDay, endTime);
    const end =
      endCandidate <= start
        ? new Date(start.getTime() + 30 * 60 * 1000)
        : endCandidate;

    const payload = {
      user,
      date: toDateInputValue(baseDay),
      startTime: formatInputTime(start),
      endTime: formatInputTime(end),
      title: title || "Busy",
      notes,
      allDay,
    };

    const tempId = crypto.randomUUID();
    setEvents((prev) => [
      ...prev,
      {
        id: tempId,
        title: payload.title,
        start,
        end,
        notes,
        source: "busy",
        owner: userEmail,
        allDay,
      },
    ]);

    resetForm();
    setCreateOpen(false);

    try {
      const res = await fetch(`${API_BASE}/add_busy_event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json().catch(() => null);
      if (saved?._id) {
        setEvents((prev) =>
          prev.map((e) => (e.id === tempId ? { ...e, id: saved._id } : e))
        );
      }
    } catch {
      setEvents((prev) => prev.filter((e) => e.id !== tempId));
      setError("Failed to save busy event");
    }
  }

  // Update busy event
  async function handleUpdate() {
    if (!editEvent) return;
    const baseDay = selectedDate;
    const start = allDay ? new Date(baseDay) : parseTimeToDate(baseDay, startTime);
    const endCandidate = allDay
      ? new Date(baseDay.getTime() + 60 * 60 * 1000)
      : parseTimeToDate(baseDay, endTime);
    const end =
      endCandidate <= start
        ? new Date(start.getTime() + 30 * 60 * 1000)
        : endCandidate;

    const id = editEvent.id;
    const updatePayload = {
      title: title || "Busy",
      date: toDateInputValue(baseDay),
      startTime: formatInputTime(start),
      endTime: formatInputTime(end),
      notes,
      allDay,
    };

    // Optimistic
    setEvents((prev) =>
      prev.map((e) =>
        e.id === id
          ? { ...e, title: updatePayload.title, start, end, notes, allDay }
          : e
      )
    );

    resetForm();
    setCreateOpen(false);
    try {
      await fetch(`${API_BASE}/busy_events/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
    } catch {
      setError("Failed to update");
      refreshBusy();
    }
  }

  // Delete busy event
  async function handleDelete(id) {
    const target = events.find((e) => e.id === id);
    const isBusy = target?.source === "busy";
    setEvents((prev) => prev.filter((e) => e.id !== id));
    if (editEvent?.id === id) resetForm();
    if (!isBusy) return;
    try {
      await fetch(`${API_BASE}/busy_events/${id}`, { method: "DELETE" });
    } catch {
      setError("Failed to delete");
      refreshBusy();
    }
  }

  // Edit
  function handleEdit(ev) {
    setEditEvent(ev);
    setSelectedDate(startOfDay(ev.start));
    setTitle(ev.title);
    setNotes(ev.notes || "");
    setAllDay(!!ev.allDay);
    setStartTime(formatInputTime(ev.start));
    setEndTime(formatInputTime(ev.end));
    setCreateOpen(true);
  }

  // Google sync
  async function handleGoogleSync() {
    if (!userEmail) return;
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/sync_google_calendar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      if (!res.ok) throw new Error();
      await refreshBusy();
    } catch {
      setError("Google sync failed");
    } finally {
      setSyncing(false);
    }
  }

  // Import ICS (file)
  function handleICSFile(file) {
    if (!file) return;
    file.text().then((t) => {
      const imported = parseICS(t);
      if (imported.length) {
        setEvents((prev) => {
          const existing = new Set(
            prev.map((e) => `${e.start.toISOString()}|${e.title}`)
          );
          const filtered = imported.filter(
            (e) => !existing.has(`${e.start.toISOString()}|${e.title}`)
          );
          return [...prev, ...filtered];
        });
      }
    });
  }
  function importRawICS(raw) {
    const imported = parseICS(raw);
    if (imported.length) {
      setEvents((prev) => [...prev, ...imported]);
    }
  }

  // Week navigation
  function prevWeek() {
    const ns = addDays(weekStart, -7);
    setWeekStart(ns);
    setSelectedDate(ns);
  }
  function nextWeek() {
    const ns = addDays(weekStart, 7);
    setWeekStart(ns);
    setSelectedDate(ns);
  }
  function goToday() {
    const today = startOfDay(new Date());
    setSelectedDate(today);
    setWeekStart(startOfWeek(today));
  }

  // Events in this week (including ones that overlap into the week)
  const weekEvents = useMemo(() => {
    const wkStart = weekStart;
    const wkEnd = addDays(weekStart, 7); // exclusive
    return events.filter(
      (e) =>
        (e.start >= wkStart && e.start < wkEnd) ||
        (e.end > wkStart && e.end <= wkEnd) ||
        (e.start < wkStart && e.end > wkStart)
    );
  }, [events, weekStart]);

  // Separate all-day vs timed
  const allDayByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((d, i) => (map[i] = []));
    weekEvents.forEach((ev) => {
      const idx = weekDays.findIndex((d) => sameDay(d, ev.start));
      if (idx >= 0 && ev.allDay) map[idx].push(ev);
    });
    return map;
  }, [weekEvents, weekDays]);

  const timedEvents = useMemo(
    () => weekEvents.filter((e) => !e.allDay),
    [weekEvents]
  );

  // Overlap layout
  function layoutDayEvents(day) {
    const eventsForDay = timedEvents
      .filter((e) => sameDay(e.start, day))
      .sort((a, b) => a.start - b.start);
    const lanes = [];
    eventsForDay.forEach((ev) => {
      let placed = false;
      for (const lane of lanes) {
        if (lane[lane.length - 1].end <= ev.start) {
          lane.push(ev);
          placed = true;
          break;
        }
      }
      if (!placed) lanes.push([ev]);
    });
    const positioned = [];
    lanes.forEach((lane, laneIdx) =>
      lane.forEach((ev) =>
        positioned.push({
          ev,
          laneIdx,
          laneCount: lanes.length,
        })
      )
    );
    return positioned;
  }

  const dayEventLayouts = useMemo(() => {
    const obj = {};
    weekDays.forEach((d, i) => (obj[i] = layoutDayEvents(d)));
    return obj;
  }, [weekDays, timedEvents]);

  // Selected day list
  const selectedDayEvents = useMemo(
    () =>
      events
        .filter((e) => sameDay(e.start, selectedDate))
        .sort((a, b) => a.start - b.start),
    [events, selectedDate]
  );

  function weekTitle() {
    const start = weekDays[0];
    const end = weekDays[6];
    const sameMonth = start.getMonth() === end.getMonth();
    return sameMonth
      ? `${start.toLocaleString(undefined, {
          month: "long",
          day: "numeric",
        })} – ${end.getDate()}, ${end.getFullYear()}`
      : `${start.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
        })} – ${end.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}`;
  }

  // ---------- Drag-to-create ----------
  const beginDrag = useCallback((dayIdx, clientY, columnEl) => {
    const rect = columnEl.getBoundingClientRect();
    const y = clientY - rect.top;
    const total = slotHeight * 24;
    const clamped = Math.min(Math.max(0, y), total - 2);
    const mins = roundMinutes((clamped / total) * 1440);
    setDragSelecting(true);
    setDragDayIdx(dayIdx);
    setDragStartMin(mins);
    setDragEndMin(mins + 30); // default 30 mins
  }, []);

  const updateDrag = useCallback(
    (clientY) => {
      if (!dragSelecting || dragDayIdx == null) return;
      const col = document.querySelector(`[data-cal-day="${dragDayIdx}"]`);
      if (!col) return;
      const rect = col.getBoundingClientRect();
      const total = slotHeight * 24;
      const y = clientY - rect.top;
      const clamped = Math.min(Math.max(0, y), total - 2);
      const mins = roundMinutes((clamped / total) * 1440);
      if (mins < dragStartMin) {
        setDragEndMin(dragStartMin);
        setDragStartMin(mins);
      } else {
        setDragEndMin(Math.max(mins, dragStartMin + 15));
      }
    },
    [dragSelecting, dragDayIdx, dragStartMin]
  );

  const finishDrag = useCallback(() => {
    if (!dragSelecting || dragDayIdx == null) {
      setDragSelecting(false);
      return;
    }
    const dayDate = weekDays[dragDayIdx];
    const startM = dragStartMin;
    const endM = dragEndMin;
    setSelectedDate(startOfDay(dayDate));
    setAllDay(false);
    setStartTime(minsToTime(startM));
    setEndTime(minsToTime(endM));
    setTitle("Busy");
    setNotes("");
    setEditEvent(null);
    setCreateOpen(true);
    setDragSelecting(false);
    setDragDayIdx(null);
    setDragStartMin(null);
    setDragEndMin(null);
  }, [dragSelecting, dragDayIdx, dragStartMin, dragEndMin, weekDays]);

  useEffect(() => {
    function onMove(e) {
      updateDrag(e.clientY);
    }
    function onUp() {
      finishDrag();
    }
    if (dragSelecting) {
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragSelecting, updateDrag, finishDrag]);

  return (
    <Card withBorder radius="lg" p="lg">
      <Group justify="space-between" mb="sm" wrap="wrap">
        <Group gap={6}>
          <ActionIcon variant="light" onClick={prevWeek} aria-label="Previous week">
            <IconChevronLeft size={16} />
          </ActionIcon>
          <Text fw={600}>{weekTitle()}</Text>
          <ActionIcon variant="light" onClick={nextWeek} aria-label="Next week">
            <IconChevronRight size={16} />
          </ActionIcon>
          <Button size="compact-sm" variant="subtle" onClick={goToday}>
            Today
          </Button>
        </Group>
        <Group gap={8}>
          <Button
            size="compact-sm"
            variant="subtle"
            leftSection={<IconRefresh size={14} />}
            loading={loadingRemote}
            onClick={refreshBusy}
          >
            Refresh
          </Button>
          <FileButton onChange={handleICSFile} accept=".ics,text/calendar">
            {(props) => (
              <Button
                {...props}
                variant="outline"
                size="compact-sm"
                leftSection={<IconUpload size={14} />}
              >
                Import .ics
              </Button>
            )}
          </FileButton>
          <Button
            size="compact-sm"
            variant="light"
            leftSection={<IconDownload size={14} />}
            onClick={() => {
              const raw = prompt("Paste raw .ics content to import:");
              if (raw) importRawICS(raw);
            }}
          >
            Paste .ics
          </Button>
          <Button
            size="compact-sm"
            leftSection={<IconPlus size={14} />}
            onClick={() => {
              resetForm();
              setCreateOpen(true);
            }}
          >
            Add
          </Button>
          <Button
            size="compact-sm"
            variant="light"
            loading={syncing}
            onClick={handleGoogleSync}
          >
            Sync Google
          </Button>
        </Group>
      </Group>

      {error && (
        <Text size="xs" c="red" mb="xs">
          {error}
        </Text>
      )}

      <Divider mb="sm" />

      {/* Week headers (Mon..Sun) */}
      <div
        style={{
          display: "grid",
            gridTemplateColumns: "80px repeat(7, 1fr)",
          gap: 0,
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
          marginBottom: 4,
        }}
      >
        <div />
        {weekDays.map((d, i) => {
          const isToday = sameDay(d, new Date());
          const selected = sameDay(d, selectedDate);
          return (
            <div
              key={i}
              onClick={() => setSelectedDate(startOfDay(d))}
              style={{
                padding: "4px 6px",
                cursor: "pointer",
                background: selected ? theme.colors.blue[0] : "transparent",
                borderRadius: 6,
                position: "relative",
              }}
            >
              <Group gap={6} justify="space-between">
                <Text
                  size="xs"
                  fw={600}
                  c={isToday ? "red" : "dark"}
                  style={{ lineHeight: 1.1 }}
                >
                  {d.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
                {isToday && (
                  <Badge
                    size="xs"
                    variant="filled"
                    color="red"
                    radius="sm"
                    style={{ fontSize: 9 }}
                  >
                    Today
                  </Badge>
                )}
              </Group>
              {/* All-day events row */}
              {allDayByDay[i]?.length > 0 && (
                <Group gap={4} mt={4} wrap="wrap">
                  {allDayByDay[i].map((ev) => (
                    <Badge
                      key={ev.id}
                      size="xs"
                      radius="sm"
                      variant="light"
                      color={
                        ev.source === "import"
                          ? "grape"
                          : ev.source === "busy"
                          ? "teal"
                          : "indigo"
                      }
                      style={{ cursor: "pointer" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(ev);
                      }}
                    >
                      {ev.title}
                    </Badge>
                  ))}
                </Group>
              )}
            </div>
          );
        })}
      </div>

      {/* Time grid with drag-to-create */}
      <ScrollArea style={{ height: 600 }}>
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "80px repeat(7, 1fr)",
            alignItems: "stretch",
          }}
        >
          {/* Time labels column */}
          <div
            style={{
              position: "relative",
              borderRight: `1px solid ${theme.colors.gray[3]}`,
            }}
          >
            {hours.map((h) => (
              <div
                key={h}
                style={{
                  height: slotHeight,
                  boxSizing: "border-box",
                  padding: "2px 4px",
                  fontSize: 11,
                  color: theme.colors.gray[6],
                }}
              >
                {`${String(h).padStart(2, "0")}:00`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, dayIdx) => {
            const layouts = dayEventLayouts[dayIdx];
            const totalHeight = slotHeight * 24;
            let dragBlock = null;
            if (
              dragSelecting &&
              dragDayIdx === dayIdx &&
              dragStartMin != null &&
              dragEndMin != null
            ) {
              const top = (dragStartMin / 60) * slotHeight;
              const height = Math.max(
                12,
                ((dragEndMin - dragStartMin) / 60) * slotHeight
              );
              dragBlock = { top, height };
            }
            return (
              <div
                key={dayIdx}
                data-cal-day={dayIdx}
                onMouseDown={(e) => {
                  if (e.target.closest(".cal-ev")) return;
                  beginDrag(dayIdx, e.clientY, e.currentTarget);
                }}
                onClick={(e) => {
                  if (e.target === e.currentTarget)
                    setSelectedDate(startOfDay(day));
                }}
                style={{
                  position: "relative",
                  borderRight:
                    dayIdx < 6 ? `1px solid ${theme.colors.gray[3]}` : "none",
                  background: sameDay(day, selectedDate)
                    ? theme.colors.blue[0]
                    : "transparent",
                  userSelect: "none",
                  height: totalHeight,
                }}
              >
                {/* Hour slots background lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    style={{
                      position: "relative",
                      height: slotHeight,
                      borderTop: `1px solid ${
                        h === 0
                          ? theme.colors.gray[3]
                          : theme.colors.gray[2]
                      }`,
                    }}
                  />
                ))}

                {/* Timed events */}
                {layouts.map(({ ev, laneIdx, laneCount }) => {
                  const startMinutes =
                    ev.start.getHours() * 60 + ev.start.getMinutes();
                  const endMinutes =
                    ev.end.getHours() * 60 + ev.end.getMinutes();
                  const top = (startMinutes / 60) * slotHeight;
                  const height =
                    Math.max(
                      20,
                      ((endMinutes - startMinutes) / 60) * slotHeight
                    ) - 2;
                  const widthPct = 100 / laneCount;
                  const leftPct = laneIdx * widthPct;
                  return (
                    <Tooltip
                      key={ev.id}
                      label={`${ev.title} ${
                        ev.allDay
                          ? "(all day)"
                          : `${formatTime(ev.start)} - ${formatTime(ev.end)}`
                      }`}
                      withArrow
                    >
                      <div
                        className="cal-ev"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(ev);
                        }}
                        style={{
                          position: "absolute",
                          top,
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          height,
                          background:
                            ev.source === "import"
                              ? theme.colors.grape[5]
                              : ev.source === "busy"
                              ? theme.colors.teal[5]
                              : theme.colors.indigo[5],
                          color: "white",
                          fontSize: 11,
                          borderRadius: 6,
                          padding: "4px 6px",
                          boxSizing: "border-box",
                          overflow: "hidden",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            lineHeight: 1.1,
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {ev.title}
                        </span>
                        <span style={{ opacity: 0.85 }}>
                          {formatTime(ev.start)} – {formatTime(ev.end)}
                        </span>
                      </div>
                    </Tooltip>
                  );
                })}

                {dragBlock && (
                  <div
                    style={{
                      position: "absolute",
                      top: dragBlock.top,
                      left: 2,
                      right: 2,
                      height: dragBlock.height,
                      background: theme.colors.blue[4],
                      opacity: 0.35,
                      border: `1px solid ${theme.colors.blue[6]}`,
                      borderRadius: 6,
                      pointerEvents: "none",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Divider my="md" />

      {/* Selected day list */}
      <Stack gap="xs" mt="xs">
        <Group justify="space-between" align="center">
          <Text fw={600} size="sm">
            {toDateInputValue(selectedDate)} ({selectedDayEvents.length} event
            {selectedDayEvents.length !== 1 && "s"})
          </Text>
          {selectedDayEvents.length > 0 && (
            <Text size="xs" c="dimmed">
              Click event block to edit
            </Text>
          )}
        </Group>
        <ScrollArea style={{ maxHeight: 220 }} type="auto">
          <Stack gap="sm" pr="sm" mt={4}>
            {selectedDayEvents.length === 0 && (
              <Text size="xs" c="dimmed">
                No events this day.
              </Text>
            )}
            {selectedDayEvents.map((ev) => (
              <Card
                key={ev.id}
                withBorder
                radius="md"
                padding="xs"
                style={{
                  borderColor:
                    ev.source === "import"
                      ? theme.colors.grape[4]
                      : ev.source === "busy"
                      ? theme.colors.teal[4]
                      : theme.colors.indigo[4],
                  cursor: "pointer",
                }}
                onClick={() => handleEdit(ev)}
              >
                <Group justify="space-between" align="flex-start" gap={6}>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Group gap={6}>
                      <Badge
                        size="xs"
                        variant="light"
                        color={
                          ev.source === "import"
                            ? "grape"
                            : ev.source === "busy"
                            ? "teal"
                            : "indigo"
                        }
                        radius="sm"
                      >
                        {ev.source === "import"
                          ? "Imported"
                          : ev.source === "busy"
                          ? "Busy"
                          : "Manual"}
                      </Badge>
                      {ev.allDay && (
                        <Badge
                          size="xs"
                          variant="outline"
                          color="yellow"
                          radius="sm"
                        >
                          All day
                        </Badge>
                      )}
                    </Group>
                    <Text size="sm" fw={600} style={{ lineHeight: 1.1 }}>
                      {ev.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {ev.allDay
                        ? "All day"
                        : `${formatTime(ev.start)} - ${formatTime(ev.end)}`}
                    </Text>
                    {ev.notes && (
                      <Text size="xs" c="dimmed" lineClamp={2}>
                        {ev.notes}
                      </Text>
                    )}
                  </Stack>
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="subtle"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(ev.id);
                    }}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>

      <Modal
        opened={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetForm();
        }}
        title={editEvent ? "Edit Busy Event" : "Add Busy Event"}
        centered
        radius="lg"
        size={480}
      >
        <Stack>
          <Text size="xs" c="dimmed">
            Date: {toDateInputValue(selectedDate)}
          </Text>
          <TextInput
            label="Title"
            placeholder="Session / Meeting / Outing"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <Textarea
            label="Notes"
            placeholder="Optional details"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            minRows={2}
            autosize
          />
          <Checkbox
            label="All day"
            checked={allDay}
            onChange={(e) => setAllDay(e.currentTarget.checked)}
          />
          {!allDay && (
            <Group grow>
              <TimeInput
                label="Start"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <TimeInput
                label="End"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </Group>
          )}
          <Group justify="flex-end" mt="sm">
            <Button
              variant="subtle"
              onClick={() => {
                setCreateOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={editEvent ? handleUpdate : handleAdd}>
              {editEvent ? "Update" : "Add"}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
}