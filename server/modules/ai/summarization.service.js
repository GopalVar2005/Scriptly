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
      return "Focus on giving a clear overview. Prioritize quick_recap quality.";
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

/**
 * Scale output depth based on transcript length.
 * Short recordings produce concise output. Long lectures get comprehensive coverage.
 */
function getContentDepthGuidance(text) {
  const wordCount = text.split(/\s+/).length;

  if (wordCount > 3000) {
    return `Content Depth (long transcript — ${wordCount} words detected):
- quick_recap: 4-6 sentences covering all major themes. The reader should feel the full scope was understood.
- key_concepts: 5-7 items. Cover all distinct topics discussed.
- important_to_remember: 5-8 items. Include all critical facts, formulas, definitions.
- potential_exam_questions: 3-5 questions covering different sections of the material.
- key_terms: 8-12 glossary entries for all technical/domain terms introduced.
- memory_anchors: 3-5 anchors for the most complex ideas.
- keywords: 8-12 tags covering all topics.`;
  } else if (wordCount > 1000) {
    return `Content Depth (medium transcript — ${wordCount} words detected):
- quick_recap: 3-5 sentences giving a meaningful overview.
- key_concepts: 3-5 items.
- important_to_remember: 3-5 items.
- potential_exam_questions: 2-3 questions.
- key_terms: 5-8 glossary entries.
- memory_anchors: 2-3 anchors if genuine analogies exist.
- keywords: 5-8 tags.`;
  }

  return `Content Depth (short transcript — ${wordCount} words detected):
- quick_recap: 2-3 concise sentences.
- key_concepts: 2-3 items.
- important_to_remember: 2-3 items.
- potential_exam_questions: 1-2 questions.
- key_terms: 3-5 glossary entries.
- memory_anchors: 1-2 if applicable.
- keywords: 3-5 tags.`;
}

const getBasePrompt = (text, mode) => {
  const modeInstruction = getModeInstruction(mode);
  const depthGuidance = getContentDepthGuidance(text);

  return `
You are an intelligent study partner who has just carefully listened to a lecture. Your job is to distill what was TAUGHT — not summarize what the topic is about.

CRITICAL RULES:

1. DISTILL UNDERSTANDING, NOT TOPICS.
   Extract the speaker's key arguments, insights, perspectives, and reasoning — not generic textbook knowledge about the topic.

2. BE TRANSCRIPT-SPECIFIC.
   Your output must clearly reflect THIS specific lecture. If your explanation could appear in any Wikipedia article or textbook chapter about the same topic, rewrite it to reference the speaker's actual framing, examples, or emphasis.

3. NEVER GENERATE GENERIC FILLER.
   Do not write: "This is important because it helps us understand..." or "This concept is significant in the field of..."
   Instead write specifically: what the speaker argued, what distinction they drew, what example they gave, what implication they raised.

4. PRIORITIZE SIGNAL OVER COVERAGE.
   A few high-quality insights beat many shallow bullet points. Skip trivial or obvious information.

5. FOR ABSTRACT OR ARGUMENT-DRIVEN CONTENT:
   When the lecture is conceptual, speculative, or idea-heavy with few concrete examples — focus on the speaker's REASONING STRUCTURE: what they argued, what they contrasted with, what they predicted, what implications they drew, and what mental models they used. The value in these lectures is in the thinking pattern, not in factual details.

BEFORE GENERATING THE JSON, internally identify:
- What is the lecture's CENTRAL ARGUMENT or main thesis?
- Which ideas are PRIMARY (the lecture's main points) vs. SUPPORTING (examples, evidence, context)?
- What CONNECTIONS exist between concepts? (cause-effect, contrast, dependency, evolution)
- What would a student MOST LIKELY FORGET or confuse?
Let this analysis shape every section — especially quick_recap, key_concepts, and important_to_remember.

Mode: ${modeInstruction}

${depthGuidance}

Return ONLY the raw JSON object below. No markdown fences. No explanation.

{
  "subject_detected": "string — The specific subject area (e.g., 'Molecular Biology' or 'Macroeconomic Policy'), not a vague label",

  "quick_recap": "string — A revision-first overview. Start with the lecture's CENTRAL ARGUMENT or dominant insight — not a list of topics. Then layer in supporting ideas in order of importance. The reader should think: 'I understand what this lecture was really about.' Do NOT begin with 'This lecture discusses...' or 'The speaker talks about...'",

  "key_concepts": [
    {
      "concept": "string — Name of a meaningful conceptual idea (not a trivial sub-topic)",
      "explanation": "string — Explain as the SPEAKER framed it, referencing their argument, example, or perspective. Do NOT write a generic textbook definition. For abstract content, capture the reasoning pattern.",
      "why_it_matters": "string — Explain how this concept connects to at least one OTHER concept from this lecture (cause, contrast, dependency, or implication). If truly standalone, explain its specific role in the lecture's central argument. NEVER write generic importance statements."
    }
  ],

  "important_to_remember": [
    "string — High-signal revision points only: things easily confused, easily forgotten, counter-intuitive, or likely to be tested. Each item should make a student think 'I would have forgotten this.' NOT generic facts about the topic."
  ],

  "potential_exam_questions": [
    {
      "question": "string — Must be at the APPLY or ANALYZE level. Good stems: 'If [condition changed], how would [concept] behave differently?', 'What is the relationship between [X] and [Y]?', 'Why did the speaker argue [claim] rather than [alternative]?', 'Compare [A] and [B] in terms of [dimension].' Never use simple 'What is X?' recall questions.",
      "hint": "string — A thinking nudge that guides reasoning without giving the answer. Reference a specific concept or distinction from the lecture."
    }
  ],

  "key_terms": {
    "term": "definition — ONLY include terms a student would genuinely need defined: difficult vocabulary, domain-specific jargon, technical phrases, culturally specific references. SKIP obvious or common words. Quality over quantity."
  },

  "memory_anchors": [
    "string — Create an analogy that maps the PROCESS or RELATIONSHIP, not just the object. Format: '[Concept] is like [familiar thing] because [shared mechanism].' The 'because' clause is what makes it memorable — it encodes WHY the analogy works. If no genuinely useful analogy exists, omit the entry entirely."
  ],

  "keywords": [
    "string — Thematic tags that reinforce the lecture's major topics. Useful for scanning and categorization."
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