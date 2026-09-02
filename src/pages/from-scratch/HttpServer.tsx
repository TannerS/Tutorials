import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function FromScratchHttpServer() {
  return (
    <LessonLayout
      title="Build an HTTP Server from Sockets"
      sectionId="from-scratch"
      lessonIndex={3}
      prev={{ path: '/from-scratch/storage', label: 'Build a Key-Value Store with a Write-Ahead Log' }}
      next={{ path: '/from-scratch/consensus', label: 'Build Raft: Leader Election & Log Replication' }}
    >
      <p>
        HTTP is a text protocol over a byte stream. That sentence is the whole lesson. Everything
        that feels magical about Tomcat, Netty, nginx, or a load balancer is a consequence of two
        facts: TCP gives you an <em>unframed</em> stream of bytes, and HTTP has to find message
        boundaries inside it.
      </p>

      <p>
        Every measurement below was compiled and run on the machine that wrote this lesson &mdash;
        JDK 26.0.1, 14 cores, macOS 26.5, everything bound to <code>127.0.0.1</code>. Output is
        pasted verbatim, never paraphrased. Timings are hardware-specific; the shapes are not.
      </p>

      <h2>Step 1: The Smallest Thing curl Will Talk To</h2>

      <p>
        A <code>ServerSocket</code>, an <code>accept()</code>, a read, a write. No parsing at all
        &mdash; we are only trying to see what a real client actually sends.
      </p>

      <CodeBlock language="java" title="Step1Echo.java — accept one connection, dump the bytes">
{`try (ServerSocket server = new ServerSocket()) {
    server.bind(new InetSocketAddress("127.0.0.1", 8080));

    try (Socket conn = server.accept()) {          // blocks until a client arrives
        InputStream in = conn.getInputStream();
        OutputStream out = conn.getOutputStream();

        byte[] buf = new byte[8192];
        int n = in.read(buf);                       // NOT a correct read loop -- see Step 2
        String raw = new String(buf, 0, n, StandardCharsets.US_ASCII);

        System.out.println("--- received " + n + " bytes ---");
        System.out.print(raw.replace("\\r", "\\\\r").replace("\\n", "\\\\n\\n"));

        String body = "hello\\n";
        out.write(("HTTP/1.1 200 OK\\r\\n"
                 + "Content-Type: text/plain\\r\\n"
                 + "Content-Length: " + body.length() + "\\r\\n"
                 + "\\r\\n"
                 + body).getBytes(StandardCharsets.US_ASCII));
        out.flush();
    }
}`}
      </CodeBlock>

      <p>
        Run it, point <code>curl</code> at it, and look at what came down the wire. The escapes are
        printed literally so the line endings are visible:
      </p>

      <CodeBlock language="text" title="Real output — the exact bytes curl 8.7.1 sent">
{`listening on 127.0.0.1:8080
--- received 82 bytes ---
GET /hello HTTP/1.1\\r\\n
Host: 127.0.0.1:8080\\r\\n
User-Agent: curl/8.7.1\\r\\n
Accept: */*\\r\\n
\\r\\n
--- end ---`}
      </CodeBlock>

      <p>
        Eighty-two bytes. That is the entire request. Note what is <em>not</em> there: no length
        prefix, no framing header, no message-type byte. The only structural markers in the whole
        thing are <code>\r\n</code> between lines and one empty line at the end.
      </p>

      <p>And curl was perfectly happy with the hand-typed response:</p>

      <CodeBlock language="text" title="Real output — curl -sv --http1.1 http://127.0.0.1:8080/hello">
{`*   Trying 127.0.0.1:8080...
* Connected to 127.0.0.1 (127.0.0.1) port 8080
> GET /hello HTTP/1.1
> Host: 127.0.0.1:8080
> User-Agent: curl/8.7.1
> Accept: */*
>
* Request completely sent off
< HTTP/1.1 200 OK
< Content-Type: text/plain
< Content-Length: 6
<
{ [6 bytes data]
* Connection #0 to host 127.0.0.1 left intact
hello`}
      </CodeBlock>

      <InfoBox variant="note" title="You are now an HTTP server">
        <p>
          There is no HTTP layer in the operating system. <code>ServerSocket</code> gave you TCP; a
          string with the right bytes in it gave you HTTP. Every web server on earth is doing
          exactly this underneath, and the remaining 20,000 lines are about doing it{' '}
          <em>correctly</em>, <em>concurrently</em>, and <em>safely</em> &mdash; which is the rest
          of this lesson.
        </p>
      </InfoBox>

      <h2>Step 2: Parse the Head by Hand</h2>

      <p>
        Step 1 called <code>in.read(buf)</code> once and treated the result as a request. That is
        the single most common beginner bug in socket code, and it is worth watching it fail. Here
        a client sends the same request in two TCP segments 200ms apart &mdash; which is what a
        request crossing a real network looks like:
      </p>

      <CodeBlock language="java" title="Step2Split.java — the client splits mid-header">
{`o.write("GET /split HTTP/1.1\\r\\nHo".getBytes(US_ASCII));
o.flush();
Thread.sleep(200);
o.write("st: 127.0.0.1:8081\\r\\n\\r\\n".getBytes(US_ASCII));
o.flush();`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — one read() against a split request">
{`one read() returned 23 bytes:
  GET /split HTTP/1.1\\r\\nHo
ends with blank line? false`}
      </CodeBlock>

      <InfoBox variant="warning" title="TCP has no messages">
        <p>
          The request was cut in half in the middle of the word <code>Host</code>. TCP guarantees
          that bytes arrive in order and unduplicated; it guarantees <em>nothing</em> about where
          the boundaries between your <code>write()</code> calls land. One write can arrive as
          five reads, five writes can arrive as one read. A request is not &ldquo;whatever one
          read returned&rdquo; &mdash; it is a thing you must keep reading until <em>you</em>{' '}
          detect its end marker.
        </p>
      </InfoBox>

      <p>
        So the parser has to read to a delimiter, not to a buffer size. HTTP/1.1&apos;s delimiters
        are <code>CRLF</code> between lines and a bare <code>CRLF</code> line to end the head:
      </p>

      <FlowChart
        title="Where the head ends"
        chart={"graph TD\n  A[\"read one CRLF line\"] --> B{\"first line?\"}\n  B -->|yes| C[\"method SP target SP version\"]\n  C --> A\n  B -->|no| D{\"line empty?\"}\n  D -->|no| E[\"name COLON OWS value<br/>lowercase the name<br/>append to a LIST\"]\n  E --> A\n  D -->|yes| F[\"head is over<br/>body starts at the next byte\"]\n  style F fill:#1a3329\n  style D fill:#1a2744"}
      />

      <CodeBlock language="java" title="Step2Parse.java — read a line, then the headers">
{`/** Reads one CRLF-terminated line. Returns null at EOF. Rejects a bare LF. */
static String readLine(InputStream in) throws IOException {
    ByteArrayOutputStream buf = new ByteArrayOutputStream();
    int prev = -1, c;
    while ((c = in.read()) != -1) {
        if (prev == '\\r' && c == '\\n') {
            byte[] b = buf.toByteArray();
            return new String(b, 0, b.length - 1, US_ASCII);   // drop the trailing \\r
        }
        if (c == '\\n' && prev != '\\r') throw new IOException("bare LF in head (400)");
        buf.write(c);
        prev = c;
    }
    return null;
}

static Request parse(InputStream in) throws IOException {
    String[] parts = readLine(in).split(" ");           // method, target, version
    Map<String, List<String>> headers = new LinkedHashMap<>();
    String line;
    while (!(line = readLine(in)).isEmpty()) {          // blank line ends the head
        int colon = line.indexOf(':');
        if (colon < 0) throw new IOException("header with no colon: " + line);
        String name  = line.substring(0, colon).toLowerCase(Locale.ROOT);  // case-insensitive
        String value = line.substring(colon + 1).strip();                  // strip optional ws
        headers.computeIfAbsent(name, k -> new ArrayList<>()).add(value);  // KEEP duplicates
    }
    return new Request(parts[0], parts[1], parts[2], headers);
}`}
      </CodeBlock>

      <p>
        Four spec details are baked into those twenty lines, and each one is a real bug if you
        skip it. Drive the server with raw bytes to see them:
      </p>

      <CodeBlock language="bash" title="Sending a request by hand, no client library involved">
{`printf 'GET /x HTTP/1.1\\r\\nHOST: 127.0.0.1\\r\\nx-Trace: alpha\\r\\nX-TRACE: beta\\r\\nAccept:    */*   \\r\\n\\r\\n' \\
  | nc 127.0.0.1 8080`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — what the parser understood">
{`HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 139

method=GET target=/x version=HTTP/1.1
  host -> [127.0.0.1]
  x-trace -> [alpha, beta]
  accept -> [*/*]
host lookup (any case): 127.0.0.1`}
      </CodeBlock>

      <ul>
        <li>
          <strong>Header names are case-insensitive.</strong> <code>HOST</code>,{' '}
          <code>x-Trace</code>, and <code>X-TRACE</code> all arrived in different cases and all
          resolved. Lowercase on the way in, or you will write a <code>Content-Length</code> check
          that a client defeats by sending <code>content-length</code>.
        </li>
        <li>
          <strong>Duplicates are legal and must not be silently dropped.</strong>{' '}
          <code>x-trace</code> came in twice and the parser kept both as a list. A{' '}
          <code>Map&lt;String, String&gt;</code> here is a security bug, not a simplification
          &mdash; see the smuggling box below.
        </li>
        <li>
          <strong>Optional whitespace after the colon is not part of the value.</strong>{' '}
          <code>Accept:    */*   </code> parsed to <code>*/*</code>. That is what{' '}
          <code>.strip()</code> is doing, and forgetting it produces values with invisible
          leading spaces that fail equality checks.
        </li>
        <li>
          <strong>The line ending is CRLF, not LF.</strong> Sending Unix line endings to this
          parser is rejected outright:
        </li>
      </ul>

      <CodeBlock language="text" title="Real output — printf 'GET /x HTTP/1.1\nHost: 127.0.0.1\n\n' | nc">
{`HTTP/1.1 200 OK
Content-Type: text/plain
Content-Length: 35

PARSE ERROR: bare LF in head (400)`}
      </CodeBlock>

      <InfoBox variant="danger" title="This is where request smuggling lives">
        <p>
          Being sloppy about any of the four rules above is how HTTP request smuggling works. The
          classic version: a front-end proxy and a back-end server disagree about the length of a
          request &mdash; because one honours <code>Content-Length</code> and the other honours{' '}
          <code>Transfer-Encoding</code>, or because one takes the <em>first</em> duplicate
          header and the other takes the <em>last</em>. The bytes that one of them considers to be
          the tail of request A, the other considers to be the head of request B, and an attacker
          gets to prepend arbitrary content to another user&apos;s request.
        </p>
        <p>
          The defence is not clever parsing. It is being strict: reject a message that has both{' '}
          <code>Content-Length</code> and <code>Transfer-Encoding</code>, reject duplicate{' '}
          <code>Content-Length</code> values that disagree, and reject a bare LF where the spec
          requires CRLF. RFC 9112 says exactly this, and it says it because of these attacks.
        </p>
      </InfoBox>

      <h2>Step 3: Content-Length Is a Promise, and Clients Believe It</h2>

      <p>
        A response is a status line, headers, a blank line, and a body. The body has no terminator
        &mdash; the client knows where it ends only because <code>Content-Length</code> told it.
        That makes the header a load-bearing promise. Getting it wrong does not produce a nice
        error; it produces one of the two most confusing failures in networking.
      </p>

      <p>
        The test server always writes the same 26-byte body, <code>abcdefghijklmnopqrstuvwxyz</code>,
        and lies about its length depending on the path:
      </p>

      <CodeBlock language="java" title="Step3Length.java — the lie is one variable">
{`String body = "abcdefghijklmnopqrstuvwxyz";   // exactly 26 bytes
int declared = switch (target) {
    case "/short"                -> 5;      // under-declare
    case "/long", "/long-close"  -> 100;    // over-declare
    default                      -> body.length();
};
out.write(("HTTP/1.1 200 OK\\r\\n"
         + "Content-Type: text/plain\\r\\n"
         + "Content-Length: " + declared + "\\r\\n"
         + "\\r\\n" + body).getBytes(US_ASCII));`}
      </CodeBlock>

      <h3>Too long: the client hangs</h3>

      <p>
        The client has been promised 100 bytes and has 26. It has no way to know the server is
        finished, so it does the only correct thing and keeps waiting:
      </p>

      <CodeBlock language="text" title="Real output — curl --max-time 3 http://127.0.0.1:8080/long">
{`curl: (28) Operation timed out after 3004 milliseconds with 26 out of 100 bytes received
abcdefghijklmnopqrstuvwxyz`}
      </CodeBlock>

      <p>
        Three seconds of nothing, then a timeout, and the timeout came from{' '}
        <code>--max-time</code> &mdash; without it, curl waits indefinitely. Closing the socket
        instead of holding it open turns the hang into a different error, which is at least
        honest about what happened:
      </p>

      <CodeBlock language="text" title="Real output — /long-close: same lie, then close the socket">
{`curl: (18) transfer closed with 74 bytes remaining to read
abcdefghijklmnopqrstuvwxyz`}
      </CodeBlock>

      <InfoBox variant="tip" title="If you have ever debugged a &quot;random hang&quot;, this is a candidate">
        <p>
          An over-declared length is invisible in logs. The server thinks it responded &mdash; it
          wrote a 200 and its handler returned. The client sees a request that never completes.
          Every layer blames the other. The tell is the exact one above:{' '}
          <code>N out of M bytes received</code> where N is stable and M is bigger. A common real
          cause is computing the length from <code>String.length()</code> (characters) while
          writing UTF-8 (bytes) &mdash; any non-ASCII character and the two disagree.
        </p>
      </InfoBox>

      <h3>Too short: the connection is poisoned</h3>

      <p>
        Under-declaring is worse, and it is worse in a way that only shows up on the{' '}
        <em>next</em> request. Declare 5, write 26, then send two requests down one connection and
        read the raw bytes back:
      </p>

      <CodeBlock language="bash" title="Two pipelined requests, one socket, no client library">
{`printf 'GET /short HTTP/1.1\\r\\nHost: x\\r\\n\\r\\nGET /second HTTP/1.1\\r\\nHost: x\\r\\n\\r\\n' \\
  | nc -w 2 127.0.0.1 8080 | cat -v`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — ^M is the CR that cat -v makes visible">
{`HTTP/1.1 200 OK^M
Content-Type: text/plain^M
Content-Length: 5^M
^M
abcdefghijklmnopqrstuvwxyzHTTP/1.1 200 OK^M
Content-Type: text/plain^M
Content-Length: 26^M
^M
abcdefghijklmnopqrstuvwxyz`}
      </CodeBlock>

      <p>
        Follow what a client does with that. It reads the head, sees <code>Content-Length: 5</code>,
        takes five bytes &mdash; <code>abcde</code> &mdash; and declares response one complete.
        The next byte should begin response two&apos;s status line. The next byte is{' '}
        <code>f</code>. Twenty-one bytes of body are now sitting in the stream pretending to be a
        response.
      </p>

      <FlowChart
        title="Where the client thinks the boundary is, vs where it actually is"
        chart={"graph TD\n  A[\"Content-Length: 5\"] --> B[\"client reads 5 bytes: abcde\"]\n  B --> C[\"client: response 1 complete<br/>next byte = status line of response 2\"]\n  C --> D[\"actual next byte: 'f'\"]\n  D --> E{\"what does the client do?\"}\n  E -->|curl: strict| F[\"detects excess<br/>KILLS the connection\"]\n  E -->|naive: trusting| G[\"parses 'fghij...' as a status line<br/>desynchronised forever\"]\n  style F fill:#1a3329\n  style G fill:#3b1a1a"}
      />

      <p>
        curl takes the strict branch. Ask it to reuse one connection for both requests and watch
        it refuse:
      </p>

      <CodeBlock language="text" title="Real output — curl -sv http://127.0.0.1:8080/short http://127.0.0.1:8080/second">
{`> GET /short HTTP/1.1
< HTTP/1.1 200 OK
< Content-Type: text/plain
< Content-Length: 5
<
* Excess found writing body: excess = 21, size = 5, maxdownload = 5, bytecount = 5
* Closing connection
abcde* Connected to 127.0.0.1 (127.0.0.1) port 8080
> GET /second HTTP/1.1
< HTTP/1.1 200 OK
< Content-Length: 26
<
* Connection #1 to host 127.0.0.1 left intact
abcdefghijklmnopqrstuvwxyz`}
      </CodeBlock>

      <p>
        And the server log confirms curl really did throw the socket away rather than reuse it
        &mdash; two connections were made where one would have done:
      </p>

      <CodeBlock language="text" title="Real output — server side">
{`listening
req#1 target=/short declared=5 actually writing=26
client closed after 1 request(s)
req#1 target=/second declared=26 actually writing=26
client closed after 1 request(s)`}
      </CodeBlock>

      <InfoBox variant="danger" title="&quot;It works in curl&quot; is not proof of a correct length">
        <p>
          curl defends itself. A caching proxy sitting between your service and its callers may
          not &mdash; and a proxy that accepts those 21 bytes as the beginning of the next
          response will happily serve one user&apos;s data as the answer to another user&apos;s
          request. That is response splitting, and it comes from exactly this bug. The server
          being &ldquo;only a little bit wrong&rdquo; about a number is the whole vulnerability.
        </p>
      </InfoBox>

      <p>
        So the response writer encodes first and measures the bytes. This is the version everything
        below uses:
      </p>

      <CodeBlock language="java" title="Server.java — encode, then measure, then declare">
{`static void write(OutputStream out, int code, String reason, String body, boolean close)
        throws IOException {
    byte[] b = body.getBytes(StandardCharsets.UTF_8);     // encode FIRST, then measure
    String head = "HTTP/1.1 " + code + " " + reason + "\\r\\n"
                + "Content-Type: text/plain; charset=utf-8\\r\\n"
                + "Content-Length: " + b.length + "\\r\\n"
                + "Connection: " + (close ? "close" : "keep-alive") + "\\r\\n"
                + "\\r\\n";
    out.write(head.getBytes(StandardCharsets.US_ASCII));
    out.write(b);
    out.flush();
}`}
      </CodeBlock>

      <h2>Step 4: Keep-Alive, and What Closing Costs</h2>

      <p>
        HTTP/1.0 closed the connection after every response. HTTP/1.1 flipped the default: the
        connection stays open unless someone says <code>Connection: close</code>. A server that
        ignores this is not <em>broken</em> &mdash; every response it sends is valid, every client
        works &mdash; it is just paying for a TCP handshake and teardown on every single request.
      </p>

      <CodeBlock language="java" title="The entire keep-alive implementation">
{`while (true) {                                     // loop, don't return
    Request r = parse(in);                          // throws EOFException when client closes
    boolean close = "close".equalsIgnoreCase(r.header("connection"))
                 || !KEEP_ALIVE
                 || r.version().equals("HTTP/1.0"); // 1.0 defaults the other way
    write(out, 200, "OK", route(r), close);
    if (close) return;
}`}
      </CodeBlock>

      <p>
        That is the whole feature: a <code>while</code> loop around the parse-and-respond pair, and
        the discipline of consuming exactly <code>Content-Length</code> bytes so the next request
        starts at a known offset. Step 3 is why the discipline matters &mdash; keep-alive is only
        possible <em>because</em> both sides agree on where each message ends.
      </p>

      <CodeBlock language="text" title="Real output — curl reusing one socket for two requests">
{`* Connected to 127.0.0.1 (127.0.0.1) port 8080
> GET /a HTTP/1.1
< HTTP/1.1 200 OK
< Connection: keep-alive
* Connection #0 to host 127.0.0.1 left intact
* Re-using existing connection with host 127.0.0.1
> GET /b HTTP/1.1
< HTTP/1.1 200 OK
< Connection: keep-alive
* Connection #0 to host 127.0.0.1 left intact`}
      </CodeBlock>

      <h3>Measure it</h3>

      <p>
        5,000 requests, one client thread, three configurations. The benchmark client counts the
        TCP connections it actually needed:
      </p>

      <CodeBlock language="text" title="Real output — JDK 26.0.1, loopback, thread-per-connection server">
{`=== server WITH keep-alive ===
reuse    5000 requests     252 ms      19,841 req/s   tcp connections used: 1
new      5000 requests     834 ms       5,995 req/s   tcp connections used: 5000

=== server that IGNORES keep-alive (closes every response) ===
reuse    5000 requests     858 ms       5,828 req/s   tcp connections used: 5001
new      5000 requests     830 ms       6,024 req/s   tcp connections used: 5000`}
      </CodeBlock>

      <p>
        <strong>3.3x, from a <code>while</code> loop.</strong> Read the third row carefully,
        because it is the interesting one: the client <em>asked</em> to reuse the connection and
        still needed 5,001 of them, because the server closed after every response. The client
        cannot opt into keep-alive on its own. Both ends have to cooperate, and the server is the
        one that decides.
      </p>

      <InfoBox variant="warning" title="On loopback this understates the win, badly">
        <p>
          These numbers were measured over <code>127.0.0.1</code>, where a TCP handshake costs
          essentially nothing &mdash; no propagation delay, no packet loss. On a real network the
          handshake costs one full round trip before a single byte of your request moves. Add TLS
          and it is one or two <em>more</em> round trips for the handshake. At a 40ms RTT, a new
          connection per request adds 40&ndash;120ms of pure latency to every call while the
          loopback measurement here charges you about 0.12ms.
        </p>
        <p>
          That is why connection pooling is not a micro-optimisation in a microservice mesh. It is
          the difference between an internal call costing 1ms and costing 121ms, and it is the
          same reason a <code>RestTemplate</code> or <code>HttpClient</code> you construct
          per-request is a genuine production incident rather than a style problem.
        </p>
      </InfoBox>

      <h2>Step 5: One Connection at a Time Blocks Everybody</h2>

      <p>
        Everything so far has handled one connection, finished it, and gone back to{' '}
        <code>accept()</code>. That is the simplest possible server and it is also the one that
        falls over first. To show why, the server grows a <code>/slow</code> route that sleeps for
        one second — standing in for the database query or third-party API that every real
        endpoint eventually contains.
      </p>

      <p>
        Send one request to <code>/slow</code>, then immediately ask for the fast route and time
        how long the fast one waits:
      </p>

      <CodeBlock language="text" title="Real output — one slow client in flight, then a fast request">
{`serial   fast request took 0.848729s
thread   fast request took 0.004064s`}
      </CodeBlock>

      <p>
        A request that takes four milliseconds of actual work took 849 milliseconds to answer,
        because it sat behind somebody else&apos;s sleep. This is <strong>head-of-line
        blocking</strong>, and it scales exactly the way you fear:
      </p>

      <CodeBlock language="text" title="Real output — five slow clients in flight, then a fast request">
{`serial   fast request waited 4.766783s
thread   fast request waited 0.002998s
pool     fast request waited 0.003757s`}
      </CodeBlock>

      <p>
        Five queued sleepers, roughly five seconds of waiting. The fix is to stop doing one thing
        at a time — hand each accepted socket to something that can run concurrently:
      </p>

      <CodeBlock language="java" title="The whole change, four ways">
{`// 1. serial - one at a time
while (true) handle(ss.accept());

// 2. thread per connection - simple, and fine up to a point
while (true) { Socket s = ss.accept(); new Thread(() -> handle(s)).start(); }

// 3. bounded pool - caps memory, introduces a NEW ceiling
ExecutorService ex = Executors.newFixedThreadPool(8);
while (true) { Socket s = ss.accept(); ex.submit(() -> handle(s)); }

// 4. virtual threads - JDK 21+
ExecutorService ex = Executors.newVirtualThreadPerTaskExecutor();
while (true) { Socket s = ss.accept(); ex.submit(() -> handle(s)); }`}
      </CodeBlock>

      <InfoBox variant="warning" title="A bounded pool does not remove the ceiling. It moves it.">
        <p>
          Option 3 looks like the responsible grown-up choice, and for CPU-bound work it is. But
          the pool has eight threads, and a request blocked on a sleep is still <em>occupying</em>{' '}
          one. Fill all eight and the ninth request is back to waiting — the serial problem
          returns, just later.
        </p>
      </InfoBox>

      <CodeBlock language="text" title="Real output — saturating an 8-thread pool">
{`8 slow clients in flight:
  pool      fast request waited  0.693064s
  virtual   fast request waited  0.004351s

200 slow clients in flight:
  pool      fast request waited 24.463070s     <- every thread blocked on a sleep
  virtual   fast request waited  0.003517s`}
      </CodeBlock>

      <p>
        Twenty-four seconds. The server is not busy — it is asleep, eight times over, while 192
        more requests queue behind it and one fast request that needed no work at all waits out
        the whole thing. Virtual threads answer in three milliseconds under the identical load,
        because a virtual thread parked on a blocking call does not hold an OS thread hostage.
      </p>

      <FlowChart
        title="Where each model puts its ceiling"
        chart={"graph TD\n  A[\"accept() returns a socket\"] --> B{\"who runs handle()?\"}\n  B -->|\"the accept loop itself\"| C[\"SERIAL<br/>ceiling = 1 concurrent request\"]\n  B -->|\"a brand new OS thread\"| D[\"THREAD PER CONN<br/>ceiling = OS thread limit<br/>~1MB stack each\"]\n  B -->|\"a fixed pool of N\"| E[\"BOUNDED POOL<br/>ceiling = N blocked requests\"]\n  B -->|\"a virtual thread\"| F[\"VIRTUAL THREADS<br/>ceiling = memory<br/>blocking is cheap\"]\n  style C fill:#3b1a1a,stroke:#f87171\n  style E fill:#3d2f14\n  style F fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="note" title="Throughput hides this completely">
        <p>
          Measured as raw requests per second on the <em>fast</em> route, the four models look
          nearly identical — 12,658 / 22,222 / 22,727 / 21,978 req/s for serial, thread, pool and
          virtual. Serial is only 1.8x behind, which would tempt you to call it good enough. That
          benchmark is lying to you: it never blocks, so it never exercises the thing that breaks.
          Latency under a blocking workload is where the difference lives, and it is a factor of
          seven thousand rather than a factor of two.
        </p>
      </InfoBox>

      <h2>Step 6: When You Do Not Know the Length Yet</h2>

      <p>
        <code>Content-Length</code> requires knowing the size of the body before sending the first
        byte. That is impossible when you are streaming a query result, generating a report, or
        proxying something. HTTP/1.1&apos;s answer is <strong>chunked transfer encoding</strong>:
        send the body as a series of length-prefixed pieces, then a zero-length piece to signal the
        end.
      </p>

      <CodeBlock language="java" title="Writing a chunked response">
{`out.write(("HTTP/1.1 200 OK\\r\\n"
         + "Content-Type: text/plain\\r\\n"
         + "Transfer-Encoding: chunked\\r\\n\\r\\n").getBytes(US_ASCII));

for (String part : new String[]{"first ", "second ", "third\\n"}) {
    byte[] b = part.getBytes(US_ASCII);
    out.write((Integer.toHexString(b.length) + "\\r\\n").getBytes(US_ASCII));  // size in HEX
    out.write(b);
    out.write("\\r\\n".getBytes(US_ASCII));
    out.flush();                       // each chunk can leave immediately
}
out.write("0\\r\\n\\r\\n".getBytes(US_ASCII));   // the terminator`}
      </CodeBlock>

      <p>What the client sees, and what actually crossed the wire:</p>

      <CodeBlock language="text" title="Real output — curl decodes it; the raw bytes show the framing">
{`$ curl -s http://127.0.0.1:8191/chunked
first second third

$ printf 'GET /chunked HTTP/1.1\\r\\nHost: x\\r\\n\\r\\n' | nc 127.0.0.1 8191 | sed -n l
HTTP/1.1 200 OK\\r$
Content-Type: text/plain\\r$
Transfer-Encoding: chunked\\r$
\\r$
6\\r$          <- "first " is 6 bytes, in HEX
first \\r$
7\\r$          <- "second " is 7
second \\r$
6\\r$          <- "third\\n" is 6
third$
\\r$
0\\r$          <- terminator: a zero-length chunk
\\r$`}
      </CodeBlock>

      <p>
        curl showed you three words on one line and never mentioned any of this. That is the point
        of a framing layer — and it is also why <code>Transfer-Encoding</code> and{' '}
        <code>Content-Length</code> must never both appear on one response. When they disagree,
        different servers in a chain resolve the conflict differently, and the resulting
        disagreement about where one request ends and the next begins is the basis of{' '}
        <strong>request smuggling</strong>.
      </p>

      <h2>Step 7: A Server With No Timeout Is a Server You Can Switch Off</h2>

      <p>
        Every read in this server so far blocks forever by default. Consider a client that opens a
        connection, sends a request line and one header, and then simply stops — never sends the
        blank line that ends the head, never disconnects:
      </p>

      <CodeBlock language="text" title="The whole attack">
{`( printf 'GET / HTTP/1.1\\r\\nHost: x\\r\\n'; sleep 6 ) | nc 127.0.0.1 8192`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same client against both servers">
{`--- server WITHOUT a read timeout ---
  after 4s, server log says: 0 timeout event(s)   <- thread still held, indefinitely

--- server WITH a 2000ms read timeout ---
  [server] read timeout after 2004ms - connection dropped`}
      </CodeBlock>

      <p>
        No malformed packets, no volume, no cleverness. The client is simply slow, which is
        indistinguishable from a phone on a bad connection — and that is what makes it effective.
        Repeat it a few hundred times and every thread in your pool is holding a conversation that
        will never finish. This is <strong>Slowloris</strong>, and the fix is one line:
      </p>

      <CodeBlock language="java" title="The one line, plus the limits that belong next to it">
{`socket.setSoTimeout(2000);   // throws SocketTimeoutException on a stalled read

// and, because a client can also be slow by being ENORMOUS:
//   - cap the number of headers        (say 100)
//   - cap the length of any one line   (say 8 KB)
//   - cap the total size of the head   (say 64 KB)
//   - cap the request body size
// Without these, "Content-Length: 99999999999" is a memory exhaustion bug.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Defaults are not on your side">
        <p>
          A freshly constructed <code>Socket</code> has <em>no</em> read timeout. Neither does a
          plain <code>ServerSocket</code>. Every production HTTP server sets these for you — Tomcat
          has <code>connectionTimeout</code>, nginx has <code>client_header_timeout</code> — and
          the reason those settings exist is exactly the four seconds of silence above. If you ever
          write a network service by hand, timeouts are not hardening you add later. They are part
          of the minimum correct implementation.
        </p>
      </InfoBox>

      <h2>What You Just Built, In Real Names</h2>

      <CodeBlock language="text" title="The toy, and its production counterparts">
{`what we built              what it is called        where you have met it
-------------------------  ----------------------  --------------------------------
accept loop                the acceptor            Tomcat Acceptor thread,
                                                   nginx worker accept loop
parsing the head by hand   HTTP message parser     Tomcat Http11Processor,
                                                   Netty HttpObjectDecoder
Content-Length framing     message framing         the reason smuggling exists
keep-alive loop            persistent connections  HTTP/1.1 default; connection
                                                   pools in every HTTP client
thread per connection      the classic model       Tomcat BIO (pre-2010)
bounded pool               the servlet model       Tomcat maxThreads (default 200)
virtual thread per conn    JDK 21+ model           Spring Boot 3.2+
                                                   spring.threads.virtual.enabled
chunked encoding           streaming responses     SSE, large downloads, proxies
read timeout               connection timeout      Tomcat connectionTimeout,
                                                   nginx client_header_timeout

Everything above is roughly what Tomcat does before your controller runs.
Spring Boot's "embedded server" is this loop, plus twenty years of edge cases.`}
      </CodeBlock>

      <h2>What This Toy Does Not Do</h2>

      <CodeBlock language="text" title="The distance between this page and a real server">
{`NOT IMPLEMENTED HERE:

  TLS                  no https. Certificates, ALPN, session resumption.
  HTTP/2 and /3        binary framing, multiplexing, HPACK header
                       compression, and for /3 an entire transport (QUIC).
  request bodies       we parse the head and ignore the body. POST,
                       multipart uploads, 100-continue.
  correct parsing      no header count or size limits, no URL decoding,
                       no percent-encoding, no absolute-form request
                       targets, no obs-fold handling.
  static files         no path traversal defence. "GET /../../etc/passwd"
                       would be a real vulnerability if we served files.
  compression          no gzip / br content encoding.
  backpressure         a slow reader can make writes block forever.
  observability        no access log, no metrics, no request IDs.

The parsing gaps are the dangerous ones. Framing bugs are not cosmetic:
disagreements between two servers about where a request ENDS are what
request smuggling exploits, and they come from exactly the kind of
hand-rolled parsing on this page.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Where this connects to the rest of the section">
        <p>
          The concurrency ladder in Step 5 is the same ladder as{' '}
          <a href="/from-scratch/scheduler">Build a Task Scheduler</a> — accepted sockets are just
          tasks, and a thread pool starving on blocked I/O behaves identically whether the blocking
          call is a sleep or a socket read. If you want to keep going here, the highest-value next
          step is adding request-body parsing with a hard size cap, because it forces you to
          confront framing properly rather than trusting the client.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default FromScratchHttpServer;
