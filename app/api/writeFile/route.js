// /api/writeFile/route.js
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req, res) {
  const { filePath, content } = await req.json();

  try {
    const absolutePath = path.resolve(filePath);
    await fs.writeFile(absolutePath, content, "utf-8");
    return NextResponse.json(
      { message: "File saved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error writing file:", error);
    return NextResponse.json({ error: "Failed to save file" }, { status: 500 });
  }
}
