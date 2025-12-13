import { Scene } from 'phaser';
import Server from 'socket.io-client';

export default class Main extends Scene {

    constructor() {
        super({ key: 'main' });
    }

    init() {
        this.maps = null;
        this.tiles = {};
        this.layers = {};
        this.player = null;
        this.traps = {};
        this.clouds = {};
        this.message = null;
        this.tramp = {};
        this.debug = null;
        this.debugEnabled = false;
        this.audios = { music: {}, effect: {} };
        this.effects = { fear: false, speed: false, slow: false, fly:false, onPlatform: false };
        this.cursors = this.input.keyboard.createCursorKeys();
        this.spawnCoords = { x: 160, y: 4909 };
        this.finish = null;
        this.respawnTimer = null;

        this.server = Server(process.env.SERVER_URL || `${location.hostname}:9208`);
        this.players = {};
    }
    
    /**
     * This function is used to create world of your imagination.
     */
    createWorld() {
        this.maps = this.make.tilemap({ key: 'maps' });

        // Tiles and original layer
        this.tiles.tiles = this.maps.addTilesetImage('tiles');
        this.layers.tiles = this.maps.createLayer('World', this.tiles.tiles, 0, 0);
        this.layers.tiles.setCollisionByExclusion([-1]); // The player will collide with this layer

        // Tiles and layer of the sea
        this.tiles.sea = this.maps.addTilesetImage('sea');
        this.layers.sea = this.maps.createLayer('Sea', this.tiles.sea, 0, 0);

        // Tiles and layer platforms
        this.tiles.platform = this.maps.addTilesetImage('plateformes');
        this.layers.platform = this.maps.createLayer('Plateformes', this.tiles.platform, 0, 0);
        this.layers.platform.setCollisionByExclusion([-1]); // The player will collide with this layer

        // Set the boundaries of our world
        this.physics.world.bounds.width = this.layers.tiles.width;
        this.physics.world.bounds.height = this.layers.tiles.height;
    }

    /**
     * This function is used to create the player.
     * @param {Object} position
     */
    createPlayer(position = this.spawnCoords) {
        this.player = this.physics.add.sprite(position.x, position.y, 'player');
        this.player.setScale(.6)
            .setSize(95,120)
            .setOffset(35,10)
            .setBounce(0) // our player will bounce from items
            .setCollideWorldBounds(true); // don't go out of the map

        // Set the player alive
        this.player.alive = true;

        // The player collide with layers
        this.physics.add.collider(this.layers.tiles, this.player);
        this.physics.add.collider(this.layers.platform, this.player);
    }

    /**
     * This function is used to create network player.
     * @param {String} id
     * @param {Object} position
     */
    createNetworkPlayer(id, position = this.spawnCoords) {
        
        this.players = { ...this.players, [id]: {
            id, sprite: this.physics.add.sprite(position.x, position.y, 'player')
        }};

        this.players[id].sprite.setScale(.6)
            .setSize(95,120)
            .setOffset(35,10)
            .setBounce(0) // our player will bounce from items
            .setCollideWorldBounds(true); // don't go out of the map

        // Set the player id
        this.players[id].id = id;

        // Set the player alive
        this.players[id].alive = true;

        // The player collide with layers
        this.physics.add.collider(this.layers.tiles, this.players[id].sprite);
        this.physics.add.collider(this.layers.platform, this.players[id].sprite);
    }
    
    /**
     * This function is used to create all bonus.
     */
    createBonus() {
        // Fish
        this.tiles.fishTiles = this.maps.addTilesetImage('fish');
        this.layers.fishLayer = this.maps.createLayer('Fish', this.tiles.fishTiles, 0, 0);

        this.layers.fishLayer.setTileIndexCallback(27, this.collectFish, this);
        this.physics.add.overlap(this.player, this.layers.fishLayer);

        // Chocolate
        this.tiles.chocoTiles = this.maps.addTilesetImage('choco');
        this.layers.chocoLayer = this.maps.createLayer('Choco', this.tiles.chocoTiles, 0, 0);

        this.layers.chocoLayer.setTileIndexCallback(28, this.collectChoco, this);
        this.physics.add.overlap(this.player, this.layers.chocoLayer);

        // Cucumber
        this.tiles.cucumTiles = this.maps.addTilesetImage('cucumber');
        this.layers.cucumLayer = this.maps.createLayer('Cucumber', this.tiles.cucumTiles, 0, 0);

        this.layers.cucumLayer.setTileIndexCallback(29, this.collectCucum, this);
        this.physics.add.overlap(this.player, this.layers.cucumLayer);

        // Bird
        this.tiles.birdTiles = this.maps.addTilesetImage('bird');
        this.layers.birdLayer = this.maps.createLayer('Bird', this.tiles.birdTiles, 0, 0);

        this.layers.birdLayer.setTileIndexCallback(30, this.collectBird, this);
        this.physics.add.overlap(this.player, this.layers.birdLayer);

        // Trampoline
        this.tiles.trampTiles = this.maps.addTilesetImage('trampoline');
        this.layers.trampLayer = this.maps.createLayer('Tramp', this.tiles.trampTiles, 0, 0);

        this.layers.trampLayer.setTileIndexCallback(38, this.TrampoJump, this);
        this.physics.add.overlap(this.player, this.layers.trampLayer);
    }

