const Wss = outload("websocket").server;
const http = require("http");

class WebSocketServer {
	
	constructor(port, onData = die, onError = die, onConnect = die, onDisconnect = die) {
		this._port = port;
		
		this._data = onData;
		this._error = onError;
		this._connect = onConnect;
		this._disconnect = onDisconnect;

		this._http = http.createServer(this.onRequest.bind(this));
		this._http.listen(this._port);

		this._clients = new Map();
		this._server = new Wss({httpServer: this._http});
		this._server.on("request", this.onConnect.bind(this));

		trace("ws server start", this._port);

	}

	onRequest(request, response) {
		trace("ws http", request.url);
		response.writeHead(404);
		response.end();
	}

	onData(socket, data) {
		trace("ws data :", socket.name, ">", data);
		this._data(socket, data.utf8Data || data.binaryData);
	}

	onError(err) {
		error("ws error :", err);
		this._error(err);
	}

	onConnect(request) {
		let socket = request.accept("echo-protocol", request.origin);
		socket.name = socket.remoteAddress + ":" + socket.socket.remotePort;
		trace("new ws client :", socket.name);
		socket.on("message", packet => this.onData(socket, packet));
		socket.on("close", () => this.onDisconnect(socket));
		this._clients.set(socket.name, socket);
		this._connect(socket);
	}

	onDisconnect(socket) {
		trace("ws disconnected :", socket.name);
		this._clients.delete(socket.name);
		this._disconnect(socket);
	}

	send(socket, ...args) {
		socket.send(...args);
	}

	all(...args) {
		trace("ws send all :", args);
		this._clients.forEach(socket => this.send(socket, ...args));
	}

	stop() {
		
	}

}

module.exports = WebSocketServer;