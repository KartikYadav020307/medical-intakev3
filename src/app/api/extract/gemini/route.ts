import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiagnosisItem {
  name: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface MedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  boundingBox: [number, number, number, number];
}

interface LabResultItem {
  testName: string;
  value: string;
  unit: string;
  boundingBox: [number, number, number, number];
}

interface AllergyItem {
  allergen: string;
  reaction: string;
  severity: string;
  source_page: number;
}

interface ProcedureItem {
  name: string;
  date: string;
  body_part: string;
  source_page: number;
}

interface GeminiExtractionResult {
  diagnoses: DiagnosisItem[];
  medications: MedicationItem[];
  labResults: LabResultItem[];
  allergies: AllergyItem[];
  procedures: ProcedureItem[];
}

interface SuccessResponse {
  success: true;
  data: GeminiExtractionResult;
}

interface ErrorResponse {
  success: false;
  error: string;
}

// ---------------------------------------------------------------------------
// JSON Schema for structured output enforcement
// ---------------------------------------------------------------------------

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    diagnoses: {
      type: "array",
      description: "List of medical diagnoses found in the document.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The exact diagnosis text as written in the document.",
          },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level: High for clearly stated diagnoses, Medium for probable, Low for ambiguous.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["name", "confidence", "boundingBox"],
      },
    },
    medications: {
      type: "array",
      description: "List of medications found in the document.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The medication name as written in the document.",
          },
          dosage: {
            type: "string",
            description:
              "The dosage amount and form (e.g. '500mg tablet'). Empty string if not specified.",
          },
          frequency: {
            type: "string",
            description:
              "How often the medication is taken (e.g. 'twice daily'). Empty string if not specified.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["name", "dosage", "frequency", "boundingBox"],
      },
    },
    labResults: {
      type: "array",
      description: "List of laboratory test results found in the document.",
      items: {
        type: "object",
        properties: {
          testName: {
            type: "string",
            description: "The name of the lab test as written in the document.",
          },
          value: {
            type: "string",
            description: "The result value of the test.",
          },
          unit: {
            type: "string",
            description:
              "The unit of measurement for the result. Empty string if not specified.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["testName", "value", "unit", "boundingBox"],
      },
    },
    allergies: {
      type: "array",
      description: "List of patient allergies found in the document.",
      items: {
        type: "object",
        properties: {
          allergen: {
            type: "string",
            description: "The food or drug allergen.",
          },
          reaction: {
            type: "string",
            description: "The reaction experienced by the patient.",
          },
          severity: {
            type: "string",
            description: "The severity of the reaction.",
          },
          source_page: {
            type: "number",
            description: "The page number where the allergy was found.",
          },
        },
        required: ["allergen", "reaction", "severity", "source_page"],
      },
    },
    procedures: {
      type: "array",
      description: "List of medical procedures, surgeries, or imaging found in the document.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The name of the procedure, surgery, or imaging.",
          },
          date: {
            type: "string",
            description: "The date of the procedure.",
          },
          body_part: {
            type: "string",
            description: "The body part the procedure applied to.",
          },
          source_page: {
            type: "number",
            description: "The page number where the procedure was found.",
          },
        },
        required: ["name", "date", "body_part", "source_page"],
      },
    },
  },
  required: ["diagnoses", "medications", "labResults", "allergies", "procedures"],
} as const;

// ---------------------------------------------------------------------------
// System instruction
// ---------------------------------------------------------------------------

const SYSTEM_INSTRUCTION = `You are a medical document analysis AI specializing in extracting structured clinical data from PDF documents.

TASK:
Analyze the provided PDF and extract all Tier 1 medical data: diagnoses, medications, lab results, allergies, and procedures.

BOUNDING BOX RULES:
- For every extracted item that asks for a bounding box, provide the 2D spatial bounding box where that text appears in the document.
- Bounding boxes use the format [ymin, xmin, ymax, xmax].
- All coordinates are integers normalized to a 1000×1000 scale, where (0, 0) is the top-left corner and (1000, 1000) is the bottom-right corner.
- The bounding box should tightly enclose the relevant text region.

EXTRACTION RULES:
- Extract ONLY information that is explicitly present in the document. Do NOT hallucinate or infer data that is not written.
- Identify any patient allergies, specifically food or drug allergies, the reaction, and severity.
- Identify past medical procedures, surgeries, or imaging (e.g., appendectomy, MRI).
- If a category has no data in the document, return an empty array for that category.
- For confidence: use "High" for clearly and unambiguously stated items, "Medium" for probable items, "Low" for ambiguous or partially legible items.
- For dosage and frequency: use an empty string "" if the information is not specified in the document.
- For lab result units: use an empty string "" if not specified.

OUTPUT:
Return ONLY the structured JSON object. No explanations, no markdown, no commentary.`;

