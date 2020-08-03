const ModuleBase	 = require("@root/files/base/_server/base");

const TCPServer		 = require("./tcp/server");
const IOServer		 = require("./io/server");
const WSServer		 = require("./ws/server");
const UDPServer		 = require("./udp/server");

class Relay extends ModuleBase {

	constructor(app, settings) {
		super(app, settings);
	}

	async construct() {

		this.max_points = 50; // max servers (all constructors)
		this._min_port = 55500; // from port
		this._max_port = 55599; // to port

		this.points = new Map(); // servers
		this.pipes = new Map(); // pipes
		this.datas = new Map(); // data callbacks

		this.constructors = new Map(Object.entries({ // constructors
			"tcp": TCPServer, 
			"udp": UDPServer, 
			"io": IOServer, 
			"ws": WSServer
		}));

		/*setTimeout(() => {
			let testClass = require("./test.js");
			new testClass(this);
		}, 2500);*/

		return this;
	}

	/**
	 * @method _port : check port in use
	 * @param {number} port 
	 */
	_port(port) {
		return [...this.points.values()].filter(point => point.port === port).length === 1;
	}

	/**
	 * @method check : 
	 * @param {http.Request} req : 
	 * @param {http.Response} res : 
	 * @param {number} port : 
	 */
	check(req, res, port) {
		this.send200(res, {ok: true, msg: this._port(port) ? "busy" : "available", port: port});
	}

	/**
	 * @method start : 
	 * @param {http.Request} req : 
	 * @param {http.Response} res : 
	 * @param {string} type : 
	 * @param {number} port : 
	 */
	start(req, res, type, port) {
		this.send200(res, this._start(type, port));
	}

	/**
	 * @method _start : start server
	 * @param {string} type : tcp io ws udp
	 * @param {number} port : server port
	 */
	_start(type, port) {
		if(!this.constructors.has(type)) // check server type exists
			return {ok: false, msg: "no " + type};
		if(isNaN(port)) // check port is valid
			return {ok: false, msg: "invalid port : " + port};
		if(port < this._min_port || port > this._max_port) // check port in authorized range
			return {ok: false, msg: this._min_port + " < port < " + this._max_port};
		if(this.points.size >= this.max_points) // check not too many servers running
			return {ok: false, msg: "too many servers running"};
		if(this._port(port)) // check port is available
			return {ok: false, msg: "port " + port + " is busy"};

		let uid = this._uid(); // gen server uid
		this.pipes.set(uid, new Set()); // init pipes
		this.datas.set(uid, (socket, data) => this._data(uid, socket, data)); // data callback
		let serverClass = this.constructors.get(type), server = new serverClass(port, this.datas.get(uid)); // start server
		this.points.set(uid, server); // keep server ref
		return {ok: true, msg: "server started", uid: uid, type: type, port: port};
	}

	/**
	 * @method stop : 
	 * @param {http.Request} req : 
	 * @param {http.Response} res : 
	 * @param {string} uid : 
	 */
	stop(req, res, uid) {
		this.send200(res, this._stop(uid));
	}

	/**
	 * @method _stop : stop server
	 * @param {string} uid : server uid
	 */
	_stop(uid) {
		if(!this.points.has(uid)) // check server exists
			return {ok: false, msg: "no server", uid: uid};
		this.points.get(uid).stop(); // stop it
		this.points.delete(uid); // delete it
		this.pipes.delete(uid); // delete pipes
		this.pipes.forEach(pipes => { // delete back pipes
			if(pipes.has(uid)) pipes.delete(uid);
		});
		return {ok: true, msg: "server stopped", uid: uid};
	}

	/**
	 * @method pipe : 
	 * @param {http.Request} req : 
	 * @param {http.Response} res : 
	 * @param {string} from : 
	 * @param {string} to : 
	 */
	pipe(req, res, from, to) {
		this.send200(res, this._pipe(from, to));
	}

	/**
	 * @method _pipe : pipe data between servers
	 * @param {string} from : origin uid
	 * @param {string} to : target uid
	 */
	_pipe(from, to) {
		if(this.points.has(from)) { // check origin exists
			if(from === to)  // check not piping to self
				return {ok: false, msg: "no black hole please", from: from, to: to};
			if(this.pipes.get(from).has(to)) // check not already piped
				return {ok: false, msg: "already piped", from: from, to: to};
			else {
				if(this.points.has(to)) { // check target exists
					this.pipes.get(from).add(to); // add pipe
					return {ok: true, msg: "pipe", from: from, to: to};
				}
				return {ok: false, msg: "no server " + to, from: from, to: to};
			}
		}
		return {ok: false, msg: "no server " + from, from: from, to: to};
	}

	unpipe(req, res, from, to) {
		this.send200(res, this._unpipe(from, to));
	}

	/**
	 * @method _unpipe : unpipe data
	 * @param {string} from : origin uid
	 * @param {string} to : target uid
	 */
	_unpipe(from, to) {
		if(!this.pipes.has(from))  // check origin exists
			return {ok: false, msg: "no pipe", from: from, to: to};
		if(this.pipes.get(from).has(to)) { // check target exists
			this.pipes.get(from).delete(to); // delete pipe
			return {ok: true, msg: "unpipe", from: from, to: to};
		}
		return {ok: false, msg: "no pipe", from: from, to: to};
	}

	/**
	 * @method send : 
	 * @param {http.Request} req : 
	 * @param {http.Response} res : 
	 * @param {string} uid : 
	 * @param  {...*} data : 
	 */
	send(req, res, uid, ...data) {
		this.send200(res, this._send(uid, ...data));
	}

	/**
	 * @method _send : send data to server
	 * @param {string} uid : server uid
	 * @param {...*} data : some data
	 */
	_send(uid, ...data) {
		if(!this.points.has(uid)) return {ok: false, msg: "no server", uid: uid};
		console.log("send", uid, data);
		this.points.get(uid).all(...data);
		return {ok: true, msg: "sent", uid: uid};
	}

	/**
	 * @method _data : all servers data callback
	 * @param {string} uid : server uid
	 * @param {*} socket : emitter socket
	 * @param {*} data : received data
	 */
	_data(uid, socket, data) {
		// do something with data before dispatch ?
		this.pipes.get(uid).forEach(pipeuid => { // pipe data
			console.log("pipe to", pipeuid);
			this.points.get(pipeuid).all(data); // send to all pipe clients
		});
	}

	/**
	 * @method _uid : generate short uids
	 * @return {string} generated uid
	 */
	_uid() {
		return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toLowerCase();
	}
	
}

module.exports = Relay;