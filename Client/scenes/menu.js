import { Scene } from 'phaser';

export default class Menu extends Scene {
    constructor() {
        super({ key: 'menu' });
    }

    init() {
        this.playButton = null;
        this.nameInput = null;
        this.playerName = '';
    }

    preload() {
        this.load.image('title', 'images/title.png');
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
        const name = this.nameInput.value.trim() || 'Anonymous Cat';

        // Remove the input field before starting the next scene
        if (this.nameInput && this.nameInput.parentNode) {
            this.nameInput.parentNode.removeChild(this.nameInput);
            this.nameInput = null;
        }

        this.scene.start('loading', { playerName: name });
    }

    create() {
        this.add.image(this.getCenterX(), 300, 'title');
        this.cameras.main.setBackgroundColor('#ccccff');

        // Create HTML input field for name
        this.nameInput = document.createElement('input');
        this.nameInput.type = 'text';
        this.nameInput.placeholder = 'Your name';
        this.nameInput.maxLength = 20;
        this.nameInput.style.position = 'absolute';
        this.nameInput.style.left = '50%';
        this.nameInput.style.top = '50%';
        this.nameInput.style.transform = 'translate(-50%, -50%)';
        this.nameInput.style.padding = '10px';
        this.nameInput.style.fontSize = '20px';
        this.nameInput.style.textAlign = 'center';
        this.nameInput.style.border = '2px solid #000';
        this.nameInput.style.borderRadius = '5px';
        this.nameInput.style.width = '250px';
        this.nameInput.style.zIndex = '1000';
        document.body.appendChild(this.nameInput);
        this.nameInput.focus();

        // Add name input label (after input so it doesn't get covered)
        this.add.text(this.getCenterX(), this.getCenterY() - 100, 'Enter your name:', {
            fill: '#000',
            font: "30px Arial",
            align: "center"
        }).setOrigin(0.5);
        
        // Allow Enter key to start game
        this.nameInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.playGame();
            }
        });

        this.playButton = this.add.text(this.getCenterX()-50, this.getCenterY()*1.5, 'Play', {
            fill: '#000',
            font: "70px Arial",
            align: "center"
        }).setInteractive()
          .on('pointerdown', () => this.playGame())
          .on('pointerover', () => this.hover())
          .on('pointerout', () => this.hoverReset());
    }

    shutdown() {
        // Clean up the input field when leaving the scene
        if (this.nameInput && this.nameInput.parentNode) {
            this.nameInput.parentNode.removeChild(this.nameInput);
        }
    }
}