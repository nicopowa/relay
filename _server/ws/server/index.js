const Wss = outload("websocket").server;

class WebSocketServer {
	
	constructor(port, onData, onError, onConnect, onDisconnect) {
		this._port = port;
		
		this._data = onData || die;
		this._error = onError || die;
		this._connect = onConnect || die;
		this._disconnect = onDisconnect || die;

		this.clients = new Map();
		this._server = new Wss({port: this._port});
		this._server.on("connection", this.onConnect.bind(this));

	}

	onData(socket, data) {
		trace("ws data : " + socket.name + " > " + data);
		this._data(socket, data);
	}

	onError(err) {
		error("ws error : " + err);
		this._error(err);
	}

	onConnect(socket) {
		socket.name = socket.remoteAddress + "." + socket.socket.remotePort;
		trace("new ws client : " + socket.name);
		socket.on("message", packet => this.onData(socket, packet));
		socket.on("close", () => this.onDisconnect(socket));
		this.clients.set(socket.name, socket);
		this._connect(socket);
	}

	onDisconnect(socket) {
		trace("ws disconnected : " + socket.name);
		this.clients.delete(socket.name);
		this._disconnect(socket);
	}

	send(socket, ...args) {
		socket.send(...args);
	}

	all(...args) {
		this.clients.forEach(socket => this.send(socket, ...args));
	}

}

module.exports = WebSocketServer;