    /**
     * This function is used to apply all camera settings.
     */
    manageCamera() {
        // set bounds so the camera won't go outside the game world
        this.cameras.main.setBounds(0, 0, this.maps.widthInPixels, this.maps.heightInPixels);
        // make the camera follow the player
        this.cameras.main.startFollow(this.player);
        // set background color, so the sky is not black    
        this.cameras.main.setBackgroundColor('#ccccff'); 
    }

    /**
     * This function is used to register all audios.
     */
    registerAudios() {
        this.audios.effect.jump = this.sound.add('effect:jump', { volume: .5 });
        this.audios.effect.meow = this.sound.add('effect:meow', { volume: .2 });
        this.audios.effect.knife = this.sound.add('effect:knife', { volume: 1 });
        this.audios.effect.catDeath = this.sound.add('effect:death', { volume: .9 });
        this.audios.effect.rocket = this.sound.add('effect:rocket', { volume: 1 });
        this.audios.effect.scream = this.sound.add('effect:scream', { volume: .4 });
        this.audios.effect.vomit  = this.sound.add('effect:vomit', { volume: 1 });
        this.audios.effect.flute  = this.sound.add('effect:flute', { volume: .2 });
        this.audios.effect.twang  = this.sound.add('effect:twang', { volume: 1 });

        this.audios.music.default = this.sound.add('music:default', { volume: .2 }).play();
    }

    /**
     * This function is used to register all animations.
     */
    registerAnimations() {
        this.anims.create({
            key: 'walk', frameRate: 60, repeat: -1,
            frames: this.anims.generateFrameNames('player', { prefix: 'Run_', start: 1, end: 30, zeroPad: 3 })
        });
    
        this.anims.create({
            key: 'idle', frameRate: 60, repeat: -1,
            frames: this.anims.generateFrameNames('player', { prefix: 'Idle_', start:1, end: 36, zeroPad:3 })
        });

        this.anims.create({
            key: 'jump', frameRate: 60, repeat: -1,
            frames: this.anims.generateFrameNames('player', { prefix: 'Jump_', start: 1, end: 36, zeroPad: 3})
        });

        this.anims.create({
            key: 'fear', frameRate: 60, repeat: -1,
            frames: this.anims.generateFrameNames('player', { prefix: 'Fear_', start:1, end: 5, zeroPad:3 })
        });
        
        this.anims.create({
            key: 'ded', frameRate: 10,
            frames: [{ key: 'player', frame: 'Ded' }]
        });
    }

    /**
     * This function is used to register and handle all spikes.
     */
    manageSpikes() {
        this.traps.spikes = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        let spikeObjects = this.maps.getObjectLayer('Spikes')['objects'];
        spikeObjects.forEach(spikeObject => {
            this.traps.spikes.create(spikeObject.x, spikeObject.y - spikeObject.height, 'spikeTrap').setOrigin(0, 0).setAlpha(0);
        });
        this.physics.add.collider(this.player, this.traps.spikes, this.killPlayer, null, this);
    }

    /**
     * This function is used to register and handle all trampolines.
     */
    manageTrampos() {
        this.tramp.tramps = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        let trampObjects = this.maps.getObjectLayer('Tramps')['objects'];
        trampObjects.forEach(trampObject => {
            this.tramp.tramps.create(trampObject.x, trampObject.y - trampObject.height, 'trampos').setOrigin(0, 0);
        });
        this.physics.add.collider(this.player, this.tramp.tramps, this.TrampoJump, null, this);
    }

