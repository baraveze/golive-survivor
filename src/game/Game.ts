import Phaser from 'phaser';
import { BALANCE } from './config/balance';
import { GameScene, type GameCallbacks } from './scenes/GameScene';

export function createGame(parent: HTMLElement, callbacks: GameCallbacks) {
  const scene = new GameScene(callbacks);
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: BALANCE.width,
    height: BALANCE.height,
    backgroundColor: '#0b1320',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    render: { antialias: true, roundPixels: true },
    audio: { noAudio: true },
    scene: [scene],
    banner: false,
  });
  return { game, scene };
}
