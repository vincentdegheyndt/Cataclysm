const _ = require('lodash');
const Server = require('socket.io')();

const players = []; // All connected players was registered here

Server.listen(process.env.PORT || 9208);
Server.on('connect', (Socket) => {
	console.log(`${Socket.id} was connected..`);
	players.push(Socket.id); // Add player to connected players array

	Server.emit('player:spawn', Socket.id); // Send "player:spawn" to all players
	Socket.emit('player:all', players); // Send "player:all" to all players

	/**
	 * @param {Object} data
	 */
	Socket.on('player:move', (data) => {
		Server.emit('player:moved', Socket.id, data.position, data.flip); // Send "player:moved" to all players with position and flip
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
	 * Handle player winning.
	 */
	Socket.on('player:winning', () => {
		Server.emit('player:winned', Socket.id); // Send "player:winned" to all players
	});

	/**
	 * Handle player disconnect.
	 */
	Socket.on('disconnect', () => {
		Server.emit('player:unspawn', Socket.id); // Send "player:unspawn" to all players
		_.remove(players, (player) => {
			return player === Socket.id;
		}); // Remove the player from the connected players array
		
		console.log(`${Socket.id} was disconnected..`);
  	});
});