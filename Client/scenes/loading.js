import { Scene } from 'phaser';

export default class Loading extends Scene {

    constructor() {
        super({ key: 'loading' });
    }

    preload() {

        // Load audio assets..
        this.load.audio('music:default', 'audios/musics/default.mp3');
        this.load.audio('effect:jump', 'audios/effects/jump.mp3');
        this.load.audio('effect:meow',  'audios/effects/meow.mp3');
        this.load.audio('effect:knife', 'audios/effects/knife.mp3');
        this.load.audio('effect:death', 'audios/effects/death.mp3');
        this.load.audio('effect:rocket', 'audios/effects/rocket.mp3');
        this.load.audio('effect:scream', 'audios/effects/fear.mp3');
        this.load.audio('effect:vomit', 'audios/effects/vomit.mp3');
        this.load.audio('effect:flute', 'audios/effects/flute.mp3');
        this.load.audio('effect:twang', 'audios/effects/twang.mp3');

        // Load tilemap assets..
        this.load.tilemapTiledJSON('maps', '../assets/map.json');
        
        // Load spritesheet assets..
        this.load.spritesheet('tiles', '../assets/images/tiles.png', { frameWidth: 70, frameHeight: 70});
        this.load.spritesheet('plateformes', 'images/plateformes.png', {frameWidth: 70, frameHeight: 70});
        this.load.spritesheet('sea', 'images/sea.png', { frameWidth: 70, frameHeight: 70});
        this.load.spritesheet('spikeTrap', 'images/spikesTrap.png', { frameWidth: 70, frameHeight: 70});
        
        // Load images assets
        this.load.image('coin', 'images/coinGold.png');
        this.load.image('fish', 'images/fish.png');
        this.load.image('choco', 'images/choco.png');
        this.load.image('cucumber', 'images/cucumber.png');
        this.load.image('bird', 'images/bird.png')
        this.load.image('trampoline', 'images/trampoline.png')
        this.load.image('spikeTrap', 'images/spikeTrap.png');
        this.load.image('moving', 'images/moving.png');
        this.load.image('cloud', 'images/cloud.png');
        this.load.image('trampos', 'images/trampos.png');
        this.load.image('food', 'images/croquettes.png')
    

        // Load atlas assets
        this.load.atlas('player', 'images/cat.png', 'cat.json');

        // Show loading..
        this.add.text(this.cameras.main.width - 15, 5, 'Loading..', {
            color: '#FFFFFF',
            fontSize: 28
        }).setOrigin(1, 0);

        // Switch scene when loading is complete..
        this.load.on('complete', () => {
            this.scene.start('main');
        });
    }

}