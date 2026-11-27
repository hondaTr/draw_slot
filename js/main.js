import { audio } from './audio.js';
import {
  WEIGHT_OPTIONS,
  loadState,
  saveState,
  getActiveGroup,
  getEnabledMembers,
  addGroup,
  renameActiveGroup,
  deleteActiveGroup,
  addMembers,
  updateMember,
  removeMember,
  setAllMembersEnabled,
  resetAllWeights,
} from './storage.js';
import { StageController, escapeHtml } from './stage.js';
import { executeDraw } from './scenarios/index.js';

const stage = new StageController();
let state = loadState();
let isRunning = false;
let lastWinnerId = null;

// DOM 要素参照
const el = {
  groupBadge: document.getElementById('current-group-badge'),
  headerDrawTitle: document.getElementById('header-draw-title'),
  btnDrawTitle: document.getElementById('btn-draw-title'),
  activeMemberCount: document.getElementById('active-member-count'),
  btnToggleFast: document.getElementById('btn-toggle-fast'),
  labelFastMode: document.getElementById('label-fast-mode'),
  btnToggleSound: document.getElementById('btn-toggle-sound'),
  labelSoundMode: document.getElementById('label-sound-mode'),
  btnOpenParty: document.getElementById('btn-open-party'),
  btnOpenSettings: document.getElementById('btn-open-settings'),
  btnStartDraw: document.getElementById('btn-start-draw'),
  btnSkipDraw: document.getElementById('btn-skip-draw'),
  btnExcludeWinner: document.getElementById('btn-exclude-winner'),
  memberWarning: document.getElementById('member-warning'),

  // パーティへんせいモーダル
  modalParty: document.getElementById('modal-party'),
  groupSelect: document.getElementById('group-select'),
  btnGroupNew: document.getElementById('btn-group-new'),
  btnGroupRename: document.getElementById('btn-group-rename'),
  btnGroupDelete: document.getElementById('btn-group-delete'),
  inputMemberName: document.getElementById('input-member-name'),
  btnAddMember: document.getElementById('btn-add-member'),
  btnToggleBulk: document.getElementById('btn-toggle-bulk'),
  bulkAddBox: document.getElementById('bulk-add-box'),
  textareaBulk: document.getElementById('textarea-bulk-members'),
  btnExecBulk: document.getElementById('btn-exec-bulk'),
  partySummary: document.getElementById('party-summary'),
  btnEnableAll: document.getElementById('btn-enable-all'),
  btnDisableAll: document.getElementById('btn-disable-all'),
  btnResetWeights: document.getElementById('btn-reset-weights'),
  memberList: document.getElementById('member-list'),

  // せっていモーダル
  modalSettings: document.getElementById('modal-settings'),
  inputDrawTitle: document.getElementById('input-draw-title'),
  selectScenario: document.getElementById('select-scenario'),
  rangeSafeRate: document.getElementById('range-safe-rate'),
  labelSafeRate: document.getElementById('label-safe-rate'),
  chkFastMode: document.getElementById('chk-fast-mode'),
  chkReducedEffects: document.getElementById('chk-reduced-effects'),
};

function persist(nextState) {
  state = nextState;
  saveState(state);
}

function syncAudioAndSpeed() {
  audio.setMode(state.settings.soundMode);
  stage.setFastMode(state.settings.fastMode);
  stage.setReducedEffects(state.settings.reducedEffects);
}

