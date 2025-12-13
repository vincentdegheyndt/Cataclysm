const Server = require('socket.io')({
    cors: {
		// origin: ["http://localhost:1234", "http://localhost:8080"],
		origin: true,
        methods: ["GET", "POST"]
    }
});

const players = {}; // All connected players was registered here (now an object with player data)
const activatedTraps = []; // Track all activated traps (array of {trapType, position})

Server.listen(process.env.PORT || 9208);
Server.on('connect', (Socket) => {
	console.log(`${Socket.id} was connected..`);

	/**
	 * Handle player registration with name
	 * @param {String} playerName
	 */
	Socket.on('player:register', (playerName) => {
		players[Socket.id] = {
			id: Socket.id,
			name: playerName || 'Anonymous Cat',
			progress: 0
		};

		console.log(`${playerName} (${Socket.id}) registered`);

		// Send spawn event with player name
		Server.emit('player:spawn', Socket.id, playerName);

		// Send all existing players to the new player
		Socket.emit('player:all', players);

		// Send all activated traps to the new player
		Socket.emit('traps:all', activatedTraps);
	});

	/**
	 * @param {Object} data
	 */
	Socket.on('player:move', (data) => {
		// Update player progress
		if (players[Socket.id]) {
			players[Socket.id].progress = data.progress || 0;
		}
		Server.emit('player:moved', Socket.id, data.position, data.flip, data.progress); // Send "player:moved" to all players with position and flip
	});

	/**
	 * @param {String} animation
	 * @param {Boolean} state
	 */
	Socket.on('player:animate', (animation, state) => {
		Server.emit('player:animated', Socket.id, animation, state); // Send "player:animated" to all players to handle the correct animation
	});

	Socket.on('player:meow', () => {
		Server.emit('player:meow', Socket.id); // Send "player:meow" to all players
	});

	/**
	 * Handle player hitting a trap
	 * @param {String} trapType - Type of trap (death, fish, choco, cucumber, bird)
	 * @param {Object} position - Position where trap was hit
	 */
	Socket.on('player:trap', (trapType, position) => {
		// Add to activated traps list
		activatedTraps.push({ trapType, position });

		Server.emit('player:trapped', Socket.id, trapType, position); // Send "player:trapped" to all players
	});

	/**
	 * Handle player winning.
	 */
	Socket.on('player:winning', () => {
		const playerName = players[Socket.id] ? players[Socket.id].name : 'Unknown Player';
		Server.emit('player:winned', Socket.id, playerName); // Send "player:winned" to all players with name
		console.log(`${playerName} (${Socket.id}) won the game!`);
	});

	/**
	 * Handle player disconnect.
	 */
	Socket.on('disconnect', () => {
		const playerName = players[Socket.id] ? players[Socket.id].name : 'Unknown';

		Server.emit('player:unspawn', Socket.id); // Send "player:unspawn" to all players
		delete players[Socket.id]; // Remove the player from the connected players object

		console.log(`${playerName} (${Socket.id}) was disconnected..`);
  	});
});