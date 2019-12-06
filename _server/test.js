const IOClient = require("./io/client");
const TCPClient = require("./tcp/client");
const UDPClient = require("./udp/client");
const WSClient = require("./ws/client");

class RelayTest {

	constructor(relay) {
		this.relay = relay;

		this._test();
	}

	_wait(ms = 500) {
		trace("");
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async _test() {

		trace("test relay");

		await this._wait();

		let tcp = this.relay._start("tcp", 55555);
		trace(tcp);

		await this._wait();

		let io = this.relay._start("io", 55556);
		trace(io);

		await this._wait();

		let udp = this.relay._start("udp", 55557);
		trace(udp);

		await this._wait();

		let ws = this.relay._start("ws", 55558);
		trace(ws);

		await this._wait();

		let tcptoio = this.relay._pipe(tcp.uid, io.uid);
		trace("pipe", tcptoio);
		let iototcp = this.relay._pipe(io.uid, tcp.uid);
		trace("pipe", iototcp);
		let udptotcp = this.relay._pipe(udp.uid, tcp.uid);
		trace("pipe", udptotcp);
		let tcptoudp = this.relay._pipe(tcp.uid, udp.uid);
		trace("pipe", tcptoudp);
		let tcptows = this.relay._pipe(tcp.uid, ws.uid);
		trace("pipe", tcptows);
		let wstotcp = this.relay._pipe(ws.uid, tcp.uid);
		trace("pipe", wstotcp);

		await this._wait();

		trace("check", this.relay._port(55556));

		await this._wait();

		let tcpclient = new TCPClient("localhost", 55555,
			() => trace("tcp client connect"),
			data => trace("tcp client data :", data),
			() => trace("tcp client disconnect"),
			err => trace("tcp client error :", err)
		);

		await this._wait();

		let ioclient = new IOClient("http://localhost", 55556,
			() => trace("io client connect"),
			data => trace("io client data :", data),
			() => trace("io client disconnect"),
			err => trace("io client error :", err)
		);

		await this._wait();

		let udpclient = new UDPClient("localhost", 55557,
			data => trace("udp client data :", data),
			err => trace("udp client error :", err)
		);

		await this._wait();

		let wsclient = new WSClient("ws://localhost", 55558,
			() => trace("ws client connect"),
			data => trace("ws client data :", data),
			() => trace("ws client disconnect"),
			err => trace("ws client error :", err)
		);

		await this._wait();

		ioclient.send("haha", "hoho");

		await this._wait();

		tcpclient.send("hahaha");

		await this._wait();

		udpclient.send("hahaha");

		await this._wait();

		wsclient.send("hahaha");

	}

}

module.exports = RelayTest;