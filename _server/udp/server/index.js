const Datagram = require("dgram");

class UDPServer {

	constructor(port, onData = die, onError = die) {

		this._port = port;
		
		this._data = onData;
		this._error = onError;

		this._clients = new Map();
		this._server = Datagram.createSocket("udp4");
		this._server.on("message", this.onData.bind(this));
		this._server.on("error", this.onError.bind(this));
		//this._server.on("listening", () => {});
		this._server.bind(this._port);

		console.log("udp server start", this._port);
	}

	onData(data, socket) {
		socket.name = socket.address + ":" + socket.port;
		if(!this._clients.has(socket.name)) {
			console.log("new udp client :", socket.name);
			this._clients.set(socket.name, {address: socket.address, port: socket.port});
			return; // helo message, no dispatch
		}
		console.log("udp data :", socket.name, ">", data);
		this._data(socket, data);
	}

	onError(err) {
		error("io error :", err);
		this._error(err);
	}

	send(socket, data) {
		this._server.send(data, socket.port, socket.address, err => {
			if(err) console.log("udp send error :", err)
		});
	}

	all(data) {
		console.log("udp send all :", data);
		this._clients.forEach(socket => this.send(socket, data));
	}
	
	stop() {
		console.log("udp server stop", this._port);
		this._clients.clear();
		this._server.close();
	}

	get port() {
		return this._port;
	}

	get clients() {
		return this._clients;
	}

}

module.exports = UDPServer;