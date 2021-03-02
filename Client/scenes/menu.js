import { Scene } from 'phaser';

export default class Menu extends Scene {
    constructor() {
        super({ key: 'menu' });
    }

    init() {
        this.playButton = null;
    }

    preload() {
        this.load.image('title', 'images/title.png');
        this.load.image('titleCat', 'images/titleCat.png');
    }

    getCenterX() {
        return (this.sys.canvas.width) * 0.5;
    }
    
    getCenterY() {
        return (this.sys.canvas.height) * 0.5;
    }

    hover() {
        this.playButton.setStyle({ fill:'#ff0' });
    }

    hoverReset() {
        this.playButton.setStyle({ fill: '#fff' });
    }

    playGame() {
        this.scene.start('loading');
    }

    create() {
        this.add.image(this.getCenterX(), 300, 'title');
        this.cameras.main.setBackgroundColor('#ccccff'); 
        this.playButton = this.add.text(this.getCenterX()-50, this.getCenterY()*1.5, 'Play', {   
            fill: '#000',
            font: "70px Arial",
            align: "center"
        }).setInteractive()
          .on('pointerdown', () => this.playGame())
          .on('pointerover', () => this.hover())
          .on('pointerout', () => this.hoverReset());
    }
}