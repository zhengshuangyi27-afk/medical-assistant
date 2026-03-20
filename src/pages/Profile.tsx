import {
  ChevronRight,
  Info,
  Database,
  FileCode2,
  ChevronLeft,
  Bot,
  Check,
  X,
  LogOut,
  Loader2,
  KeyRound,
  UserPlus,
  Zap,
  Camera,
  Pencil,
  Link2,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import BottomNav from '@/src/components/ui/BottomNav';
import { cn } from '@/src/lib/utils';
import { apiGet, apiPost, apiPatch, apiPostFormData, publicAssetUrl } from '@/src/lib/api';
import {
  getAuthToken,
  setAuthSession,
  clearAuthSession,
  getCachedUser,
  maskPhone,
  type AuthUser,
} from '@/src/lib/auth';
import {
  getSelectedModelId,
  LLM_MODULES,
  type LlmModuleKey,
  getModuleModelMap,
  setModuleModelId,
  serializeLlmByModuleForApi,
  setModuleModelMapFromServer,
} from '@/src/lib/llm';
import {
  loadHospitalConfig,
  saveHospitalConfig,
  hospitalRowSummary,
  type HospitalIntegrationConfig,
} from '@/src/lib/hospital-config';

interface LlmModel {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectFrom = (location.state as { from?: string } | null)?.from;

  const [models, setModels] = useState<LlmModel[]>([]);
  const [selectedModel, setSelectedModel] = useState(() => getSelectedModelId());
  const [overrides, setOverrides] = useState<Partial<Record<LlmModuleKey, string>>>(() => getModuleModelMap());
  const [pickingFor, setPickingFor] = useState<'global' | LlmModuleKey | null>(null);

  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getCachedUser());
  /** 仅有 Token、无本地用户缓存时需要拉取 /me，其余情况直接展示 */
  const [authBoot, setAuthBoot] = useState(() => !!getAuthToken() && !getCachedUser());
  const [authPanel, setAuthPanel] = useState<'login' | 'register'>('login');
  const [phone, setPhone] = useState('');
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [regNick, setRegNick] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authErr, setAuthErr] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [nickEditing, setNickEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState('');
  const [nickSaving, setNickSaving] = useState(false);

  const [hospitalCfg, setHospitalCfg] = useState<HospitalIntegrationConfig>(() => loadHospitalConfig());
  const [hospitalModal, setHospitalModal] = useState<null | 'his' | 'emr' | 'lis'>(null);
  const [hospDraft, setHospDraft] = useState<Record<string, string>>({});

  const mergeAvatarRev = (prev: AuthUser | null, next: AuthUser): number => {
    const prevRev = prev?.avatarRev ?? 0;
    // 头像 URL 变化时提升版本；未变化时沿用已有版本，避免登录后回到旧缓存参数导致头像看似“丢失”
    if (prev?.phone === next.phone && prev?.avatarUrl && next.avatarUrl && prev.avatarUrl !== next.avatarUrl) {
      return prevRev + 1;
    }
    if (prev?.phone === next.phone) return prevRev;
    return next.avatarUrl ? 1 : 0;
  };

  const openHospitalModal = (kind: 'his' | 'emr' | 'lis') => {
    const c = loadHospitalConfig();
    setHospitalCfg(c);
    if (kind === 'his') {
      setHospDraft({ hisBaseUrl: c.hisBaseUrl, hisApiKey: c.hisApiKey });
    } else if (kind === 'emr') {
      setHospDraft({ emrBaseUrl: c.emrBaseUrl, emrClientId: c.emrClientId });
    } else {
      setHospDraft({ lisPacsBaseUrl: c.lisPacsBaseUrl, lisRemark: c.lisRemark });
    }
    setHospitalModal(kind);
  };

  const saveHospitalModal = () => {
    const c = { ...loadHospitalConfig() };
    if (hospitalModal === 'his') {
      c.hisBaseUrl = (hospDraft.hisBaseUrl || '').trim();
      c.hisApiKey = (hospDraft.hisApiKey || '').trim();
    } else if (hospitalModal === 'emr') {
      c.emrBaseUrl = (hospDraft.emrBaseUrl || '').trim();
      c.emrClientId = (hospDraft.emrClientId || '').trim();
    } else if (hospitalModal === 'lis') {
      c.lisPacsBaseUrl = (hospDraft.lisPacsBaseUrl || '').trim();
      c.lisRemark = (hospDraft.lisRemark || '').trim();
    }
    saveHospitalConfig(c);
    setHospitalCfg(c);
    setHospitalModal(null);
  };

  const clearHospitalModalFields = () => {
    if (hospitalModal === 'his') {
      setHospDraft({ hisBaseUrl: '', hisApiKey: '' });
    } else if (hospitalModal === 'emr') {
      setHospDraft({ emrBaseUrl: '', emrClientId: '' });
    } else if (hospitalModal === 'lis') {
      setHospDraft({ lisPacsBaseUrl: '', lisRemark: '' });
    }
  };

  const applyServerLlmSettings = (settings: {
    selected_llm?: string | null;
    llm_by_module?: Record<string, string>;
  }) => {
    if (settings?.selected_llm) localStorage.setItem('selected_llm', settings.selected_llm);
    if (settings?.llm_by_module != null && typeof settings.llm_by_module === 'object') {
      setModuleModelMapFromServer(settings.llm_by_module);
    }
    setSelectedModel(getSelectedModelId());
    setOverrides(getModuleModelMap());
  };

  const persistAll = (globalId?: string) => {
    const sid = globalId ?? getSelectedModelId();
    apiPost('/api/config/user/settings', {
      selected_llm: sid,
      llm_by_module: serializeLlmByModuleForApi(),
    }).catch(() => {});
  };

  const loadModelsAndSettings = () => {
    return Promise.all([
      apiGet<{ models: LlmModel[] }>('/api/config/llm'),
      apiGet<{ selected_llm?: string | null; llm_by_module?: Record<string, string> }>(
        '/api/config/user/settings'
      ).catch(() => ({})),
    ])
      .then(([data, settings]) => {
        setModels(data.models || []);
        applyServerLlmSettings(settings || {});
        let sid = getSelectedModelId();
        if (!sid && data.models?.length) {
          sid = data.models.find((m) => m.is_default)?.id || data.models[0].id;
          localStorage.setItem('selected_llm', sid);
        }
        setSelectedModel(sid);
        setOverrides(getModuleModelMap());
      })
      .catch(() => {
        setModels([
          { id: 'qwen3.5-plus', name: '通义千问 3.5 Plus (阿里云)', description: 'DashScope 推荐，能力强', is_default: true },
          { id: 'qwen-turbo', name: '通义千问 Turbo (阿里云)', description: 'DashScope 快速响应', is_default: false },
          { id: 'qwen-plus', name: '通义千问 Plus (阿里云)', description: 'DashScope 更强推理', is_default: false },
          { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: '快速响应', is_default: false },
          { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: '强推理', is_default: false },
        ]);
        const sid = getSelectedModelId() || 'qwen3.5-plus';
        if (!getSelectedModelId()) localStorage.setItem('selected_llm', sid);
        setSelectedModel(sid);
        setOverrides(getModuleModelMap());
      });
  };

  useEffect(() => {
    const t = getAuthToken();
    if (!t) {
      setAuthUser(null);
      setAuthBoot(false);
      return;
    }
    apiGet<{ user: AuthUser }>('/api/auth/me')
      .then((r) => {
        const prev = getCachedUser();
        const avatarRev = mergeAvatarRev(prev, r.user);
        const user = { ...r.user, avatarRev };
        setAuthUser(user);
        setAuthSession(t, user);
      })
      .catch(() => {
        setNickEditing(false);
        clearAuthSession();
        setAuthUser(null);
      })
      .finally(() => setAuthBoot(false));
  }, []);

  useEffect(() => {
    if (authUser) loadModelsAndSettings();
  }, [authUser?.id]);

  const afterAuthSuccess = (token: string, user: AuthUser) => {
    const prev = getCachedUser();
    const u = { ...user, avatarRev: mergeAvatarRev(prev, user) };
    setAuthSession(token, u);
    setAuthUser(u);
    setAuthErr('');
    setPwd('');
    setPwd2('');
    const to = redirectFrom && redirectFrom !== '/profile' ? redirectFrom : '/';
    navigate(to, { replace: true });
  };

  const handleLoginPassword = async () => {
    setAuthErr('');
    setAuthBusy(true);
    try {
      const r = await apiPost<{ token: string; user: AuthUser }>('/api/auth/login', {
        phone: phone.trim(),
        password: pwd,
      });
      afterAuthSuccess(r.token, r.user);
    } catch (e) {
      setAuthErr((e as Error).message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegister = async () => {
    setAuthErr('');
    if (pwd.length < 6 || pwd.length > 32) {
      setAuthErr('密码 6～32 位');
      return;
    }
    if (pwd !== pwd2) {
      setAuthErr('两次密码不一致');
      return;
    }
    setAuthBusy(true);
    try {
      const r = await apiPost<{ token: string; user: AuthUser }>('/api/auth/register', {
        phone: phone.trim(),
        password: pwd,
        nickname: regNick.trim() || undefined,
      });
      afterAuthSuccess(r.token, r.user);
    } catch (e) {
      setAuthErr((e as Error).message);
    } finally {
      setAuthBusy(false);
    }
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !authUser) return;
    if (!/^image\/(jpeg|png|webp|gif)$/i.test(file.type)) {
      alert('请上传 jpg、png、webp 或 gif 图片');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('图片请小于 2MB');
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const r = await apiPostFormData<{ ok: boolean; avatarUrl: string }>('/api/auth/avatar', fd);
      const nextRev = (authUser.avatarRev ?? 0) + 1;
      const next = { ...authUser, avatarUrl: r.avatarUrl, avatarRev: nextRev };
      setAuthSession(token, next);
      setAuthUser(next);
    } catch (err) {
      alert((err as Error).message || '上传失败');
    } finally {
      setAvatarUploading(false);
    }
  };

  const displayNickname = authUser
    ? authUser.nickname?.trim() || `用户${authUser.phone.slice(-4)}`
    : '';

  const startEditNickname = () => {
    if (!authUser) return;
    setNickDraft(authUser.nickname?.trim() || `用户${authUser.phone.slice(-4)}`);
    setNickEditing(true);
  };

  const saveNickname = async () => {
    if (!authUser) return;
    const n = nickDraft.trim();
    if (n.length < 1 || n.length > 32) {
      alert('昵称为 1～32 个字');
      return;
    }
    const token = getAuthToken();
    if (!token) return;
    setNickSaving(true);
    try {
      await apiPatch<{ nickname: string }>('/api/auth/profile', { nickname: n });
      const next = { ...authUser, nickname: n };
      setAuthSession(token, next);
      setAuthUser(next);
      setNickEditing(false);
    } catch (e) {
      alert((e as Error).message || '保存失败');
    } finally {
      setNickSaving(false);
    }
  };

  const handleLogout = () => {
    if (!confirm('确定退出登录？将返回登录页。')) return;
    setNickEditing(false);
    clearAuthSession();
    setAuthUser(null);
    setModels([]);
    navigate('/profile', { replace: true });
  };

  const handleGlobalModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    localStorage.setItem('selected_llm', modelId);
    persistAll(modelId);
    setPickingFor(null);
  };

  const handleModuleModelChange = (module: LlmModuleKey, modelId: string | null) => {
    setModuleModelId(module, modelId);
    setOverrides(getModuleModelMap());
    persistAll();
    setPickingFor(null);
  };

  const modelName = (id: string) => models.find((m) => m.id === id)?.name || id || '—';

  const moduleDisplay = (key: LlmModuleKey) => {
    const ov = overrides[key]?.trim();
    if (ov) return modelName(ov);
    return `跟随全局（${modelName(selectedModel)}）`;
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f7f8fa] relative">
      {authBoot ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 mt-4">加载中…</p>
        </div>
      ) : !authUser ? (
        <>
          <nav className="bg-white border-b border-slate-100 sticky top-0 z-40 pt-safe">
            <div className="px-4 h-16 flex items-center justify-between relative">
              <div className="w-[72px]" aria-hidden />
              <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white fill-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-blue-900">多模态医生助手</span>
              </div>
              <div className="w-[72px]" aria-hidden />
            </div>
          </nav>
          <p className="text-center text-sm text-slate-500 px-4 py-3 bg-slate-50 border-b border-slate-100">
            登录后可使用病例生成、用药查询、报告助手等全部功能
          </p>
          <main className="flex-1 overflow-y-auto px-4 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="flex border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setAuthPanel('login');
                    setAuthErr('');
                  }}
                  className={cn(
                    'flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5',
                    authPanel === 'login' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500'
                  )}
                >
                  <KeyRound className="w-4 h-4" />
                  登录
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthPanel('register');
                    setAuthErr('');
                  }}
                  className={cn(
                    'flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5',
                    authPanel === 'register' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-slate-500'
                  )}
                >
                  <UserPlus className="w-4 h-4" />
                  注册
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">手机号</label>
                  <input
                    type="tel"
                    maxLength={11}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="11位手机号"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">密码（6～32位）</label>
                  <input
                    type="password"
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder={authPanel === 'login' ? '登录密码' : '设置登录密码'}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200"
                  />
                </div>
                {authPanel === 'register' && (
                  <>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">确认密码</label>
                      <input
                        type="password"
                        value={pwd2}
                        onChange={(e) => setPwd2(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">昵称（可选）</label>
                      <input
                        type="text"
                        value={regNick}
                        onChange={(e) => setRegNick(e.target.value)}
                        placeholder="如：张医生"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200"
                      />
                    </div>
                  </>
                )}
                {authErr && <p className="text-sm text-red-500">{authErr}</p>}
                <button
                  type="button"
                  disabled={authBusy}
                  onClick={authPanel === 'login' ? handleLoginPassword : handleRegister}
                  className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {authBusy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : authPanel === 'login' ? (
                    <KeyRound className="w-5 h-5" />
                  ) : (
                    <UserPlus className="w-5 h-5" />
                  )}
                  {authPanel === 'login' ? '登录' : '注册并登录'}
                </button>
              </div>
            </div>
          </main>
        </>
      ) : (
        <>
          <header className="bg-white sticky top-0 z-40 px-4 py-3 flex items-center pt-safe">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-1 -ml-1 hover:bg-slate-100 rounded-full transition-colors mr-2"
            >
              <ChevronLeft className="w-6 h-6 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">我的</h1>
          </header>

          <main className="flex-1 overflow-y-auto pb-24 no-scrollbar">
            <section className="bg-white px-4 py-6 shadow-sm mb-3">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleAvatarFile}
              />
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  {authUser.avatarUrl ? (
                    <img
                      src={`${publicAssetUrl(authUser.avatarUrl)}?v=${authUser.avatarRev ?? 0}`}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                      {displayNickname.slice(0, 1) || authUser.phone.slice(0, 1)}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={avatarUploading}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow border-2 border-white disabled:opacity-50"
                    aria-label="更换头像"
                  >
                    {avatarUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  {nickEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        maxLength={32}
                        value={nickDraft}
                        onChange={(e) => setNickDraft(e.target.value)}
                        placeholder="1～32 字"
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-800 text-base font-semibold"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={nickSaving}
                          onClick={saveNickname}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-60 flex items-center gap-1"
                        >
                          {nickSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                          保存
                        </button>
                        <button
                          type="button"
                          disabled={nickSaving}
                          onClick={() => setNickEditing(false)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h2 className="text-lg font-bold text-slate-800 truncate">{displayNickname}</h2>
                        <button
                          type="button"
                          onClick={startEditNickname}
                          className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          aria-label="修改昵称"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{maskPhone(authUser.phone)}</p>
                      <button
                        type="button"
                        disabled={avatarUploading}
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-xs text-blue-600 font-medium mt-1"
                      >
                        {avatarUploading ? '上传中…' : '更换头像'}
                      </button>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="shrink-0 flex flex-col items-center gap-0.5 text-slate-400 hover:text-red-500"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-[10px]">退出</span>
                </button>
              </div>
            </section>

        {/* LLM Configuration Section */}
        <section className="mb-3">
          <h2 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ai 大模型配置</h2>
          <div className="bg-white border-y border-gray-100">
            <div
              onClick={() => setPickingFor('global')}
              className="flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3 shrink-0">
                  <Bot className="h-5 w-5 text-purple-600" />
                </div>
                <div className="min-w-0">
                  <span className="text-base text-[#333333] block font-medium">全局默认模型</span>
                  <span className="text-xs text-purple-600 font-medium mt-0.5 block truncate">
                    {modelName(selectedModel)}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">未单独设置的功能均使用此模型</span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666666] shrink-0" />
            </div>
            {LLM_MODULES.map(({ key, label }) => (
              <div
                key={key}
                onClick={() => setPickingFor(key)}
                className="flex items-center justify-between p-4 border-b border-gray-50 last:border-0 active:bg-gray-50 cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <span className="text-base text-[#333333] font-medium block">{label}</span>
                  <span className="text-xs text-slate-500 mt-0.5 block truncate">{moduleDisplay(key)}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-[#666666] shrink-0" />
              </div>
            ))}
          </div>
        </section>

        {/* 医院系统配置：默认空白，本地预留字段，点击填写 */}
        <section className="mb-3">
          <h2 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">医院系统配置</h2>
          <p className="px-4 pb-2 text-[11px] text-gray-400 leading-relaxed">
            院内 HIS / EMR 等对接预留项，配置仅保存在本机浏览器；正式接入以院方接口文档为准。
          </p>
          <div className="bg-white border-y border-gray-100">
            <button
              type="button"
              onClick={() => openHospitalModal('his')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 text-left"
            >
              <div className="flex items-center min-w-0">
                <span className="text-[#1a73e8] mr-3 shrink-0">
                  <Database className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="text-base text-[#333333] font-medium block">HIS API</span>
                  <span className="text-xs text-slate-400 mt-0.5 block truncate">
                    {hospitalRowSummary(hospitalCfg, 'his') || '未配置 · 点击填写'}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666666] shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => openHospitalModal('emr')}
              className="w-full flex items-center justify-between p-4 border-b border-gray-50 active:bg-gray-50 text-left"
            >
              <div className="flex items-center min-w-0">
                <span className="text-[#1a73e8] mr-3 shrink-0">
                  <FileCode2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="text-base text-[#333333] font-medium block">EMR 电子病历</span>
                  <span className="text-xs text-slate-400 mt-0.5 block truncate">
                    {hospitalRowSummary(hospitalCfg, 'emr') || '未配置 · 点击填写'}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666666] shrink-0" />
            </button>
            <button
              type="button"
              onClick={() => openHospitalModal('lis')}
              className="w-full flex items-center justify-between p-4 active:bg-gray-50 text-left"
            >
              <div className="flex items-center min-w-0">
                <span className="text-slate-500 mr-3 shrink-0">
                  <Link2 className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <span className="text-base text-[#333333] font-medium block">LIS / PACS（预留）</span>
                  <span className="text-xs text-slate-400 mt-0.5 block truncate">
                    {hospitalRowSummary(hospitalCfg, 'lis') || '未配置 · 点击填写'}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#666666] shrink-0" />
            </button>
          </div>
        </section>

        {/* NotificationsSection */}
        <section className="mb-3">
          <h2 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">消息通知</h2>
          <div className="bg-white border-y border-gray-100">
            <div className="flex items-center justify-between p-4 border-b border-gray-50">
              <span className="text-base text-[#333333]">新患者提醒</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a73e8]"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4">
              <span className="text-base text-[#333333]">化验结果更新</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a73e8]"></div>
              </label>
            </div>
          </div>
        </section>

        {/* SupportSection */}
        <section className="mb-8">
          <div className="bg-white border-y border-gray-100">
            <div className="flex items-center justify-between p-4 active:bg-gray-50 transition-colors cursor-pointer">
              <div className="flex items-center">
                <span className="text-gray-400 mr-3">
                  <Info className="h-5 w-5" />
                </span>
                <span className="text-base text-[#333333]">关于医疗助手</span>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </div>
          </div>
        </section>

        <section className="px-4 mt-6">
          <p className="text-center text-xs text-gray-400 pb-4">版本 1.3.1</p>
        </section>
      </main>

      <BottomNav />
        </>
      )}

      {pickingFor && authUser && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-h-[85vh] rounded-t-2xl shadow-xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 pb-safe flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">
                {pickingFor === 'global' ? '全局默认模型' : `${LLM_MODULES.find((m) => m.key === pickingFor)?.label} · 模型`}
              </h3>
              <button
                type="button"
                onClick={() => setPickingFor(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 overflow-y-auto flex-1">
              {pickingFor !== 'global' && (
                <button
                  type="button"
                  onClick={() => handleModuleModelChange(pickingFor, null)}
                  className={cn(
                    'w-full p-4 flex items-center justify-between rounded-xl mb-3 bg-white shadow-sm border text-left',
                    !overrides[pickingFor]?.trim()
                      ? 'ring-2 ring-purple-500 border-transparent'
                      : 'border-slate-200'
                  )}
                >
                  <div>
                    <h4 className="font-bold text-slate-800">跟随全局默认</h4>
                    <p className="text-xs text-slate-500 mt-1">{modelName(selectedModel)}</p>
                  </div>
                  {!overrides[pickingFor]?.trim() && (
                    <Check className="w-5 h-5 text-purple-600 shrink-0" strokeWidth={3} />
                  )}
                </button>
              )}
              {models.map((model) => {
                const isGlobal = pickingFor === 'global';
                const checked = isGlobal
                  ? selectedModel === model.id
                  : overrides[pickingFor]?.trim() === model.id;
                return (
                  <div
                    key={model.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      isGlobal
                        ? handleGlobalModelChange(model.id)
                        : handleModuleModelChange(pickingFor, model.id)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        isGlobal
                          ? handleGlobalModelChange(model.id)
                          : handleModuleModelChange(pickingFor, model.id);
                      }
                    }}
                    className={cn(
                      'p-4 flex items-center justify-between rounded-xl mb-3 cursor-pointer transition-all active:scale-[0.98] bg-white shadow-sm',
                      checked ? 'ring-2 ring-purple-500 border-transparent' : 'border border-slate-200 hover:border-purple-300'
                    )}
                  >
                    <div>
                      <h4 className={cn('font-bold text-base', checked ? 'text-purple-700' : 'text-slate-800')}>
                        {model.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1.5">{model.description ?? ''}</p>
                    </div>
                    {checked && (
                      <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                        <Check className="w-4 h-4 text-purple-600" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {hospitalModal && authUser && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-h-[80vh] rounded-t-2xl shadow-xl overflow-hidden flex flex-col pb-safe">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-slate-800 text-lg">
                {hospitalModal === 'his' && 'HIS API 配置'}
                {hospitalModal === 'emr' && 'EMR 电子病历配置'}
                {hospitalModal === 'lis' && 'LIS / PACS（预留）'}
              </h3>
              <button
                type="button"
                onClick={() => setHospitalModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                以下为对接预留字段，保存后写入本机；后续版本将按医院接口规范调用，请勿在公共设备保存敏感密钥。
              </p>
              {hospitalModal === 'his' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">服务根地址（Base URL）</label>
                    <input
                      type="url"
                      placeholder="https://his.example.com/api"
                      value={hospDraft.hisBaseUrl || ''}
                      onChange={(e) => setHospDraft((d) => ({ ...d, hisBaseUrl: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">API Key / Token（可选）</label>
                    <input
                      type="password"
                      placeholder="由院方信息科提供"
                      value={hospDraft.hisApiKey || ''}
                      onChange={(e) => setHospDraft((d) => ({ ...d, hisApiKey: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                      autoComplete="off"
                    />
                  </div>
                </>
              )}
              {hospitalModal === 'emr' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">集成服务地址</label>
                    <input
                      type="url"
                      placeholder="https://emr.example.com/integration"
                      value={hospDraft.emrBaseUrl || ''}
                      onChange={(e) => setHospDraft((d) => ({ ...d, emrBaseUrl: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">应用 ID / Client ID（预留）</label>
                    <input
                      type="text"
                      placeholder="对接时填写"
                      value={hospDraft.emrClientId || ''}
                      onChange={(e) => setHospDraft((d) => ({ ...d, emrClientId: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </>
              )}
              {hospitalModal === 'lis' && (
                <>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">统一接口基址（预留）</label>
                    <input
                      type="url"
                      placeholder="https://…"
                      value={hospDraft.lisPacsBaseUrl || ''}
                      onChange={(e) => setHospDraft((d) => ({ ...d, lisPacsBaseUrl: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">备注（科室、环境等）</label>
                    <input
                      type="text"
                      placeholder="可选"
                      value={hospDraft.lisRemark || ''}
                      onChange={(e) => setHospDraft((d) => ({ ...d, lisRemark: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                </>
              )}
              <button
                type="button"
                onClick={clearHospitalModalFields}
                className="text-sm text-slate-500 underline"
              >
                清空本项
              </button>
            </div>
            <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setHospitalModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium"
              >
                取消
              </button>
              <button
                type="button"
                onClick={saveHospitalModal}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
