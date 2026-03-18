/**
 * 医院系统对接配置（本地预留，供后续与 HIS / EMR 等集成）
 * 仅存浏览器 localStorage，不上传服务器。
 */
const STORAGE_KEY = 'medical_hospital_integration_v1';

export type HospitalIntegrationConfig = {
  /** HIS 服务根地址 */
  hisBaseUrl: string;
  /** HIS 调用凭证（Token / API Key 等，按院方规范） */
  hisApiKey: string;
  /** EMR 集成基址 */
  emrBaseUrl: string;
  /** EMR 应用标识 / Client ID（预留） */
  emrClientId: string;
  /** LIS / PACS 等统一接口基址（预留） */
  lisPacsBaseUrl: string;
  /** 备注（如科室编码、环境说明） */
  lisRemark: string;
};

const empty: HospitalIntegrationConfig = {
  hisBaseUrl: '',
  hisApiKey: '',
  emrBaseUrl: '',
  emrClientId: '',
  lisPacsBaseUrl: '',
  lisRemark: '',
};

export function loadHospitalConfig(): HospitalIntegrationConfig {
  if (typeof window === 'undefined') return { ...empty };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...empty };
    const p = JSON.parse(raw) as Partial<HospitalIntegrationConfig>;
    return { ...empty, ...p };
  } catch {
    return { ...empty };
  }
}

export function saveHospitalConfig(c: HospitalIntegrationConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
}

export function hasHisConfigured(cfg: HospitalIntegrationConfig): boolean {
  return !!cfg.hisBaseUrl?.trim();
}

function trimDisplay(s: string, max = 36): string {
  const t = s.trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function hospitalRowSummary(
  cfg: HospitalIntegrationConfig,
  kind: 'his' | 'emr' | 'lis'
): string {
  if (kind === 'his') return trimDisplay(cfg.hisBaseUrl) || '';
  if (kind === 'emr') return trimDisplay(cfg.emrBaseUrl) || '';
  return trimDisplay(cfg.lisPacsBaseUrl) || '';
}
