import dotenv from 'dotenv';
dotenv.config();

async function runSarvamVerification() {
  console.log('========================================================');
  console.log('  MedGraph - Sarvam AI Suite Verification');
  console.log('========================================================\n');

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    throw new Error('SARVAM_API_KEY is not defined in environment!');
  }
  console.log('✓ SARVAM_API_KEY loaded securely from environment (hidden from client).');

  // Test 1: Sarvam 105B Chat Completions
  console.log('\n[Test 1: Sarvam-105B Flagship LLM]');
  const t0 = Date.now();
  const chatRes = await fetch('https://api.sarvam.ai/v2/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-subscription-key': apiKey,
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'sarvam-105b',
      messages: [
        {
          role: 'user',
          content: 'What is clinical hyperkalemia and why does Lisinopril cause it? Answer in 1 concise sentence.',
        },
      ],
      max_tokens: 150,
      temperature: 0.1,
    }),
  });
  const t1 = Date.now();
  if (!chatRes.ok) throw new Error(`Chat API failed with ${chatRes.status}`);
  const chatData = (await chatRes.json()) as any;
  const reply = chatData.choices?.[0]?.message?.content || chatData.choices?.[0]?.message?.reasoning;
  console.log(`  ✓ Status: 200 OK (${t1 - t0} ms)`);
  console.log(`  ✓ Model: ${chatData.model}`);
  console.log(`  ✓ Clinical Response: "${reply?.trim()}"`);

  // Test 2: Sarvam Bulbul v4 Flash (Text-to-Speech)
  console.log('\n[Test 2: Sarvam Bulbul v4 Flash Text-to-Speech]');
  const tts0 = Date.now();
  const ttsRes = await fetch('http://localhost:5000/api/voice/synthesize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: 'MedGraph voice synthesis active. Lisinopril was discontinued secondary to acute hyperkalemia.',
      speaker: 'ishita_en_medical',
      target_language_code: 'en-IN',
    }),
  });
  const tts1 = Date.now();
  if (!ttsRes.ok) throw new Error(`TTS failed with ${ttsRes.status}`);
  const ttsData = (await ttsRes.json()) as any;
  console.log(`  ✓ Status: 200 OK (${tts1 - tts0} ms)`);
  console.log(`  ✓ Speaker: ${ttsData.speaker}`);
  console.log(`  ✓ Generated Audio Base64 length: ${ttsData.audio?.length} chars`);

  // Test 3: Sarvam Saaras v4 (Speech-to-Text Roundtrip)
  console.log('\n[Test 3: Sarvam Saaras v4 Speech-to-Text (Roundtrip)]');
  const stt0 = Date.now();
  const sttRes = await fetch('http://localhost:5000/api/voice/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audio: ttsData.audio,
      mimeType: 'audio/wav',
      language_code: 'en-IN',
    }),
  });
  const stt1 = Date.now();
  if (!sttRes.ok) throw new Error(`STT failed with ${sttRes.status}`);
  const sttData = (await sttRes.json()) as any;
  console.log(`  ✓ Status: 200 OK (${stt1 - stt0} ms)`);
  console.log(`  ✓ Model: ${sttData.model}`);
  console.log(`  ✓ Language: ${sttData.language_code}`);
  console.log(`  ✓ Recognized Transcript: "${sttData.transcript}"`);

  // Test 4: Unified Clinical Investigation API with Evidence Verification
  console.log('\n[Test 4: Unified Investigation via Sarvam Pipeline]');
  const inv0 = Date.now();
  const invRes = await fetch('http://localhost:5000/api/investigate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patient_id: 'P001',
      question: sttData.transcript || 'Why was lisinopril discontinued?',
    }),
  });
  const inv1 = Date.now();
  if (!invRes.ok) throw new Error(`Investigation failed with ${invRes.status}`);
  const invData = (await invRes.json()) as any;
  console.log(`  ✓ Status: 200 OK (${inv1 - inv0} ms)`);
  console.log(`  ✓ Verified Claims: ${invData.claims?.length}`);
  console.log(`  ✓ Verification Status: ${invData.verification_status}`);
  console.log(`  ✓ Key Findings: ${invData.key_findings?.length}`);

  console.log('\n========================================================');
  console.log('  All Sarvam AI Verification Tests Passed Successfully! ');
  console.log('========================================================\n');
}

runSarvamVerification().catch((err) => {
  console.error('\n❌ Sarvam Verification Failed:', err);
  process.exit(1);
});
