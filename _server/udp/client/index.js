const Datagram = require("dgram");

class UDPClient {

	constructor(host, port, onData, onError) {

		this._host = host;
		this._port = port;

		trace("new udp client :", this._host + ":" + this._port);

		this._data = onData;
		this._error = onError;

		this._socket = Datagram.createSocket("udp4");
		this._socket.on("message", this.onData.bind(this));
		this._socket.on("error", this.onError.bind(this));

		this._socket.connect(this._port, this._host);

		this.send("helo");

	}

	onData(data) {
		//trace("udp client data :", data);
		this._data(data);
	}

	onError(err) {
		//trace("udp client error", err);
		this._error(err);
	}

	send(data) {
		trace("udp client send :", data);
		this._socket.send(data, this._port, err => {
			if(err) trace("udp client send error :", err)
		});
	}

	stop() {
		trace("udp client stop");
		this._socket.close();
	}

}

module.exports = UDPClient;