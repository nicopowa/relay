const ModuleBase = load("com/base");
const uniqid = outload("uniqid");

const TCPServer = require("./tcp/server");
const IOServer = require("./io/server");
const UDPServer = require("./udp/server");

class Relay extends ModuleBase {

	constructor(app, settings) {
		super(app, settings);

		this.max_points = 50;
		this._min_port = 55500;
		this._max_port = 55599;

		this.points = new Map();
		this.pipes = new Map();
		this.datas = new Map();

		this.constructors = new Map([
			["tcp", TCPServer],
			["udp", UDPServer],
			["ws", IOServer]
		]);

		this._test();
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

	_port(port) {
		return [...this.points.values()].filter(point => point.port === port).length === 1;
	}

	check(req, res, port) {
		let busy = this._port(port);
		this.sendJSON(req, res, 200, {ok: true, msg: busy ? "busy" : "available", port: port});
	}

	start(req, res, type, port) {
		this.sendJSON(req, res, 200, this._start(type, port));
	}

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

		let uid = uniqid(); // gen server id
		this.pipes.set(uid, new Set()); // init pipes
		this.datas.set(uid, (socket, data) => this._data(uid, socket, data)); // data callback
		let serverClass = this.constructors.get(type), server = new serverClass(port, this.datas.get(uid)); // start server
		this.points.set(uid, server); // keep ref
		return {ok: true, msg: "server started", uid: uid, port: port};
	}

	stop(req, res, uid) {
		this.sendJSON(req, res, 200, this._stop(uid));
	}

	_stop(uid) {
		if(!this.points.has(uid)) 
			return {ok: false, msg: "no server", uid: uid};
		this.points.get(uid).stop();
		this.points.delete(uid);
		if(this.pipes.has(uid)) this.pipes.delete(uid);
		return {ok: true, msg: "server stopped", uid: uid};
	}

	pipe(req, res, from, to) {
		this.sendJSON(req, res, 200, this._pipe(from, to));
	}

	_pipe(from, to) {
		if(this.points.has(from)) {
			if(this.pipes.get(from).has(to)) 
				return {ok: false, msg: "already piped", from: from, to: to};
			else {
				if(this.points.has(to)) {
					this.pipes.get(from).add(to);
					return {ok: true, msg: "piped", from: from, to: to};
				}
				return {ok: false, msg: "no server " + to, from: from, to: to};
			}
		}
		return {ok: false, msg: "no server " + from, from: from, to: to};
	}

	unpipe(req, res, from, to) {
		this.sendJSON(req, res, 200, this._unpipe(from, to));
	}

	_unpipe(from, to) {
		if(!this.pipes.has(from)) 
			return {ok: false, msg: "no pipe", from: from, to: to};
		if(this.pipes.get(from).has(to)) {
			this.pipes.get(from).delete(to);
			return {ok: true, msg: "unpipe", from: from, to: to};
		}
		return {ok: false, msg: "no pipe", from: from, to: to};
	}

	send(req, res, uid, ...data) {
		this.sendJSON(req, res, 200, this._send(uid, ...data));
	}

	_send(uid, ...data) {
		if(!this.points.has(uid)) 
			return {ok: false, msg: "no server", uid: uid};
		trace("send", uid, data);
		this.points.get(uid).all(...data);
		return {ok: true, msg: "sent", uid: uid};
	}

	_data(uid, socket, data) {
		// do somthing with data
		this.pipes.get(uid).forEach(pipeuid => this.points.get(pipeuid).all(data)); // pipe
	}
	
}

module.exports = Relay;