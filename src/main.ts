import { t, language, locale } from './i18n';
import './styles/main.css';
import { GAME_CONFIG } from './game/config/gameConfig';
import { DEFEAT_MESSAGES, PHASES } from './game/config/messages';
import { createGame } from './game/Game';
import type { HudState } from './game/scenes/GameScene';
import { AudioService } from './services/AudioService';
import { createScoreRepository } from './services/supabase';
import { LocalScoreRepository } from './services/score/LocalScoreRepository';
import type { ScoreRepository, ScoreSubmission } from './services/score/ScoreRepository';
import { sanitizeNickname, validateNickname } from './utils/nickname';
import { storage } from './utils/storage';
import { renderEnemyGuide } from './ui/enemyGuide';

document.documentElement.lang = language;
const app = document.querySelector<HTMLDivElement>('#app')!;
app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="./" aria-label="${t('Go Live Survivor, inicio')}"><span class="brand-icon">ϟ</span><span>GO LIVE<span class="brand-light"> SURVIVOR</span></span></a>
    <nav aria-label="${t('Principal')}"><span class="team-label"></span><label class="language-control" for="language">${t('Language')}<select id="language"><option value="es" lang="es">Español</option><option value="en" lang="en">English</option></select></label><button class="nav-button" data-leaderboard>♜ <span>${t('Leaderboard')}</span></button><button id="sound" class="sound-button" aria-label="${t('Desactivar sonido')}"></button></nav>
  </header>
  <main>
    <div class="section-heading"><span><i class="status-dot"></i> ${t('THE FINAL DEPLOYMENT')}</span><span class="eyebrow">${t('ARCADE / SURVIVAL / 90 SECONDS')}</span></div>
    <section class="arcade" aria-label="Go Live Survivor">
      <div class="arena-toolbar"><span><span class="terminal-icon">&gt;_</span> production.survivor <span class="muted">${t('/ session')}</span></span><div><span id="mode">${t('LOCAL MODE')}</span><span class="toolbar-divider">/</span><span class="live-dot"></span> ${t('LIVE')}</div></div>
      <div class="arena-body">
        <div id="game" aria-label="${t('Arena de juego. WASD o flechas para moverte; espacio para Hotfix.')}" tabindex="-1"></div>
        <section id="menu" class="menu overlay">
          <div class="menu-copy"><span class="release-tag"><i class="status-dot"></i> ${t('PRODUCTION IS CALLING')}</span><h1>GO LIVE<br><span>SURVIVOR</span><span class="title-dot">_</span></h1><p class="subtitle"></p><p class="intro">${t('Bugs, flows rotos y un Excel de 70.000 filas.')}<br>${t('Un consultor. Cero margen de error.')}</p>
            <form id="start-form" novalidate><label for="nickname">${t('TU NICKNAME')} <span>${t('QUE QUEDE EN LOS LOGS.')}</span></label><div class="input-wrap"><span>&gt;</span><input id="nickname" name="nickname" placeholder="${t('Tu alias en producción')}" maxlength="18" autocomplete="nickname" required aria-describedby="nickname-error"></div><p id="nickname-error" class="field-error" aria-live="polite"></p><button id="start" class="primary" type="submit" disabled>${t('INICIAR GO LIVE')} <span>→</span></button></form>
            <div class="menu-links"><button data-leaderboard>${t('♜ Leaderboard')}</button><span>·</span><button id="how-to">${t('Cómo jugar ↗')}</button><span>·</span><a href="#enemies">${t('Enemigos ↓')}</a></div>
          </div>
          <div class="hero-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit-cross"></div><div class="hero-tag">${t('CONSULTANT_01')} <span>${t('ONLINE')}</span></div>
            <svg class="hero-robot" viewBox="0 0 180 200"><ellipse cx="90" cy="178" rx="56" ry="12" fill="#000" opacity=".4"/><path d="M89 31V16" stroke="#79e9f6" stroke-width="5"/><rect x="83" y="6" width="13" height="13" rx="3" fill="#beff63"/><path d="M47 118h86v37H47z" fill="#285469"/><path d="M53 149h28v25H53zm46 0h28v25H99z" fill="#5ac7d9"/><path d="M32 89h18v47H32zm98 0h18v47h-18z" fill="#3d8399"/><rect x="42" y="34" width="96" height="91" rx="14" fill="#81ecf5"/><path d="M42 106h96v12q0 9-10 9H52q-10 0-10-9z" fill="#46a6bc"/><rect x="54" y="56" width="72" height="37" rx="8" fill="#10253a"/><path d="M65 66h12v13H65zm38 0h12v13h-12z" fill="#d9ffff"/><rect x="80" y="102" width="20" height="7" rx="1" fill="#beff63"/><path d="M149 62h17m-8-9v18" stroke="#beff63" stroke-width="3"/></svg>
            <div class="enemy-card card-bug"><span class="enemy-symbol green">!</span><div>${t('BUG')}<span>${t('“En DEV funcionaba.”')}</span></div><i></i></div>
            <div class="enemy-card card-flow"><span class="enemy-symbol yellow">ϟ</span><div>${t('FLOW FAILED')}<span>${t('Last run: a disaster')}</span></div><i></i></div>
            <div class="enemy-card card-excel"><span class="enemy-symbol mint">X</span><div>${t('EXCEL 70K ROWS')}<span>final_final_v8.xlsx</span></div><i></i></div>
            <span class="fix-label">${t('+ FIX DEPLOYED')}</span><span class="hero-caption">${t('ALL SYSTEMS')} <span>${t('PROBABLY')}</span> ${t('OPERATIONAL')}</span>
          </div>
          <div class="menu-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> <span>${t('MOVERTE')}</span></span><span><kbd>${t('SPACE')}</kbd> ${t('EMERGENCY HOTFIX')}</span><span class="auto-label"><i class="status-dot"></i> ${t('AUTO-FIX ENABLED')}</span></div>
        </section>
        <section id="hud" class="hud" hidden aria-label="${t('Estado de la partida')}"><div class="hud-top"><div class="stability-box"><div class="hud-label">${t('SYSTEM STABILITY')} <strong id="stability-value">100%</strong></div><div class="stability-track"><div id="stability-fill"></div></div><span id="phase-label">${t('● PHASE GREEN')}</span></div><div class="timer-box"><span class="hud-label">GO LIVE</span><strong id="timer">00:00 <small>/ 01:30</small></strong></div><div class="score-box"><span class="hud-label">${t('SCORE')}</span><strong id="score">0</strong><span id="combo">COMBO x1</span></div></div><div id="boss-bar" hidden><span>${t('⚠ PRODUCTION ISSUE')}</span><div><i id="boss-fill"></i></div></div><div class="hud-bottom"><button id="pause">${t('Ⅱ PAUSA')} <kbd>ESC</kbd></button><button id="hotfix"><kbd>${t('SPACE')}</kbd><span id="hotfix-label">${t('HOTFIX READY')}</span><i id="hotfix-fill"></i></button><span>${t('FIXES AUTOMÁTICOS')} <i class="status-dot"></i></span></div></section>
        <section id="pause-panel" class="pause-panel overlay" hidden><span class="release-tag">${t('NO TOQUES PRODUCCIÓN')}</span><h2>${t('GO LIVE EN PAUSA')}</h2><p>${t('Respirá. Los incidentes pueden esperar.')}</p><button id="resume" class="primary">${t('CONTINUAR →')}</button><button id="cancel-run" class="cancel-run">${t('CANCELAR PARTIDA Y VOLVER AL INICIO')}</button><p class="cancel-note">${t('Si cancelás, esta partida no guarda puntaje.')}</p></section>
        <section id="result" class="result overlay" hidden aria-labelledby="result-title"><div class="result-card"><span id="result-tag" class="release-tag"></span><h2 id="result-title"></h2><p id="result-message"></p><div class="result-score"><span>${t('SCORE FINAL')}</span><strong id="final-score"></strong></div><p id="survival-bonus" class="survival-bonus" hidden>${t('SURVIVAL BONUS +1000')}</p><div class="result-stats"><div><span>${t('TIEMPO')}</span><strong id="final-time"></strong></div><div><span>${t('RESUELTOS')}</span><strong id="final-issues"></strong></div><div><span>${t('MAX COMBO')}</span><strong id="final-combo"></strong></div><div><span>${t('PRODUCTION ISSUE')}</span><strong id="final-boss"></strong></div></div><p id="save-status" role="status"></p><button id="again" class="primary">${t('PLAY AGAIN')} <span>↻</span></button><div class="menu-links"><button data-leaderboard>${t('♜ LEADERBOARD')}</button><span>·</span><button id="back-menu">${t('VOLVER AL INICIO')}</button></div></div></section>
      </div>
      <div class="arena-status"><span><i class="status-dot"></i> <span id="system-status">${t('LISTO PARA EL DEPLOY')}</span></span><span>${t('NO MEETINGS. JUST SURVIVAL.')}</span><span id="version"></span></div>
    </section>
    <div id="connection-notice" role="status"></div>
    <section class="feature-row" aria-label="${t('Cómo sobrevivir')}"><article><span class="feature-number">01</span><div><h3>${t('MOVETE. ESQUIVÁ. SOBREVIVÍ.')}</h3><p>${t('Los problemas te siguen. No les des el gusto.')}</p></div><span class="feature-icon">⌘</span></article><article><span class="feature-number">02</span><div><h3>${t('EL FIX SALE SOLO.')}</h3><p>${t('Vos esquivá. Nosotros apuntamos a los bugs.')}</p></div><span class="feature-icon">⌁</span></article><article><span class="feature-number">03</span><div><h3>${t('¿TODO ARDE? HOTFIX.')}</h3><p>${t('Una barra espaciadora. Una segunda oportunidad.')}</p></div><span class="feature-icon">ϟ</span></article></section>
    <section id="enemies" class="enemy-guide" aria-labelledby="enemies-title" tabindex="-1"></section>
  </main>
  <footer><span id="footer-version"></span><span class="footer-credits">${t('Creado por')} <strong>Ezequiel Baravalle</strong> ${t('con ayuda de')} <strong>Codex</strong>.</span><span>${t('BUILT FOR THE PEOPLE WHO SHIP.')}</span><span>${t('Hecho con café y permisos de producción.')} <span class="footer-cursor">▮</span></span><span id="access-notice" class="access-notice" hidden>${t('En modo online registramos tu IP, navegador y fecha de acceso. Estos datos no aparecen en el leaderboard.')}</span></footer>
  <dialog id="info-dialog"><div class="dialog-heading"><span class="eyebrow">GO LIVE SURVIVOR</span><button id="close-dialog" aria-label="${t('Cerrar')}">✕</button></div><div id="dialog-content"></div></dialog>
