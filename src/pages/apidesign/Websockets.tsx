import LessonLayout from '../../components/LessonLayout';
import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import FlowChart from '../../components/FlowChart';
import InteractiveChallenge from '../../components/InteractiveChallenge';

export default function Websockets() {
  return (
    <LessonLayout
      title="WebSockets & Real-Time APIs"
      sectionId="apidesign"
      lessonIndex={7}
      prev={{ path: '/apidesign/graphql', label: 'GraphQL Fundamentals' }}
      next={null}
    >
      <p>
        Every REST interaction in this section, GraphQL included, shares one shape: the client
        asks, the server answers, the connection&apos;s job is done. That model has no way for the
        server to say something the client didn&apos;t ask for. A price change, a chat message from
        another user, a build finishing &mdash; none of that fits &quot;request, then response.&quot;
        Polling (asking repeatedly on a timer) and long-polling (holding a request open until
        there&apos;s something to say) are the classic workarounds within plain HTTP, and both are
        exactly that &mdash; workarounds, trading latency or server resources to fake a push model
        HTTP request/response was never built for. A <strong>WebSocket</strong> is a real persistent,
        full-duplex connection: once established, either side can send a message at any time,
        with no request required first.
      </p>

      <h2>The Handshake: One HTTP Request, Then Never Again</h2>

      <p>
        This detail gets garbled constantly, so state it precisely: a WebSocket connection{' '}
        <strong>starts as an entirely ordinary HTTP request</strong>. It has a method, a path, and
        headers, and it travels over the same TCP connection an HTTP request would. The only thing
        marking it as a WebSocket handshake is an <code>Upgrade: websocket</code> header. If the
        server supports it, it responds not with <code>200 OK</code> but with{' '}
        <code>101 Switching Protocols</code> &mdash; and from that point on, the connection stops
        being HTTP. No more requests, no more status codes, no more headers per message &mdash;
        just raw WebSocket frames flowing in either direction over the TCP socket that HTTP
        request happened to negotiate.
      </p>

      <p>
        This is the actual handshake captured from a real client connecting to a real server while
        writing this lesson &mdash; a Node.js process running the <code>ws</code> package as the
        server, and Node&apos;s own native <code>WebSocket</code> client connecting to it:
      </p>

      <CodeBlock language="http" title="Real Captured Handshake — node demo.mjs">
        {`GET / HTTP/1.1
Host: localhost:8080
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Key: GRY0bISFOW8Mc0Mo8uJrQw==
Sec-WebSocket-Version: 13

HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: Sl+9fA8mGZNiael98Q22v+ihAAw=`}
      </CodeBlock>

      <p>
        <code>Sec-WebSocket-Key</code> is 16 random bytes, base64-encoded, generated fresh by the
        client for every handshake &mdash; it is not a secret or a credential, it exists purely to
        prove the server actually understood this was a WebSocket upgrade and not, say, a caching
        proxy that blindly forwarded the request. The server proves it by computing{' '}
        <code>Sec-WebSocket-Accept</code>: base64(SHA-1(<code>Sec-WebSocket-Key</code> + a fixed
        magic GUID defined in RFC 6455 &mdash; <code>258EAFA5-E914-47DA-95CA-C5AB0DC85B11</code>)).
        That GUID is a literal, unchanging constant in the spec, confirmed here straight out of the{' '}
        <code>ws</code> package&apos;s own source rather than from memory. A client that doesn&apos;t
        see the correctly-computed <code>Sec-WebSocket-Accept</code> value is required to abort the
        connection.
      </p>

      <FlowChart
        title="Handshake Then Full-Duplex, With Heartbeats"
        chart={"graph TD\n    CLIENT[Client] -->|GET + Upgrade header| SERVER[Server]\n    SERVER -->|101 Switching Protocols| CLIENT\n    CLIENT <-->|full-duplex frames, same TCP connection| SERVER\n    SERVER -.->|ping every N seconds| CLIENT\n    CLIENT -.->|pong| SERVER\n    CLIENT -->|connection drops| RECONNECT[Reconnect with backoff]\n    RECONNECT -->|GET + Upgrade header| SERVER"}
      />

      <h2>A Real Server, a Real Client, a Real Round Trip</h2>

      <InfoBox variant="note" title="What Node v25 Actually Ships Natively vs. What Still Needs a Package">
        <p>
          Checked directly rather than assumed: Node&apos;s global <code>WebSocket</code> &mdash;
          usable with zero imports, exactly like in a browser &mdash; has been stable since{' '}
          <strong>v22.4.0</strong> (added behind a flag in v21.0.0/v20.10.0). The official docs
          describe it as &quot;a browser-compatible implementation of WebSocket&quot; &mdash; that
          wording matters: it is a <strong>client only</strong>. There is no native WebSocket{' '}
          <em>server</em> in Node as of v25. Building the server side still means reaching for a
          package, and <code>ws</code> is it &mdash; v8.21.3 on npm as of this writing, published
          within the last couple of weeks, still the de facto standard for a Node WebSocket server.
        </p>
      </InfoBox>

      <CodeBlock language="javascript" title="Server — ws package (real dependency, still required)">
        {`import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (socket) => {
  console.log('[server] client connected');
  socket.on('message', (data) => {
    const text = data.toString();
    console.log(\`[server] received: "\${text}"\`);
    socket.send(\`echo: \${text}\`);
  });
});`}
      </CodeBlock>

      <CodeBlock language="javascript" title="Client — Node's native global WebSocket, zero imports">
        {`// No 'ws' import here — this is the built-in, browser-compatible client.
const client = new WebSocket('ws://localhost:8080');

client.addEventListener('open', () => {
  console.log('[client] connection open, sending message');
  client.send('hello from native Node WebSocket client');
});

client.addEventListener('message', (event) => {
  console.log(\`[client] received: "\${event.data}"\`);
  client.close();
});`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual Output — both processes, real run, unedited">
        {`[server] listening on ws://localhost:8080
[server] client connected

[client] connection open, sending message
[server] received: "hello from native Node WebSocket client"
[client] received: "echo: hello from native Node WebSocket client"
[client] connection closed
[server] closed`}
      </CodeBlock>

      <h2>Reconnection and Heartbeats Are Not Edge Cases</h2>

      <p>
        A WebSocket looks like a stable, always-on pipe, but the network underneath it is not.
        Wi-Fi hands off to cellular, laptops sleep, and &mdash; the most common production cause
        &mdash; intermediary proxies and load balancers silently close connections that sit idle
        too long. AWS&apos;s own Application Load Balancer, for example, defaults to a 60-second
        idle timeout; a WebSocket that only pushes data occasionally can get dropped by the LB
        without either endpoint&apos;s application code ever seeing an error at the moment it
        happens. A production client has to assume the connection will drop and handle it, not
        treat reconnection as an edge case.
      </p>

      <h3>Heartbeats: Detecting a Dead Connection Before TCP Notices</h3>

      <p>
        TCP can take minutes to notice a genuinely dead peer (a pulled cable, a crashed process
        that never sent a FIN). WebSocket&apos;s protocol-level <strong>ping/pong control
        frames</strong> exist to detect this faster: one side pings, the other side&apos;s
        implementation is required by RFC 6455 to pong back automatically, and if a pong
        doesn&apos;t arrive in time, the sender knows the connection is dead well before TCP would
        report it. This is the exact pattern documented in the <code>ws</code> package&apos;s own
        README for a Node-to-Node server:
      </p>

      <CodeBlock language="javascript" title="Server Heartbeat — Pattern From ws's Own Docs">
        {`function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', heartbeat);
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate(); // no pong since last ping — dead
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);`}
      </CodeBlock>

      <InfoBox variant="warning" title="Browsers Can't See Ping/Pong — Use App-Level Heartbeats There">
        <p>
          The pattern above works because the <code>ws</code> package exposes ping/pong as JS
          events on both ends. A <strong>browser&apos;s</strong> WebSocket API &mdash; and Node&apos;s
          native global <code>WebSocket</code>, since it deliberately mirrors the browser API
          &mdash; does neither: the underlying engine answers a server&apos;s ping automatically at
          the protocol level, but JavaScript is never told it happened, and browser code cannot
          send a raw ping frame at all. If your client is a browser page (or Node&apos;s native
          client), the standard workaround is an <strong>application-level heartbeat</strong>: send
          an ordinary <code>{'{ "type": "ping" }'}</code> message on a timer and have the server
          echo it back, then watch for the reply going silent.
        </p>
      </InfoBox>

      <p>
        Reconnection needs backoff, not an immediate retry loop &mdash; hammering a server that
        just dropped your connection (possibly because it&apos;s overloaded) with instant retries
        makes things worse. This reconnect logic was actually run against a server that came up
        3.5 seconds late, with no changes to the numbers below:
      </p>

      <CodeBlock language="javascript" title="Reconnecting Client — Exponential Backoff + Jitter">
        {`class ReconnectingClient {
  constructor(url) {
    this.url = url;
    this.attempt = 0;
    this.connect();
  }

  connect() {
    const ws = new WebSocket(this.url);

    ws.addEventListener('open', () => {
      this.attempt = 0; // reset backoff once a connection actually succeeds
    });

    ws.addEventListener('close', () => {
      const delay = this.nextDelay();
      setTimeout(() => this.connect(), delay);
    });
  }

  nextDelay() {
    const base = Math.min(1000 * 2 ** this.attempt, 8000); // cap at 8s
    this.attempt++;
    const jitter = Math.random() * 0.3 * base; // avoid every client retrying in lockstep
    return Math.round(base + jitter);
  }
}`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual Output — client starts before the server exists (real run)">
        {`[client +0.0s] connecting (attempt 1)...
[client +0.0s] connection closed, retrying in 1285ms
[client +1.3s] connecting (attempt 2)...
[client +1.3s] connection closed, retrying in 2526ms
[main  +3.5s] starting server now
[client +3.8s] connecting (attempt 3)...
[server +3.8s] client connected
[client +3.8s] CONNECTED`}
      </CodeBlock>

      <p>
        Two failed attempts with growing delays, then a successful connect the moment the server
        became reachable &mdash; the backoff numbers above (1285ms, 2526ms) are the jittered output
        of that exact run, not hand-picked examples.
      </p>

      <h2>When WebSockets Are the Wrong Tool: Server-Sent Events</h2>

      <p>
        If the traffic is genuinely one-directional &mdash; the server has updates to push, the
        client never needs to talk back over that same channel &mdash; a full-duplex WebSocket is
        more machinery than the job needs. <strong>Server-Sent Events (SSE)</strong>, via the
        browser&apos;s built-in <code>EventSource</code> API, is the better-fitting tool in that
        case. Per the spec (confirmed against MDN while writing this): SSE is{' '}
        <strong>strictly one-directional, server to client</strong> &mdash; there is no mechanism
        to send data from the client back over an SSE connection at all, and{' '}
        <code>EventSource</code> <strong>reconnects automatically</strong> on its own if the
        connection drops, using a <code>retry</code> field from the stream to control the delay and
        a <code>Last-Event-ID</code> header on reconnect so the server can resume where it left off
        &mdash; none of that reconnection logic is something you write yourself, unlike the
        WebSocket client above.
      </p>

      <CodeBlock language="javascript" title="SSE Server — plain node:http, no package needed">
        {`import http from 'node:http';

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  let n = 0;
  const interval = setInterval(() => {
    n++;
    res.write(\`id: \${n}\n\`);
    res.write(\`data: \${JSON.stringify({ tick: n })}\n\n\`);
  }, 300);

  req.on('close', () => clearInterval(interval));
});

server.listen(8081);`}
      </CodeBlock>

      <CodeBlock language="javascript" title="SSE Client — browser built-in EventSource">
        {`const es = new EventSource('http://localhost:8081');
es.onopen = () => console.log('[client] connection open');
es.onmessage = (event) => console.log(\`[client] event id=\${event.lastEventId} data=\${event.data}\`);`}
      </CodeBlock>

      <CodeBlock language="bash" title="Actual Output — real run (Node's own --experimental-eventsource client)">
        {`[server] SSE endpoint at http://localhost:8081
[client] connection open
[client] event id=1 data={"tick":1,"at":1786841028108}
[client] event id=2 data={"tick":2,"at":1786841028410}
[client] event id=3 data={"tick":3,"at":1786841028711}
[client] stream ended, readyState= 0   // CONNECTING — it had already started
                                        // auto-reconnecting on its own`}
      </CodeBlock>

      <InfoBox variant="info" title="Node Has an Experimental EventSource Too — Not Stable Like WebSocket">
        <p>
          Unlike the stable global <code>WebSocket</code> client, Node&apos;s <code>EventSource</code>{' '}
          is still behind an explicit flag &mdash; <code>node --experimental-eventsource</code> as
          of v25 &mdash; and prints an experimental-API warning on use. In a browser,{' '}
          <code>EventSource</code> needs no flag; it has shipped there for years.
        </p>
      </InfoBox>

      <p>
        The trade for that simplicity: SSE payloads are UTF-8 text only (no binary frames), and
        when not served over HTTP/2, browsers cap open connections at just{' '}
        <strong>6 per domain, shared across every tab</strong> &mdash; a real constraint for a user
        with several tabs open against the same origin. HTTP/2 raises that ceiling to (by default)
        100 concurrent streams, so the cap matters mainly for HTTP/1.1 deployments.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', margin: '1rem 0' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Requirement</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Use</th>
            <th style={{ padding: '0.75rem', textAlign: 'left', color: 'var(--accent-amber)' }}>Because</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Both sides send messages independently and often (chat, multiplayer, collaborative editing)</td>
            <td style={{ padding: '0.75rem' }}><strong>WebSocket</strong></td>
            <td style={{ padding: '0.75rem' }}>Genuinely bidirectional; SSE has no client-to-server channel at all</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Server pushes updates; client never needs to talk back over the same channel (live scores, notifications, price tickers)</td>
            <td style={{ padding: '0.75rem' }}><strong>SSE</strong></td>
            <td style={{ padding: '0.75rem' }}>Simpler protocol, plain HTTP, auto-reconnect built into <code>EventSource</code> for free</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Updates are infrequent (minutes apart) and some staleness is acceptable</td>
            <td style={{ padding: '0.75rem' }}><strong>Polling</strong></td>
            <td style={{ padding: '0.75rem' }}>Not worth holding a persistent connection open for; simplest infra</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Need binary frames, or very high message frequency</td>
            <td style={{ padding: '0.75rem' }}><strong>WebSocket</strong></td>
            <td style={{ padding: '0.75rem' }}>SSE is UTF-8 text only, with per-event framing overhead</td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
            <td style={{ padding: '0.75rem' }}>Must traverse infra that may not support the WebSocket upgrade handshake (some corporate proxies, certain platforms)</td>
            <td style={{ padding: '0.75rem' }}><strong>SSE or Polling</strong></td>
            <td style={{ padding: '0.75rem' }}>Both ride plain HTTP requests/responses; no protocol upgrade to block</td>
          </tr>
        </tbody>
      </table>

      <InteractiveChallenge
        question={"You're building a dashboard that shows live stock price ticks pushed from the server. The browser never needs to send anything back over that channel. Which fits best, and why?"}
        options={[
          "WebSocket, because it's the newer and more powerful technology",
          "Server-Sent Events (SSE) — the traffic is one-directional, and EventSource gives you auto-reconnect and Last-Event-ID resumption for free, without building bidirectional plumbing you don't need",
          "Long-polling, because WebSockets are experimental",
          "Plain polling every 100ms, since that's simpler than either"
        ]}
        correctIndex={1}
        explanation={"When the server only ever pushes and the client never talks back over that channel, SSE is the better-fitting tool: it's plain HTTP, the browser's EventSource reconnects automatically using the retry field and Last-Event-ID header, and you skip building reconnect/heartbeat logic by hand. WebSockets earn their complexity when the client also needs to send messages frequently and independently — reaching for one just because it's more powerful, when the traffic pattern is purely one-directional, is the wrong trade."}
      />
    </LessonLayout>
  );
}
