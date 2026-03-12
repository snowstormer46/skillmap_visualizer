import { analyzeResume } from './src/services/geminiService';
import fs from 'fs';

async function test() {
  const resumeText = "Experienced Backend Developer with 5 years of Python, Django, and PostgreSQL. Familiar with Docker and AWS.";
  const role = "Backend Developer";
  
  let log = `Testing analyzeResume with role: ${role}\n`;
  try {
    const result = await analyzeResume(role, resumeText);
    log += `Analysis Result: ${JSON.stringify(result, null, 2)}\n`;
    log += "✅ Success: Match score generated.\n";
  } catch (err) {
    log += `❌ Error during analysis: ${err}\n`;
  }
  
  fs.writeFileSync('test-output.log', log);
  console.log("Diagnostic complete. Results written to test-output.log");
}

test();
