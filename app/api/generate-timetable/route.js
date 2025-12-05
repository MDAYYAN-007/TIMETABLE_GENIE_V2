// app/api/generate-timetable/route.js
import { NextResponse } from "next/server";
import { generateTimetableAI } from "@/utils/timetableGeneratorAI";

export async function POST(req) {
  try {
    const body = await req.json();
    const { config, facultyData, labRoomsData, branchData } = body || {};

    if (!config || !facultyData || !branchData) {
      return NextResponse.json(
        { success: false, message: "Missing config, facultyData or branchData" },
        { status: 400 }
      );
    }

    const result = await generateTimetableAI(
      config,
      facultyData,
      labRoomsData || [],
      branchData
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("❌ Error in /api/generate-timetable:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Unexpected server error" },
      { status: 500 }
    );
  }
}
