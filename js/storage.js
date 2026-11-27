// LocalStorage 永続化・グループ/メンバー管理・重み付き抽選ロジック

export const STORAGE_KEY = 'rpg_roulette_v1';

export const WEIGHT_OPTIONS = [
  { value: 0, label: '0x (当たらない)' },
  { value: 0.25, label: '0.25x (ごく低)' },
  { value: 0.5, label: '0.5x (低め)' },
  { value: 1, label: '1x (ふつう)' },
  { value: 1.5, label: '1.5x (やや高)' },
  { value: 2, label: '2x (高め)' },
  { value: 3, label: '3x (高)' },
  { value: 5, label: '5x (かなり高)' },
  { value: 7, label: '7x (とても高)' },
  { value: 10, label: '10x (最高)' },
  { value: 100, label: '100x (ほぼ確実)' },
];

export const SPEED_OPTIONS = [0.5, 0.8, 1, 2];

export const SCENARIO_IDS = [
  'treasure',
  'boss',
  'king',
  'metal',
  'casino',
  'dharma',
  'spell',
  'race',
  'sword',
  'voyage',
  'pot',
  'yesno',
  'ring',
  'phoenix',
  'slash',
  'dungeon',
  'arena',
];

function createId(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultState() {
  const defaultGroupId = 'group_default';
  return {
    version: 1,
    activeGroupId: defaultGroupId,
    groups: [
      {
        id: defaultGroupId,
        name: 'デフォルトパーティ',
        members: [
          { id: 'm_1', name: 'ゆうしゃ', enabled: true, weight: 1 },
          { id: 'm_2', name: 'せんし', enabled: true, weight: 1 },
          { id: 'm_3', name: 'まほうつかい', enabled: true, weight: 1 },
          { id: 'm_4', name: 'そうりょ', enabled: true, weight: 1 },
          { id: 'm_5', name: 'あそびにん', enabled: true, weight: 1 },
        ],
      },
    ],
    settings: {
      drawTitle: '幹事',
      selectedScenario: 'random',
      safeRate: 10,
      soundMode: 'all',
      speedMultiplier: 1,
      reducedEffects: false,
    },
  };
}

function sanitizeMember(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const name = String(raw.name ?? '').trim().slice(0, 24);
  if (!name) return null;
  const weightNum = Number(raw.weight);
  const weight = Number.isFinite(weightNum) && weightNum >= 0 ? weightNum : 1;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId('m'),
    name,
    enabled: raw.enabled !== false,
    weight,
  };
}

function sanitizeState(raw) {
  const fallback = createDefaultState();
  if (!raw || typeof raw !== 'object') return fallback;

  const groups = Array.isArray(raw.groups)
    ? raw.groups
        .map((g) => {
          if (!g || typeof g !== 'object') return null;
          const name = String(g.name ?? '').trim().slice(0, 24) || '無題グループ';
          const members = Array.isArray(g.members)
            ? g.members.map(sanitizeMember).filter(Boolean)
            : [];
          return {
            id: typeof g.id === 'string' && g.id ? g.id : createId('g'),
            name,
            members,
          };
        })
        .filter(Boolean)
    : [];

  if (groups.length === 0) {
    return fallback;
  }

  const activeGroupId = groups.some((g) => g.id === raw.activeGroupId)
    ? raw.activeGroupId
    : groups[0].id;

  const s = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
  const safeRateNum = Number(s.safeRate);
  const safeRate = Number.isFinite(safeRateNum)
    ? Math.max(0, Math.min(40, Math.round(safeRateNum)))
    : fallback.settings.safeRate;

  const validSoundModes = ['all', 'se', 'mute'];
  const soundMode = validSoundModes.includes(s.soundMode) ? s.soundMode : 'all';

  const validScenarios = ['random', ...SCENARIO_IDS];
  const selectedScenario = validScenarios.includes(s.selectedScenario)
    ? s.selectedScenario
    : 'random';

  const drawTitle = String(s.drawTitle ?? '幹事').trim().slice(0, 20) || '幹事';
  const rawSpeed = Number(s.speedMultiplier);
  const speedMultiplier = SPEED_OPTIONS.includes(rawSpeed)
    ? rawSpeed
    : s.fastMode
    ? 2
    : 1;

  return {
    version: 1,
    activeGroupId,
    groups,
    settings: {
      drawTitle,
      selectedScenario,
      safeRate,
      soundMode,
      speedMultiplier,
      reducedEffects: Boolean(s.reducedEffects),
    },
  };
}