function renderHeaderAndControls() {
  const group = getActiveGroup(state);
  const enabled = getEnabledMembers(state);
  const title = state.settings.drawTitle || '幹事';

  el.groupBadge.textContent = group.name;
  el.headerDrawTitle.textContent = title;
  el.btnDrawTitle.textContent = title;
  el.activeMemberCount.textContent = String(enabled.length);

  // 時短表示
  const fast = state.settings.fastMode;
  el.btnToggleFast.classList.toggle('is-active', fast);
  el.labelFastMode.textContent = fast ? '時短2x' : '通常';
  el.chkFastMode.checked = fast;

  // サウンド表示
  const soundMap = { all: 'BGM+SE', se: 'SEのみ', mute: 'ミュート' };
  el.labelSoundMode.textContent = soundMap[state.settings.soundMode] || 'BGM+SE';
  el.btnToggleSound.classList.toggle('is-active', state.settings.soundMode !== 'mute');

  // 抽選ボタン状態
  const hasMembers = enabled.length > 0;
  el.btnStartDraw.disabled = isRunning || !hasMembers;
  el.memberWarning.classList.toggle('hidden', hasMembers);
  el.btnOpenParty.disabled = isRunning;
  el.btnOpenSettings.disabled = isRunning;

  document.querySelectorAll('.sound-opt').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.sound === state.settings.soundMode);
  });
}

function renderPartyModal() {
  const group = getActiveGroup(state);

  // グループ選択肢
  el.groupSelect.innerHTML = state.groups
    .map((g) => `<option value="${escapeHtml(g.id)}" ${g.id === group.id ? 'selected' : ''}>${escapeHtml(g.name)} (${g.members.length}人)</option>`)
    .join('');

  el.btnGroupDelete.disabled = state.groups.length <= 1;

  const enabledCount = group.members.filter((m) => m.enabled).length;
  el.partySummary.textContent = `${enabledCount}/${group.members.length}人 参加`;

  if (group.members.length === 0) {
    el.memberList.innerHTML = '<div style="padding:14px;text-align:center;color:#94a3b8;">メンバーが登録されていません。上の入力欄から追加してください。</div>';
    return;
  }

  el.memberList.innerHTML = group.members
    .map((m) => {
      const weightOpts = WEIGHT_OPTIONS.map(
        (opt) => `<option value="${opt.value}" ${Number(m.weight) === opt.value ? 'selected' : ''}>${opt.label}</option>`
      ).join('');
      return `
        <div class="member-row ${m.enabled ? '' : 'is-disabled'}" data-member-id="${escapeHtml(m.id)}">
          <label class="member-left">
            <input type="checkbox" class="member-chk" ${m.enabled ? 'checked' : ''}>
            <span class="member-name-label">${escapeHtml(m.name)}</span>
          </label>
          <div class="member-right">
            <select class="rpg-input weight-select" title="当選確率の重み">${weightOpts}</select>
            <button type="button" class="rpg-btn rpg-btn-xs rpg-btn-danger btn-del-member">削除</button>
          </div>
        </div>
      `;
    })
    .join('');
}

function renderSettingsModal() {
  el.inputDrawTitle.value = state.settings.drawTitle;
  el.selectScenario.value = state.settings.selectedScenario;
  el.rangeSafeRate.value = String(state.settings.safeRate);
  el.labelSafeRate.textContent = String(state.settings.safeRate);
  el.chkFastMode.checked = state.settings.fastMode;
  el.chkReducedEffects.checked = Boolean(state.settings.reducedEffects);
}

function refreshAll({ resetStageToIdle = false } = {}) {
  syncAudioAndSpeed();
  renderHeaderAndControls();
  renderPartyModal();
  renderSettingsModal();
  if (resetStageToIdle && !isRunning) {
    stage.renderIdle(getEnabledMembers(state), state.settings.drawTitle);
  }
}

function openModal(modalEl) {
  if (isRunning) return;
  audio.playSe('confirm');
  modalEl.classList.remove('hidden');
}

function closeModal(modalEl) {
  audio.playSe('cursor');
  modalEl.classList.add('hidden');
}

// 抽選開始
async function handleStartDraw() {
  if (isRunning) return;
  const members = getEnabledMembers(state);
  if (members.length === 0) return;

  audio.unlock();
  audio.playSe('confirm');

  isRunning = true;
  lastWinnerId = null;
  el.btnStartDraw.classList.add('hidden');
  el.btnSkipDraw.classList.remove('hidden');
  renderHeaderAndControls();

  try {
    const result = await executeDraw({
      stage,
      members,
      settings: state.settings,
    });
    if (!result.isSafe && result.winner) {
      lastWinnerId = result.winner.id;
    }
  } finally {
    isRunning = false;
    el.btnSkipDraw.classList.add('hidden');
    el.btnStartDraw.classList.remove('hidden');
    renderHeaderAndControls();
  }
}

