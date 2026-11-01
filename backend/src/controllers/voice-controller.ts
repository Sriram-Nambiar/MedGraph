import { Request, Response } from 'express';

export class VoiceController {
  private sarvamApiKey = process.env.SARVAM_API_KEY || '';
  private sttModel = process.env.SARVAM_STT_MODEL || 'saaras:v4';
  private ttsModel = process.env.SARVAM_TTS_MODEL || 'bulbul:v4-flash';
  private sttUrl = 'https://api.sarvam.ai/speech-to-text';
  private ttsUrl = 'https://api.sarvam.ai/text-to-speech';

  /**
   * Transcribe doctor speech via Sarvam Saaras v4
   */
  public async transcribe(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = process.env.SARVAM_API_KEY || this.sarvamApiKey;
      if (!apiKey) {
        res.status(500).json({
          error: 'SARVAM_API_KEY is not configured on the server.',
          success: false,
        });
        return;
      }

      let audioBuffer: Buffer | null = null;
      let filename = 'clinical_recording.wav';
      let mimeType = 'audio/wav';

      // 1. Check if uploaded as file via multer
      if ((req as any).file) {
        const file = (req as any).file;
        audioBuffer = file.buffer;
        filename = file.originalname || 'clinical_recording.wav';
        mimeType = file.mimetype || 'audio/wav';
      }
      // 2. Check if sent as base64 in json
      else if (req.body?.audio) {
        const base64Data = req.body.audio.replace(/^data:audio\/\w+;base64,/, '');
        audioBuffer = Buffer.from(base64Data, 'base64');
        filename = req.body.filename || 'clinical_recording.wav';
        mimeType = req.body.mimeType || 'audio/wav';
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        res.status(400).json({
          error: 'No audio data received. Provide an audio file or base64 audio payload.',
          success: false,
        });
        return;
      }

      const languageCode = req.body?.language_code || 'unknown';
      const mode = req.body?.mode || 'transcribe';

      // Prepare multipart form for Sarvam API
      const formData = new FormData();
      formData.append(
        'file',
        new Blob([new Uint8Array(audioBuffer)], { type: mimeType }),
        filename
      );
      formData.append('model', this.sttModel);
      if (languageCode && languageCode !== 'unknown') {
        formData.append('language_code', languageCode);
      }
      if (mode) {
        formData.append('mode', mode);
      }

      const sarvamRes = await fetch(this.sttUrl, {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
        },
        body: formData,
      });

      if (!sarvamRes.ok) {
        const errText = await sarvamRes.text();
        console.error(`[Sarvam STT Error] ${sarvamRes.status}: ${errText}`);
        res.status(sarvamRes.status).json({
          error: `Sarvam Speech-to-Text API returned ${sarvamRes.status}`,
          details: errText,
          success: false,
        });
        return;
      }

      const result = (await sarvamRes.json()) as any;
      const transcript = (result.transcript || '').trim();

      res.json({
        success: true,
        transcript,
        language_code: result.language_code || languageCode || 'en-IN',
        model: this.sttModel,
        request_id: result.request_id,
      });
    } catch (err: any) {
      console.error('[VoiceController transcribe error]:', err);
      res.status(500).json({
        error: `Transcription service error: ${err.message}`,
        success: false,
      });
    }
  }

  /**
   * Convert clinical answer text into speech via Sarvam Bulbul v4 Flash
   */
  public async synthesize(req: Request, res: Response): Promise<void> {
    try {
      const apiKey = process.env.SARVAM_API_KEY || this.sarvamApiKey;
      if (!apiKey) {
        res.status(500).json({
          error: 'SARVAM_API_KEY is not configured on the server.',
          success: false,
        });
        return;
      }

      const rawText: string = req.body?.text || '';
      if (!rawText.trim()) {
        res.status(400).json({
          error: 'Text field is required for speech synthesis.',
          success: false,
        });
        return;
      }

      // Sanitize markdown formatting into clean speech prose
      const cleanSpeechText = this.sanitizeForSpeech(rawText);

      const targetLanguageCode = req.body?.target_language_code || 'en-IN';
      const speaker = req.body?.speaker || 'ishita_en_medical';

      // Chunk text if long to respect Sarvam token/character boundaries (≤ 450 chars per chunk)
      const textChunks = this.chunkText(cleanSpeechText, 450);

      const audioChunks: string[] = [];

      // Process chunks in sequence or parallel
      for (const chunk of textChunks) {
        if (!chunk.trim()) continue;

        const payload = {
          inputs: [chunk.trim()],
          target_language_code: targetLanguageCode,
          speaker: speaker,
          model: this.ttsModel,
        };

        const sarvamRes = await fetch(this.ttsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': apiKey,
          },
          body: JSON.stringify(payload),
        });

        if (!sarvamRes.ok) {
          const errText = await sarvamRes.text();
          console.error(`[Sarvam TTS Error] ${sarvamRes.status}: ${errText}`);
          // If fallback speaker needed
          if (errText.includes('not compatible')) {
            // Retry with standard en-IN speaker
            const retryPayload = {
              inputs: [chunk.trim()],
              target_language_code: 'en-IN',
              speaker: 'shubh_en_narration',
              model: this.ttsModel,
            };
            const retryRes = await fetch(this.ttsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': apiKey,
              },
              body: JSON.stringify(retryPayload),
            });
            if (retryRes.ok) {
              const retryData = (await retryRes.json()) as any;
              if (retryData.audios && retryData.audios.length > 0) {
                audioChunks.push(retryData.audios[0]);
                continue;
              }
            }
          }
          continue;
        }

        const data = (await sarvamRes.json()) as any;
        if (data.audios && data.audios.length > 0) {
          audioChunks.push(data.audios[0]);
        }
      }

      if (audioChunks.length === 0) {
        res.status(500).json({
          error: 'Failed to synthesize speech audio from Sarvam API.',
          success: false,
        });
        return;
      }

      res.json({
        success: true,
        audio: audioChunks[0], // primary / first audio
        audios: audioChunks,  // full array of sequential audio chunks
        mimeType: 'audio/wav',
        speaker: speaker,
        language_code: targetLanguageCode,
        model: this.ttsModel,
      });
    } catch (err: any) {
      console.error('[VoiceController synthesize error]:', err);
      res.status(500).json({
        error: `Speech synthesis error: ${err.message}`,
        success: false,
      });
    }
  }

  /**
   * Cleans markdown formatting, symbols, and bullets into natural medical prose
   */
  private sanitizeForSpeech(text: string): string {
    return text
      .replace(/•|\*/g, ' ')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, (match) => {
        // keep dosages like (24/26 mg) or (5.7 mEq/L) readable
        if (/\d/.test(match)) {
          return match.replace(/[()]/g, '');
        }
        return '';
      })
      .replace(/`.*?`/g, '')
      .replace(/->|→/g, ' changed to ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Chunks long texts at sentence boundaries
   */
  private chunkText(text: string, maxLen: number = 450): string[] {
    if (text.length <= maxLen) return [text];

    const sentences = text.match(/[^.!?]+[.!?]+|\S+/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
      if ((current + ' ' + sentence).length <= maxLen) {
        current = current ? `${current} ${sentence}` : sentence;
      } else {
        if (current) chunks.push(current);
        current = sentence;
      }
    }
    if (current) chunks.push(current);

    return chunks;
  }
}

export const voiceController = new VoiceController();
