import { audio } from '../audio.js';
import { getSpriteSvg } from '../sprites.js';
import { escapeHtml } from '../stage.js';

const KANA_POOL = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';

function randomKana() {
  return KANA_POOL[Math.floor(Math.random() * KANA_POOL.length)];
}

function renderSpellScene({ chars, statusBadge = 'ふっかつの じゅもんを いれてください', aura = 'aura-wood', errorMode = false, highlightAll = false }) {
  const cells = chars
    .map((c, idx) => {
      let cls = 'spell-char';
      if (errorMode) cls += ' error';
      else if (highlightAll || idx >= chars.length - 1) cls += ' highlight';
      return `<span class="${cls}">${escapeHtml(c)}</span>`;
    })
    .join('');

  return `
    <div class="chest-aura-badge ${aura}">${escapeHtml(statusBadge)}</div>
    <div class="sprite-wrap sprite-float">${getSpriteSvg('scroll', 80)}</div>
    <div class="spell-grid">${cells}</div>
  `;
}

export async function runSpellScenario(ctx) {
  const { stage, drawTitle, isSafe, winner, decoy, route } = ctx;

  stage.setTheme('dungeon');
  stage.setQuestLabel('ふっかつの じゅもん 入力画面');
  audio.startBgm('field');

  const prefix = ['ゆ', 'う', 'し', 'ゃ', 'の', 'め', 'も', 'だ'];
  const shown = [];

  stage.setVisualHtml(renderSpellScene({ chars: ['？'], statusBadge: '手書きメモを 見ながら 入力中…' }));
  await stage.typeText(`ノートの すみに かいた「ふっかつの じゅもん」で\n今回の「${drawTitle}」を よびだそう！`, { pauseAfterMs: 550 });

  // プレミア：1発で通った！（珍しい）
  if (route === 'premier') {
    const winChars = Array.from(`もょもと・${winner.name}`).slice(0, 12);
    for (const ch of winChars) {
      stage.checkAborted();
      shown.push(ch);
      audio.playSe('cursor');
      stage.setVisualHtml(renderSpellScene({
        chars: shown,
        statusBadge: 'めずらしく 1発で 入力できた！',
        aura: 'aura-gold',
        highlightAll: true,
      }));
      await stage.wait(95);
    }
    audio.playSe('confirm');
    stage.flash('gold');
    await stage.typeText(`すごい！ 長い じゅもんが 1回も まちがえずに 通った！\n「${winner.name}」が「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  for (let i = 0; i < 8; i++) {
    stage.checkAborted();
    shown.push(i < prefix.length ? prefix[i] : randomKana());
    audio.playSe('cursor');
    stage.setVisualHtml(renderSpellScene({ chars: shown, statusBadge: 'ぽちぽち 入力中…', aura: 'aura-red' }));
    await stage.wait(125);
  }

  // セーフ：おきのどくですが ぼうけんのしょは…
  if (isSafe) {
    await stage.typeText('最後の 1文字を いれた！', { pauseAfterMs: 600 });
    audio.playSe('wipeout');
    stage.setVisualHtml(renderSpellScene({
      chars: ['お', 'き', 'の', 'ど', 'く', 'で', 'す', 'が'],
      statusBadge: 'おきのどくですが ぼうけんのしょは…',
      aura: 'aura-red',
      errorMode: true,
    }));
    await stage.typeText('おきのどくですが ぼうけんのしょは きえてしまいました…！\n（デロデロデロデロ…） 今回は ぜんいん セーフ！', { pauseAfterMs: 900 });
    return;
  }

  // 逆転：「ぬ」と「め」、「わ」と「れ」の手書きメモ見間違い！
  if (route === 'reverse') {
    const fakeChars = [...shown.slice(0, 5), ...Array.from(decoy.name).slice(0, 4)];
    stage.setVisualHtml(renderSpellScene({
      chars: fakeChars,
      statusBadge: `メモによると「${decoy.name}」？`,
      aura: 'aura-gold',
    }));
    await stage.typeText(`「${decoy.name}」の じゅもんを ぜんぶ いれた……！`, { pauseAfterMs: 700 });

    audio.playSe('miss');
    stage.shake('light');
    stage.setVisualHtml(renderSpellScene({
      chars: fakeChars,
      statusBadge: 'じゅもんが ちがいます！',
      aura: 'aura-red',
      errorMode: true,
    }));
    await stage.typeText('「じゅもんが ちがいます」！！\n……あ！ 手書きメモの「ぬ」と「め」を みまちがえていた！', { pauseAfterMs: 750 });

    await stage.showCutin('「め」を「ぬ」に うちなおした！', 950);
    audio.playSe('upgrade');
    stage.flash('gold');
    const trueChars = [...shown.slice(0, 4), ...Array.from(winner.name).slice(0, 6)];
    stage.setVisualHtml(renderSpellScene({
      chars: trueChars,
      statusBadge: `つうじた！「${winner.name}」`,
      aura: 'aura-gold',
      highlightAll: true,
    }));
    await stage.typeText(`うちなおしたら やっと 通じた！\n「${winner.name}」が 今回の「${drawTitle}」に きまった！`, { pauseAfterMs: 850 });
    return;
  }

  // 通常
  audio.playSe('confirm');
  stage.flash('gold');
  const okChars = [...shown.slice(0, 4), ...Array.from(winner.name).slice(0, 6)];
  stage.setVisualHtml(renderSpellScene({
    chars: okChars,
    statusBadge: `じゅもん せいこう！「${winner.name}」`,
    aura: 'aura-gold',
    highlightAll: true,
  }));
  await stage.typeText(`じゅもんが みごと 通じた！\n「${winner.name}」が 今回の「${drawTitle}」に きまった！`, { pauseAfterMs: 800 });
}
