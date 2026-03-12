import { analyzeResume } from './src/services/geminiService';

async function test() {
  const resumeText = "Experienced Backend Developer with 5 years of Python, Django, and PostgreSQL. Familiar with Docker and AWS.";
  const role = "Backend Developer";
  
  console.log("Testing analyzeResume...");
  try {
    const result = await analyzeResume(role, resumeText);
    console.log("Analysis Result:", JSON.stringify(result, null, 2));
    if (result.matchScore > 0) {
      console.log("✅ Success: Match score generated.");
    } else {
      console.log("⚠️ Warning: Match score is 0. Check keyword matching.");
    }
  } catch (err) {
    console.error("❌ Error during analysis:", err);
  }
}

test();
