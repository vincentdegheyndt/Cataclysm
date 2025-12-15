import { Scene } from 'phaser';
import Server from 'socket.io-client';

// Constants - Configuration
const CONFIG = {
    SERVER_PORT: '9208',
    CAMERA_BG_COLOR: '#ccccff',
    // Use environment variable or default to localhost for development
    // For production, set SERVER_URL in your build environment to your deployed server URL
    DEFAULT_SERVER_URL: process.env.SERVER_URL ||
                        (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
                            ? `${location.hostname}:9208`
                            : 'https://your-server-url.onrender.com'), // Replace with your actual server URL
};

// Constants - Spawn and positioning
const SPAWN_COORDS = { x: 160, y: 4909 };

// Constants - Player physics
const PLAYER = {
    SCALE: 0.6,
    SIZE_WIDTH: 95,
    SIZE_HEIGHT: 120,
    OFFSET_X: 35,
    OFFSET_Y: 10,
    BOUNCE: 0,
};

// Constants - Movement speeds
const MOVE_SPEED = {
    NORMAL: 500,
    FAST: 750,
    SLOW: 150,
    STOPPED: 0,
};

// Constants - Physics values
const PHYSICS = {
    JUMP_VELOCITY: -800,
    TRAMPOLINE_VELOCITY: -1000,
    DEATH_ANGULAR_VELOCITY: 500,
    DEATH_VELOCITY_Y: -200,
    CUCUMBER_VELOCITY_Y: -500,
};

// Constants - Animation settings
const ANIMATION = {
    WALK_FRAME_RATE: 60,
    WALK_START: 1,
    WALK_END: 30,
    IDLE_FRAME_RATE: 60,
    IDLE_START: 1,
    IDLE_END: 36,
    JUMP_FRAME_RATE: 60,
    JUMP_START: 1,
    JUMP_END: 36,
    FEAR_FRAME_RATE: 60,
    FEAR_START: 1,
    FEAR_END: 5,
    DEAD_FRAME_RATE: 10,
    ZERO_PAD: 3,
};

// Constants - Tile indices
const TILE_INDEX = {
    FISH: 27,
    CHOCOLATE: 28,
    CUCUMBER: 29,
    BIRD: 30,
    TRAMPOLINE: 38,
};

// Constants - Audio volumes
const AUDIO_VOLUME = {
    JUMP: 0.5,
    MEOW: 0.2,
    KNIFE: 1,
    DEATH: 0.9,
    ROCKET: 1,
    SCREAM: 0.4,
    VOMIT: 1,
    FLUTE: 0.2,
    TWANG: 1,
    MUSIC_DEFAULT: 0.2,
};

// Constants - Timers (in milliseconds)
const TIMERS = {
    EFFECT_DURATION_SHORT: 1800,
    EFFECT_DURATION_STANDARD: 2000,
    EFFECT_DURATION_LONG: 3000,
    RESPAWN_DELAY: 2000,
    SPIKE_ALPHA_RESET: 5000,
    WIN_SCENE_DELAY: 3000,
};

// Constants - Cloud animation
const CLOUD = {
    SCALE: 2,
    ANIMATION_DURATION: 2000,
    ANIMATION_EASE: 'Stepped',
};

// Constants - UI
const UI = {
    MESSAGE_X: 20,
    MESSAGE_Y: 570,
    MESSAGE_FONT_SIZE: '20px',
    MESSAGE_COLOR: '#ffffff',
    WIN_MESSAGE_SCALE: 1.5,
    WIN_MESSAGE_COLOR: '#ff0',
    DEBUG_X: 20,
    DEBUG_Y: 20,
    DEBUG_FONT_SIZE: '20px',
    DEBUG_COLOR: '#ff0',
    DEBUG_BG_COLOR: '#000',
    DEBUG_PADDING: { x: 10, y: 10 },
};

// Constants - Messages
const MESSAGES = {
    FISH: 'poisson !!',
    CHOCOLATE: 'Beurk chocolat !!',
    CUCUMBER: 'Aaaaaaah un concombre !!',
    BIRD: 'Je voooole !!',
    EMPTY: '',
    CONNECTION_ERROR: 'Connection error. Retrying...',
    DISCONNECTED: 'Disconnected from server',
};