`;
const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
renderEnemyGuide(el('enemies'));
const number = (n: number) => new Intl.NumberFormat(locale).format(n);
const audio = new AudioService();
let repository: ScoreRepository = new LocalScoreRepository();
let runNumber = 0;
let currentName = '';
let screen: 'menu' | 'playing' | 'result' = 'menu';
let boardRequest = 0;
const dialog = el<HTMLDialogElement>('info-dialog');
const nickname = el<HTMLInputElement>('nickname');
nickname.value = storage.get('gls:nickname') ?? '';
document.querySelector('.team-label')!.textContent = GAME_CONFIG.teamName;
document.querySelector('.subtitle')!.textContent = GAME_CONFIG.subtitle;
document.title = GAME_CONFIG.title;
el('version').textContent = 'v' + GAME_CONFIG.version;
el('footer-version').textContent = t('Version') + ' ' + GAME_CONFIG.version;
const languageSelect = el<HTMLSelectElement>('language');
languageSelect.value = language;
languageSelect.onchange = () => {
  storage.set('gls:language', languageSelect.value);
  storage.set('gls:nickname', nickname.value);
  window.location.reload();
};

const { game, scene } = createGame(el('game'), { audio, hud: updateHud, finish: showResult });
// Phaser's ready event precedes scene creation; POST_STEP is the first safe start point.
game.events.once('poststep', () => {
  el<HTMLButtonElement>('start').disabled = false;
});

function updateSound(): void {
  el('sound').textContent = audio.enabled ? t('♫ ON') : t('♫ OFF');
  el('sound').setAttribute(
    'aria-label',
    audio.enabled ? t('Desactivar sonido') : t('Activar sonido'),
  );
  el('sound').setAttribute('aria-pressed', String(audio.enabled));
}
updateSound();
el('sound').onclick = () => {
  audio.toggle();
  updateSound();
};

void createScoreRepository().then((result) => {
  repository = result.repository;
  el('mode').textContent = repository.mode === 'online' ? t('ONLINE MODE') : t('LOCAL MODE');
  el('connection-notice').textContent = result.notice;
  el('access-notice').hidden = repository.mode !== 'online';
});

function start(): void {
  const error = validateNickname(nickname.value);
  el('nickname-error').textContent = error ?? '';
  nickname.setAttribute('aria-invalid', String(Boolean(error)));
  if (error) {
    nickname.focus();
    return;
  }
  currentName = sanitizeNickname(nickname.value);
  storage.set('gls:nickname', currentName);
  nickname.value = currentName;
  runNumber++;
  screen = 'playing';
  languageSelect.disabled = true;
  languageSelect.title = t('Language can be changed from the home screen.');
  el('menu').hidden = true;
  el('result').hidden = true;
  el('hud').hidden = false;
  el('pause-panel').hidden = true;
  el('system-status').textContent = t('DEPLOY EN CURSO');
  document.querySelectorAll<HTMLButtonElement>('header [data-leaderboard]').forEach((button) => {
    button.disabled = true;
  });
  audio.unlock();
  el('game').focus();
  scene.startRun();
}
el('start-form').onsubmit = (event) => {
  event.preventDefault();
  start();
};
el('again').onclick = start;
function showMenu(): void {
  runNumber++;
  screen = 'menu';
  languageSelect.disabled = false;
  languageSelect.title = '';
  el('result').hidden = true;
  el('hud').hidden = true;
  el('pause-panel').hidden = true;
  el('menu').hidden = false;
  el('system-status').textContent = t('LISTO PARA EL DEPLOY');
  document.querySelectorAll<HTMLButtonElement>('header [data-leaderboard]').forEach((button) => {
    button.disabled = false;
  });
  nickname.focus();
}
el('back-menu').onclick = showMenu;
el('cancel-run').onclick = () => {
  scene.cancelRun();
  showMenu();
};
el('pause').onclick = () => scene.togglePause();
el('resume').onclick = () => {
  scene.togglePause();
  el('game').focus();
};
el('hotfix').onclick = () => {
  scene.hotfix();
  el('game').focus();
};

function updateHud(state: HudState): void {
  el('stability-value').textContent = `${state.stability}%`;
  el('stability-fill').style.width = `${state.stability}%`;
  el('stability-fill').style.backgroundColor =
    state.stability > 50 ? '#beff63' : state.stability > 25 ? '#ffcf62' : '#ff657f';
  const seconds = Math.floor(state.seconds);
  el('timer').innerHTML =
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')} <small>/ 01:30</small>`;
  el('score').textContent = number(state.score);
  el('combo').textContent = `COMBO x${state.combo}`;
  el('combo').style.color = state.combo > 1 ? '#beff63' : '#7d8ba2';
  el('phase-label').textContent = `${t('PHASE')} ${PHASES[state.phase].name}`;
  el('phase-label').style.color = PHASES[state.phase].color;
  el('hotfix-label').textContent =
    state.cooldown > 0
      ? `${t('HOTFIX')} ${state.cooldown.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}s`
      : t('HOTFIX READY');
  el('hotfix').classList.toggle('charging', state.cooldown > 0);
  el('hotfix-fill').style.width = `${(1 - state.cooldown / 8) * 100}%`;
  el('boss-bar').hidden = state.bossHp === null;
  el('boss-fill').style.width = `${(state.bossHp ?? 0) * 100}%`;
  el('pause-panel').hidden = !state.paused;
}

