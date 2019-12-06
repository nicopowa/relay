const net = require("net");

class TCPClient {

	constructor(host, port, onConnect = die, onData = die, onDisconnect = die, onError = die) {

		this._host = host;
		this._port = port;

		trace("new tcp client :", this._host + ":" + this._port);

		this._connect = onConnect;
		this._data = onData;
		this._disconnect = onDisconnect;
		this._error = onError;

		this._socket = new net.Socket();
		this._socket.connect(this._port, this._host, this.onConnect.bind(this));
		this._socket.on("data", this.onData.bind(this));
		this._socket.on("close", this.onDisconnect.bind(this));
		this._socket.on("error", this.onError.bind(this));
	}

	onConnect() {
		//trace("tcp client connected to :", this._host + ":" + this._port);
		this._connect();
	}

	onData(data) {
		//trace("tcp client data :", data);
		this._data(data);
	}

	onDisconnect() {
		//trace("tcp client disconnect");
		this._disconnect();
	}

	onError(err) {
		//trace("tcp client error", err);
		//this.close(); // ??
		this._error(err);
	}

	send(data) {
		trace("tcp client send :", data);
		this._socket.write(data);
	}

	stop() {
		trace("tcp client stop");
		this._socket.destroy();
	}

}

module.exports = TCPClient;