    /**
     * This function is used to manage the clouds.
     */
    manageClouds() {
        this.clouds.cloud = this.physics.add.group({
            customSeparateX: true,
            customSeparateY: true,
            allowGravity: false,
            immovable: true,
            playerLocked: false
        });

        let cloudObjects = this.maps.getObjectLayer('Cloud')['objects'];
        cloudObjects.forEach(cloudObject => {
            const cloud = this.clouds.cloud.create(cloudObject.x, cloudObject.y - cloudObject.height, 'cloud').setOrigin(0,0).setScale(2);

            const moveX = cloudObject.properties.find(obj => obj.name == 'moveX').value;
            const moveY = cloudObject.properties.find(obj => obj.name == 'moveY').value;

            // Animate the cloud
            this.tweens.add({
                targets: cloud.body.velocity,
                x: { from: moveX, to: -Math.abs(moveX) },
                y: { from: moveY, to: -Math.abs(moveY) },
                duration: 2000,
                ease: 'Stepped',
                yoyo: true,
                repeat: -1
            });
        });
        this.physics.add.collider(this.player, this.clouds.cloud, this.landOnCloud, null, this);
    }

    /**
     * This function is used to manage the finish line.
     */
    manageFinishLine(){
        this.finish = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        let finishObjects = this.maps.getObjectLayer('Finish')['objects'];
        finishObjects.forEach(finishObject => {
            this.finish.create(finishObject.x, finishObject.y - finishObject.height, 'food').setOrigin(0, 0);
        });
        this.physics.add.collider(this.player, this.finish, this.finishTrigger, null, this);
    }

    /**
     * I know what this function is for, but is it really useful to comment on it?
     */
    landOnCloud () {
        this.effects.onPlatform = true;
    }

    /**
     * This function is used to manage the death of a player
     * @param {Object} sprite 
     * @param {Object} tile 
     */
    killPlayer (sprite, tile) {
        this.player.alive = false;
        this.physics.world.colliders.destroy();
        this.cameras.main.stopFollow();
        this.player.anims.play('ded', true);
        
        this.player.body.allowRotation = true;
        this.player.body.angularVelocity = 500;
        this.player.body.setVelocityX((Math.random() * 1000) - 500);
        this.player.body.setVelocityY(-200);
    
        this.player.setCollideWorldBounds(false);

        this.audios.effect.knife.play();
        this.audios.effect.catDeath.play();

        tile.setAlpha(1);
        setTimeout(() => {
            tile.setAlpha(0);
        }, 5000)

        // Player respawn
        this.respawnTimer = setTimeout((position = this.spawnCoords) => {
            if (!this.player) return; // Guard against scene change

            this.cameras.main.startFollow(this.player);
            this.player.alive = true;

            // Recreation of world collisions
            this.physics.add.collider(this.layers.tiles, this.player);
            this.physics.add.collider(this.layers.platform, this.player);
            this.physics.add.collider(this.player, this.traps.spikes, this.killPlayer, null, this);
            this.physics.add.collider(this.player, this.clouds.cloud, this.landOnCloud, null, this);

            // Reset player state
            this.player.setCollideWorldBounds(true);
            this.player.setVelocity(0,0);
            this.player.body.angularVelocity = 0;
            this.player.setX(position.x);
            this.player.setY(position.y);
            this.player.setRotation(0);
            this.player.anims.play('idle', true);
            this.player.body.allowRotation = false;

            // Recreation of bonuses detections
            this.physics.add.overlap(this.player, this.layers.fishLayer);
            this.physics.add.overlap(this.player, this.layers.chocoLayer);
            this.physics.add.overlap(this.player, this.layers.cucumLayer);
            this.physics.add.overlap(this.player, this.layers.birdLayer);
            this.physics.add.overlap(this.player, this.layers.trampLayer);

            this.respawnTimer = null;
        }, 2000);
    }

    /**
     * This function is used to collect and handle the fish.
     * @param {Object} sprite 
     * @param {Object} tile 
     */
    collectFish(sprite, tile) {
        this.layers.fishLayer.removeTileAt(tile.x, tile.y);
        this.effects.speed = true;
        this.message.setText('poisson !!');
        this.audios.effect.rocket.play();
        setTimeout(() => {
            this.effects.speed = false;
            this.message.setText('');
        }, 2000);
    }