function showResult(result: Omit<ScoreSubmission, 'player_name'>): void {
  screen = 'result';
  el('hud').hidden = true;
  el('result').hidden = false;
  document.querySelectorAll<HTMLButtonElement>('header [data-leaderboard]').forEach((button) => {
    button.disabled = false;
  });
  const survived = result.result === 'survived';
  el('result').classList.toggle('won', survived);
  el('result-tag').textContent = survived ? t('DEPLOYMENT COMPLETE') : t('INCIDENT REPORT');
  el('result-title').textContent = survived ? t('GO LIVE SURVIVED') : t('PRODUCTION DOWN');
  el('result-message').textContent = survived
    ? t('Increíblemente, producción sigue funcionando.')
    : DEFEAT_MESSAGES[Math.floor(Math.random() * DEFEAT_MESSAGES.length)];
  el('final-score').textContent = number(result.score);
  el('final-time').textContent = `${result.survived_seconds}s`;
  el('final-issues').textContent = String(result.issues_resolved);
  el('final-combo').textContent = `x${result.max_combo}`;
  el('final-boss').textContent = result.boss_resolved ? t('RESOLVED ✓') : t('NOT RESOLVED');
  el('survival-bonus').hidden = !survived;
  el('system-status').textContent = survived
    ? t('PRODUCCIÓN SIGUE FUNCIONANDO. POR AHORA.')
    : t('REVISANDO LOS LOGS...');
  el('save-status').textContent = t('Guardando partida…');
  el('again').focus();
  const submission = { ...result, player_name: currentName };
  const thisRun = runNumber;
  const activeRepository = repository;
  void (async () => {
    let saved = false;
    try {
      await activeRepository.submitScore(submission);
      saved = true;
      const rank = await activeRepository.getWeeklyRank();
      if (runNumber === thisRun)
        el('save-status').textContent =
          `${activeRepository.mode === 'online' ? t('WEEKLY RANK') : t('LOCAL RANK')} ${rank ? `#${rank}` : '—'} · ${t('PARTIDA GUARDADA')}`;
    } catch {
      if (!saved && activeRepository.mode === 'online') {
        await new LocalScoreRepository().submitScore(submission);
      }
      if (runNumber === thisRun)
        el('save-status').textContent = saved
          ? t('Partida guardada. Ranking temporalmente no disponible.')
          : t('Sin conexión. Partida guardada en el ranking local.');
    }
  })();
}

