const SocketIOClient = outload("socket.io-client");

class IOClient {

	constructor(host, port, onConnect = die, onData = die, onDisconnect = die, onError = die) {

		this._host = host;
		this._port = port;

		trace("new io client :", this._host + ":" + this._port);

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
		//trace("io client connected to :", this._host + ":" + this._port);
		this._connect();
	}

	onData(data) {
		//trace("io client data :", data);
		this._data(data);
	}

	onDisconnect() {
		//trace("io client disconnect");
		this._disconnect();
	}

	onError(err) {
		//trace("io client error", err);
		//this.stop(); // ??
		this._error(err);
	}

	send(type, data) {
		trace("io client send :", type, data);
		this._socket.emit(type, data);
	}

	stop() {
		trace("io client stop");
		this._socket.close();
	}

}

module.exports = IOClient;