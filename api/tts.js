import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CACHE_DIR = path.join(os.tmpdir(), 'decsim_audio_cache');
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch {
  // Ignored in read-only / restricted environments
}

// In-memory cache for fast response within serverless container lifecycle
const memoryCache = new Map();

/**
 * Packs 16-bit Linear PCM into a standard 44-byte RIFF WAV format
 */
function pcmToWav(pcmBase64, sampleRate = 24000, numChannels = 1) {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const wavHeader = Buffer.alloc(44);
  const dataSize = pcmBuffer.length;
  const fileSize = 36 + dataSize;
  const byteRate = sampleRate * numChannels * 2;
  const blockAlign = numChannels * 2;

  // RIFF chunk descriptor
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(fileSize, 4);
  wavHeader.write('WAVE', 8);

  // 'fmt ' sub-chunk
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16); // 16 for PCM
  wavHeader.writeUInt16LE(1, 20); // 1 = PCM
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(16, 34); // 16-bit

  // 'data' sub-chunk
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  return Buffer.concat([wavHeader, pcmBuffer]).toString('base64');
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    let data = req.body;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch {
        data = {};
      }
    } else if (!data) {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const raw = Buffer.concat(buffers).toString('utf-8');
      try {
        data = JSON.parse(raw);
      } catch {
        data = {};
      }
    }

    const apiKey =
      process.env.GOOGLE_CLOUD_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.VITE_GOOGLE_CLOUD_API_KEY;

    if (!apiKey) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ simulated: true, reason: 'No Google API key configured on Vercel' }));
      return;
    }

    // Determine voice name (Puck = tactical field operator, Charon = calm instructor)
    let voiceName = 'Charon';
    if (data.voiceName?.includes('Puck') || data.voiceName?.includes('Fenrir') || data.channel === 'radio') {
      voiceName = 'Puck';
    } else if (data.channel === 'instructor') {
      voiceName = 'Charon';
    }

    const hash = crypto.createHash('md5').update(`${voiceName}:${data.text || ''}`).digest('hex');

    // 1. Check memory cache
    if (memoryCache.has(hash)) {
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ audioContent: memoryCache.get(hash), simulated: false, cached: true }));
      return;
    }

    // 2. Check /tmp disk cache
    const cacheFilePath = path.join(CACHE_DIR, `${hash}.wav.b64`);
    if (fs.existsSync(cacheFilePath)) {
      try {
        const cachedBase64 = fs.readFileSync(cacheFilePath, 'utf-8');
        memoryCache.set(hash, cachedBase64);
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ audioContent: cachedBase64, simulated: false, cached: true }));
        return;
      } catch {
        // Continue to API if disk cache read failed
      }
    }

    // 3. Try Google Gemini TTS endpoint
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: data.text }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName,
                },
              },
            },
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (geminiResp.ok) {
      const geminiData = await geminiResp.json();
      const part = geminiData.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (part?.inlineData?.data) {
        const wavBase64 = pcmToWav(part.inlineData.data, 24000, 1);

        memoryCache.set(hash, wavBase64);
        try {
          fs.writeFileSync(cacheFilePath, wavBase64, 'utf-8');
        } catch {
          // Ignore cache write failures
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify({ audioContent: wavBase64, simulated: false, provider: 'gemini-tts' }));
        return;
      }
    }

    // Fallback if API returned non-200 or no audio
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ simulated: true, reason: 'TTS API returned non-audio response' }));
  } catch (err) {
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({ simulated: true, error: err.message }));
  }
}
