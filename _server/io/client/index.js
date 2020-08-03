const SocketIOClient = require("socket.io-client");

class IOClient {

	constructor(host, port, onConnect = die, onData = die, onDisconnect = die, onError = die) {

		this._host = host;
		this._port = port;

		console.log("new io client :", this._host + ":" + this._port);

		this._connect = onConnect;
		this._data = onData;
		this._disconnect = onDisconnect;
		this._error = onError;

		this._socket = SocketIOClient(this._host + ":" + this._port);
		this._socket.on("connect", this.onConnect.bind(this));
		this._socket.on("message", this.onData.bind(this));
		this._socket.on("disconnect", this.onDisconnect.bind(this));
		this._socket.on("error", this.onError.bind(this));
	}

	onConnect() {
		//console.log("io client connected to :", this._host + ":" + this._port);
		this._connect();
	}

	onData(data) {
		//console.log("io client data :", data);
		this._data(data);
	}

	onDisconnect() {
		//console.log("io client disconnect");
		this._disconnect();
	}

	onError(err) {
		//console.log("io client error", err);
		//this.stop(); // ??
		this._error(err);
	}

	send(type, data) {
		console.log("io client send :", type, data);
		this._socket.emit(type, data);
	}

	stop() {
		console.log("io client stop");
		this._socket.close();
	}

}

module.exports = IOClient;