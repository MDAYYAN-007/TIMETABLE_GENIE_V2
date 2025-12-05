// utils/timetableGeneratorAI.js
// SERVER ONLY — Do NOT import this inside "use client" components.

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate timetable using Gemini (Google AI)
 */
export async function generateTimetableAI(
  config,
  facultyData,
  labRoomsData,
  branchData
) {
  console.log("🔧 SERVER: Generating timetable using Gemini...");
  console.log("⚙ Config:", JSON.stringify(config, null, 2));
  console.log("📚 Faculty Count:", facultyData?.length || 0);
  console.log("🏫 Lab Rooms Count:", labRoomsData?.length || 0);
  console.log("🏷 Branch Data:", JSON.stringify(branchData, null, 2));

  // ============= 1. PREPROCESSING =============
  const days =
    (config.saturdayPeriods || 0) > 0
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri"];

  const weekdayPeriods = config.weekdayPeriods || 6;
  const saturdayPeriods = config.saturdayPeriods || 0;

  const shortBreakAfter = config.shortBreakAfter || 2; // between N & N+1
  const lunchBreakAfter = config.lunchBreakAfter || 4; // between M & M+1

  const sections = parseInt(branchData.sections) || 1;
  const sectionNames =
    branchData.sectionNames ||
    Array.from({ length: sections }, (_, i) => `Section ${String.fromCharCode(65 + i)}`);

  const subjects = config.subjects || [];
  const labs = config.labs || [];

  const preprocessed = {
    days,
    weekdayPeriods,
    saturdayPeriods,
    shortBreakAfter,
    lunchBreakAfter,
    sections,
    sectionNames,
    subjectCount: subjects.length,
    labCount: labs.length,
    facultyCount: facultyData?.length || 0,
    labRoomCount: labRoomsData?.length || 0,
  };

  console.log("📊 Preprocessed summary:", JSON.stringify(preprocessed, null, 2));

  // ============= 2. GEMINI SYSTEM INSTRUCTIONS =============

  const systemPrompt = `
You are an expert timetable generation engine.

Your job is to generate a class timetable for multiple sections of a semester
based on the provided configuration, teachers, and labs.

You MUST respect all rules below. If you cannot satisfy them, do NOT fake a valid timetable.

-------------------------------------------------
PERIOD INDEXING & BREAK SEMANTICS
-------------------------------------------------
- Conceptually, periods are numbered: Period 1, 2, 3, ...
- In the timetable arrays, index 0 = Period 1, index 1 = Period 2, and so on.

- shortBreakAfter = N means:
  There is a short break BETWEEN Period N and Period N+1.
  Example: shortBreakAfter = 2 -> break is between Period 2 and Period 3.

- lunchBreakAfter = M means:
  There is a lunch break BETWEEN Period M and Period M+1.

- A 1-period SUBJECT can be scheduled at Period N or Period N+1 even if there is a break between them.
- A 2-period LAB MUST NOT cross a break boundary:
  - If shortBreakAfter = 2, you cannot place a lab occupying Period 2 & 3.
  - If lunchBreakAfter = 4, you cannot place a lab occupying Period 4 & 5.

-------------------------------------------------
DATA YOU RECEIVE
-------------------------------------------------
You receive:
- config (subjects, labs, weekdayPeriods, saturdayPeriods, shortBreakAfter, lunchBreakAfter)
- facultyData (teachers, with optional unavailability per slot)
- labRoomsData (lab rooms, with optional unavailability per slot)
- branchData (semester, sections, sectionNames, etc.)
- preprocessed (days, periods, sections, counts)

Teacher/Lab unavailability format:
- facultyData[i].unavailability["Mon-1"], "Tue-3", etc:
  - { unavailable?: boolean, allocated?: boolean, message?: string }
- labRoomsData[i].unavailability has the same shape.
- If a slot is unavailable or allocated, you MUST NOT schedule that teacher/labRoom at that Day-Period.

-------------------------------------------------
HARD RULES (MUST NEVER BE VIOLATED)
-------------------------------------------------

1) No Teacher Double Booking:
   - For a given (day, periodIndex), a teacherId may appear at most once across ALL sections.
   - A teacher cannot teach 2 different sections at the same time slot.

2) Teacher Availability:
   - If unavailability["Day-PeriodNumber"] exists and is unavailable or allocated,
     that teacher MUST NOT be scheduled at that slot.

3) Lab Room Constraints:
   - Labs require exactly 2 consecutive periods on the same day.
   - Use the labRoom specified in the lab object when provided.
   - If a labRoom slot is unavailable or allocated, it cannot host a lab in that slot.
   - A lab room cannot be double-booked at the same (day, period).
   - Labs must NOT cross a break boundary (shortBreakAfter or lunchBreakAfter).

4) Sections:
   - Each section has its OWN timetable. Do not merge sections together.
   - Subject and lab frequencies apply per section (unless clearly stated otherwise).

5) Frequencies:
   - For each subject: schedule the specified number of single-period sessions per week.
   - For each lab: schedule the specified number of 2-period sessions per week.
   - If it is logically impossible to satisfy all frequencies (due to constraints),
     set "success": false and explain clearly in "message".

-------------------------------------------------
OUTPUT FORMAT (STRICT)
-------------------------------------------------

You MUST return ONLY a JSON object (no markdown, no commentary, no extra text) with this shape:

{
  "success": boolean,
  "message": string,
  "sectionTimetables": {
    "<SectionName>": {
      "Mon": [slotOrNull, ...],
      "Tue": [slotOrNull, ...],
      "Wed": [slotOrNull, ...],
      "Thu": [slotOrNull, ...],
      "Fri": [slotOrNull, ...],
      "Sat"?: [slotOrNull, ...]   // include only if saturdayPeriods > 0
    }
  },
  "debug": {
    "notes": string
  }
}

- For Mon–Fri: array length = weekdayPeriods.
- For Sat (if saturdayPeriods > 0): array length = saturdayPeriods.

Each slot is either:
- null, OR
- an object:

{
  "type": "subject" | "lab",
  "name": string,
  "subjectId"?: string,
  "labId"?: string,
  "teacherId": string,
  "teacherName": string,
  "labRoomId"?: string | null,
  "labRoomName"?: string | null,
  "section": string,
  "duration": number   // 1 for subject, 2 for lab
}

- For "subject": duration MUST be 1.
- For "lab": duration MUST be 2 and MUST occupy two consecutive indices
  on that day with the same lab entry object in both slots (e.g., periods 1 & 2).

-------------------------------------------------
VALIDATION CHECKLIST BEFORE RETURNING
-------------------------------------------------

Before you output the JSON, mentally verify:

- For every (day, periodIndex):
  - No teacherId appears multiple times across sections.
  - No labRoomId appears multiple times across sections.
- All labs:
  - Use exactly 2 consecutive periods.
  - Do not cross shortBreakAfter or lunchBreakAfter boundaries.
- All teachers:
  - Respect unavailability.
  - Are not double-booked.
- Subject and lab frequencies are satisfied as much as possible.
- If constraints cannot all be satisfied:
  - Set success:false,
  - Provide a clear "message".

Return ONLY the JSON object. No extra text.
`.trim();

  const userPayload = {
    config,
    facultyData,
    labRoomsData,
    branchData,
    preprocessed,
  };

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" }); chrome 

  const fullPrompt = `${systemPrompt}

DATA:
${JSON.stringify(userPayload, null, 2)}

Return ONLY the JSON object described above.
`;

  const result = await model.generateContent(fullPrompt);
  const response = await result.response;
  let text = response.text();

  console.log("🧠 Raw Gemini response:", text);

  // ============= 3. SAFE JSON PARSE =============
  try {
    // Many times Gemini puts ```json ... ```; strip code fences if present
    text = text.trim();
    if (text.startsWith("```")) {
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    }

    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error("❌ Failed to parse Gemini JSON:", err);
    return {
      success: false,
      message: "Gemini returned invalid JSON",
      raw: text,
    };
  }
}