el('close-dialog').onclick = () => dialog.close();
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', () => {
  boardRequest++;
});
el('how-to').onclick = () => {
  el('dialog-content').innerHTML =
    `<span class="release-tag">${t('RUNBOOK / 90 SEGUNDOS')}</span><h2>${t('CÓMO SOBREVIVIR')}</h2><div class="instructions"><p><b>${t('01 / Movete')}</b>${t('Usá WASD o las flechas para esquivar. Si te alcanzan, baja tu System Stability.')}</p><p><b>${t('02 / Los Fixes son automáticos')}</b>${t('Disparás al problema más cercano. Resolvé varios en menos de 2 segundos para encadenar combos hasta x3.')}</p><p><b>${t('03 / Emergency Hotfix')}</b>${t('SPACE lanza un pulso que limpia problemas cercanos. Se recarga cada 8 segundos.')}</p><p><b>${t('04 / Aguantá hasta el final')}</b>${t('La presión sube a los 30 y 60 segundos. Al segundo 65 llega Production Issue. Sobrevivir 90 segundos da +1000 puntos; resolver el boss es opcional.')}</p><p><b>${t('Un respiro')}</b>${t('ESC pausa. Al cambiar de ventana, pausamos automáticamente.')}</p></div><p class="dialog-note">${t('Sin cuentas, sin reuniones, sin “un cambio chiquito”.')}</p>`;
  dialog.showModal();
  el('dialog-content').scrollTop = 0;
};
document.querySelectorAll<HTMLButtonElement>('[data-leaderboard]').forEach((button) => {
  button.onclick = () => {
    if (screen !== 'playing') {
      dialog.showModal();
      void showLeaderboard(true);
    }
  };
});

