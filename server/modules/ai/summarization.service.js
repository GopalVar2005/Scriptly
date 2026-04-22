const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");
require("dotenv").config();
const { ML } = require("../../config/constants");
const logger = require("../../utils/logger");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "dummy");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "dummy" });

function getModeInstruction(mode) {
  switch (mode) {
    case "deep_study":
      return "Be thorough. Include 5-6 key_concepts each with full explanation and why_it_matters. Include 4-5 potential_exam_questions. Include memory_anchors wherever a genuine analogy exists. Maximize educational value.";
    case "exam_prep":
      return "Focus entirely on what could be tested. Maximize potential_exam_questions to 5. In important_to_remember include formulas, definitions, dates and specific facts. Flag common misconceptions in key_concepts why_it_matters field. Distractors in exam questions must be based on common student misconceptions.";
    case "quick_refresh":
      return "Be brief. quick_recap max 2 sentences. key_concepts max 3 items, one sentence explanation only. Skip memory_anchors. keywords only the most critical 5.";
    case "first_pass":
    default:
      return "Focus on giving a clear overview. Keep key_concepts to 3-4 items. Keep potential_exam_questions to 2. Prioritize quick_recap quality.";
  }
}

async function executeLLMWithFallback(prompt, primaryModelRef, fallbackModelRef, temperature) {
  try {
    const model = genAI.getGenerativeModel({ model: primaryModelRef });
    const result = await model.generateContent(prompt);
    logger.info("[LLM_PRIMARY]", `Successfully generated content via ${primaryModelRef}`);
    return extractJSON(result.response.text());
  } catch (primaryError) {
    logger.warn("[LLM_PRIMARY]", primaryError.message);
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: fallbackModelRef,
        temperature: temperature, 
      });
      logger.info("[LLM_FALLBACK]", `Successfully generated fallback content via ${fallbackModelRef}`);
      return extractJSON(chatCompletion.choices[0]?.message?.content || "");
    } catch (fallbackError) {
      logger.error("[ERROR]", "Both primary and fallback LLMs failed", fallbackError.message);
      throw new Error("Both primary and fallback AI generation failed.");
    }
  }
}

const getBasePrompt = (text, mode) => {
  const modeInstruction = getModeInstruction(mode);

  return `
You are an expert academic tutor and study assistant. Your goal is to analyze the following user-provided transcript and generate a highly structured study guide perfectly formatted as a JSON object.

Mode Guidance:
${modeInstruction}

You must return ONLY the raw JSON object conforming EXACTLY to the structure below. Do not wrap it in markdown code blocks (\`\`\`json). Just the raw JSON object.

JSON Structure:
{
  "subject_detected": "string (The core subject area, e.g., 'Molecular Biology' or '19th Century History')",
  "quick_recap": "string (A concise overview of the entire text)",
  "key_concepts": [
    {
      "concept": "string (The name of the concept)",
      "explanation": "string (Clear explanation of the concept)",
      "why_it_matters": "string (Why this concept is important or how it connects to the broader subject)"
    }
  ],
  "important_to_remember": [
    "string (Crucial facts, dates, steps, or definitions)"
  ],
  "potential_exam_questions": [
    {
      "question": "string (A likely test question based on the material)",
      "hint": "string (A brief hint or guide to the answer)"
    }
  ],
  "key_terms": {
    "term": "definition"
  },
  "memory_anchors": [
    "string (Mnemonic device, analogy, or mental imagery to help remember complex ideas)"
  ],
  "keywords": [
    "string (Short tags or topics)"
  ]
}

Transcript:
${text}
`;
};

function extractJSON(text) {
  let cleaned = text.trim();

  // Strip markdown fences if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }

  cleaned = cleaned.trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // Fallback: extract outermost {} or []
    const objStart = cleaned.indexOf("{");
    const objEnd = cleaned.lastIndexOf("}");
    const arrStart = cleaned.indexOf("[");
    const arrEnd = cleaned.lastIndexOf("]");

    // Determine which comes first — object or array
    const useArray =
      arrStart !== -1 &&
      arrEnd !== -1 &&
      arrEnd > arrStart &&
      (objStart === -1 || arrStart < objStart);

    const start = useArray ? arrStart : objStart;
    const end = useArray ? arrEnd : objEnd;

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1));
      } catch (e2) {
        throw new Error("Could not parse JSON from LLM output");
      }
    }
    throw new Error("Could not find JSON object in LLM output");
  }
}

function validateSummary(data) {
  const safeData = { ...data };

  if (typeof safeData.subject_detected !== "string")
    safeData.subject_detected = "Unknown Subject";
  if (typeof safeData.quick_recap !== "string")
    safeData.quick_recap = "No recap available.";

  if (!Array.isArray(safeData.key_concepts)) safeData.key_concepts = [];
  safeData.key_concepts = safeData.key_concepts.map((kc) => ({
    concept: kc?.concept || "Unknown Concept",
    explanation: kc?.explanation || "No explanation provided.",
    why_it_matters: kc?.why_it_matters || "Importance not specified.",
  }));

  if (!Array.isArray(safeData.important_to_remember))
    safeData.important_to_remember = [];

  if (!Array.isArray(safeData.potential_exam_questions))
    safeData.potential_exam_questions = [];
  safeData.potential_exam_questions = safeData.potential_exam_questions.map(
    (pq) => ({
      question: pq?.question || "Missing question",
      hint: pq?.hint || "Missing hint",
    })
  );

  if (!safeData.key_terms || typeof safeData.key_terms !== "object")
    safeData.key_terms = {};

  if (!Array.isArray(safeData.memory_anchors)) safeData.memory_anchors = [];
  if (!Array.isArray(safeData.keywords)) safeData.keywords = [];

  return safeData;
}

