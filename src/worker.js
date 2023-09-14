import HTML from 'webpage.html';

// Worker script
export default {
	async fetch(request, env) {
		try {
			// Each unique room name corresponds to a unique Object
			let id = env.EXAMPLE_CLASS.idFromName(new URL(request.url).pathname);
			let stub = await env.EXAMPLE_CLASS.get(id);

			let response = await stub.fetch(request);

			return response;
		} catch (err) {
			return new Response("Encounted an error: " + err.message, { status: 500 });
		}
	}
}

// Durable Object script
export class ExampleClass {
	constructor(state, env) {
		this.state = state;
		this.sessions = [];
	}

	async fetch(request) {
		const path = new URL(request.url).pathname.split("/");
		if (!path[1]) { // root
			return new Response(HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
		} else if (path[1] === "ws") { // return WebSocket
			const pair = new WebSocketPair();

			// get two sides of the socket communication
			const client = pair[0];
			const server = pair[1];
			this.sessions.push(server);

			server.accept();

			server.addEventListener("message", async msg => {
				const data = msg.data;

				for (let sv of this.sessions) {
					try {
						sv.send(data);
					} catch (err) {
						server.send("Error: " + err.message);
					}
				}
			});

			return new Response(null, { status: 101, webSocket: client });
		} else {
			return new Response("Bad request", { status: 500 });
		}
	}
}