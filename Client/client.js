import 'core-js/stable';
import 'regenerator-runtime/runtime';
import Phaser from 'phaser';

// Loading all scenes..
import { Loading, Main, Menu } from './scenes';

class Game extends Phaser.Game {

    constructor() {
        super({
            title: "Cataclysm",
            type: Phaser.AUTO,
            width: window.innerWidth * Math.round(window.devicePixelRatio), height: window.innerHeight * Math.round(window.devicePixelRatio),
            scene: [Menu, Loading, Main],
            disableContextMenu: false,
            enableDebug: false,
            input: { keyboard: true, mouse: true, touch: false, gamepad: false },
            physics: {
                default: 'arcade',
                arcade: {
                    debug: false,
                    gravity: { y: 1200 } ,
                    tileBias: 32 // This fixes the tiles collision issue on high speed.
                }},
            scale: {
                mode: Phaser.Scale.WIDTH_CONTROLS_HEIGHT ,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        });
    }

}

window.addEventListener('load', () => {
   new Game();
});