async function summarizeText(text, mode = "first_pass") {
  const prompt = getBasePrompt(text, mode);

  let parsedData = await executeLLMWithFallback(
    prompt,
    ML.MODELS.PRIMARY_GEMINI,
    ML.MODELS.FALLBACK_GROQ,
    ML.TEMPERATURE.DEFAULT
  );

  return validateSummary(parsedData);
}

const getExplainPrompt = (term, context, level) => {
  const depthInstruction =
    level === "technical"
      ? "Provide a highly technical, advanced explanation suitable for university level. Use domain-specific terminology."
      : "Provide a simple, intuitive explanation suitable for a beginner. Use plain English and avoid jargon.";

  return `
You are an expert academic tutor.
Explain the concept "${term}" given the context "${context}".

${depthInstruction}

Return ONLY a raw JSON object with this exact structure:
{
  "one_liner": "string (A one sentence summary of the concept)",
  "full_explanation": "string (A clear 2-3 paragraph explanation)",
  "real_world_example": "string (A concrete real-world example or analogy)",
  "common_misconception": "string (A common misunderstanding about this, or null if none)",
  "connects_to": ["string", "string"] (2-3 related concepts to explore further)
}
`;
};

async function explainConcept(term, context = "", level = "simple") {
  const prompt = getExplainPrompt(term, context, level);

  let data = await executeLLMWithFallback(
    prompt,
    ML.MODELS.PRIMARY_GEMINI,
    ML.MODELS.FALLBACK_GROQ,
    ML.TEMPERATURE.DEFAULT
  );

  return {
    one_liner: data.one_liner || "",
    full_explanation: data.full_explanation || "",
    real_world_example: data.real_world_example || "",
    common_misconception: data.common_misconception || null,
    connects_to: Array.isArray(data.connects_to) ? data.connects_to : [],
  };
}

// ─────────────────────────────────────────────
// MCQ Quiz Generation
// ─────────────────────────────────────────────

async function generateMCQQuiz(note) {
  const QUIZ_MIN_QUESTIONS = 5;
  const QUIZ_MAX_QUESTIONS = 8;
  const questionCount = Math.min(
    Math.max(note.potential_exam_questions?.length || 0, QUIZ_MIN_QUESTIONS),
    QUIZ_MAX_QUESTIONS
  );

  const prompt = `
You are an expert quiz designer specializing in pedagogy and assessment design.
Subject: "${note.subject_detected || "General Study"}"

Generate exactly ${questionCount} MCQ questions from the study material below.

QUESTION RULES:
- Questions must be specific and factual (e.g., "What is X?", "Which of the following correctly describes Y?")
- Never use open-ended or essay-style prompts ("Explain...", "Describe...", "Discuss...")
- Each question must have exactly one unambiguously correct answer
- Questions should test understanding, not just surface-level recall

DISTRACTOR RULES — read carefully, this determines quiz quality:
- Every distractor must match the correct answer in length, grammar, and format
- Never write a distractor that is obviously longer, shorter, or stylistically different from the correct answer
- Each distractor must come from one of these three categories:
    1. MISCONCEPTION — a wrong belief students commonly hold about this specific topic
    2. ADJACENT CONCEPT — a real concept from the same subject area that does not apply in this context
    3. PARTIAL TRUTH — something factually true in a different context but wrong as an answer here
- NEVER use:
    - Unrelated or random wrong answers
    - Vague fillers like "None of the above" or "All of the above"
    - Answers from completely unrelated subject areas
    - Answers that are trivially obviously wrong

Study Material:
${JSON.stringify(
    {
      key_concepts: note.key_concepts,
      important_to_remember: note.important_to_remember,
      key_terms: note.key_terms,
      original_hints: note.potential_exam_questions,
    },
    null,
    2
  )}

Return ONLY a raw JSON array. No markdown, no explanation, no preamble:
[
  {
    "question": "Clear, specific MCQ question text?",
    "correct_answer": "Correct concise answer",
    "distractors": [
      "Misconception-based wrong answer",
      "Adjacent concept wrong answer",
      "Partial truth wrong answer"
    ],
    "explanation": "One sentence explaining why the correct answer is right and why the most tempting distractor is wrong"
  }
]
`;

  // Validate and normalize a parsed quiz array
  function validateQuiz(parsed) {
    if (!Array.isArray(parsed)) {
      throw new Error("Quiz response is not an array");
    }
    return parsed.map((q) => ({
      question: q.question || "Missing question",
      correct_answer: q.correct_answer || "Missing answer",
      distractors: Array.isArray(q.distractors) ? q.distractors : [],
      explanation: q.explanation || "No explanation provided.",
    }));
  }

  const parsed = await executeLLMWithFallback(
    prompt,
    ML.MODELS.PRIMARY_GEMINI,
    ML.MODELS.FALLBACK_GROQ,
    ML.TEMPERATURE.QUIZ
  );

  const validated = validateQuiz(parsed);
  logger.info("[LLM_PRIMARY]", `Generated ${validated.length} quiz questions`);
  return validated;
}

module.exports = {
  summarizeText,
  getModeInstruction,
  extractJSON,
  validateSummary,
  explainConcept,
  generateMCQQuiz,
};