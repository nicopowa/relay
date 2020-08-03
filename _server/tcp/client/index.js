const net = require("net");

class TCPClient {

	constructor(host, port, onConnect = die, onData = die, onDisconnect = die, onError = die) {

		this._host = host;
		this._port = port;

		console.log("new tcp client :", this._host + ":" + this._port);

		this._connected = false;

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
		//console.log("tcp client connected to :", this._host + ":" + this._port);
		this._connected = true;
		this._connect();
	}

	onData(data) {
		//console.log("tcp client data :", data);
		this._data(data);
	}

	onDisconnect() {
		//console.log("tcp client disconnect");
		this._connected = false;
		this._disconnect();
	}

	onError(err) {
		//console.log("tcp client error", err);
		//this.close(); // ??
		//this._connected = false;
		this._error(err);
	}

	send(data) {
		console.log("tcp client send :", data);
		this._socket.write(data);
	}

	stop() {
		console.log("tcp client stop");
		this._socket.destroy();
		this._connected = false;
	}

	get connected() {
		return this._connected;
	}

}

module.exports = TCPClient;