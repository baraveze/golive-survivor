import { BALANCE } from '../game/config/balance';
import { BOSS, ENEMIES } from '../game/config/enemies';

const timestamp = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;

export function renderEnemyGuide(section: HTMLElement): void {
  section.innerHTML = `
    <div class="enemy-guide-heading">
      <div><span class="release-tag">CONOCÉ A TUS INCIDENTES</span><h2 id="enemies-title">LOS ENEMIGOS DEL GO LIVE</h2></div>
      <a href="#app">VOLVER AL INICIO ↑</a>
    </div>
    <p class="enemy-guide-intro">Todos te persiguen. Algunos solo quieren un Fix. Otros, una reunión de crisis.</p>
    <div class="enemy-guide-grid"></div>
    <p class="enemy-guide-note">Resistencia expresada en Fixes normales. El daño indica cuánta Stability perdés por contacto; los puntos base se multiplican con tu combo.</p>
  `;
  const grid = section.querySelector('.enemy-guide-grid')!;
  for (const enemy of [...ENEMIES, BOSS]) {
    const boss = enemy.id === BOSS.id;
    const card = document.createElement('article');
    card.className = `enemy-profile${boss ? ' enemy-profile-boss' : ''}`;
    card.style.setProperty('--enemy-color', `#${enemy.color.toString(16).padStart(6, '0')}`);
    card.innerHTML = `
      <div class="enemy-profile-header"><span class="enemy-profile-icon" aria-hidden="true"></span><div><span class="enemy-profile-spawn"></span><h3></h3></div></div>
      <p class="enemy-profile-description"></p>
      <dl class="enemy-profile-stats"><div><dt>RESISTENCIA</dt><dd></dd></div><div><dt>DAÑO</dt><dd></dd></div><div><dt>SCORE BASE</dt><dd></dd></div></dl>
      <p class="enemy-profile-tip"><span>TIP DE SUPERVIVENCIA</span><span></span></p>
    `;
    card.querySelector('.enemy-profile-icon')!.textContent = enemy.glyph;
    card.querySelector('h3')!.textContent = enemy.label;
    card.querySelector('.enemy-profile-spawn')!.textContent = boss
      ? `BOSS · ALERTA ${timestamp(BALANCE.bossSpawnSecond)} · LLEGA ${timestamp(BALANCE.bossSpawnSecond + BALANCE.bossWarningSeconds)}`
      : enemy.spawnAfterSeconds === 0
        ? 'DESDE EL INICIO'
        : `DESDE ${timestamp(enemy.spawnAfterSeconds)}`;
    card.querySelector('.enemy-profile-description')!.textContent = enemy.description;
    const values = [
      `${enemy.hp} ${enemy.hp === 1 ? 'FIX' : 'FIXES'}`,
      `${enemy.damage}%`,
      `+${enemy.score}`,
    ];
    card.querySelectorAll('dd').forEach((value, i) => {
      value.textContent = values[i];
    });
    card.querySelector('.enemy-profile-tip span:last-child')!.textContent = enemy.tip;
    grid.append(card);
  }
}
