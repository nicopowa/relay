const Datagram = require("dgram");

class UDPServer {

	constructor(port, onData, onError) {
		this._port = port;
		
		this._data = onData || die;
		this._error = onError || die;

		this.clients = new Map();
		this._server = Datagram.createSocket("udp4");
		this._server.on("message", this.onData.bind(this));
		this._server.on("error", this.onError.bind(this));
		//this._server.on("listening", () => {});
		this._server.bind(this._port);

		trace("UDP server start", this._port);
	}

	onData(data, socket) {
		socket.name = socket.address + ":" + socket.port;
		if(!this.clients.has(socket.name)) this.clients.set(socket.name, {});
		trace("udp data : " + socket.name + " > " + data);
		this._data(socket, data);
	}

	onError(err) {
		error("io error : " + err);
		this._error(err);
	}

	send(socket, data) {
		this._server.send(data, socket.port, socket.remoteAddress, (err) => {
			
		});
	}

	all(data) {
		this.clients.forEach(socket => this.send(socket, data));
	}
	
	stop() {
		trace("UDP server stop", this._port);
		this.clients.clear();
		this._server.close();
	}

	get port() {
		return this._port;
	}

}

module.exports = UDPServer;