async function showLeaderboard(weekly: boolean): Promise<void> {
  const request = ++boardRequest;
  el('dialog-content').innerHTML =
    `<span class="release-tag">${t('HALL OF PRODUCTION')}</span><h2>${t('♜ GO LIVE HEROES')}</h2><p class="leaderboard-subtitle">${t('Una partida más. Un puesto más arriba.')}</p><div class="board-tabs"><button id="weekly" class="${weekly ? 'selected' : ''}" aria-pressed="${weekly}">${t('THIS WEEK')}</button><button id="alltime" class="${!weekly ? 'selected' : ''}" aria-pressed="${!weekly}">${t('ALL TIME')}</button></div><p id="board-notice" role="status">${t('Consultando los logs…')}</p><table class="leaderboard"><thead><tr><th>#</th><th>${t('CONSULTOR')}</th><th>${t('SCORE')}</th></tr></thead><tbody id="board-rows"></tbody></table><div class="board-footer"><span id="personal-best">${t('YOUR BEST: —')}</span><span>${weekly ? t('LUNES 00:00 UTC') : t('TODOS LOS DEPLOYS')}</span></div><p class="dialog-note">${t('Top 10 · Mejor partida por jugador · Nicknames no únicos.')}</p>`;
  el('weekly').onclick = () => {
    void showLeaderboard(true);
  };
  el('alltime').onclick = () => {
    void showLeaderboard(false);
  };
  el('dialog-content').scrollTop = 0;
  let source = repository;
  let fallback = false;
  const read = (repo: ScoreRepository) =>
    Promise.all([
      weekly ? repo.getWeeklyLeaderboard() : repo.getAllTimeLeaderboard(),
      repo.getPersonalBest(),
    ] as const);
  let data;
  try {
    data = await read(source);
  } catch {
    source = new LocalScoreRepository();
    fallback = true;
    data = await read(source);
  }
  if (request !== boardRequest || !dialog.open) return;
  const [rows, best] = data;
  el('board-notice').textContent = fallback
    ? t('Sin conexión. Mostrando tus partidas locales.')
    : source.mode === 'local'
      ? t('LOCAL MODE · Solo partidas de este navegador.')
      : t('ONLINE · El equipo está en producción.');
  if (!rows.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 3;
    td.className = 'empty-board';
    td.textContent = t('Todavía no hay héroes. Tu próximo deploy puede ser el primero.');
    tr.append(td);
    el('board-rows').append(tr);
  }
  rows.forEach((row, index) => {
    const tr = document.createElement('tr');
    tr.classList.toggle('is-you', row.user_id === source.userId);
    const podium = [
      { style: 'gold', medal: '🥇', label: t('1.º puesto · Oro') },
      { style: 'silver', medal: '🥈', label: t('2.º puesto · Plata') },
      { style: 'bronze', medal: '🥉', label: t('3.º puesto · Bronce') },
    ][index];
    const position = document.createElement('td');
    if (podium) {
      tr.classList.add(`podium-${podium.style}`);
      const medal = document.createElement('span');
      medal.className = 'rank-medal';
      medal.textContent = podium.medal;
      medal.setAttribute('role', 'img');
      medal.setAttribute('aria-label', podium.label);
      medal.title = podium.label;
      position.append(medal);
    } else {
      position.textContent = String(index + 1).padStart(2, '0');
    }
    tr.append(position);
    [
      `${row.player_name}${row.user_id === source.userId ? t('  ← YOU') : ''}`,
      number(row.score),
    ].forEach((value) => {
      const td = document.createElement('td');
      td.textContent = value;
      tr.append(td);
    });
    el('board-rows').append(tr);
  });
  el('personal-best').textContent = `${t('YOUR BEST')}: ${best === null ? '—' : number(best)}`;
}