export function loadState(storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return createDefaultState();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

export function saveState(state, storage = typeof localStorage !== 'undefined' ? localStorage : null) {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ストレージ容量超過やプライベートモードは無視
  }
}

export function getActiveGroup(state) {
  return state.groups.find((g) => g.id === state.activeGroupId) || state.groups[0];
}

export function getEnabledMembers(state) {
  const group = getActiveGroup(state);
  return group ? group.members.filter((m) => m.enabled) : [];
}

export function addGroup(state, name) {
  const cleanName = String(name ?? '').trim().slice(0, 24);
  if (!cleanName) return state;
  const newGroup = {
    id: createId('g'),
    name: cleanName,
    members: [],
  };
  return {
    ...state,
    activeGroupId: newGroup.id,
    groups: [...state.groups, newGroup],
  };
}

export function renameActiveGroup(state, newName) {
  const cleanName = String(newName ?? '').trim().slice(0, 24);
  if (!cleanName) return state;
  return {
    ...state,
    groups: state.groups.map((g) =>
      g.id === state.activeGroupId ? { ...g, name: cleanName } : g
    ),
  };
}

export function deleteActiveGroup(state) {
  if (state.groups.length <= 1) return state;
  const remaining = state.groups.filter((g) => g.id !== state.activeGroupId);
  return {
    ...state,
    activeGroupId: remaining[0].id,
    groups: remaining,
  };
}

export function addMembers(state, names) {
  const cleanList = names
    .map((n) => String(n ?? '').trim().slice(0, 24))
    .filter(Boolean);
  if (cleanList.length === 0) return state;

  return {
    ...state,
    groups: state.groups.map((g) => {
      if (g.id !== state.activeGroupId) return g;
      const appended = cleanList.map((name) => ({
        id: createId('m'),
        name,
        enabled: true,
        weight: 1,
      }));
      return { ...g, members: [...g.members, ...appended] };
    }),
  };
}

export function updateMember(state, memberId, patch) {
  return {
    ...state,
    groups: state.groups.map((g) => {
      if (g.id !== state.activeGroupId) return g;
      return {
        ...g,
        members: g.members.map((m) =>
          m.id === memberId ? { ...m, ...patch } : m
        ),
      };
    }),
  };
}

export function removeMember(state, memberId) {
  return {
    ...state,
    groups: state.groups.map((g) => {
      if (g.id !== state.activeGroupId) return g;
      return {
        ...g,
        members: g.members.filter((m) => m.id !== memberId),
      };
    }),
  };
}

export function setAllMembersEnabled(state, enabled) {
  return {
    ...state,
    groups: state.groups.map((g) => {
      if (g.id !== state.activeGroupId) return g;
      return {
        ...g,
        members: g.members.map((m) => ({ ...m, enabled })),
      };
    }),
  };
}

export function resetAllWeights(state) {
  return {
    ...state,
    groups: state.groups.map((g) => {
      if (g.id !== state.activeGroupId) return g;
      return {
        ...g,
        members: g.members.map((m) => ({ ...m, weight: 1 })),
      };
    }),
  };
}

function getMemberWeight(member) {
  const w = Number(member?.weight);
  return Number.isFinite(w) && w >= 0 ? w : 1;
}

// 重み付きランダム抽選（weight === 0 のメンバーは絶対に対象外）
export function pickWinner(members, rng = Math.random) {
  if (!Array.isArray(members) || members.length === 0) return null;
  const candidates = members.filter((m) => getMemberWeight(m) > 0);
  if (candidates.length === 0) return null;

  const totalWeight = candidates.reduce((sum, m) => sum + getMemberWeight(m), 0);
  let roll = rng() * totalWeight;
  for (const m of candidates) {
    roll -= getMemberWeight(m);
    if (roll <= 0) return m;
  }
  return candidates[candidates.length - 1];
}

// 演出用のフェイク候補者（winner 以外から選出、1人だけの場合はダミーを返す）
export function pickDecoy(members, winner, rng = Math.random) {
  const others = members.filter((m) => !winner || m.id !== winner.id);
  if (others.length > 0) {
    return others[Math.floor(rng() * others.length)];
  }
  return { id: 'dummy_decoy', name: 'たびのしょうにん', enabled: true, weight: 1 };
}
