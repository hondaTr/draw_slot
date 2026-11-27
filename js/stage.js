import { audio } from './audio.js';
import { getSpriteSvg } from './sprites.js';

export class SkipError extends Error {
  constructor() {
    super('DRAW_SKIPPED');
    this.name = 'SkipError';
  }
}

export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export class StageController {
  constructor() {
    this.frameEl = document.getElementById('stage-frame');
    this.bgEl = document.getElementById('stage-bg');
    this.flashEl = document.getElementById('stage-flash');
    this.blackoutEl = document.getElementById('stage-blackout');
    this.confettiEl = document.getElementById('stage-confetti');
    this.questLabelEl = document.getElementById('stage-quest-label');
    this.scenarioTagEl = document.getElementById('stage-scenario-tag');
    this.visualEl = document.getElementById('stage-visual');
    this.cutinEl = document.getElementById('stage-cutin');
    this.cutinTextEl = document.getElementById('cutin-text');
    this.resultEl = document.getElementById('stage-result');
    this.resultCardEl = this.resultEl.querySelector('.result-card');
    this.resultSubEl = document.getElementById('result-sub');
    this.resultNameEl = document.getElementById('result-name');
    this.resultCaptionEl = document.getElementById('result-caption');
    this.excludeBtnEl = document.getElementById('btn-exclude-winner');
    this.messageTextEl = document.getElementById('message-text');
    this.messageCursorEl = document.getElementById('message-cursor');

    this.speedMultiplier = 1;
    this.reducedEffects = false;
    this.aborted = false;
    this.pendingTimers = new Set();
    this.pendingRejects = new Set();
  }

  setSpeedMultiplier(val) {
    const num = Number(val);
    this.speedMultiplier = Number.isFinite(num) && num > 0 ? num : 1;
  }

  setReducedEffects(enabled) {
    this.reducedEffects = Boolean(enabled);
  }

  resetRun() {
    this.aborted = false;
    this.clearTimers();
    this.clearEffects();
    this.clearResult();
    this.hideCutin();
    this.messageCursorEl.classList.add('hidden');
  }

  clearTimers() {
    for (const t of this.pendingTimers) {
      clearTimeout(t);
    }
    this.pendingTimers.clear();
    this.pendingRejects.clear();
  }

  skip() {
    this.aborted = true;
    for (const reject of Array.from(this.pendingRejects)) {
      reject(new SkipError());
    }
    this.clearTimers();
  }

  checkAborted() {
    if (this.aborted) {
      throw new SkipError();
    }
  }

  scaleMs(ms) {
    return Math.max(20, Math.round(ms / this.speedMultiplier));
  }

  wait(ms) {
    this.checkAborted();
    const duration = this.scaleMs(ms);
    return new Promise((resolve, reject) => {
      const wrappedReject = (err) => {
        this.pendingTimers.delete(timer);
        this.pendingRejects.delete(wrappedReject);
        reject(err);
      };
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer);
        this.pendingRejects.delete(wrappedReject);
        if (this.aborted) {
          reject(new SkipError());
        } else {
          resolve();
        }
      }, duration);
      this.pendingTimers.add(timer);
      this.pendingRejects.add(wrappedReject);
    });
  }

  async typeText(text, { speedMs = 22, pauseAfterMs = 460, sound = true } = {}) {
    this.checkAborted();
    this.messageCursorEl.classList.add('hidden');
    this.messageTextEl.textContent = '';

    const chars = Array.from(text);
    const stepMs = Math.max(8, Math.round(speedMs / this.speedMultiplier));

    for (let i = 0; i < chars.length; i++) {
      this.checkAborted();
      this.messageTextEl.textContent += chars[i];
      if (sound && chars[i].trim() !== '' && i % 2 === 0) {
        audio.playSe('blip');
      }
      await this.waitRaw(stepMs);
    }

    this.messageCursorEl.classList.remove('hidden');
    if (pauseAfterMs > 0) {
      await this.wait(pauseAfterMs);
    }
  }

  waitRaw(ms) {
    this.checkAborted();
    return new Promise((resolve, reject) => {
      const wrappedReject = (err) => {
        this.pendingTimers.delete(timer);
        this.pendingRejects.delete(wrappedReject);
        reject(err);
      };
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer);
        this.pendingRejects.delete(wrappedReject);
        if (this.aborted) reject(new SkipError());
        else resolve();
      }, ms);
      this.pendingTimers.add(timer);
      this.pendingRejects.add(wrappedReject);
    });
  }

  setTextInstant(text) {
    this.messageTextEl.textContent = text;
    this.messageCursorEl.classList.remove('hidden');
  }

  setQuestLabel(text) {
    this.questLabelEl.textContent = text;
  }

  setScenarioTag(text) {
    if (!text) {
      this.scenarioTagEl.classList.add('hidden');
      this.scenarioTagEl.textContent = '';
    } else {
      this.scenarioTagEl.textContent = text;
      this.scenarioTagEl.classList.remove('hidden');
    }
  }

  setTheme(themeName) {
    this.bgEl.className = `stage-bg theme-${themeName}`;
  }

  setVisualHtml(html) {
    this.visualEl.innerHTML = html;
  }

  clearEffects() {
    this.frameEl.classList.remove('shake-light', 'shake-heavy');
    this.flashEl.className = 'stage-flash';
    this.blackoutEl.classList.remove('active');
    this.confettiEl.innerHTML = '';
  }

  shake(level = 'light') {
    if (this.reducedEffects) return;
    const cls = level === 'heavy' ? 'shake-heavy' : 'shake-light';
    this.frameEl.classList.remove('shake-light', 'shake-heavy');
    void this.frameEl.offsetWidth;
    this.frameEl.classList.add(cls);
  }

  flash(color = 'white') {
    if (this.reducedEffects) return;
    this.flashEl.className = 'stage-flash';
    void this.flashEl.offsetWidth;
    this.flashEl.classList.add(`flash-${color}`);
  }

  setBlackout(active) {
    this.blackoutEl.classList.toggle('active', Boolean(active));
  }

  async showCutin(text, durationMs = 1100) {
    this.checkAborted();
    audio.playSe('cutin');
    this.cutinTextEl.textContent = text;
    this.cutinEl.classList.remove('hidden');
    this.shake('heavy');
    await this.wait(durationMs);
    this.hideCutin();
  }

  hideCutin() {
    this.cutinEl.classList.add('hidden');
  }

  spawnConfetti(count = 20) {
    const colors = ['#ffd93d', '#ff4757', '#2ed573', '#4deeea', '#c084fc', '#ffffff'];
    let html = '';
    for (let i = 0; i < count; i++) {
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const dur = 1.6 + Math.random() * 1.4;
      const color = colors[i % colors.length];
      html += `<span class="confetti-piece" style="left:${left}%;background:${color};animation-delay:${delay}s;animation-duration:${dur}s;"></span>`;
    }
    this.confettiEl.innerHTML = html;
  }

  renderIdle(members, drawTitle) {
    this.clearEffects();
    this.clearResult();
    this.hideCutin();
    this.setTheme('field');
    this.setScenarioTag('');
    this.setQuestLabel(`お題：${drawTitle}（参加メンバー ${members.length}人）`);

    const pills = members
      .map((m) => `<span class="member-pill">${escapeHtml(m.name)}</span>`)
      .join('');

    this.setVisualHtml(`
      <div class="idle-scene">
        <div class="sprite-wrap sprite-bounce">
          ${getSpriteSvg('hero', 104)}
        </div>
        <div class="idle-party-strip">
          ${pills || '<span class="member-pill">メンバーがいません</span>'}
        </div>
      </div>
    `);

    if (members.length > 0) {
      this.setTextInstant(
        `じゅんびが できた！\nボタンを おして「${drawTitle}」を きめよう。`
      );
    } else {
      this.setTextInstant('パーティに メンバーが いないようだ…\n「パーティへんせい」から なかまを くわえよう！');
    }
  }

  showResultBanner({ isSafe, winner, drawTitle, canExclude }) {
    this.clearEffects();
    this.hideCutin();
    this.resultCardEl.classList.toggle('is-safe', isSafe);

    if (isSafe) {
      audio.playSe('safe');
      this.resultSubEl.textContent = '今回の けっか';
      this.resultNameEl.textContent = 'ぜんいん セーフ';
      this.resultCaptionEl.textContent = `「${drawTitle}」は きまらなかった！ もういちど ためそう。`;
      this.excludeBtnEl.classList.add('hidden');
      this.setTextInstant('しかし なにも おこらなかった！\n今回は ぜんいん セーフ。もういちど ためしてみよう。');
    } else {
      audio.playSe('fanfare');
      this.spawnConfetti(20);
      this.flash('gold');
      this.resultSubEl.textContent = `今回の「${drawTitle}」`;
      this.resultNameEl.textContent = winner.name;
      this.resultCaptionEl.textContent = 'に きまった！';
      this.excludeBtnEl.classList.toggle('hidden', !canExclude);
      this.excludeBtnEl.disabled = false;
      this.excludeBtnEl.textContent = `「${winner.name}」を次回から除外する`;
      this.setTextInstant(`「${winner.name}」が 今回の「${drawTitle}」に きまった！\nよろしく おねがいします！`);
    }

    this.resultEl.classList.remove('hidden');
  }

  clearResult() {
    this.resultEl.classList.add('hidden');
    this.excludeBtnEl.classList.add('hidden');
  }
}
