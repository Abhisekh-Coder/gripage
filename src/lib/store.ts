import { createClient } from "@/utils/supabase/client";
import type { GripEvent, Participant, FitnessAnswers } from "./types";

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ─── Events ───

export async function getEvents(): Promise<GripEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEvent);
}

export async function getLiveEvents(): Promise<GripEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "live")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEvent);
}

export async function getPastEvents(): Promise<GripEvent[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "ended")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapEvent);
}

export async function getEvent(eventId: string): Promise<GripEvent | null> {
  const supabase = createClient();
  // Try by id first, then by code
  let { data } = await supabase.from("events").select("*").eq("id", eventId).single();
  if (!data) {
    const res = await supabase.from("events").select("*").eq("code", eventId.toUpperCase()).single();
    data = res.data;
  }
  return data ? mapEvent(data) : null;
}

export async function getEventByCode(code: string): Promise<GripEvent | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("code", code.toUpperCase())
    .single();
  return data ? mapEvent(data) : null;
}

export async function createEvent(name: string, date: string, adminPin: string): Promise<GripEvent> {
  const supabase = createClient();
  const code = generateCode();
  const { data, error } = await supabase
    .from("events")
    .insert({ name, date, admin_pin: adminPin, code, status: "live" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapEvent(data);
}

export async function endEvent(eventId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("events").update({ status: "ended" }).eq("id", eventId);
}

export async function reopenEvent(eventId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("events").update({ status: "live" }).eq("id", eventId);
}

export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("events").delete().eq("id", eventId);
}

export async function deleteParticipant(participantId: string): Promise<void> {
  const supabase = createClient();
  await supabase.from("participants").delete().eq("id", participantId);
}

// ─── Participants ───

export async function getParticipants(eventId: string): Promise<Participant[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(mapParticipant);
}

export async function getParticipantByEmail(eventId: string, email: string): Promise<Participant | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .eq("email", email.toLowerCase().trim())
    .single();
  return data ? mapParticipant(data) : null;
}

export async function getParticipant(participantId: string): Promise<Participant | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("participants")
    .select("*")
    .eq("id", participantId)
    .single();
  return data ? mapParticipant(data) : null;
}

export async function addParticipant(p: Omit<Participant, "id" | "createdAt">): Promise<Participant> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("participants")
    .insert({
      event_id: p.eventId,
      name: p.name,
      email: p.email,
      phone: p.phone,
      gender: p.gender,
      height_cm: p.heightCm,
      weight_kg: p.weightKg,
      age: p.age,
      fitness_does_gym: p.fitnessAnswers.doesGym,
      fitness_gym_frequency: p.fitnessAnswers.gymFrequency,
      fitness_exercise_types: p.fitnessAnswers.exerciseType,
      fitness_goal: p.fitnessAnswers.fitnessGoal,
      fitness_activity_level: p.fitnessAnswers.activityLevel,
      grip_left_kg: p.gripLeftKg,
      grip_right_kg: p.gripRightKg,
      grip_avg_kg: p.gripAvgKg,
      expected_grip: p.expectedGrip,
      biological_age: p.biologicalAge,
      bio_stage: p.bioStage,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return mapParticipant(data);
}

export async function getParticipantCount(eventId: string): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("participants")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);
  return count ?? 0;
}

export async function exportParticipantsCSV(eventId: string): Promise<string> {
  const participants = await getParticipants(eventId);
  const headers = [
    "Name", "Email", "Phone", "Gender", "Age", "Height (cm)", "Weight (kg)",
    "Gym", "Frequency", "Activity Level", "Exercises", "Goal",
    "Grip Left (kg)", "Grip Right (kg)", "Grip Avg (kg)",
    "Expected Grip (kg)", "Biological Age", "Stage",
  ];
  const rows = participants.map((p) => [
    p.name, p.email, p.phone, p.gender, p.age, p.heightCm, p.weightKg,
    p.fitnessAnswers.doesGym, p.fitnessAnswers.gymFrequency,
    p.fitnessAnswers.activityLevel, p.fitnessAnswers.exerciseType.join(";"),
    p.fitnessAnswers.fitnessGoal,
    p.gripLeftKg ?? "", p.gripRightKg ?? "", p.gripAvgKg,
    p.expectedGrip, p.biologicalAge, p.bioStage,
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

// ─── Mappers ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapEvent(row: any): GripEvent {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    date: row.date,
    adminPin: row.admin_pin,
    status: row.status,
    createdAt: new Date(row.created_at).getTime(),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipant(row: any): Participant {
  const fa: FitnessAnswers = {
    doesGym: row.fitness_does_gym,
    gymFrequency: row.fitness_gym_frequency,
    exerciseType: row.fitness_exercise_types || [],
    fitnessGoal: row.fitness_goal,
    activityLevel: row.fitness_activity_level,
  };
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    gender: row.gender,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    age: row.age,
    fitnessAnswers: fa,
    gripLeftKg: row.grip_left_kg,
    gripRightKg: row.grip_right_kg,
    gripAvgKg: row.grip_avg_kg,
    expectedGrip: row.expected_grip,
    biologicalAge: row.biological_age,
    bioStage: row.bio_stage,
    createdAt: new Date(row.created_at).getTime(),
  };
}
