
import { NextResponse } from "next/server";
import {
  parseYouTubeHistory,
  generateAnalytics,
} from "../../../lib/youtube.ts";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please upload a JSON file." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The uploaded file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 25 MB." },
        { status: 413 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".json")) {
      return NextResponse.json(
        { error: "Only JSON files are supported currently." },
        { status: 415 }
      );
    }

    const text = await file.text();

    let rawData: unknown;

    try {
      rawData = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON file." },
        { status: 400 }
      );
    }

    const videos = parseYouTubeHistory(rawData);

    if (videos.length === 0) {
      return NextResponse.json(
        {
          error:
            "No YouTube watch history found. Please upload the correct watch-history JSON file.",
        },
        { status: 422 }
      );
    }

    const analytics = generateAnalytics(videos);

    return NextResponse.json({
      success: true,
      message: "YouTube history imported successfully!",
      analytics,
    });
  } catch (error) {
    console.error("Import error:", error);

    return NextResponse.json(
      { error: "Something went wrong while processing the file." },
      { status: 500 }
    );
  }
}
