/**
 * Voice: accept WeChat miniprogram recording upload, return transcribed text.
 * Uses OpenAI Whisper if OPENAI_API_KEY is set; otherwise returns placeholder.
 */
import { Router } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

async function transcribeWithWhisper(buffer: Buffer, mimeType: string): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return '[语音识别未配置 OPENAI_API_KEY，请在小程序端使用微信自带的语音转文字能力，或配置 Whisper]';
  }
  const form = new FormData();
  form.append('file', new Blob([buffer], { type: mimeType || 'audio/mp3' }), 'voice.mp3');
  form.append('model', 'whisper-1');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Whisper: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { text?: string };
  return data.text?.trim() ?? '';
}

router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;
    if (!file?.buffer) {
      return res.status(400).json({ error: 'audio file required' });
    }
    const mimeType = file.mimetype || 'audio/mpeg';
    const text = await transcribeWithWhisper(file.buffer, mimeType);
    return res.json({ text });
  } catch (e) {
    console.error('Voice transcribe error:', e);
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Transcribe failed',
    });
  }
});

export const voiceRouter = router;