function bindEvents() {
  // 抽選スタート & スキップ
  el.btnStartDraw.addEventListener('click', handleStartDraw);
  el.btnSkipDraw.addEventListener('click', () => {
    if (!isRunning) return;
    audio.playSe('cursor');
    stage.skip();
  });

  // 結果からの「次回から除外」
  el.btnExcludeWinner.addEventListener('click', () => {
    if (!lastWinnerId || isRunning) return;
    audio.playSe('confirm');
    persist(updateMember(state, lastWinnerId, { enabled: false }));
    el.btnExcludeWinner.disabled = true;
    el.btnExcludeWinner.textContent = '除外しました（パーティに反映済）';
    refreshAll({ resetStageToIdle: false });
  });

  // 時短トグル
  el.btnToggleFast.addEventListener('click', () => {
    audio.playSe('cursor');
    persist({
      ...state,
      settings: { ...state.settings, fastMode: !state.settings.fastMode },
    });
    refreshAll();
  });

  // サウンドトグル（all -> se -> mute -> all）
  el.btnToggleSound.addEventListener('click', () => {
    const order = ['all', 'se', 'mute'];
    const next = order[(order.indexOf(state.settings.soundMode) + 1) % order.length];
    persist({
      ...state,
      settings: { ...state.settings, soundMode: next },
    });
    syncAudioAndSpeed();
    if (next !== 'mute') {
      audio.unlock();
      audio.playSe('cursor');
    }
    renderHeaderAndControls();
  });

  // モーダル開閉
  el.btnOpenParty.addEventListener('click', () => {
    renderPartyModal();
    openModal(el.modalParty);
  });
  el.btnOpenSettings.addEventListener('click', () => {
    renderSettingsModal();
    openModal(el.modalSettings);
  });

  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.close);
      if (target) closeModal(target);
    });
  });

  [el.modalParty, el.modalSettings].forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(backdrop);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!el.modalParty.classList.contains('hidden')) closeModal(el.modalParty);
      if (!el.modalSettings.classList.contains('hidden')) closeModal(el.modalSettings);
    }
  });

  // グループ操作
  el.groupSelect.addEventListener('change', (e) => {
    audio.playSe('cursor');
    persist({ ...state, activeGroupId: e.target.value });
    refreshAll({ resetStageToIdle: true });
  });

  el.btnGroupNew.addEventListener('click', () => {
    const name = window.prompt('新しいグループ名を入力してください', '新パーティ');
    if (!name || !name.trim()) return;
    audio.playSe('confirm');
    persist(addGroup(state, name));
    refreshAll({ resetStageToIdle: true });
  });

  el.btnGroupRename.addEventListener('click', () => {
    const current = getActiveGroup(state);
    const name = window.prompt('グループ名を変更してください', current.name);
    if (!name || !name.trim()) return;
    audio.playSe('confirm');
    persist(renameActiveGroup(state, name));
    refreshAll({ resetStageToIdle: true });
  });

  el.btnGroupDelete.addEventListener('click', () => {
    if (state.groups.length <= 1) return;
    const current = getActiveGroup(state);
    if (!window.confirm(`グループ「${current.name}」を削除しますか？`)) return;
    audio.playSe('confirm');
    persist(deleteActiveGroup(state));
    refreshAll({ resetStageToIdle: true });
  });

  // メンバー追加
  const submitSingleMember = () => {
    const val = el.inputMemberName.value.trim();
    if (!val) return;
    audio.playSe('confirm');
    persist(addMembers(state, [val]));
    el.inputMemberName.value = '';
    refreshAll({ resetStageToIdle: true });
  };

  el.btnAddMember.addEventListener('click', submitSingleMember);
  el.inputMemberName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      submitSingleMember();
    }
  });

  el.btnToggleBulk.addEventListener('click', () => {
    audio.playSe('cursor');
    el.bulkAddBox.classList.toggle('hidden');
  });

  el.btnExecBulk.addEventListener('click', () => {
    const raw = el.textareaBulk.value;
    const names = raw
      .split(/[\n,、]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length === 0) return;
    audio.playSe('confirm');
    persist(addMembers(state, names));
    el.textareaBulk.value = '';
    el.bulkAddBox.classList.add('hidden');
    refreshAll({ resetStageToIdle: true });
  });

  // メンバー一覧操作（イベント委譲）
  el.memberList.addEventListener('change', (e) => {
    const row = e.target.closest('.member-row');
    if (!row) return;
    const memberId = row.dataset.memberId;

    if (e.target.classList.contains('member-chk')) {
      audio.playSe('cursor');
      persist(updateMember(state, memberId, { enabled: e.target.checked }));
      refreshAll({ resetStageToIdle: true });
    } else if (e.target.classList.contains('weight-select')) {
      audio.playSe('cursor');
      persist(updateMember(state, memberId, { weight: Number(e.target.value) || 1 }));
      refreshAll({ resetStageToIdle: true });
    }
  });

  el.memberList.addEventListener('click', (e) => {
    if (!e.target.classList.contains('btn-del-member')) return;
    const row = e.target.closest('.member-row');
    if (!row) return;
    audio.playSe('cursor');
    persist(removeMember(state, row.dataset.memberId));
    refreshAll({ resetStageToIdle: true });
  });

  el.btnEnableAll.addEventListener('click', () => {
    audio.playSe('confirm');
    persist(setAllMembersEnabled(state, true));
    refreshAll({ resetStageToIdle: true });
  });

  el.btnDisableAll.addEventListener('click', () => {
    audio.playSe('cursor');
    persist(setAllMembersEnabled(state, false));
    refreshAll({ resetStageToIdle: true });
  });

  el.btnResetWeights.addEventListener('click', () => {
    audio.playSe('cursor');
    persist(resetAllWeights(state));
    refreshAll({ resetStageToIdle: true });
  });

  // 設定モーダル操作
  el.inputDrawTitle.addEventListener('input', (e) => {
    const title = e.target.value.trim() || '幹事';
    persist({ ...state, settings: { ...state.settings, drawTitle: title } });
    renderHeaderAndControls();
    if (!isRunning) {
      stage.renderIdle(getEnabledMembers(state), title);
    }
  });

  document.querySelectorAll('.title-preset').forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.playSe('cursor');
      const title = btn.dataset.title;
      el.inputDrawTitle.value = title;
      persist({ ...state, settings: { ...state.settings, drawTitle: title } });
      refreshAll({ resetStageToIdle: true });
    });
  });

  el.selectScenario.addEventListener('change', (e) => {
    audio.playSe('cursor');
    persist({ ...state, settings: { ...state.settings, selectedScenario: e.target.value } });
  });

  el.rangeSafeRate.addEventListener('input', (e) => {
    const val = Number(e.target.value) || 0;
    el.labelSafeRate.textContent = String(val);
    persist({ ...state, settings: { ...state.settings, safeRate: val } });
  });

  document.querySelectorAll('.sound-opt').forEach((btn) => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.sound;
      persist({ ...state, settings: { ...state.settings, soundMode: mode } });
      syncAudioAndSpeed();
      if (mode !== 'mute') {
        audio.unlock();
        audio.playSe('cursor');
      }
      renderHeaderAndControls();
    });
  });

  el.chkFastMode.addEventListener('change', (e) => {
    audio.playSe('cursor');
    persist({ ...state, settings: { ...state.settings, fastMode: e.target.checked } });
    refreshAll();
  });

  el.chkReducedEffects.addEventListener('change', (e) => {
    audio.playSe('cursor');
    persist({ ...state, settings: { ...state.settings, reducedEffects: e.target.checked } });
    refreshAll();
  });
}

// 初期化
bindEvents();
refreshAll({ resetStageToIdle: true });
