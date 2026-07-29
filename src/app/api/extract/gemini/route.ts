import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DiagnosisItem {
  name: string;
  date: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface MedicationItem {
  name: string;
  date: string;
  dosage: string;
  frequency: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface LabResultItem {
  testName: string;
  date: string;
  value: string;
  unit: string;
  isAbnormal: boolean;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface AllergyItem {
  allergen: string;
  reaction: string;
  severity: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface ProcedureItem {
  name: string;
  date: string;
  body_part: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface VitalItem {
  measurement: string;
  value: string;
  unit: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface PhysicianItem {
  name: string;
  role: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface IcdCodeItem {
  code: string;
  description: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface FamilyHistoryItem {
  condition: string;
  relative: string;
}

interface SocialHistoryItem {
  category: "Smoking" | "Alcohol";
  status: string;
  details: string;
}

interface ImagingFindingItem {
  bodyPart: string;
  finding: string;
  confidence: "High" | "Medium" | "Low";
  boundingBox: [number, number, number, number];
}

interface GeminiExtractionResult {
  encounter_date: string;
  diagnoses: DiagnosisItem[];
  medications: MedicationItem[];
  labResults: LabResultItem[];
  allergies: AllergyItem[];
  procedures: ProcedureItem[];
  vitals: VitalItem[];
  physicians: PhysicianItem[];
  icdCodes: IcdCodeItem[];
  familyHistory: FamilyHistoryItem[];
  socialHistory: SocialHistoryItem[];
  imagingFindings: ImagingFindingItem[];
}

interface SafetyAlerts {
  conflictFound: boolean;
  severity: "None" | "Moderate" | "CRITICAL RED ALERT";
  description: string;
}

interface SuccessResponse {
  success: true;
  data: GeminiExtractionResult;
  safetyAlerts?: SafetyAlerts;
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
    encounter_date: {
      type: "string",
      description:
        "The date of the medical encounter, visit, or when the document was authored. Actively search for headers like 'Date of Visit', 'Date of Service', 'Report Date', 'Encounter Date', 'Date of Exam', or any document-level date. Use YYYY-MM-DD format. If no date can be determined, return 'Unknown'.",
    },
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
          date: {
            type: "string",
            description:
              "The most accurate clinical date associated with this diagnosis, formatted as a strict ISO 8601 YYYY-MM-DD string.",
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
        required: ["name", "date", "confidence", "boundingBox"],
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
          date: {
            type: "string",
            description:
              "The most accurate clinical date associated with this medication, formatted as a strict ISO 8601 YYYY-MM-DD string.",
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
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this medication extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["name", "date", "dosage", "frequency", "confidence", "boundingBox"],
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
          date: {
            type: "string",
            description:
              "The most accurate clinical date associated with this lab result, formatted as a strict ISO 8601 YYYY-MM-DD string.",
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
          isAbnormal: {
            type: "boolean",
            description:
              "True if the lab value falls outside the normal/reference range, false otherwise. Evaluate the value against standard clinical reference ranges.",
          },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this lab result extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["testName", "date", "value", "unit", "isAbnormal", "confidence", "boundingBox"],
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
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this allergy extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["allergen", "reaction", "severity", "confidence", "boundingBox"],
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
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this procedure extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["name", "date", "body_part", "confidence", "boundingBox"],
      },
    },
    vitals: {
      type: "array",
      description: "List of vital sign measurements found in the document.",
      items: {
        type: "object",
        properties: {
          measurement: {
            type: "string",
            description:
              "The name of the vital sign (e.g., Blood Pressure, Heart Rate, Temperature).",
          },
          value: {
            type: "string",
            description: "The recorded value of the vital sign.",
          },
          unit: {
            type: "string",
            description:
              "The unit of measurement (e.g., mmHg, bpm, °F). Empty string if not specified.",
          },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this vital sign extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["measurement", "value", "unit", "confidence", "boundingBox"],
      },
    },
    physicians: {
      type: "array",
      description: "List of attending or referring physicians found in the document.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The physician's full name.",
          },
          role: {
            type: "string",
            description:
              "The physician's role or specialty (e.g., Attending, Cardiologist). Empty string if not specified.",
          },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this physician extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["name", "role", "confidence", "boundingBox"],
      },
    },
    icdCodes: {
      type: "array",
      description: "List of ICD-10 (or ICD-9) codes found in the document.",
      items: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "The ICD code (e.g., E11.9, J06.9).",
          },
          description: {
            type: "string",
            description:
              "The description or label associated with the ICD code.",
          },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description:
              "Confidence level for this ICD code extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["code", "description", "confidence", "boundingBox"],
      },
    },
    familyHistory: {
      type: "array",
      description: "List of family medical history conditions found in the document.",
      items: {
        type: "object",
        properties: {
          condition: {
            type: "string",
            description: "The medical condition that runs in the family.",
          },
          relative: {
            type: "string",
            description: "The relative who is affected by the condition (e.g., 'Father', 'Maternal Grandmother').",
          },
        },
        required: ["condition", "relative"],
      },
    },
    socialHistory: {
      type: "array",
      description: "List of social history details for smoking and alcohol use.",
      items: {
        type: "object",
        properties: {
          category: {
            type: "string",
            enum: ["Smoking", "Alcohol"],
            description: "The category of the social history item.",
          },
          status: {
            type: "string",
            description: "The current status (e.g., 'Current smoker', 'Former', 'Never', 'Occasional').",
          },
          details: {
            type: "string",
            description: "Any additional details provided (e.g., '1 pack/day for 20 years', '2 drinks/week'). Empty string if not specified.",
          },
        },
        required: ["category", "status", "details"],
      },
    },
    imagingFindings: {
      type: "array",
      description: "List of imaging and radiology findings found in the document.",
      items: {
        type: "object",
        properties: {
          bodyPart: {
            type: "string",
            description: "The body part examined.",
          },
          finding: {
            type: "string",
            description: "The finding or impression from the imaging report.",
          },
          confidence: {
            type: "string",
            enum: ["High", "Medium", "Low"],
            description: "Confidence level for this imaging finding extraction.",
          },
          boundingBox: {
            type: "array",
            description:
              "Spatial bounding box as [ymin, xmin, ymax, xmax] normalized to a 1000x1000 coordinate space.",
            items: { type: "integer" },
          },
        },
        required: ["bodyPart", "finding", "confidence", "boundingBox"],
      },
    },
  },
  required: ["encounter_date", "diagnoses", "medications", "labResults", "allergies", "procedures", "vitals", "physicians", "icdCodes", "familyHistory", "socialHistory", "imagingFindings"],
} as const;

const PRECHECK_SCHEMA = {
  type: "object",
  properties: {
    isMedical: {
      type: "boolean",
      description:
        "true if the document is a medical record, lab report, prescription, or clinical note; false otherwise.",
    },
    reason: {
      type: "string",
      description: "A one-sentence explanation for the classification.",
    },
    isWrongPatient: {
      type: "boolean",
      description: "true if the document explicitly belongs to a different patient than expected.",
    },
    detectedPatientName: {
      type: "string",
      description: "The name of the patient the document belongs to, if isWrongPatient is true.",
    },
  },
  required: ["isMedical", "reason"],
} as const;

const CONFLICT_SCHEMA = {
  type: "object",
  properties: {
    conflictFound: {
      type: "boolean",
      description: "True if a drug-allergy conflict exists, false otherwise.",
    },
    severity: {
      type: "string",
      enum: ["None", "Moderate", "CRITICAL RED ALERT"],
      description: "The severity of the identified conflict.",
    },
    description: {
      type: "string",
      description: "Explanation of the conflict (e.g., 'Patient is allergic to Sulfa; prescribed Bactrim').",
    },
  },
  required: ["conflictFound", "severity", "description"],
} as const;



// ---------------------------------------------------------------------------
// System instruction
function buildSystemInstruction(sex: string, bloodType: string, language: string): string {
  return `You are a medical document analysis AI specializing in extracting structured clinical data from PDF documents.

TASK:
Analyze the provided PDF and extract all Tier 1 medical data: diagnoses, medications, lab results, allergies, procedures, vitals (e.g., blood pressure, heart rate, temperature), attending physicians (name and role/specialty), ICD-10 codes (code and description), family medical history, social history (smoking/alcohol), and imaging/radiology findings.

BOUNDING BOX RULES:
- For every extracted item that asks for a bounding box, provide the 2D spatial bounding box where that text appears in the document.
- Bounding boxes use the format [ymin, xmin, ymax, xmax].
- All coordinates are integers normalized to a 1000×1000 scale, where (0, 0) is the top-left corner and (1000, 1000) is the bottom-right corner.
- The bounding box should tightly enclose the relevant text region.

EXTRACTION RULES:
- Extract ONLY information that is explicitly present in the document. Do NOT hallucinate or infer data that is not written.
- Identify any patient allergies, specifically food or drug allergies, the reaction, and severity.
- Identify past medical procedures, surgeries, or imaging (e.g., appendectomy, MRI).
- Extract vital signs such as Blood Pressure, Heart Rate, Temperature, Respiratory Rate, SpO2, Weight, and Height. Include the measurement name, value, and unit.
- Identify attending or referring physicians with their name and role or specialty.
- Extract any ICD-10 (or ICD-9) codes along with their descriptions.
- Extract family medical history: conditions that run in the patient's family and which relative is affected (e.g., "Father - diabetes", "Mother - breast cancer").
- Extract social history for smoking and alcohol use. Record the category, current status (e.g., "Current smoker", "Former", "Never"), and any additional details (e.g., "1 pack/day for 20 years").
- Extract imaging and radiology findings including the body part examined, the finding/impression, and confidence level.
- For lab results, explicitly evaluate the reported value against standard clinical reference ranges and set isAbnormal to true if the value falls outside normal limits, false otherwise. If no reference range is available, use standard medical reference ranges.
- CRITICAL: The patient's biological sex is ${sex}, blood type is ${bloodType}, and primary language is ${language}. You MUST use this biological sex when evaluating lab result reference ranges to determine if the isAbnormal flag should be true or false. (e.g., Creatinine and Hemoglobin have different normal ranges for males vs. females). Use the primary language to assist with accurate translation if the document is not in English.
- If a category has no data in the document, return an empty array for that category.
- For confidence: use "High" for clearly and unambiguously stated items, "Medium" for probable items, "Low" for ambiguous or partially legible items.
- For dosage and frequency: use an empty string "" if the information is not specified in the document.
- For lab result units: use an empty string "" if not specified.
- ENCOUNTER DATE: Actively search for the date of the medical encounter, visit, or when the document was created/authored. Look for headers like "Date of Visit", "Date of Service", "Report Date", "Encounter Date", "Date of Exam", or any document-level date. Return in YYYY-MM-DD format. If no date can be determined, return "Unknown".

CRITICAL TEMPORAL DIRECTIVE: For every Diagnosis, Medication, and Lab result you extract, you MUST determine the most accurate clinical date associated with it.
- Look for specific dates next to the item (e.g., a lab draw date).
- If a specific item date is missing, infer the date from the document's primary metadata (e.g., 'Date Discharged', 'Encounter Date', or 'Date Admitted').
- ALWAYS format the extracted date as a strict ISO 8601 YYYY-MM-DD string (e.g., '2026-05-18').

OUTPUT:
Return ONLY the structured JSON object. No explanations, no markdown, no commentary.`;
}

// ---------------------------------------------------------------------------
// POST /api/extract/gemini
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
): Promise<NextResponse<SuccessResponse | ErrorResponse>> {
  // ── 1. Parse & validate request body ────────────────────────────────
  let pdfUrl: string;
  let expectedPatientName: string | undefined;
  let expectedDob: string | undefined;
  let expectedSex: string | undefined;
  let expectedBloodType: string | undefined;
  let expectedLanguage: string | undefined;
  let gatekeeperPrefs: Record<string, unknown> | undefined;

  try {
    const body = (await request.json()) as {
      pdfUrl?: unknown; expectedPatientName?: unknown; expectedDob?: unknown;
      expectedSex?: unknown; expectedBloodType?: unknown; expectedLanguage?: unknown;
      gatekeeperPrefs?: Record<string, unknown>;
    };
    if (!body.pdfUrl || typeof body.pdfUrl !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid 'pdfUrl' in request body." },
        { status: 400 },
      );
    }
    pdfUrl = body.pdfUrl;
    expectedPatientName = typeof body.expectedPatientName === "string" ? body.expectedPatientName : undefined;
    expectedDob = typeof body.expectedDob === "string" ? body.expectedDob : undefined;
    expectedSex = typeof body.expectedSex === "string" ? body.expectedSex : undefined;
    expectedBloodType = typeof body.expectedBloodType === "string" ? body.expectedBloodType : undefined;
    expectedLanguage = typeof body.expectedLanguage === "string" ? body.expectedLanguage : undefined;
    
    // Default gatekeeper prefs if not provided
    const defaultGatekeeperPrefs = { strictIdentityMatch: false, allergySensitivity: 'high' };
    gatekeeperPrefs = typeof body.gatekeeperPrefs === "object" && body.gatekeeperPrefs !== null 
      ? { ...defaultGatekeeperPrefs, ...body.gatekeeperPrefs } 
      : defaultGatekeeperPrefs;
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

  // ── Shared Gemini client ───────────────────────────────────────────
  const ai = new GoogleGenAI({ apiKey });

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

  // ── 3.5  Fast-fail pre-check: classify document ────────────────────
  try {
    let triageSystemInstruction = `You are a triage AI. The securely logged-in patient is ${expectedPatientName || 'Unknown'}, born ${expectedDob || 'Unknown'}, Biological Sex: ${expectedSex || 'Unknown'}, Blood Type: ${expectedBloodType || 'Unknown'}, Primary Language: ${expectedLanguage || 'Unknown'}. Analyze the document. If it is a non-medical document, flag isMedical as false. If the document explicitly belongs to a different patient, flag isWrongPatient as true and extract their detectedPatientName.`;

    if (gatekeeperPrefs?.strictIdentityMatch) {
      triageSystemInstruction += " STRICT IDENTITY MATCH IS ENABLED: If the name does not match perfectly or is missing, you MUST flag isWrongPatient as true.";
    }

    const triageResponse = await ai.models.generateContent({
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
            { text: "Classify this document." },
          ],
        },
      ],
      config: {
        systemInstruction: triageSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: PRECHECK_SCHEMA,
      },
    });

    const triageText = triageResponse.text;

    if (triageText) {
      const triage = JSON.parse(triageText) as {
        isMedical: boolean;
        reason: string;
        isWrongPatient?: boolean;
        detectedPatientName?: string;
      };

      if (!triage.isMedical) {
        return NextResponse.json(
          {
            success: false,
            error: `Document Rejected: ${triage.reason}`,
          },
          { status: 400 },
        );
      }

      if (triage.isWrongPatient) {
        return NextResponse.json(
          {
            success: false,
            error: `Security Alert: This document appears to belong to ${triage.detectedPatientName}, not ${expectedPatientName || "the current user"}. Upload rejected.`,
          },
          { status: 400 },
        );
      }
    }
  } catch (err) {
    // Pre-check failed — log and proceed to main extraction rather than blocking
    console.warn("Pre-check triage failed; proceeding to extraction.", err);
  }

  // ── 4. Call Gemini API ─────────────────────────────────────────────
  try {

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
              text: "Extract all diagnoses, medications, lab results, allergies, procedures, vitals, attending physicians, and ICD-10 codes from this medical document. Include the spatial bounding box and confidence for each extracted item.",
            },
          ],
        },
      ],
      config: {
        systemInstruction: buildSystemInstruction(
          expectedSex || "Unknown",
          expectedBloodType || "Unknown",
          expectedLanguage || "Unknown"
        ),
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
      encounter_date: typeof parsed.encounter_date === "string" ? parsed.encounter_date : "Unknown",
      diagnoses: Array.isArray(parsed.diagnoses) ? parsed.diagnoses : [],
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      labResults: Array.isArray(parsed.labResults) ? parsed.labResults : [],
      allergies: Array.isArray(parsed.allergies) ? parsed.allergies : [],
      procedures: Array.isArray(parsed.procedures) ? parsed.procedures : [],
      vitals: Array.isArray(parsed.vitals) ? parsed.vitals : [],
      physicians: Array.isArray(parsed.physicians) ? parsed.physicians : [],
      icdCodes: Array.isArray(parsed.icdCodes) ? parsed.icdCodes : [],
      familyHistory: Array.isArray(parsed.familyHistory) ? parsed.familyHistory : [],
      socialHistory: Array.isArray(parsed.socialHistory) ? parsed.socialHistory : [],
      imagingFindings: Array.isArray(parsed.imagingFindings) ? parsed.imagingFindings : [],
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
    for (const a of data.allergies) {
      a.boundingBox = clampBox(a.boundingBox);
    }
    for (const p of data.procedures) {
      p.boundingBox = clampBox(p.boundingBox);
    }
    for (const v of data.vitals) {
      v.boundingBox = clampBox(v.boundingBox);
    }
    for (const ph of data.physicians) {
      ph.boundingBox = clampBox(ph.boundingBox);
    }
    for (const ic of data.icdCodes) {
      ic.boundingBox = clampBox(ic.boundingBox);
    }
    for (const img of data.imagingFindings) {
      img.boundingBox = clampBox(img.boundingBox);
    }

    let safetyAlerts: SafetyAlerts | undefined = undefined;

    if (data.allergies.length > 0 && data.medications.length > 0) {
      try {
          let conflictSystemInstruction = "You are a clinical safety AI. Analyze the provided allergies and medications and detect if there are any dangerous drug-allergy interactions.";
          if (gatekeeperPrefs?.allergySensitivity === 'low') {
            conflictSystemInstruction += " ONLY flag critical, life-threatening conflicts. Ignore minor or theoretical interactions.";
          } else {
            conflictSystemInstruction += " Flag all potential interactions including minor and theoretical ones.";
          }

          const conflictResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `Here is a patient's extracted allergy list: ${JSON.stringify(
                      data.allergies
                    )}. Here is their prescribed medication list: ${JSON.stringify(
                      data.medications
                    )}. Are there any dangerous drug-allergy interactions here?`,
                  },
                ],
              },
            ],
            config: {
              systemInstruction: conflictSystemInstruction,
              responseMimeType: "application/json",
              responseSchema: CONFLICT_SCHEMA,
            },
          });

        const conflictText = conflictResponse.text;
        if (conflictText) {
          safetyAlerts = JSON.parse(conflictText) as SafetyAlerts;
        }
      } catch (err) {
        console.warn("Safety check failed; proceeding without alerts.", err);
      }
    }

    // ── 6. Return structured response ────────────────────────────────
    return NextResponse.json({ success: true, data, safetyAlerts }, { status: 200 });
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