// Constants - Layer and tileset names
const LAYER_NAMES = {
    WORLD: 'World',
    SEA: 'Sea',
    PLATFORMS: 'Plateformes',
    FISH: 'Fish',
    CHOCOLATE: 'Choco',
    CUCUMBER: 'Cucumber',
    BIRD: 'Bird',
    TRAMPOLINE: 'Tramp',
};

const TILESET_NAMES = {
    TILES: 'tiles',
    SEA: 'sea',
    PLATFORMS: 'plateformes',
    FISH: 'fish',
    CHOCOLATE: 'choco',
    CUCUMBER: 'cucumber',
    BIRD: 'bird',
    TRAMPOLINE: 'trampoline',
};

const OBJECT_LAYER_NAMES = {
    SPIKES: 'Spikes',
    TRAMPOLINES: 'Tramps',
    CLOUD: 'Cloud',
    FINISH: 'Finish',
};

const ANIMATION_KEYS = {
    WALK: 'walk',
    IDLE: 'idle',
    JUMP: 'jump',
    FEAR: 'fear',
    DEAD: 'ded',
};

const SPRITE_PREFIXES = {
    RUN: 'Run_',
    IDLE: 'Idle_',
    JUMP: 'Jump_',
    FEAR: 'Fear_',
    DEAD: 'Ded',
};

export default class Main extends Scene {

    constructor() {
        super({ key: 'main' });
    }

    init(data) {
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
        this.spawnCoords = SPAWN_COORDS;
        this.finish = null;
        this.respawnTimer = null;
        this.playerName = data.playerName || 'Anonymous Cat';

        this.server = Server(CONFIG.DEFAULT_SERVER_URL);
        this.players = {};
        this.playerListUI = null;
        this.finishX = 0; // Will be set when finish line is created
        this.lastNetworkUpdate = 0; // Throttle network updates
        this.networkUpdateRate = 16; // Update network every 16ms (60 times per second)
    }
    
    /**
     * This function is used to create world of your imagination.
     */
    createWorld() {
        this.maps = this.make.tilemap({ key: 'maps' });

        // Tiles and original layer
        this.tiles.tiles = this.maps.addTilesetImage(TILESET_NAMES.TILES);
        this.layers.tiles = this.maps.createLayer(LAYER_NAMES.WORLD, this.tiles.tiles, 0, 0);
        this.layers.tiles.setCollisionByExclusion([-1]); // The player will collide with this layer

        // Tiles and layer of the sea
        this.tiles.sea = this.maps.addTilesetImage(TILESET_NAMES.SEA);
        this.layers.sea = this.maps.createLayer(LAYER_NAMES.SEA, this.tiles.sea, 0, 0);

        // Tiles and layer platforms
        this.tiles.platform = this.maps.addTilesetImage(TILESET_NAMES.PLATFORMS);
        this.layers.platform = this.maps.createLayer(LAYER_NAMES.PLATFORMS, this.tiles.platform, 0, 0);
        this.layers.platform.setCollisionByExclusion([-1]); // The player will collide with this layer

        // Set the boundaries of our world
        this.physics.world.bounds.width = this.layers.tiles.width;
        this.physics.world.bounds.height = this.layers.tiles.height;
    }

    /**
     * Helper function to configure a player sprite with standard settings
     * @param {Phaser.Physics.Arcade.Sprite} sprite - The sprite to configure
     */
    configurePlayerSprite(sprite) {
        sprite.setScale(PLAYER.SCALE)
            .setSize(PLAYER.SIZE_WIDTH, PLAYER.SIZE_HEIGHT)
            .setOffset(PLAYER.OFFSET_X, PLAYER.OFFSET_Y)
            .setBounce(PLAYER.BOUNCE)
            .setCollideWorldBounds(true);
    }

    /**
     * Helper function to add colliders for a player sprite
     * @param {Phaser.Physics.Arcade.Sprite} sprite - The sprite to add colliders for
     */
    addPlayerColliders(sprite) {
        this.physics.add.collider(this.layers.tiles, sprite);
        this.physics.add.collider(this.layers.platform, sprite);
    }

