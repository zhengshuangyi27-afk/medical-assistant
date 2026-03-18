/**
 * 报告助手：上传报告图片，AI 解析后按固定格式返回（含异常指标标注）
 */
import { Router } from 'express';
import multer from 'multer';
import { getLlmConfigById, getDefaultLlmConfig } from '../lib/config-db.js';
import { completeWithImage } from '../lib/llm.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    cb(null, !!ok);
  },
});

/** 报告解析结果固定格式的提示词 */
const REPORT_PARSE_SYSTEM_PROMPT = `你是一位专业的报告解析助手。请根据用户上传的报告图片，识别并提取内容，严格按以下 JSON 格式输出，不要包含任何其他说明或 markdown 代码块。只输出一行 JSON。

格式说明：
- reportType: 报告类型（如：血常规、尿常规、生化全套、影像报告等）
- items: 检查项数组，每项包含：name、value、unit、isAbnormal、reference（同前）
- abnormalSummary: 异常指标摘要字符串数组
- summary: 报告总结，一两句话概括整体结论
- suggestions: 综合健康建议字符串数组（2～5 条，如复查、观察要点等）
- visitRecommendation: 就医建议，一句话说明是否需要就诊、紧急程度（如「建议尽快内分泌科就诊」「暂无需急诊，3 个月后复查即可」）
- recommendedDepartments: 如需专科就诊则列出科室名称数组（如 ["内分泌科","心内科"]）；若无需专科可填 [] 或 ["健康体检科/全科随访"]
- lifestyleAndDietAdvice: 日常生活与饮食习惯调整建议，字符串数组（如低盐低脂、规律作息、戒烟限酒、饮水量等），至少 2 条，无异常时也可给一般保健建议

输出格式（仅此一行 JSON，字段不可缺省，数组可为空）：
{"reportType":"","items":[{"name":"","value":"","unit":"","isAbnormal":false,"reference":""}],"abnormalSummary":[],"summary":"","suggestions":[],"visitRecommendation":"","recommendedDepartments":[],"lifestyleAndDietAdvice":[]}

请根据图片内容如实填写。异常指标在 items 中标记 isAbnormal。以上建议仅供参考，不能替代面诊。`;

router.post('/parse', upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    if (!file || !file.buffer) {
      return res.status(400).json({ error: '请上传一张报告图片（支持 jpeg/png/gif/webp）' });
    }
    const modelId = (req.body?.modelId as string) || undefined;
    const config = modelId
      ? await getLlmConfigById(modelId)
      : await getDefaultLlmConfig();
    if (!config) {
      return res.status(400).json({ error: 'No LLM config found. 请配置支持视觉的模型（如 Gemini）。' });
    }
    const base64 = file.buffer.toString('base64');
    const mimeType = file.mimetype || 'image/jpeg';
    const text = await completeWithImage(
      config,
      REPORT_PARSE_SYSTEM_PROMPT,
      '请识别并解析这份报告，按指定 JSON 格式输出。',
      base64,
      mimeType
    );
    // 尝试解析 JSON，便于前端直接使用
    let parsed: unknown = null;
    try {
      const cleaned = text.replace(/^```\w*\n?/i, '').replace(/\n?```\s*$/i, '').trim();
      const start = cleaned.indexOf('{');
      const end = cleaned.lastIndexOf('}');
      if (start !== -1 && end > start) {
        parsed = JSON.parse(cleaned.slice(start, end + 1));
      }
    } catch {
      // 解析失败时仍返回原始文本
    }
    return res.json({ result: text, parsed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '报告解析失败';
    console.error('Report parse error:', e);
    return res.status(500).json({ error: msg });
  }
});

export const reportRouter = router;