// ---------------------------------------------------------------------------
// POST /api/extract/gemini
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // ── 1. Parse & validate request body ────────────────────────────────
  let pdfUrl: string;

  try {
    const body = (await request.json()) as { pdfUrl?: unknown };
    if (!body.pdfUrl || typeof body.pdfUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'pdfUrl' in request body." },
        { status: 400 },
      );
    }
    pdfUrl = body.pdfUrl;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

  // Reject non-HTTP(S) URLs (e.g. local file paths like C:/...)
  if (!/^https?:\/\//i.test(pdfUrl)) {
    return NextResponse.json(
      { success: false, error: "Invalid URL provided. File must be uploaded to storage first." },
      { status: 400 },
    );
  }

  // Basic URL validation
  try {
    new URL(pdfUrl);
  } catch {
    return NextResponse.json(
      { success: false, error: "The provided 'pdfUrl' is not a valid URL." },
      { status: 400 },
    );
  }

  // Reject obviously non-PDF URLs (permissive for Supabase public URLs)
  const urlPath = new URL(pdfUrl).pathname.toLowerCase();
  const extension = urlPath.split(".").pop() ?? "";
  const nonPdfExtensions = ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "tiff"];
  if (nonPdfExtensions.includes(extension)) {
    return NextResponse.json(
      { success: false, error: "The provided URL does not appear to point to a PDF file." },
      { status: 400 },
    );
  }

  // ── 2. Read required env vars ───────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("GEMINI_API_KEY environment variable is not set.");
    return NextResponse.json(
      { success: false, error: "Extraction service is not configured. Please contact the administrator." },
      { status: 500 },
    );
  }

  // ── 3. Fetch the PDF from the provided URL ─────────────────────────
  let pdfBase64: string;

  try {
    const pdfResponse = await fetch(pdfUrl);

    if (!pdfResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch the PDF. Remote server responded with status ${pdfResponse.status}.`,
        },
        { status: 502 },
      );
    }

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "The fetched PDF is empty (0 bytes)." },
        { status: 400 },
      );
    }

    pdfBase64 = buffer.toString("base64");
  } catch (err) {
    console.error("Error fetching PDF from URL:", err);
    return NextResponse.json(
      { success: false, error: "Failed to retrieve the PDF from the provided URL." },
      { status: 502 },
    );
  }

  // ── 4. Call Gemini API ─────────────────────────────────────────────
  try {
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: pdfBase64,
              },
            },
            {
              text: "Extract all diagnoses, medications, lab results, allergies, and procedures from this medical document. Include the spatial bounding box for each extracted item when requested by the schema.",
            },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: EXTRACTION_SCHEMA,
      },
    });

    // ── 5. Parse and validate the response ───────────────────────────
    const rawText = response.text;

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: "Gemini returned an empty response." },
        { status: 500 },
      );
    }

    let parsed: GeminiExtractionResult;

    try {
      parsed = JSON.parse(rawText) as GeminiExtractionResult;
    } catch {
      console.error("Failed to parse Gemini response as JSON:", rawText);
      return NextResponse.json(
        { success: false, error: "Failed to parse the extraction results." },
        { status: 500 },
      );
    }

    // Ensure all expected arrays exist (defensive)
    const data: GeminiExtractionResult = {
      diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      labResults: Array.isArray(parsed.labResults) ? parsed.labResults : [],
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      procedures: Array.isArray(parsed.procedures) ? parsed.procedures : [],
    };

    // Clamp bounding box values to valid 0–1000 range
    const clampBox = (box: number[]): [number, number, number, number] => {
      const clamp = (v: number) => Math.max(0, Math.min(1000, Math.round(v)));
      return [
        clamp(box[0] ?? 0),
        clamp(box[1] ?? 0),
        clamp(box[2] ?? 0),
        clamp(box[3] ?? 0),
      ];
    };

    for (const d of data.diagnoses) {
      d.boundingBox = clampBox(d.boundingBox);
    }
    for (const m of data.medications) {
      m.boundingBox = clampBox(m.boundingBox);
    }
    for (const l of data.labResults) {
      l.boundingBox = clampBox(l.boundingBox);
    }

    // ── 6. Return structured response ────────────────────────────────
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error("Gemini API error:", err);

    // Surface quota/rate-limit errors clearly
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes("429") || errMsg.toLowerCase().includes("quota")) {
      return NextResponse.json(
        { success: false, error: "API rate limit exceeded. Please wait a minute and try again." },
        { status: 429 },
      );
    }

    return NextResponse.json(
      { success: false, error: "An error occurred while processing the document with AI." },
      { status: 500 },
    );
  }
}