    /**
     * This function is used to create the player.
     * @param {Object} position
     */
    createPlayer(position = this.spawnCoords) {
        this.player = this.physics.add.sprite(position.x, position.y, 'player');
        this.configurePlayerSprite(this.player);

        // Set the player alive
        this.player.alive = true;
        this.player.playerName = this.playerName;

        // Add name label above player
        this.player.nameLabel = this.add.text(0, 0, this.playerName, {
            fontSize: '26px',
            fill: '#000000',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1000);

        // The player collide with layers
        this.addPlayerColliders(this.player);
    }

    /**
     * This function is used to create network player.
     * @param {String} id
     * @param {String} playerName
     * @param {Object} position
     */
    createNetworkPlayer(id, playerName, position = this.spawnCoords) {
        // Prevent duplicate creation
        if (this.players[id]) {
            console.log(`Player ${id} already exists, skipping creation`);
            return;
        }

        console.log(`Creating network player sprite for ${playerName} (${id})`);

        this.players = { ...this.players, [id]: {
            id,
            sprite: this.physics.add.sprite(position.x, position.y, 'player'),
            playerName: playerName || 'Anonymous Cat',
            progress: 0
        }};

        this.configurePlayerSprite(this.players[id].sprite);

        // Set the player id
        this.players[id].id = id;
        this.players[id].sprite.playerName = playerName || 'Anonymous Cat';

        // Set the player alive
        this.players[id].alive = true;

        // Disable physics for network players - they should only display received positions
        this.players[id].sprite.body.setAllowGravity(false);
        this.players[id].sprite.body.moves = false;

        // Add name label above player
        this.players[id].sprite.nameLabel = this.add.text(0, 0, playerName || 'Anonymous Cat', {
            fontSize: '26px',
            fill: '#000000',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(1000);

        // Network players don't need colliders since they're position-only
        // this.addPlayerColliders(this.players[id].sprite);

        console.log(`Network player ${playerName} created successfully at (${position.x}, ${position.y})`);
    }
    
    /**
     * Helper function to create a bonus layer with tile callback
     * @param {String} tilesetName - The name of the tileset
     * @param {String} layerName - The name of the layer
     * @param {Number} tileIndex - The tile index for the callback
     * @param {Function} callback - The callback function
     * @param {String} tilesKey - The key to store tiles in this.tiles
     * @param {String} layerKey - The key to store layer in this.layers
     */
    createBonusLayer(tilesetName, layerName, tileIndex, callback, tilesKey, layerKey) {
        this.tiles[tilesKey] = this.maps.addTilesetImage(tilesetName);
        this.layers[layerKey] = this.maps.createLayer(layerName, this.tiles[tilesKey], 0, 0);
        this.layers[layerKey].setTileIndexCallback(tileIndex, callback, this);
        this.physics.add.overlap(this.player, this.layers[layerKey]);
    }

    /**
     * This function is used to create all bonus.
     */
    createBonus() {
        // Fish
        this.createBonusLayer(TILESET_NAMES.FISH, LAYER_NAMES.FISH, TILE_INDEX.FISH, this.collectFish, 'fishTiles', 'fishLayer');

        // Chocolate
        this.createBonusLayer(TILESET_NAMES.CHOCOLATE, LAYER_NAMES.CHOCOLATE, TILE_INDEX.CHOCOLATE, this.collectChoco, 'chocoTiles', 'chocoLayer');

        // Cucumber
        this.createBonusLayer(TILESET_NAMES.CUCUMBER, LAYER_NAMES.CUCUMBER, TILE_INDEX.CUCUMBER, this.collectCucum, 'cucumTiles', 'cucumLayer');

        // Bird
        this.createBonusLayer(TILESET_NAMES.BIRD, LAYER_NAMES.BIRD, TILE_INDEX.BIRD, this.collectBird, 'birdTiles', 'birdLayer');

        // Trampoline
        this.createBonusLayer(TILESET_NAMES.TRAMPOLINE, LAYER_NAMES.TRAMPOLINE, TILE_INDEX.TRAMPOLINE, this.TrampoJump, 'trampTiles', 'trampLayer');
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
        this.cameras.main.setBackgroundColor(CONFIG.CAMERA_BG_COLOR);
    }

    /**
     * This function is used to register all audios.
     */
    registerAudios() {
        this.audios.effect.jump = this.sound.add('effect:jump', { volume: AUDIO_VOLUME.JUMP });
        this.audios.effect.meow = this.sound.add('effect:meow', { volume: AUDIO_VOLUME.MEOW });
        this.audios.effect.knife = this.sound.add('effect:knife', { volume: AUDIO_VOLUME.KNIFE });
        this.audios.effect.catDeath = this.sound.add('effect:death', { volume: AUDIO_VOLUME.DEATH });
        this.audios.effect.rocket = this.sound.add('effect:rocket', { volume: AUDIO_VOLUME.ROCKET });
        this.audios.effect.scream = this.sound.add('effect:scream', { volume: AUDIO_VOLUME.SCREAM });
        this.audios.effect.vomit  = this.sound.add('effect:vomit', { volume: AUDIO_VOLUME.VOMIT });
        this.audios.effect.flute  = this.sound.add('effect:flute', { volume: AUDIO_VOLUME.FLUTE });
        this.audios.effect.twang  = this.sound.add('effect:twang', { volume: AUDIO_VOLUME.TWANG });

        this.audios.music.default = this.sound.add('music:default', { volume: AUDIO_VOLUME.MUSIC_DEFAULT }).play();
    }

    /**
     * This function is used to register all animations.
     */
    registerAnimations() {
        this.anims.create({
            key: ANIMATION_KEYS.WALK,
            frameRate: ANIMATION.WALK_FRAME_RATE,
            repeat: -1,
            frames: this.anims.generateFrameNames('player', {
                prefix: SPRITE_PREFIXES.RUN,
                start: ANIMATION.WALK_START,
                end: ANIMATION.WALK_END,
                zeroPad: ANIMATION.ZERO_PAD
            })
        });

        this.anims.create({
            key: ANIMATION_KEYS.IDLE,
            frameRate: ANIMATION.IDLE_FRAME_RATE,
            repeat: -1,
            frames: this.anims.generateFrameNames('player', {
                prefix: SPRITE_PREFIXES.IDLE,
                start: ANIMATION.IDLE_START,
                end: ANIMATION.IDLE_END,
                zeroPad: ANIMATION.ZERO_PAD
            })
        });

        this.anims.create({
            key: ANIMATION_KEYS.JUMP,
            frameRate: ANIMATION.JUMP_FRAME_RATE,
            repeat: -1,
            frames: this.anims.generateFrameNames('player', {
                prefix: SPRITE_PREFIXES.JUMP,
                start: ANIMATION.JUMP_START,
                end: ANIMATION.JUMP_END,
                zeroPad: ANIMATION.ZERO_PAD
            })
        });

        this.anims.create({
            key: ANIMATION_KEYS.FEAR,
            frameRate: ANIMATION.FEAR_FRAME_RATE,
            repeat: -1,
            frames: this.anims.generateFrameNames('player', {
                prefix: SPRITE_PREFIXES.FEAR,
                start: ANIMATION.FEAR_START,
                end: ANIMATION.FEAR_END,
                zeroPad: ANIMATION.ZERO_PAD
            })
        });

        this.anims.create({
            key: ANIMATION_KEYS.DEAD,
            frameRate: ANIMATION.DEAD_FRAME_RATE,
            frames: [{ key: 'player', frame: SPRITE_PREFIXES.DEAD }]
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

        let spikeObjects = this.maps.getObjectLayer(OBJECT_LAYER_NAMES.SPIKES)['objects'];
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

        let trampObjects = this.maps.getObjectLayer(OBJECT_LAYER_NAMES.TRAMPOLINES)['objects'];
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

        let cloudObjects = this.maps.getObjectLayer(OBJECT_LAYER_NAMES.CLOUD)['objects'];
        cloudObjects.forEach(cloudObject => {
            const cloud = this.clouds.cloud.create(cloudObject.x, cloudObject.y - cloudObject.height, 'cloud')
                .setOrigin(0, 0)
                .setScale(CLOUD.SCALE);

            const moveX = cloudObject.properties.find(obj => obj.name == 'moveX').value;
            const moveY = cloudObject.properties.find(obj => obj.name == 'moveY').value;

            // Animate the cloud
            this.tweens.add({
                targets: cloud.body.velocity,
                x: { from: moveX, to: -Math.abs(moveX) },
                y: { from: moveY, to: -Math.abs(moveY) },
                duration: CLOUD.ANIMATION_DURATION,
                ease: CLOUD.ANIMATION_EASE,
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

        let finishObjects = this.maps.getObjectLayer(OBJECT_LAYER_NAMES.FINISH)['objects'];
        finishObjects.forEach(finishObject => {
            this.finish.create(finishObject.x, finishObject.y - finishObject.height, 'food').setOrigin(0, 0);
            // Store finish X position for progress calculation
            if (this.finishX === 0) {
                this.finishX = finishObject.x;
            }
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
     * Helper function to handle player animation and network sync
     * @param {String} animationKey - The animation key to play
     * @param {Boolean} state - The animation state
     */
    playAnimationAndSync(animationKey, state = true) {
        this.player.anims.play(animationKey, state);
        this.server.emit('player:animate', animationKey, state);
    }

    /**
     * Helper function to handle horizontal movement
     * @param {Number} velocity - The velocity to apply
     * @param {Boolean} flipX - Whether to flip the sprite
     */
    handleHorizontalMovement(velocity, flipX) {
        this.player.body.setVelocityX(velocity);
        this.player.flipX = flipX;
        if (this.player.body.onFloor() || this.effects.onPlatform) {
            this.playAnimationAndSync(ANIMATION_KEYS.WALK);
        }
    }

    /**
     * Helper function to check if player is grounded
     * @returns {Boolean}
     */
    isGrounded() {
        return this.player.body.onFloor() || this.effects.onPlatform;
    }

    /**
     * Helper function to send player position to network
     */
    sendPlayerPosition() {
        if (Object.keys(this.players).length != 0) {
            const currentTime = Date.now();
            // Throttle updates to reduce network traffic and jitter
            if (currentTime - this.lastNetworkUpdate >= this.networkUpdateRate) {
                this.lastNetworkUpdate = currentTime;
                const progress = this.calculateProgress(this.player.x);
                this.server.emit('player:move', {
                    position: { x: this.player.x, y: this.player.y },
                    flip: { x: this.player.flipX, y: this.player.flipY },
                    progress: progress
                });
            }
        }
    }

    /**
     * Calculate progress percentage based on X position
     * @param {Number} currentX - Current X position of the player
     * @returns {Number} Progress percentage (0-100)
     */
    calculateProgress(currentX) {
        // Progress goes from spawn X to finish X (higher X = more progress since game goes left to right)
        const totalDistance = this.finishX - this.spawnCoords.x;
        const currentDistance = currentX - this.spawnCoords.x;
        const progress = Math.max(0, Math.min(100, (currentDistance / totalDistance) * 100));
        return progress;
    }

    /**
     * Update the player list UI
     */
    updatePlayerListUI() {
        if (!this.playerListUI) return;

        // Build player list with current player and network players
        const playerData = [
            {
                name: this.playerName,
                progress: this.calculateProgress(this.player.x),
                isLocal: true
            }
        ];

        Object.values(this.players).forEach(player => {
            playerData.push({
                name: player.playerName,
                progress: player.progress || 0,
                isLocal: false
            });
        });

        // Sort by progress (highest first)
        playerData.sort((a, b) => b.progress - a.progress);

        // Build text with position numbers
        let text = 'Players:\n';
        playerData.forEach((player, index) => {
            const position = index + 1;
            const marker = player.isLocal ? '►' : '';
            const markerEnd = player.isLocal ? '◄' : '';
            text += `${position} ${marker}${player.name}${markerEnd} ${player.progress.toFixed(1)}%\n`;
        });

        this.playerListUI.setText(text);
    }

    /**
     * Helper function to calculate move speed based on active effects
     * @returns {Number} The current move speed
     */
    calculateMoveSpeed() {
        if (this.effects.fear) {
            return MOVE_SPEED.STOPPED;
        } else if (this.effects.speed) {
            return MOVE_SPEED.FAST;
        } else if (this.effects.slow) {
            return MOVE_SPEED.SLOW;
        } else {
            return MOVE_SPEED.NORMAL;
        }
    }

    /**
     * Helper function to recreate all player collisions
     */
    recreatePlayerCollisions() {
        // Recreation of world collisions
        this.physics.add.collider(this.layers.tiles, this.player);
        this.physics.add.collider(this.layers.platform, this.player);
        this.physics.add.collider(this.player, this.traps.spikes, this.killPlayer, null, this);
        this.physics.add.collider(this.player, this.clouds.cloud, this.landOnCloud, null, this);

        // Recreation of bonuses detections
        this.physics.add.overlap(this.player, this.layers.fishLayer);
        this.physics.add.overlap(this.player, this.layers.chocoLayer);
        this.physics.add.overlap(this.player, this.layers.cucumLayer);
        this.physics.add.overlap(this.player, this.layers.birdLayer);
        this.physics.add.overlap(this.player, this.layers.trampLayer);
    }

    /**
     * This function is used to manage the death of a player
     * @param {Object} sprite
     * @param {Object} tile
     */
    killPlayer (sprite, tile) {
        this.player.alive = false;
        this.player.body.enable = false;
        this.cameras.main.stopFollow();
        this.player.anims.play(ANIMATION_KEYS.DEAD, true);

        this.player.body.allowRotation = true;
        this.player.body.angularVelocity = PHYSICS.DEATH_ANGULAR_VELOCITY;
        this.player.body.setVelocityX((Math.random() * 1000) - 500);
        this.player.body.setVelocityY(PHYSICS.DEATH_VELOCITY_Y);

        this.player.setCollideWorldBounds(false);

        this.audios.effect.knife.play();
        this.audios.effect.catDeath.play();

        // Keep trap visible permanently after activation
        tile.setAlpha(1);

        // Emit trap event to other players
        this.server.emit('player:trap', 'death', { x: tile.x, y: tile.y });

        // Player respawn
        this.respawnTimer = setTimeout((position = this.spawnCoords) => {
            if (!this.player) return; // Guard against scene change

            this.cameras.main.startFollow(this.player);
            this.player.alive = true;

            // Re-enable physics body
            this.player.body.enable = true;

            // Reset player state
            this.player.setCollideWorldBounds(true);
            this.player.setVelocity(0, 0);
            this.player.body.angularVelocity = 0;
            this.player.setX(position.x);
            this.player.setY(position.y);
            this.player.setRotation(0);
            this.player.anims.play(ANIMATION_KEYS.IDLE, true);
            this.player.body.allowRotation = false;

            this.respawnTimer = null;
        }, TIMERS.RESPAWN_DELAY);
    }

    /**
     * Helper function to apply a temporary effect with message and audio
     * @param {String} effectName - The name of the effect to enable
     * @param {String} message - The message to display
     * @param {Object} audio - The audio to play
     * @param {Number} duration - The duration in milliseconds
     * @param {Function} onEnd - Optional callback when effect ends
     */
    applyTemporaryEffect(effectName, message, audio, duration, onEnd = null) {
        this.effects[effectName] = true;
        this.message.setText(message);
        audio.play();
        setTimeout(() => {
            this.effects[effectName] = false;
            this.message.setText(MESSAGES.EMPTY);
            if (onEnd) onEnd();
        }, duration);
    }

    /**
     * This function is used to collect and handle the fish.
     * @param {Object} sprite
     * @param {Object} tile
     */
    collectFish(sprite, tile) {
        this.layers.fishLayer.removeTileAt(tile.x, tile.y);
        this.applyTemporaryEffect('speed', MESSAGES.FISH, this.audios.effect.rocket, TIMERS.EFFECT_DURATION_STANDARD);
    }

    /**
     * This function is used to collect and handle the chocolate.
     * @param {Object} sprite
     * @param {Object} tile
     */
    collectChoco(sprite, tile) {
        this.layers.chocoLayer.removeTileAt(tile.x, tile.y);
        this.applyTemporaryEffect('slow', MESSAGES.CHOCOLATE, this.audios.effect.vomit, TIMERS.EFFECT_DURATION_STANDARD);
    }

    /**
     * This function is used to collect and handle the cucumber.
     * @param {Object} sprite
     * @param {Object} tile
     */
    collectCucum(sprite, tile) {
        this.layers.cucumLayer.removeTileAt(tile.x, tile.y);
        this.player.body.setVelocityX((Math.random() * 1000) - 500);
        this.player.body.setVelocityY(PHYSICS.CUCUMBER_VELOCITY_Y);
        this.applyTemporaryEffect('fear', MESSAGES.CUCUMBER, this.audios.effect.scream, TIMERS.EFFECT_DURATION_SHORT);
    }

    /**
     * This function is used to collect and handle the bird.
     * @param {Object} sprite
     * @param {Object} tile
     */
    collectBird(sprite, tile) {
        this.layers.birdLayer.removeTileAt(tile.x, tile.y);
        this.applyTemporaryEffect('fly', MESSAGES.BIRD, this.audios.effect.flute, TIMERS.EFFECT_DURATION_LONG, () => {
            this.audios.effect.flute.stop();
        });
    }

    /**
     * This function is used to handle the trampoline.
     */
    TrampoJump() {
        this.player.body.setVelocityY(PHYSICS.TRAMPOLINE_VELOCITY);
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
                this.message.setText(MESSAGES.EMPTY);
            }

            // Register player with name
            this.server.emit('player:register', this.playerName);

            // Request all connected users
            this.server.on('player:all', (players) => {
                console.log('Received player:all', players);
                Object.values(players).forEach((player) => {
                    if (this.server.id != player.id) {
                        console.log(`Creating network player: ${player.name} (${player.id})`);
                        this.createNetworkPlayer(player.id, player.name);
                    } else {
                        console.log(`Skipping self: ${player.name} (${player.id})`);
                    }
                });
            });

            // Receive all activated traps
            this.server.on('traps:all', (traps) => {
                console.log('Received activated traps:', traps);
                traps.forEach(trap => {
                    if (trap.trapType === 'death') {
                        // Find and activate the spike trap
                        const spike = this.traps.spikes.getChildren().find(s =>
                            Math.abs(s.x - trap.position.x) < 5 && Math.abs(s.y - trap.position.y) < 5
                        );
                        if (spike) {
                            spike.setAlpha(1);
                        }
                    }
                });
            });

            // Handle player spawning
            this.server.on('player:spawn', (id, playerName) => {
                if (id != this.server.id) this.createNetworkPlayer(id, playerName);

                console.log(`${playerName} (${id}) was connected 😁`, this.players);
            });

            // Handle player moving
            this.server.on('player:moved', (id, position, flip, progress) =>  {
                if (id != this.server.id && this.players[id]) {
                    this.players[id].sprite.setPosition(position.x, position.y);
                    this.players[id].sprite.setFlip(flip.x, flip.y);
                    this.players[id].progress = progress || 0;
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
            this.server.on('player:winned',  (id, playerName) => {
                this.message.setText(`${playerName} HAS WON!`).setScale(UI.WIN_MESSAGE_SCALE).setStyle({ fill: UI.WIN_MESSAGE_COLOR });
                setTimeout(() => {
                    this.scene.start('menu');
                }, TIMERS.WIN_SCENE_DELAY);
            });

            // Handle player hitting trap
            this.server.on('player:trapped', (id, trapType, position) => {
                if (id !== this.server.id && this.players[id]) {
                    // Visual feedback for traps hit by other players
                    if (trapType === 'death') {
                        // Play death animation on network player
                        if (this.players[id].sprite) {
                            this.players[id].sprite.anims.play(ANIMATION_KEYS.DEAD, true);
                        }

                        // Find the spike trap at this position and make it visible
                        const spike = this.traps.spikes.getChildren().find(s =>
                            Math.abs(s.x - position.x) < 5 && Math.abs(s.y - position.y) < 5
                        );
                        if (spike) {
                            // Keep trap visible permanently after activation
                            spike.setAlpha(1);
                            this.audios.effect.knife.play();
                            this.audios.effect.catDeath.play();
                        }
                    }
                }
            });

            // Handle player unspawn
            this.server.on('player:unspawn', id => {
                if (this.players[id]) {
                    console.log(`Removing player ${id} from game`);

                    // Clean up name label
                    if (this.players[id].sprite && this.players[id].sprite.nameLabel) {
                        this.players[id].sprite.nameLabel.destroy();
                        this.players[id].sprite.nameLabel = null;
                    }

                    // Clean up sprite
                    if (this.players[id].sprite) {
                        this.players[id].sprite.destroy();
                        this.players[id].sprite = null;
                    }

                    // Remove from players object
                    delete this.players[id];
                    console.log(`${id} was disconnected 😞. Remaining players:`, Object.keys(this.players));
                }
            });

        });

        this.server.on('connect_error', (error) => {
            console.error('Connection error:', error);
            if (this.message) {
                this.message.setText(MESSAGES.CONNECTION_ERROR);
            }
        });

        this.server.on('disconnect', (reason) => {
            console.log('Disconnected:', reason);
            if (this.message) {
                this.message.setText(MESSAGES.DISCONNECTED);
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
        this.message = this.add.text(UI.MESSAGE_X, UI.MESSAGE_Y, null, {
            fontSize: UI.MESSAGE_FONT_SIZE,
            fill: UI.MESSAGE_COLOR
        }).setScrollFactor(0);

        // Create the debugging text (always create it, but hide by default)
        this.debug = this.add.text(this.cameras.main.width - UI.DEBUG_X, UI.DEBUG_Y, this.debugging(), {
            fontSize: UI.DEBUG_FONT_SIZE,
            fill: UI.DEBUG_COLOR,
            backgroundColor: UI.DEBUG_BG_COLOR,
            padding: UI.DEBUG_PADDING
        }).setOrigin(1, 0).setScrollFactor(0).setVisible(this.debugEnabled);

        // Create player list UI in top-left corner
        this.playerListUI = this.add.text(20, 20, 'Players:\n', {
            fontSize: '26px',
            fill: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            padding: { x: 16, y: 12 },
            lineSpacing: 6
        }).setScrollFactor(0).setDepth(100);

        // Add keyboard listener to toggle debug mode with D key
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKTICK);
        this.debugKeyPressed = false;

        // Update name labels after physics/camera updates to prevent flickering
        this.events.on('postupdate', () => {
            // Update local player name label position
            if (this.player && this.player.nameLabel) {
                this.player.nameLabel.setPosition(
                    Math.round(this.player.x),
                    Math.round(this.player.y - 80)
                );
            }

            // Update network players name labels
            Object.values(this.players).forEach(player => {
                if (player.sprite && player.sprite.nameLabel) {
                    player.sprite.nameLabel.setPosition(
                        Math.round(player.sprite.x),
                        Math.round(player.sprite.y - 80)
                    );
                }
            });
        });
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

        const moveSpeed = this.calculateMoveSpeed();

        if (this.player.alive) {

            // Send player position to network if moving
            if (this.cursors.left.isDown || this.cursors.right.isDown || !this.player.body.onFloor()) {
                this.sendPlayerPosition();
            }

            // Handle horizontal movement
            if (this.cursors.left.isDown) {
                this.handleHorizontalMovement(-moveSpeed, true);
            } else if (this.cursors.right.isDown) {
                this.handleHorizontalMovement(moveSpeed, false);
            } else {
                this.player.body.setVelocityX(0);
                if (this.isGrounded() && !this.effects.fear) {
                    this.playAnimationAndSync(ANIMATION_KEYS.IDLE);
                }
            }

            // Handle jump
            if (this.cursors.up.isDown && (this.isGrounded() || this.effects.fly)) {
                this.audios.effect.jump.play();
                this.player.body.setVelocityY(PHYSICS.JUMP_VELOCITY);
                this.effects.onPlatform = false;
            }

            // Handle jump animation
            if (!this.isGrounded() && !this.effects.fear) {
                this.playAnimationAndSync(ANIMATION_KEYS.JUMP);
            }

            // Handle fear animation
            if (this.effects.fear){
                this.playAnimationAndSync(ANIMATION_KEYS.FEAR);
            }

            // Handle meow
            if (this.cursors.space.isDown) {
                this.server.emit('player:meow');
            }

            // Handle platform idle state
            if (this.effects.onPlatform && this.player.body.velocity.x === 0){
                this.player.anims.play(ANIMATION_KEYS.IDLE, true);
            } else {
                this.effects.onPlatform = false;
            }

        }

        // Update player list UI periodically (every frame is fine, not expensive)
        this.updatePlayerListUI();
    }

}