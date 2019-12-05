const ModuleBase = load("com/base");

const TCPServer = require("./tcp/server");
const IOServer = require("./io/server");
const WSServer = require("./ws/server");
const UDPServer = require("./udp/server");

class Relay extends ModuleBase {

	constructor(app, settings) {
		super(app, settings);

		this.max_points = 50; // max servers (all constructors)
		this._min_port = 55500; // from port
		this._max_port = 55599; // to port

		this.points = new Map(); // servers
		this.pipes = new Map(); // pipes
		this.datas = new Map(); // data callbacks

		this.constructors = new Map([ // constructors
			["tcp", TCPServer], 
			["udp", UDPServer], 
			["io", IOServer], 
			["ws", WSServer]
		]);

		//this._test();
	}

	_test() {

		let tcp = this._start("tcp", 55555);
		console.log("tcp", tcp);
		let ws = this._start("ws", 55556);
		console.log("ws", ws);

		let pipe = this._pipe(tcp.uid, ws.uid);
		console.log("pipe", pipe);

		let around = this._pipe(ws.uid, tcp.uid);
		console.log("pipe", around);

		console.log("check", this._port(55556));

	}

	/**
	 * @method _port : check port in use
	 * @param {number} port 
	 */
	_port(port) {
		return [...this.points.values()].filter(point => point.port === port).length === 1;
	}

	check(req, res, port) {
		this.sendJSON(req, res, 200, {ok: true, msg: this._port(port) ? "busy" : "available", port: port});
	}

	start(req, res, type, port) {
		this.sendJSON(req, res, 200, this._start(type, port));
	}

	/**
	 * @method _start : start server
	 * @param {string} type : 
	 * @param {number} port : 
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
		this.points.set(uid, server); // keep ref
		return {ok: true, msg: "server started", uid: uid, type: type, port: port};
	}

	stop(req, res, uid) {
		this.sendJSON(req, res, 200, this._stop(uid));
	}

	/**
	 * @method _stop : stop server
	 * @param {string} uid 
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

	pipe(req, res, from, to) {
		this.sendJSON(req, res, 200, this._pipe(from, to));
	}

	/**
	 * @method _pipe : pipe data between servers
	 * @param {string} from : origin uid
	 * @param {string} to : target uid
	 */
	_pipe(from, to) {
		if(this.points.has(from)) { // check origin exists
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
		this.sendJSON(req, res, 200, this._unpipe(from, to));
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

	send(req, res, uid, ...data) {
		this.sendJSON(req, res, 200, this._send(uid, ...data));
	}

	/**
	 * @method _send : send data to server
	 * @param {string} uid : server uid
	 * @param  {...*} data : some data
	 */
	_send(uid, ...data) {
		if(!this.points.has(uid)) 
			return {ok: false, msg: "no server", uid: uid};
		trace("send", uid, data);
		this.points.get(uid).all(...data);
		return {ok: true, msg: "sent", uid: uid};
	}

	/**
	 * @method _data : all servers data callback
	 * @param {string} uid 
	 * @param {*} socket 
	 * @param {*} data 
	 */
	_data(uid, socket, data) {
		// do something with data before dispatch ?
		this.pipes.get(uid).forEach(pipeuid => this.points.get(pipeuid).all(data)); // pipe data
	}

	/**
	 * @method _uid : generate short uids
	 */
	_uid() {
		return (Date.now().toString(36) + Math.random().toString(36).substr(2, 5)).toLowerCase();
	}
	
}

module.exports = Relay;