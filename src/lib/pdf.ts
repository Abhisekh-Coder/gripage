import { jsPDF } from "jspdf";
import type { Participant, BioStage } from "./types";
import { STAGE_MAP } from "./formula";

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function generateResultPDF(participant: Participant): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const w = doc.internal.pageSize.getWidth();
  const stage = STAGE_MAP[participant.bioStage];
  const stageRgb = hexToRgb(stage.color);
  const delta = participant.age - participant.biologicalAge;
  const isYounger = delta > 0;
  const vitalityScore = Math.round(Math.max(0, Math.min(100, 50 + delta * 3.3)));
  const copper: [number, number, number] = [212, 132, 90];
  const bg: [number, number, number] = [12, 12, 12];
  const cardBg: [number, number, number] = [20, 20, 20];

  // Background
  doc.setFillColor(...bg);
  doc.rect(0, 0, w, 297, "F");

  // ─── HEADER ───
  doc.setFillColor(16, 16, 16);
  doc.rect(0, 0, w, 45, "F");

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...copper);
  doc.text("GripAge", 20, 20);

  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text("Grip Strength & Biological Age Report", 20, 27);

  doc.setFontSize(8);
  doc.text(new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }), w - 20, 20, { align: "right" });

  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("RESULTS FOR", 20, 40);

  // ─── BIO AGE HERO ───
  doc.setFillColor(...cardBg);
  doc.roundedRect(15, 50, w - 30, 60, 3, 3, "F");

  // Name
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(participant.name, 25, 64);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`${participant.email}  |  ${participant.phone}`, 25, 70);

  // Big bio age number
  doc.setFontSize(48);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...stageRgb);
  doc.text(`${participant.biologicalAge}`, w - 30, 72, { align: "right" });

  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text("Biological Age", w - 30, 78, { align: "right" });

  // Stage badge & delta
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...stageRgb);
  doc.text(participant.bioStage, 25, 85);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(150, 150, 150);
  const deltaText = isYounger ? `${Math.abs(delta)} years younger biologically` : delta < 0 ? `${Math.abs(delta)} years older biologically` : "On track for your age";
  doc.text(deltaText, 25, 91);

  // Vitality score bar
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Vitality Score: ${vitalityScore}/100`, 25, 102);
  // Bar background
  doc.setFillColor(30, 30, 30);
  doc.roundedRect(25, 104, w - 80, 2.5, 1, 1, "F");
  // Bar fill
  doc.setFillColor(...stageRgb);
  doc.roundedRect(25, 104, Math.max(2, (w - 80) * (vitalityScore / 100)), 2.5, 1, 1, "F");

  // ─── AGE COMPARISON CARD ───
  let y = 118;
  doc.setFillColor(...cardBg);
  doc.roundedRect(15, y, (w - 35) / 2, 35, 3, 3, "F");

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("AGE COMPARISON", 25, y + 8);

  // Actual | Delta | Bio
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(200, 200, 200);
  doc.text(`${participant.age}`, 30, y + 22);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Actual", 30, y + 28);

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...stageRgb);
  const deltaDisplay = delta > 0 ? `−${delta}` : delta < 0 ? `+${Math.abs(delta)}` : "=";
  const midX = 15 + (w - 35) / 4;
  doc.text(deltaDisplay, midX, y + 22, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Delta", midX, y + 28, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...stageRgb);
  const rightX = 15 + (w - 35) / 2 - 15;
  doc.text(`${participant.biologicalAge}`, rightX, y + 22);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Bio Age", rightX, y + 28);

  // ─── GRIP STRENGTH CARD ───
  const gripCardX = 15 + (w - 35) / 2 + 5;
  doc.setFillColor(...cardBg);
  doc.roundedRect(gripCardX, y, (w - 35) / 2, 35, 3, 3, "F");

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("GRIP STRENGTH", gripCardX + 10, y + 8);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...stageRgb);
  doc.text(`${participant.gripAvgKg}`, gripCardX + 12, y + 22);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Your (kg)", gripCardX + 12, y + 28);

  const gripDiff = participant.gripAvgKg - participant.expectedGrip;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(gripDiff >= 0 ? 74 : 248, gripDiff >= 0 ? 222 : 113, gripDiff >= 0 ? 128 : 113);
  doc.text(`${gripDiff >= 0 ? "+" : ""}${gripDiff.toFixed(1)}`, gripCardX + (w - 35) / 4, y + 22, { align: "center" });
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("vs expected", gripCardX + (w - 35) / 4, y + 28, { align: "center" });

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 120, 120);
  doc.text(`${participant.expectedGrip}`, gripCardX + (w - 35) / 2 - 25, y + 22);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Expected (kg)", gripCardX + (w - 35) / 2 - 25, y + 28);

  // ─── METRICS TABLE ───
  y = 160;
  doc.setFillColor(...cardBg);
  doc.roundedRect(15, y, w - 30, 45, 3, 3, "F");

  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("DETAILS", 25, y + 8);

  const metrics = [
    ["Chronological Age", `${participant.age} years`],
    ["Height / Weight", `${participant.heightCm} cm / ${participant.weightKg} kg`],
    ["Grip Avg", `${participant.gripAvgKg} kg`],
    ["Expected Grip", `${participant.expectedGrip} kg`],
    ...(participant.gripLeftKg !== null ? [["Left Hand", `${participant.gripLeftKg} kg`]] : []),
    ...(participant.gripRightKg !== null ? [["Right Hand", `${participant.gripRightKg} kg`]] : []),
  ];

  doc.setFontSize(8);
  metrics.forEach(([label, value], i) => {
    const rowY = y + 15 + i * 5.5;
    doc.setTextColor(100, 100, 100);
    doc.text(label, 25, rowY);
    doc.setTextColor(200, 200, 200);
    doc.setFont("helvetica", "bold");
    doc.text(value, w - 25, rowY, { align: "right" });
    doc.setFont("helvetica", "normal");
  });

  // ─── FITNESS PROFILE ───
  y = 210;
  doc.setFillColor(...cardBg);
  doc.roundedRect(15, y, w - 30, 40, 3, 3, "F");

  doc.setFontSize(7);
  doc.setTextColor(...copper);
  doc.text("FITNESS PROFILE", 25, y + 8);

  doc.setFontSize(8);
  const fa = participant.fitnessAnswers;
  const fitnessInfo = [
    ["Gym / Workout", fa.doesGym === "yes" ? "Yes" : fa.doesGym === "sometimes" ? "Sometimes" : "No"],
    ["Frequency", fa.gymFrequency],
    ["Activity Level", fa.activityLevel.charAt(0).toUpperCase() + fa.activityLevel.slice(1).replace("_", " ")],
    ["Exercises", fa.exerciseType.length > 0 ? fa.exerciseType.join(", ").replace(/_/g, " ") : "None"],
    ["Fitness Goal", fa.fitnessGoal],
  ];

  fitnessInfo.forEach(([label, value], i) => {
    const rowY = y + 15 + i * 5;
    doc.setTextColor(100, 100, 100);
    doc.text(label, 25, rowY);
    doc.setTextColor(200, 200, 200);
    doc.text(value, w - 25, rowY, { align: "right" });
  });

  // ─── STAGE REFERENCE TABLE ───
  y = 255;
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text("STAGE REFERENCE", 25, y);

  const stages: { range: string; label: BioStage }[] = [
    { range: ">+10", label: "Elite Vitality" },
    { range: "+6 to +10", label: "Peak Fitness" },
    { range: "+3 to +5", label: "Above Average" },
    { range: "-2 to +2", label: "On Track" },
    { range: "-5 to -3", label: "Below Average" },
    { range: "-10 to -6", label: "Needs Attention" },
    { range: "<-10", label: "Critical Gap" },
  ];

  doc.setFontSize(6);
  stages.forEach((s, i) => {
    const rowY = y + 5 + i * 3.5;
    const info = STAGE_MAP[s.label];
    const rgb = hexToRgb(info.color);
    const isCurrent = s.label === participant.bioStage;

    doc.setFillColor(...rgb);
    doc.circle(27, rowY - 0.8, 1, "F");

    doc.setTextColor(80, 80, 80);
    doc.text(s.range, 31, rowY);

    if (isCurrent) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...rgb);
      doc.text(`${s.label} ← You`, 52, rowY);
      doc.setFont("helvetica", "normal");
    } else {
      doc.setTextColor(100, 100, 100);
      doc.text(s.label, 52, rowY);
    }
  });

  // ─── FOOTER ───
  doc.setFontSize(6);
  doc.setTextColor(50, 50, 50);
  doc.text("Generated by GripAge — Grip Strength & Biological Age", w / 2, 291, { align: "center" });
  doc.text("Formula anchored to population norms. For informational purposes only.", w / 2, 294, { align: "center" });

  doc.save(`GripAge_${participant.name.replace(/\s+/g, "_")}_Report.pdf`);
}