    /**
     * This function is used to collect and handle the chocolate.
     * @param {Object} sprite 
     * @param {Object} tile
     */
    collectChoco(sprite, tile) {
        this.layers.chocoLayer.removeTileAt(tile.x, tile.y);
        this.effects.slow = true;
        this.message.setText('Beurk chocolat !!');
        this.audios.effect.vomit.play();
        setTimeout(() => {
            this.effects.slow = false;
            this.message.setText('');
        }, 2000);
    }

    /**
     * This function is used to collect and handle the cucumber.
     * @param {Object} sprite 
     * @param {Object} tile
     */
    collectCucum(sprite, tile) {
        this.layers.cucumLayer.removeTileAt(tile.x, tile.y);
        this.effects.fear = true;
        this.player.body.setVelocityX((Math.random() * 1000) - 500);
        this.player.body.setVelocityY(-500);
        this.message.setText('Aaaaaaah un concombre !!');
        this.audios.effect.scream.play();
        setTimeout(() => {
            this.effects.fear = false;
            this.message.setText('');
        }, 1800);
    }

    /**
     * This function is used to collect and handle the bird.
     * @param {Object} sprite 
     * @param {Object} tile
     */
    collectBird(sprite, tile) {
        this.layers.birdLayer.removeTileAt(tile.x, tile.y);
        this.effects.fly = true;
        this.message.setText('Je voooole !!');
        this.audios.effect.flute.play();
        setTimeout(() => {
            this.effects.fly = false;
            this.audios.effect.flute.stop();
            this.message.setText('');
        }, 3000);
    }

    /**
     * This function is used to handle the trampoline.
     */
    TrampoJump() {
        this.player.body.setVelocityY(-1000);  
        this.audios.effect.twang.play();
    }

    /**
     * This function is used to handle the finish event.
     */
    finishTrigger() {
        this.server.emit('player:winning');
    }

    /**
     * These function is used to display all debug informations.
     */
    debugging() {
        return `Debugging Cataclysm (Phaser ${Phaser.VERSION})
        \nFramerate: ${Math.floor(this.game.loop.actualFps)}
        \nNetwork: ${this.server.connected ? `Connected` : `Disconnected`}
        \nCoordinates: X:${Math.floor(this.player.x)} Y:${Math.floor(this.player.y)}`;
    }

