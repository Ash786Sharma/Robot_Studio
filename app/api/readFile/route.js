// /api/readFile/route.js
import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

export async function POST(req, res) {
  const { filePath } = await req.json();

  try {
    const absolutePath = path.resolve(filePath);
    const content = await fs.readFile(absolutePath, "utf-8");
    return NextResponse.json({ content }, { status: 200 });
  } catch (error) {
    console.error("Error reading file:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
