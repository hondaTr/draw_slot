import { audio } from '../audio.js';
import { pickWinner, pickDecoy } from '../storage.js';
import { SkipError } from '../stage.js';
import { runTreasureScenario } from './treasure.js';
import { runBossScenario } from './boss.js';
import { runKingScenario } from './king.js';
import { runMetalScenario } from './metal.js';
import { runCasinoScenario } from './casino.js';
import { runDharmaScenario } from './dharma.js';
import { runSpellScenario } from './spell.js';
import { runRaceScenario } from './race.js';
import { runSwordScenario } from './sword.js';
import { runVoyageScenario } from './voyage.js';
import { runPotScenario } from './pot.js';
import { runYesNoScenario } from './yesno.js';
import { runRingScenario } from './ring.js';
import { runPhoenixScenario } from './phoenix.js';
import { runSlashScenario } from './slash.js';
import { runDungeonScenario } from './dungeon.js';
import { runArenaScenario } from './arena.js';

export const SCENARIO_MAP = {
  treasure: { name: '宝箱あけ', run: runTreasureScenario },
  boss: { name: 'ボス戦', run: runBossScenario },
  king: { name: '王様のまえ', run: runKingScenario },
  metal: { name: 'メタル系', run: runMetalScenario },
  casino: { name: 'カジノスロット', run: runCasinoScenario },
  dharma: { name: 'ダーマの神殿', run: runDharmaScenario },
  spell: { name: 'ふっかつのじゅもん', run: runSpellScenario },
  race: { name: 'スライムレース', run: runRaceScenario },
  sword: { name: '伝説の剣', run: runSwordScenario },
  voyage: { name: '旅と船', run: runVoyageScenario },
  pot: { name: '民家のツボ・タンス', run: runPotScenario },
  yesno: { name: 'はい／いいえループ', run: runYesNoScenario },
  ring: { name: '指輪の選択', run: runRingScenario },
  phoenix: { name: '不死鳥の祭壇', run: runPhoenixScenario },
  slash: { name: '居合の一閃', run: runSlashScenario },
  dungeon: { name: 'ダンジョン探検', run: runDungeonScenario },
  arena: { name: 'モンスター闘技場', run: runArenaScenario },
};

const SCENARIO_KEYS = Object.keys(SCENARIO_MAP);

function chooseRoute(isSafe) {
  if (isSafe) return 'safe';
  const r = Math.random();
  if (r < 0.14) return 'premier'; // プレミア演出
  if (r < 0.58) return 'reverse'; // 逆転・焦らし演出（約44%）
  return 'normal'; // 通常・王道期待度上昇演出
}

export async function executeDraw({ stage, members, settings }) {
  stage.resetRun();

  const safeRate = Math.max(0, Math.min(40, Number(settings.safeRate) || 0)) / 100;
  let isSafe = Math.random() < safeRate;
  const winner = isSafe ? null : pickWinner(members);
  if (!isSafe && !winner) {
    isSafe = true;
  }
  const decoy = pickDecoy(members, winner);
  const route = chooseRoute(isSafe);

  const scenarioKey =
    settings.selectedScenario && SCENARIO_MAP[settings.selectedScenario]
      ? settings.selectedScenario
      : SCENARIO_KEYS[Math.floor(Math.random() * SCENARIO_KEYS.length)];

  const scenario = SCENARIO_MAP[scenarioKey];
  stage.setScenarioTag(`演出：${scenario.name}`);

  const ctx = {
    stage,
    members,
    drawTitle: settings.drawTitle || '幹事',
    isSafe,
    winner,
    decoy,
    route,
  };

  try {
    await scenario.run(ctx);
  } catch (err) {
    if (!(err instanceof SkipError)) {
      console.error('Scenario error:', err);
    }
  } finally {
    audio.stopBgm();
  }

  stage.showResultBanner({
    isSafe,
    winner,
    drawTitle: ctx.drawTitle,
    canExclude: !isSafe && members.length > 1,
  });

  return { isSafe, winner, scenarioKey, route };
}
