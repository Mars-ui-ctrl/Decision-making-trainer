import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Persistent on-disk audio cache directory
const CACHE_DIR = path.resolve(process.cwd(), '.cache', 'audio');
try {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
} catch {
  // Ignored
}

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

function googleTtsPlugin(env) {
  return {
    name: 'google-tts-plugin',
    configureServer(server) {
      server.middlewares.use('/api/tts', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', chunk => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const data = JSON.parse(body || '{}');
            const apiKey =
              env.GOOGLE_CLOUD_API_KEY ||
              env.VITE_GOOGLE_CLOUD_API_KEY ||
              process.env.GOOGLE_CLOUD_API_KEY ||
              process.env.VITE_GOOGLE_CLOUD_API_KEY;

            if (!apiKey) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({ simulated: true, reason: 'No Google API key configured' }));
              return;
            }

            // Determine voice name (Puck = tactical field operator, Charon = calm instructor)
            let voiceName = 'Charon';
            if (data.voiceName?.includes('Puck') || data.voiceName?.includes('Fenrir') || data.channel === 'radio') {
              voiceName = 'Puck';
            } else if (data.channel === 'instructor') {
              voiceName = 'Charon';
            }

            // Check persistent on-disk cache first
            const hash = crypto.createHash('md5').update(`${voiceName}:${data.text}`).digest('hex');
            const cacheFilePath = path.join(CACHE_DIR, `${hash}.wav.b64`);

            if (fs.existsSync(cacheFilePath)) {
              try {
                const cachedBase64 = fs.readFileSync(cacheFilePath, 'utf-8');
                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ audioContent: cachedBase64, simulated: false, cached: true }));
                return;
              } catch {
                // If disk read failed, continue to API
              }
            }

            // 1. Try Google Studio Gemini TTS API (gemini-2.5-flash-preview-tts)
            try {
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
                  // Pack PCM to standard 24kHz WAV
                  const wavBase64 = pcmToWav(part.inlineData.data, 24000, 1);

                  // Persist to disk cache
                  try {
                    fs.writeFileSync(cacheFilePath, wavBase64, 'utf-8');
                  } catch {
                    // Cache write failed silently
                  }

                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = 200;
                  res.end(JSON.stringify({ audioContent: wavBase64, simulated: false, provider: 'gemini-tts' }));
                  return;
                }
              }
            } catch (err) {
              console.warn('[Google AI Studio TTS] Failed:', err.message);
            }

            // 2. Fallback: Generate high-fidelity neural audio via server-side edge-tts
            try {
              const { execFile } = await import('node:child_process');
              const tempMp3 = path.join(CACHE_DIR, `temp_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);
              const edgeVoice = voiceName === 'Puck' ? 'en-US-ChristopherNeural' : 'en-US-BrianNeural';

              await new Promise((resolve, reject) => {
                execFile('python', ['-m', 'edge_tts', '--voice', edgeVoice, '--text', data.text, '--write-media', tempMp3], (err) => {
                  if (err) return reject(err);
                  resolve();
                });
              });

              if (fs.existsSync(tempMp3)) {
                const mp3Buffer = fs.readFileSync(tempMp3);
                const b64 = mp3Buffer.toString('base64');
                try { fs.unlinkSync(tempMp3); } catch {}
                try { fs.writeFileSync(cacheFilePath, b64, 'utf-8'); } catch {}

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({ audioContent: b64, simulated: false, provider: 'edge-neural-tts' }));
                return;
              }
            } catch (edgeErr) {
              console.warn('[Server Neural TTS fallback error]:', edgeErr.message);
            }

            // Fallback: simulated = true
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ simulated: true }));
          } catch (err) {
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = 200;
            res.end(JSON.stringify({ simulated: true, error: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), googleTtsPlugin(env)],
  };
});
