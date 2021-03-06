const WebSocketClient	 = require("websocket").client;

class WSClient {

	constructor(host, port, onConnect = die, onData = die, onDisconnect = die, onError = die) {

		this._host = host;
		this._port = port;

		console.log("new ws client :", this._host + ":" + this._port);

		this._connect = onConnect;
		this._data = onData;
		this._disconnect = onDisconnect;
		this._error = onError;

		this._socket = new WebSocketClient();
		this._connection = null;

		this._socket.on("connect", this.onConnect.bind(this));
		this._socket.connect(this._host + ":" + this._port, "echo-protocol");
	}

	onConnect(connection) {
		//console.log("ws client connected to :", this._host + ":" + this._port);
		this._connection = connection;
		this._connection.on("error", this.onError.bind(this));
		this._connection.on("close", this.onDisconnect.bind(this));
		this._connection.on("message", this.onData.bind(this));

		this._connect();
	}

	onData(data) {
		//console.log("ws client data :", data);
		this._data(data);
	}

	onDisconnect() {
		//console.log("ws client disconnect");
		this._disconnect();
	}

	onError(err) {
		//console.log("ws client error", err);
		//this.stop(); // ??
		this._error(err);
	}

	send(data) {
		console.log("ws client send :", data);
		this._connection.send(data);
	}

	stop() {
		console.log("ws client stop");
		this._socket.close();
	}

}

module.exports = WSClient;