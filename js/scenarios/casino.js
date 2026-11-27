import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const ITEM_HEIGHT = 42;
const REEL_ICONS = ['slime_blue', 'slime_red', 'slime_gold', 'chest_gold', 'king_metal'];

function buildReelBaseList(names) {
  const unique = names.length > 0 ? names : ['ゆうしゃ', 'せんし', 'まほうつかい'];
  const list = [];
  while (list.length < 6) {
    for (const n of unique) {
      list.push(n);
    }
  }
  return list;
}

function renderCabinetHtml(strips, coins = 100) {
  const viewportsHtml = strips
    .map((baseList, reelIdx) => {
      // 5周分並べて十分な長さのドラムストリップを作成
      const repeated = [...baseList, ...baseList, ...baseList, ...baseList, ...baseList];
      const loopPx = -(baseList.length * ITEM_HEIGHT);
      const itemsHtml = repeated
        .map((name, cellIdx) => {
          const iconName = REEL_ICONS[(cellIdx + reelIdx) % REEL_ICONS.length];
          return `
            <div class="reel-item">
              <span class="reel-item-icon">${getSpriteSvg(iconName, 20)}</span>
              <span class="reel-item-text">${escapeHtml(name)}</span>
            </div>
          `;
        })
        .join('');

      return `
        <div class="reel-viewport" data-reel-viewport="${reelIdx}">
          <div class="reel-strip" data-reel-strip="${reelIdx}" style="--loop-px:${loopPx}px; transform:translateY(0px);">
            ${itemsHtml}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="casino-cabinet" id="casino-cabinet">
      <div class="casino-marquee">
        <div class="casino-lamps">
          <span class="casino-dot" data-dot="0"></span>
          <span class="casino-dot" data-dot="1"></span>
          <span class="casino-dot" data-dot="2"></span>
        </div>
        <div class="casino-lamp" id="casino-lamp">コインを いれて レバーを ひこう</div>
        <div class="casino-coins" id="casino-coins">COINS: ${String(coins).padStart(4, '0')}</div>
      </div>

      <div class="casino-window-wrap">
        <span class="casino-arrow">▶</span>
        <div class="casino-reels">
          <div class="casino-payline"></div>
          ${viewportsHtml}
        </div>
        <span class="casino-arrow">◀</span>
      </div>

      <div class="casino-controls-row">
        <div class="casino-stops">
          <div class="casino-stop-btn" data-stop-btn="0">STOP 1</div>
          <div class="casino-stop-btn" data-stop-btn="1">STOP 2</div>
          <div class="casino-stop-btn" data-stop-btn="2">STOP 3</div>
        </div>
        <div class="casino-lever" id="casino-lever">
          <div class="casino-lever-ball"></div>
          <div class="casino-lever-rod"></div>
        </div>
      </div>
    </div>
  `;
}

export async function runCasinoScenario(ctx) {
  const { stage, members, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('casino');
  stage.setQuestLabel('まちのカジノ・100コインスロット');
  audio.startBgm('casino');

  const poolNames = members.map((m) => m.name);
  const baseLists = [
    buildReelBaseList(poolNames),
    buildReelBaseList([...poolNames.slice(1), ...poolNames.slice(0, 1)]),
    buildReelBaseList([...poolNames.slice(2), ...poolNames.slice(0, 2)]),
  ];

  stage.setVisualHtml(renderCabinetHtml(baseLists, 100));

  const getRefs = () => ({
    lamp: document.getElementById('casino-lamp'),
    coins: document.getElementById('casino-coins'),
    lever: document.getElementById('casino-lever'),
    dots: [0, 1, 2].map((i) => document.querySelector(`[data-dot="${i}"]`)),
    viewports: [0, 1, 2].map((i) => document.querySelector(`[data-reel-viewport="${i}"]`)),
    strips: [0, 1, 2].map((i) => document.querySelector(`[data-reel-strip="${i}"]`)),
    stops: [0, 1, 2].map((i) => document.querySelector(`[data-stop-btn="${i}"]`)),
  });

  const setLamp = (text, reach = false) => {
    const { lamp } = getRefs();
    if (!lamp) return;
    lamp.textContent = text;
    lamp.classList.toggle('reach', reach);
  };

  const setCoins = (val) => {
    const { coins } = getRefs();
    if (coins) coins.textContent = `COINS: ${String(val).padStart(4, '0')}`;
  };

  const startSpinAll = async () => {
    const { lever, strips, viewports, stops, dots } = getRefs();
    if (lever) lever.classList.add('pulled');
    dots.forEach((d) => d && d.classList.remove('on', 'reach-on'));
    stops.forEach((s) => s && s.classList.remove('pressed'));
    viewports.forEach((v) => v && v.classList.remove('locked'));
    strips.forEach((st) => {
      if (!st) return;
      st.style.transition = 'none';
      st.style.transform = 'translateY(0px)';
      void st.offsetWidth;
      st.classList.add('is-spinning');
    });
    await stage.wait(280);
    if (lever) lever.classList.remove('pulled');
  };

  const stopReelAtName = async (reelIdx, targetName, { durationMs = 680, dotClass = 'on' } = {}) => {
    stage.checkAborted();
    const { strips, viewports, stops, dots } = getRefs();
    const strip = strips[reelIdx];
    const vp = viewports[reelIdx];
    const stopBtn = stops[reelIdx];
    const dot = dots[reelIdx];
    const base = baseLists[reelIdx];

    if (!strip) return;

    let nameIdx = base.indexOf(targetName);
    if (nameIdx < 0) nameIdx = 0;

    // 3周目の位置を中央行（上から2段目 = targetCellIdx - 1）に配置して滑らかに減速停止させる
    const targetCellIdx = base.length * 3 + nameIdx;
    const targetY = -((targetCellIdx - 1) * ITEM_HEIGHT);
    const preRollY = targetY + ITEM_HEIGHT * 5; // 5コマ上から減速進入

    strip.classList.remove('is-spinning');
    strip.style.transition = 'none';
    strip.style.transform = `translateY(${preRollY}px)`;
    void strip.offsetWidth;

    const scaledDur = stage.scaleMs(durationMs);
    strip.style.transition = `transform ${scaledDur}ms cubic-bezier(0.16, 1.08, 0.32, 1)`;
    strip.style.transform = `translateY(${targetY}px)`;

    if (stopBtn) stopBtn.classList.add('pressed');
    audio.playSe('reelStop');
    await stage.wait(durationMs + 40);

    if (vp) vp.classList.add('locked');
    if (dot) dot.classList.add(dotClass);
  };

  // コイン投入 & 回転開始
  setCoins(95);
  setLamp('スロット かいてんかいし！');
  await startSpinAll();

  // リール音を数回鳴らしながら回転を見せる
  for (let i = 0; i < 4; i++) {
    audio.playSe('reelTick');
    await stage.wait(170);
  }

  // プレミア：軽快にビタ揃い
  if (route === 'premier') {
    setLamp(`おっ…！？「${winner.name}」の よかん！`, true);
    await stopReelAtName(0, winner.name, { durationMs: 520 });
    await stopReelAtName(1, winner.name, { durationMs: 520, dotClass: 'reach-on' });
    await stopReelAtName(2, winner.name, { durationMs: 620, dotClass: 'reach-on' });
    audio.playSe('upgrade');
    stage.flash('gold');
    setCoins(9999);
    setLamp(`そろった！「${winner.name}」`, true);
    await stage.typeText(`3つの リールが つぎつぎに そろった！\n「${winner.name}」が 今回の「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  const targetLeftMid = isSafe || route === 'reverse' ? decoy.name : winner.name;

  // 第1リール停止
  setLamp(`左リール「${targetLeftMid}」ねらい！`);
  await stopReelAtName(0, targetLeftMid, { durationMs: 620 });
  await stage.typeText(`第1停止！ 左に「${targetLeftMid}」が とまった！`, { pauseAfterMs: 320 });

  // 第2リール停止（リーチ！）
  for (let i = 0; i < 3; i++) {
    audio.playSe('reelTick');
    await stage.wait(150);
  }
  await stopReelAtName(1, targetLeftMid, { durationMs: 660, dotClass: 'reach-on' });
  audio.playSe('upgrade');
  setLamp(`リーチ！「${targetLeftMid}」あと 1つ！`, true);
  await stage.typeText(`真ん中も「${targetLeftMid}」で リーチ！\nあと 1つ そろえば きまりだ！`, { pauseAfterMs: 420 });

  // 第3リール焦らし回転
  for (let i = 0; i < 5; i++) {
    audio.playSe('reelTick');
    await stage.wait(160);
  }

  // セーフ：1コマズレてコイン切れ
  if (isSafe) {
    const missIdx = (Math.max(0, poolNames.indexOf(targetLeftMid)) + 1) % poolNames.length;
    const missName = poolNames.length > 1 ? poolNames[missIdx] : 'はずれ';
    await stopReelAtName(2, missName, { durationMs: 850 });
    audio.playSe('miss');
    setCoins(0);
    setLamp('1コマ ずれて はずれ！');
    await stage.typeText('おしい！ 1コマ ずれて コインも つきた……\n今回は ぜんいん セーフ！', { pauseAfterMs: 650 });
    return;
  }

  // 逆転：1コマズレ → 足元の1枚でラスト1回転 → 揃う！
  if (route === 'reverse') {
    const missIdx = (Math.max(0, poolNames.indexOf(targetLeftMid)) + 1) % poolNames.length;
    const missName = poolNames.length > 1 ? poolNames[missIdx] : 'はずれ';
    await stopReelAtName(2, missName, { durationMs: 820 });
    audio.playSe('miss');
    setCoins(0);
    setLamp('コインが なくなってしまった…');
    await stage.typeText('1コマ ずれて コインが なくなった！\n……とおもったら 足元に 1枚 おちていた！', { pauseAfterMs: 550 });

    await stage.showCutin('ラスト1枚で もういちど まわした！', 800);
    setCoins(1);
    setLamp('ラスト 1回転！！', true);
    await startSpinAll();
    for (let i = 0; i < 3; i++) {
      audio.playSe('reelTick');
      await stage.wait(150);
    }
    await stopReelAtName(0, winner.name, { durationMs: 500 });
    await stopReelAtName(1, winner.name, { durationMs: 520, dotClass: 'reach-on' });
    await stopReelAtName(2, winner.name, { durationMs: 720, dotClass: 'reach-on' });

    audio.playSe('upgrade');
    stage.flash('gold');
    setCoins(777);
    setLamp(`そろった！「${winner.name}」`, true);
    await stage.typeText(`ラスト1枚で「${winner.name}」が 3つ そろった！\n「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 650 });
    return;
  }

  // 通常：第3リールがビタ止まり
  await stopReelAtName(2, winner.name, { durationMs: 840, dotClass: 'reach-on' });
  stage.flash('gold');
  setCoins(777);
  setLamp(`そろった！「${winner.name}」`, true);
  await stage.typeText(`「${winner.name}」が 3つ そろった！\n今回の「${drawTitle}」は「${winner.name}」に きまった！`, { pauseAfterMs: 600 });
}