    /**
     * This function is native to Phaser.io, is used to create the scene.
     */
    create() {

        this.server.on('connect', () => {
            console.log('We are ready to work harder! 💪😎');
            if (this.message) {
                this.message.setText('');
            }

            // Request all connected users
            this.server.on('player:all', (players) => {
                players.forEach((player) => {
                    if (this.server.id != player) {
                        this.createNetworkPlayer(player);
                    }
                });
            });

            // Handle player spawning
            this.server.on('player:spawn', id => {
                if (id != this.server.id) this.createNetworkPlayer(id);

                console.log(`${id} was connected 😁`, this.players);
            });

            // Handle player moving
            this.server.on('player:moved', (id, position, flip) =>  {
                if (id != this.server.id) {
                    this.players[id].sprite.setPosition(position.x, position.y, 0, 0);
                    this.players[id].sprite.setFlip(flip.x, flip.y);
                }
            });

            // Handle player animation
            this.server.on('player:animated', (id, animation, state = true) => {
                if (id != this.server.id) {
                    this.players[id].sprite.anims.play(animation, state);
                }
            });

            // Handle the meow of player
            this.server.on('player:meow', id => {
                this.audios.effect.meow.play();
            });

            // Handle the player winning
            this.server.on('player:winned', id => {
                this.message.setText(`${id} HAS WON!`).setScale(1.5).setStyle({ fill: '#ff0' });
                setTimeout(() => {
                    this.scene.start('menu');
                }, 3000);
            });

            // Handle player unspawn
            this.server.on('player:unspawn', id => {
                if (this.players[id]) {
                    this.players[id].sprite.destroy();
                    delete this.players[id];
                    console.log(`${id} was disconnected 😞`, this.players);
                }
            });

        });

        this.server.on('connect_error', (error) => {
            console.error('Connection error:', error);
            if (this.message) {
                this.message.setText('Connection error. Retrying...');
            }
        });

        this.server.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            if (this.message) {
                this.message.setText('Disconnected from server');
            }
        });

        this.createWorld();
        this.registerAudios();

        this.createPlayer();
        this.manageCamera();
        this.registerAnimations();
        this.createBonus();
        this.manageSpikes();
        this.manageClouds();
        this.manageTrampos();
        this.manageFinishLine();

        // Create message displayed to screen
        this.message = this.add.text(20, 570, null, {
            fontSize: '20px',
            fill: '#ffffff'
        }).setScrollFactor(0);

        // Create the debugging text (always create it, but hide by default)
        this.debug = this.add.text(20, 20, this.debugging(), {
            fontSize: '20px',
            fill: '#ff0',
            backgroundColor: '#000',
            padding: { x:10, y:10 }
        }).setScrollFactor(0).setVisible(this.debugEnabled);

        // Add keyboard listener to toggle debug mode with D key
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
        this.debugKeyPressed = false;
    } 

    /**
     * This function is called when the scene shuts down.
     */
    shutdown() {
        // Clear any pending respawn timer
        if (this.respawnTimer) {
            clearTimeout(this.respawnTimer);
            this.respawnTimer = null;
        }

        // Disconnect socket if connected
        if (this.server && this.server.connected) {
            this.server.disconnect();
        }
    }

    /**
     * This function is native to Phaser.io, is used to update the scene.
     */
    update() {
        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            this.debugEnabled = !this.debugEnabled;
            this.debug.setVisible(this.debugEnabled);

            // Toggle physics debug
            if (this.debugEnabled) {
                this.physics.world.debugGraphic = this.add.graphics();
                this.physics.world.drawDebug = true;
            } else {
                this.physics.world.drawDebug = false;
                if (this.physics.world.debugGraphic) {
                    this.physics.world.debugGraphic.clear();
                    this.physics.world.debugGraphic.destroy();
                    this.physics.world.debugGraphic = null;
                }
            }
        }

        if (this.debugEnabled) this.debug.setText(this.debugging());

        let moveSpeed;
        if (this.effects.fear){
            moveSpeed = 0;
        } else if (this.effects.speed) {
            moveSpeed = 750;
        } else if (this.effects.slow) {
            moveSpeed = 150;
        } else {
            moveSpeed = 500;
        }

        if (this.player.alive) {

            if (this.cursors.left.isDown || this.cursors.right.isDown || !this.player.body.onFloor()) {
                // If "this.players" is not empty, send the player position to all connected players
                if (Object.keys(this.players).length != 0) {
                    this.server.emit('player:move', {
                        position: { x: this.player.x, y: this.player.y },
                        flip: { x: this.player.flipX, y: this.player.flipY },
                    });
                }
            }

            if (this.cursors.left.isDown) {
                this.player.body.setVelocityX(-moveSpeed); // move left
                this.player.flipX = true; // flip the sprite to the left
                if (this.player.body.onFloor() || this.effects.onPlatform) {
                    this.player.anims.play('walk', true); // play walk animation
                    this.server.emit('player:animate', 'walk', true);
                }
            } else if (this.cursors.right.isDown) {
                this.player.body.setVelocityX(moveSpeed); // move right
                this.player.flipX = false; // use the original sprite looking to the right
                if (this.player.body.onFloor() || this.effects.onPlatform) {
                    this.player.anims.play('walk', true); // play walk animation
                    this.server.emit('player:animate', 'walk', true);
                }
            } else {
                this.player.body.setVelocityX(0);
                if (this.player.body.onFloor() && !this.effects.fear) {
                    this.player.anims.play('idle', true); // play idle animation
                    this.server.emit('player:animate', 'idle', true);
                }
            }  
            
            if (this.cursors.up.isDown && (this.player.body.onFloor() || this.effects.onPlatform || this.effects.fly)) {
                this.audios.effect.jump.play();
                this.player.body.setVelocityY(-800); // Jump
                this.effects.onPlatform = false;
            }

            if (!this.player.body.onFloor() && !this.effects.fear && !this.effects.onPlatform) {
                this.player.anims.play('jump', true); // play jump animation
                this.server.emit('player:animate', 'jump', true);
            }

            if (this.effects.fear){
                this.player.anims.play('fear', true);
                this.server.emit('player:animate', 'fear', true);
            }

            if (this.cursors.space.isDown) {
                this.server.emit('player:meow');
                
            }

            if (this.effects.onPlatform && this.player.body.velocity.x === 0){
                this.player.anims.play('idle', true);
            } else {
                this.effects.onPlatform = false;
            }

        }
    }

}