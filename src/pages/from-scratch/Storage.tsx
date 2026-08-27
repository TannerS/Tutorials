import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function FromScratchStorage() {
  return (
    <LessonLayout
      title="Build a Key-Value Store with a Write-Ahead Log"
      sectionId="from-scratch"
      lessonIndex={2}
      prev={{ path: '/from-scratch/scheduler', label: 'Build a Task Scheduler' }}
      next={{ path: '/from-scratch/httpserver', label: 'Build an HTTP Server from Sockets' }}
    >
      <p>
        A database is a <code>HashMap</code> that survives the power going out. That sounds
        like a joke, but the entire discipline is inside it: the map part is a first-year
        data structure, and everything else &mdash; the WAL, the fsync, the checksums, the
        compaction, the recovery path &mdash; exists to buy the second half of the sentence.
      </p>

      <p>
        By the end of this you will have written maybe 200 lines of Java that can lose a{' '}
        <code>kill -9</code> without losing a write, and you will have <em>measured</em> the
        price of that guarantee. It is a much larger price than most people expect.
      </p>

      <p>
        Everything below was compiled and run on the machine that wrote this lesson &mdash;
        JDK 26.0.1, Apple M4 Pro (14 cores, 48&nbsp;GB), macOS 26.5, APFS on the internal
        NVMe SSD. Every number is pasted from a real run. One of them is going to contradict
        something you have been told, and that is the most useful part of the lesson.
      </p>

      <h2>Step 1: A HashMap Is a Database Until the Process Dies</h2>

      <p>
        Start with the version that has no durability at all, so the problem has a shape
        before we start solving it.
      </p>

      <CodeBlock language="java" title="Step1Volatile.java — a correct, fast, useless database">
{`static final Map<String, String> DB = new HashMap<>();

public static void main(String[] args) {
    System.out.println("JVM started. DB holds " + DB.size() + " keys.");
    if (args[0].equals("put")) {
        DB.put(args[1], args[2]);
        System.out.println("PUT " + args[1] + " = " + args[2]);
    }
    System.out.println("GET " + args[1] + " -> " + DB.get(args[1]));
}`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — two consecutive runs">
{`$ java Step1Volatile.java put user:1 alice
JVM started. DB holds 0 keys.
PUT user:1 = alice
GET user:1 -> alice
JVM exiting. DB held 1 keys.

$ java Step1Volatile.java get user:1
JVM started. DB holds 0 keys.
GET user:1 -> null
JVM exiting. DB held 0 keys.`}
      </CodeBlock>

      <p>
        Nothing surprising happened. That is the point &mdash; state that lives only in
        heap memory has exactly the lifetime of the process that allocated it, and this is
        so obvious that it stops being interesting, which is precisely why people then fail
        to notice the interesting version of the same question: <em>when a database tells
        your client &ldquo;committed&rdquo;, what has actually happened, and what would
        survive if the machine lost power at that instant?</em>
      </p>

      <p>
        There is a real answer, it is mechanical, and by Step 4 you will have measured it.
      </p>

      <h2>Step 2: Write It Down Before You Say Yes</h2>

      <p>
        The fix is a rule, not a data structure. <strong>Before acknowledging a write to the
        client, record it somewhere that outlives the process.</strong> That rule is the
        entire idea of a write-ahead log, and the &ldquo;ahead&rdquo; means ahead of the
        acknowledgement.
      </p>

      <FlowChart
        title="The ordering rule that makes a database a database"
        chart={"graph LR\n  C[\"client: PUT user:1 alice\"] --> A[\"append record to log\"]\n  A --> F[\"force bytes to disk\"]\n  F --> M[\"update in-memory map\"]\n  M --> OK[\"reply OK to client\"]\n  OK -.->|\"crash after this point<br/>write MUST survive\"| R[\"replay log on restart\"]\n  style A fill:#1a2744,stroke:#5b9cf6\n  style F fill:#3d1f33,stroke:#f472b6\n  style OK fill:#1a3329,stroke:#4ade80"}
      />

      <p>
        Note where the reply sits: <em>last</em>. Every box to its left is a promise you are
        making, and the client has no way to verify any of them. If you move{' '}
        <code>reply OK</code> one box to the left you have built something that is faster and
        that lies. Databases ship with a configuration flag that does exactly that, and Step 4
        is about why anyone would ever turn it on.
      </p>

      <h3>Why append, and not update-in-place</h3>

      <p>
        The obvious alternative is to keep a file of fixed-size slots and overwrite the slot
        belonging to the key. Everyone is told that appending is faster because a disk head
        does not have to seek. Let us actually measure that, because on this machine the
        received wisdom is simply false.
      </p>

      <CodeBlock language="java" title="BenchWrite.java — the same bytes, two access patterns">
{`// sequential: every write lands at the end of the file
long off = (long) i * REC;

// random: every write lands in a random preallocated slot
long off = (long) where.nextInt(SLOTS) * REC;

while (buf.hasRemaining()) ch.write(buf, off + (REC - buf.remaining()));
if (fsync) ch.force(false);`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — 64-byte records, APFS on Apple M4 Pro NVMe">
{`mode                                        ops        ms        ops/sec
append, no fsync per write               200000       211         947867
random offset, no fsync per write        200000       188        1063830
append + fsync per write                   5000     20111            249
random offset + fsync per write            5000     20248            247`}
      </CodeBlock>

      <InfoBox variant="warning" title="Random writes were not slower. On this hardware, the seek argument is dead.">
        <p>
          Random-offset writes came out <em>marginally faster</em> than appends, both with
          and without fsync, and the gap is inside the run-to-run noise (a second run gave
          925,926 vs 1,041,667 and 249 vs 246). There is no seek penalty to measure, because
          there is no head to move: this is flash, and a logical block address is a lookup in
          the drive&apos;s translation table.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          The &ldquo;append is faster because seeks are expensive&rdquo; story is real
          history &mdash; on a 7200&nbsp;RPM disk a seek cost several milliseconds and
          sequential I/O genuinely was two orders of magnitude better. It is just not why
          <em> your</em> database appends. Keep reading; the actual reason is stronger than
          the one you were given.
        </p>
      </InfoBox>

      <p>
        So why does every serious storage engine still append? Two reasons that survive the
        move to SSDs, and neither is about speed:
      </p>

      <ul>
        <li>
          <strong>An append cannot destroy data that already exists.</strong> Update-in-place
          that fails halfway leaves the slot holding neither the old value nor the new one
          &mdash; you have lost a committed write while trying to replace it. An append that
          fails halfway leaves a broken record at the end of the file and every previously
          committed record completely untouched. This is a <em>crash-semantics</em> property,
          not a performance property, and it is the real reason the log is append-only.
        </li>
        <li>
          <strong>Ordering is free.</strong> The log is a total order of everything that
          happened, in the order it happened, which is what makes replay, replication, and
          point-in-time recovery possible at all. A file of slots records the present; a log
          records history.
        </li>
      </ul>

      <h3>The record format</h3>

      <p>
        A log is a file of bytes, so you need framing: some way to know where one record ends
        and the next begins. Here is the layout we will use, and Step 5 is entirely about why
        it has the fields it has.
      </p>

      <CodeBlock language="text" title="One record on disk">
{`+--------+--------+------------------------------------------+
| 4 byte | 4 byte |            payload (len bytes)           |
| len    | crc32  |                                          |
+--------+--------+------------------------------------------+
                   |
                   +-> [1B type][4B keyLen][key][4B valLen][val]
                        type: 0 = PUT, 1 = DELETE (tombstone)`}
      </CodeBlock>

      <CodeBlock language="java" title="Kv.java — the whole write path">
{`private void append(byte type, String k, String v) throws IOException {
    byte[] kb = k.getBytes(UTF_8);
    byte[] vb = v.getBytes(UTF_8);
    ByteBuffer payload = ByteBuffer.allocate(1 + 4 + kb.length + 4 + vb.length);
    payload.put(type).putInt(kb.length).put(kb).putInt(vb.length).put(vb);
    byte[] pb = payload.array();
    CRC32 crc = new CRC32(); crc.update(pb);

    ByteBuffer rec = ByteBuffer.allocate(8 + pb.length);
    rec.putInt(pb.length).putInt((int) crc.getValue()).put(pb).flip();

    long off = ch.size();
    ch.position(off);
    while (rec.hasRemaining()) ch.write(rec);
    if (fsync) ch.force(false);              // <-- the durability knob

    // only NOW does the in-memory map learn about it
    if (type == PUT) index.put(k, off); else index.remove(k);
}`}
      </CodeBlock>

      <p>
        Read the last two lines in order. The map is updated <em>after</em> the bytes are
        durable. If the process dies between the write and the map update, the log is ahead
        of memory and replay fixes it. If you swapped those two statements, the map could
        contain a write the log has never heard of &mdash; and that write would silently
        vanish on the next restart.
      </p>

      <CodeBlock language="text" title="Real output — the log is not a metaphor, it is bytes">
{`$ java Kv.java d1/data.log put user:1 alice
PUT user:1 = alice
$ java Kv.java d1/data.log put user:2 bob
PUT user:2 = bob
$ java Kv.java d1/data.log stats
recovered 2 live keys from 2 log records (54 bytes)

$ xxd d1/data.log
00000000: 0000 0014 d8a9 5681 0000 0000 0675 7365  ......V......use
00000010: 723a 3100 0000 0561 6c69 6365 0000 0012  r:1....alice....
00000020: dc21 ae47 0000 0000 0675 7365 723a 3200  .!.G.....user:2.
00000030: 0000 0362 6f62                           ...bob`}
      </CodeBlock>

      <p>
        The whole file format is visible in those 54 bytes.{' '}
        <code>00 00 00 14</code> is the payload length (20 bytes),{' '}
        <code>d8 a9 56 81</code> is its CRC32, then <code>00</code> for PUT,{' '}
        <code>00 00 00 06</code> and <code>user:1</code>,{' '}
        <code>00 00 00 05</code> and <code>alice</code>. At offset <code>0x1c</code> the next
        record begins and the pattern repeats. Nothing else is stored anywhere &mdash; there
        is no header, no index on disk, no metadata file.
      </p>

      <h2>Step 3: Recovery Is Just Replay</h2>

      <p>
        Startup rebuilds the map by reading the log from byte zero and applying every record
        in order. There is no separate &ldquo;database file&rdquo; to load &mdash; the log{' '}
        <em>is</em> the database, and the map is a cache of it.
      </p>

      <CodeBlock language="java" title="Kv.java — recovery, minus the error handling (that is Step 5)">
{`void replay() throws IOException {
    long off = 0, size = ch.size();
    index.clear();
    while (off < size) {
        ByteBuffer hdr = ByteBuffer.allocate(8);
        ch.read(hdr, off); hdr.flip();
        int len = hdr.getInt();
        int crcStored = hdr.getInt();

        ByteBuffer pb = ByteBuffer.allocate(len);
        ch.read(pb, off + 8);
        Rec r = decode(pb.array(), crcStored, len);

        // last writer wins: a later record for the same key overwrites the earlier one
        if (r.type == PUT) index.put(r.key, off); else index.remove(r.key);
        off += r.totalLen;
        replayed++;
    }
}`}
      </CodeBlock>

      <p>
        &ldquo;Last writer wins&rdquo; is doing quiet work here. The log contains every
        version of every key that was ever written, and replay walks forward applying each
        one, so the final state of the map is the newest record per key. You never delete
        from the log to update a value; you append a newer record and let replay sort it out.
      </p>

      <h3>Now actually kill it</h3>

      <p>
        A crash test where you call <code>System.exit()</code> proves nothing &mdash; that is
        an orderly shutdown that runs your finally blocks. <code>kill -9</code> is different:
        <code>SIGKILL</code> cannot be caught, blocked, or handled, so the process is removed
        by the kernel with no chance to flush anything. That is the closest thing to a power
        cut you can produce from a shell.
      </p>

      <CodeBlock language="bash" title="Killing a writer mid-flight">
{`# writer appends key:1..key:100000, fsyncing every record,
# printing an ack every 100 writes
$ java Kv.java d2/data.log flood 100000 > crash.out 2>&1 &
$ sleep 3
$ kill -9 $!`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — three seconds in, SIGKILL, then restart">
{`SENT kill -9 to 70870
--- last lines the writer acked ---
acked 400
acked 500
acked 600
--- exit status of the writer ---
process gone: dead

--- restart, replay the log ---
$ java Kv.java d2/data.log stats
recovered 661 live keys from 661 log records (21,597 bytes)

$ java Kv.java d2/data.log get key:600
GET key:600 -> value-600
$ java Kv.java d2/data.log get key:661
GET key:661 -> value-661
$ java Kv.java d2/data.log get key:662
GET key:662 -> null`}
      </CodeBlock>

      <InfoBox variant="success" title="Read the boundary, not the total">
        <p>
          The number 661 is uninteresting. The <em>boundary</em> is the entire result:{' '}
          <code>key:661</code> is present and <code>key:662</code> is absent, with nothing
          torn, blank, or half-written in between. The process was destroyed by the kernel
          somewhere inside the 662nd write, and the store came back with a clean prefix of
          history and no idea anything had gone wrong.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          That prefix property is what durability actually buys you. Not &ldquo;you lose
          nothing&rdquo; &mdash; you always lose the in-flight write &mdash; but{' '}
          <strong>you lose only a suffix, and never something you were told was
          committed.</strong>
        </p>
      </InfoBox>

      <p>
        Now notice the throughput. Three seconds produced 661 records &mdash; roughly 220
        writes per second, on 21,597 bytes of output. That is 33 bytes per record and about
        7&nbsp;KB/s. A machine that can memcpy tens of gigabytes per second just managed
        seven kilobytes, and the reason is one line in the write path that we have so far
        walked straight past.
      </p>

      <h2>Step 4: fsync, and What &ldquo;Committed&rdquo; Actually Means</h2>

      <p>
        The line is <code>ch.force(false)</code>. Deleting it makes the store roughly four
        thousand times faster. Understanding exactly what you give up in exchange is the
        single most valuable thing in this lesson, and it is not what most people assume.
      </p>

      <h3>A byte you have &ldquo;written&rdquo; is in one of three places</h3>

      <p>
        When your code says <code>write</code>, the bytes do not go to a disk. They go to the
        nearest buffer, and there are three of them stacked up, each with a different owner
        and a different way of dying.
      </p>

      <FlowChart
        title="Where your bytes actually are, and what destroys each layer"
        chart={"graph TD\n  APP[\"your byte array<br/>in the JVM heap\"] -->|\"BufferedOutputStream.write()<br/>no syscall yet\"| UB[\"userspace buffer<br/>(8 KB, inside your process)\"]\n  UB -->|\"flush() / buffer full<br/>write(2) syscall\"| PC[\"kernel page cache<br/>(OS memory)\"]\n  PC -->|\"fsync(2)<br/>ch.force()\"| DRIVE[\"storage device\"]\n\n  K1[\"process crash / kill -9\"] -.->|\"destroys\"| UB\n  K2[\"power loss / kernel panic\"] -.->|\"destroys\"| PC\n\n  style UB fill:#3b1a1a,stroke:#f87171\n  style PC fill:#3d2f1a,stroke:#fbbf24\n  style DRIVE fill:#1a3329,stroke:#4ade80\n  style K1 fill:#2a1a1a,stroke:#f87171\n  style K2 fill:#2a1a1a,stroke:#f87171"}
      />

      <p>
        Those two dotted arrows are the whole lesson. <strong>They point at different
        layers</strong>, which means <code>kill -9</code> and a power cut are not the same
        test and do not have the same answer. Let us prove it rather than assert it.
      </p>

      <CodeBlock language="java" title="Levels.java — same loop, three durability levels">
{`switch (mode) {
    case "buffered"  -> bos.write(rec);                        // userspace only
    case "pagecache" -> fos.write(rec);                        // write(2) syscall
    case "fsync"     -> { fos.write(rec); fos.getFD().sync(); } // + fsync(2)
}
System.out.println("acked " + i);   // <-- we told the client it was written`}
      </CodeBlock>

      <CodeBlock language="bash" title="Run each for 2 seconds, then SIGKILL and count survivors">
{`$ java Levels.java $MODE lv_$MODE.dat 100000 > lv_$MODE.out &
$ sleep 2
$ kill -9 $!
$ wc -l < lv_$MODE.dat        # how many acked records actually exist`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — kill -9 against each layer">
{`buffered   acked=285    survived kill -9=0      lost=285
pagecache  acked=283    survived kill -9=283    lost=0
fsync      acked=281    survived kill -9=281    lost=0`}
      </CodeBlock>

      <InfoBox variant="danger" title="fsync did not help here — and that is the correct result">
        <p>
          Look at rows two and three. The fsync version and the page-cache version{' '}
          <strong>both survived <code>kill -9</code> perfectly</strong>. If your mental model
          was &ldquo;fsync is what protects you from crashes&rdquo;, this output just falsified
          it, and it is worth sitting with for a second.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          The page cache belongs to the <em>kernel</em>, not to your process. When the kernel
          destroys your process it does not destroy its own memory, and it writes those dirty
          pages out on its own schedule regardless of whether you are still alive. A process
          crash therefore cannot lose a byte that has been through a{' '}
          <code>write(2)</code> syscall.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Row one is the one that lost data: 285 records acknowledged, zero on disk, because
          they never left the 8&nbsp;KB <code>BufferedOutputStream</code> living inside the
          dead process. <strong>The default buffering in your language&apos;s I/O library is
          a data-loss bug the moment you acknowledge before flushing.</strong>
        </p>
      </InfoBox>

      <p>
        So what <em>is</em> fsync for? The failure one layer down: power loss, kernel panic,
        someone pulling the plug, the VM host dying. You cannot produce that from a shell
        script, which is exactly why this is the durability property that people ship broken
        code against for years without noticing &mdash; every crash they have ever actually
        seen was survivable without it.
      </p>

      <h3>Now measure what it costs</h3>

      <CodeBlock language="text" title="Real output — BenchWrite.java, 64-byte appends">
{`append, no fsync per write               200000       211         947867 ops/sec
append + fsync per write                   5000     20111            249 ops/sec

                                                     ratio:  3,807x`}
      </CodeBlock>

      <p>
        Three thousand eight hundred times. Not thirty percent, not a constant factor you can
        tune away &mdash; nearly four orders of magnitude, and this is on fast modern flash.
        That number is the reason every database on earth ships a knob to turn it off, and the
        reason the knob is dangerous.
      </p>

      <p>
        The 249 is not mysterious either. Time each individual write and the shape is
        immediately obvious:
      </p>

      <CodeBlock language="text" title="Real output — BenchGroup.java, fsync every N appends, 5000 records">
{`fsync policy                        ms       ops/sec     p50 write     p99 write
every write                      20128           248       4.001 ms       4.834 ms
every 2 writes                   10063           497       3.505 ms       4.394 ms
every 4 writes                    5036           993       0.015 ms       4.177 ms
every 16 writes                   1257          3978       0.007 ms       3.978 ms
every 64 writes                    372         13441       0.006 ms       4.363 ms
every 256 writes                    94         53191       0.001 ms       0.012 ms
never (only at close)                9        555556       0.001 ms       0.003 ms`}
      </CodeBlock>

      <InfoBox variant="note" title="One fsync costs 4 ms, flat, no matter how little you wrote">
        <p>
          The p50 for &ldquo;every write&rdquo; is <strong>4.001 ms</strong>, and{' '}
          1&nbsp;/&nbsp;0.004 = 250 operations per second. The measured throughput was 248.
          The store&apos;s entire write capacity was never about the JVM, the record format,
          or the append &mdash; it was <code>1 / fsync_latency</code> and nothing else.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Now read down the p99 column. It stays near 4&nbsp;ms all the way to a batch of 64,
          while p50 collapses to 6 <em>microseconds</em>. That is the fsync cost being paid by
          one unlucky write in the batch while everyone else goes through free. The
          fixed-cost-per-fsync shape is why throughput doubles when you halve the number of
          fsyncs, exactly, all the way down the table.
        </p>
      </InfoBox>

      <p>
        And that is <strong>group commit</strong>, which is not an optimisation someone
        invented so much as the only possible response to a fixed per-fsync cost. Every
        serious database does it: hold a handful of concurrent transactions, write all their
        log records, then issue <em>one</em> fsync and acknowledge all of them. Each
        transaction still gets a genuine durability guarantee; they just share the 4&nbsp;ms.
        A batch of 64 turned 248 writes per second into 13,441 without weakening the promise
        to anybody.
      </p>

      <h3>The knob, in the products you already use</h3>

      <CodeBlock language="text" title="Everyone exposes this decision. Nobody agrees on the default.">
{`PostgreSQL   synchronous_commit = on | off
             off = ack the client before the WAL is fsynced. You can lose
             the last ~3 x wal_writer_delay of COMMITS. Not corruption --
             the DB stays consistent, you just lose committed transactions.

MySQL        innodb_flush_log_at_trx_commit = 1 | 2 | 0
             1 = fsync on every commit (the ACID-compliant setting)
             2 = write(2) to page cache on commit, fsync once a second
                 -> survives mysqld crashing, NOT the machine losing power
                 -> this is exactly row 2 of the experiment above
             0 = do not even syscall on commit

Kafka        acks=0 | 1 | all      + flush.ms / flush.messages
             Kafka deliberately does NOT fsync per message. It leans on
             replication to N brokers instead of on one disk's promise.

SQLite       PRAGMA synchronous = FULL | NORMAL | OFF
             OFF is famously ~50x faster and famously corrupts on power loss.`}
      </CodeBlock>

      <p>
        Read the MySQL entry again now that you have the experiment in your head. Setting{' '}
        <code>innodb_flush_log_at_trx_commit=2</code> is not &ldquo;slightly less
        durable&rdquo; in some vague way &mdash; it is precisely, mechanically, row two of
        that table: immune to the database process crashing, exposed to the machine losing
        power. That is a genuinely reasonable trade on a replicated cloud instance with
        battery-backed storage, and a genuinely terrible one on a single box under a desk.
        You now have the model to tell those apart instead of copying a value off a blog.
      </p>

      <InfoBox variant="warning" title="A caveat this hardware forces me to admit">
        <p>
          Java&apos;s <code>force()</code> calls <code>fsync(2)</code>. On macOS, that is
          weaker than it sounds. Straight from <code>man 2 fsync</code> on the machine that
          ran these benchmarks:
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <em>
            &ldquo;Note that while fsync() will flush all data from the host to the drive
            (i.e. the &lsquo;permanent storage device&rsquo;), the drive itself may not
            physically write the data to the platters for quite some time... Specifically, if
            the drive loses power or the OS crashes, the application may find that only some
            or none of their data was written.&rdquo;
          </em>
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Apple provides <code>fcntl(F_FULLFSYNC)</code> for the real guarantee, and the JDK
          does not expose it. So the 4&nbsp;ms measured above is the cost of getting bytes to
          the <em>drive</em>, and true power-loss durability on this platform costs more than
          that. SQLite and PostgreSQL both special-case macOS for exactly this reason. It does
          not change any shape in this lesson &mdash; but a lesson about durability that
          quietly overclaimed its own durability would be a bad joke.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="Your service acknowledges a write after appending to a log file with a BufferedWriter, but never calls flush() or fsync(). The pod is OOM-killed by Kubernetes (SIGKILL). What do you lose?"
        options={[
          'Nothing — the OS writes the file out regardless',
          'Only writes from the last second or so, since the OS flushes frequently',
          'Everything still sitting in the BufferedWriter, because that buffer died with the process',
          'The entire file, because it was never closed properly',
        ]}
        correctIndex={2}
        explanation={"A SIGKILL destroys the process and every byte of its address space, and a BufferedWriter's buffer lives in that address space. The measurement above is exactly this case: 285 records acknowledged, zero on disk. Note what the other options get wrong. Option 1 is true only for bytes that reached the kernel via a write(2) syscall — the page-cache row of the experiment, which survived kill -9 completely. Option 2 describes fsync-once-a-second (MySQL's flush_log_at_trx_commit=2), which is a different configuration than the one described. Option 4 is wrong because closing a file is not what makes data durable; the syscall is, and previously flushed data is already safe. The uncomfortable part is that this bug is invisible in testing — it only appears under an ungraceful kill, which is precisely what a production OOM is."}
      />

      <p>
        There is one more thing wrong with the write path, and it is the one that turns a
        crash from &ldquo;lost the last write&rdquo; into &ldquo;the database will not
        start&rdquo;.
      </p>

      <h2>Step 5: The Write That Only Half Happened</h2>

      <p>
        Go back to the <code>kill -9</code> in Step 3 and ask an awkward question. The process
        died <em>inside</em> the 662nd write. Why did the log end cleanly at the end of record
        661, rather than with half of record 662 stuck on the end?
      </p>

      <p>
        The honest answer is: luck, plus small records. A write is not atomic. The kernel can
        move some of your bytes and then stop &mdash; because the machine lost power mid-flush,
        because the record spanned a page or sector boundary and only the first part made it,
        because the filesystem allocated a block and died before filling it. The result is a{' '}
        <strong>torn write</strong>: a record that exists on disk but is not all there.
      </p>

      <p>
        A torn record at the end of the log is not a rare exotic event. It is the{' '}
        <em>expected</em> state of a log file after an ungraceful shutdown, and a storage
        engine that cannot handle it is a storage engine that does not start.
      </p>

      <h3>Why the length prefix is not decoration</h3>

      <p>
        Chop the last 7 bytes off a healthy 5-record log &mdash; a record that started to be
        written and did not finish:
      </p>

      <CodeBlock language="bash" title="Manufacturing a torn tail">
{`$ java Kv.java d3/data.log stats
recovered 5 live keys from 5 log records (145 bytes)

$ dd if=d3/backup.log of=d3/data.log bs=1 count=138    # drop the last 7 bytes`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — replay meets a record that is not all there">
{`$ java Kv.java d3/data.log stats
  ! bad record at offset 116: torn record: header claims 21 payload bytes, only 14 remain
  ! discarding tail from 116 to 138 (22 bytes)
recovered 4 live keys from 4 log records (116 bytes)`}
      </CodeBlock>

      <p>
        The length prefix is what makes that detectable. The header says the payload is 21
        bytes; the file only has 14 left. Those cannot both be true, so the record was never
        completed, so it was never acknowledged to a client, so <strong>discarding it is not
        data loss &mdash; it is the correct answer.</strong> The store truncates the file back
        to the last complete record and carries on with four keys.
      </p>

      <CodeBlock language="java" title="Kv.java — the only part of replay that matters">
{`if (len < 0 || len > 1 << 24 || off + 8 + len > size)
    throw new EOFException("torn record: header claims " + len
        + " payload bytes, only " + (size - off - 8) + " remain");`}
      </CodeBlock>

      <p>
        The bounds check on <code>len</code> is not paranoia either. If the tear landed inside
        the length field itself, you are about to read four bytes of garbage and treat them as
        a size. Without <code>len &lt; 0</code> you get a negative array size; without an upper
        bound, a corrupted header reading <code>0x7FFFFFFF</code> makes you try to allocate two
        gigabytes. Both are real crash reports against real storage engines.
      </p>

      <h3>Why the length prefix is not enough</h3>

      <p>
        Now the case the length prefix cannot see. Flip a single byte <em>inside</em> a record
        &mdash; the framing stays perfectly valid, only the content is wrong:
      </p>

      <CodeBlock language="bash" title="One byte, in the middle of a value">
{`$ printf '9' | dd of=d3/data.log bs=1 seek=86 count=1 conv=notrunc

$ xxd -s 58 -l 29 d3/data.log
0000003a: 0000 0015 2a31 9f8a 0000 0000 056b 6579  ....*1.......key
0000004a: 3a33 0000 0007 7661 6c75 652d 39         :3....value-9`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — the same corrupt file, read two ways">
{`# checksum verification OFF
$ java -Dnocrc=true Kv.java d3/data.log stats
recovered 5 live keys from 5 log records (145 bytes)
$ java -Dnocrc=true Kv.java d3/data.log get key:3
GET key:3 -> value-9

# checksum verification ON (the default)
$ java Kv.java d3/data.log stats
  ! bad record at offset 58: CRC MISMATCH
  ! discarding tail from 58 to 145 (87 bytes)
recovered 2 live keys from 2 log records (58 bytes)`}
      </CodeBlock>

      <InfoBox variant="danger" title="Read the first three lines again">
        <p>
          Without the checksum the store reported a <strong>perfectly healthy database</strong>
          &nbsp;&mdash; five live keys, five records, no warnings &mdash; and then served{' '}
          <code>value-9</code> for a key whose value was never anything but{' '}
          <code>value-3</code>. Nobody ever wrote <code>value-9</code>. There is no error, no
          log line, no metric, and no way for the caller to know.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          This is the failure mode that checksums exist for, and it is qualitatively worse than
          crashing. A store that refuses to start gets escalated in ten minutes. A store that
          confidently returns bytes nobody wrote gets those bytes into your backups, your
          replicas, your reports, and your customers&apos; invoices, and you find out months
          later.
        </p>
      </InfoBox>

      <p>
        The CRC32 costs four bytes per record and a computation that does not register against
        a 4&nbsp;ms fsync. That is why it is not a tunable in real systems: PostgreSQL, Kafka,
        SQLite, RocksDB and every other engine of this shape checksum their log records, because
        the alternative is being unable to distinguish your data from noise.
      </p>

      <InfoBox variant="warning" title="Where our toy is genuinely wrong, and what real engines do instead">
        <p>
          Look at what the CRC-enabled run actually did: it hit the bad record at offset 58 and
          truncated <em>everything from there to the end</em>, discarding <code>key:4</code> and{' '}
          <code>key:5</code>, which were completely intact. Four live keys became two.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          That is right for a torn <em>tail</em> and badly wrong for corruption in the{' '}
          <em>middle</em>. The two cases mean different things: a bad record at the end is an
          incomplete write that was never acknowledged, so dropping it is correct. A bad record
          with valid records after it means the bytes rotted after they were committed &mdash;
          that is real corruption of acknowledged data, and the right response is to refuse to
          start and make a human restore from a backup, not to silently amputate the log.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Our <code>replay()</code> collapses both into &ldquo;truncate here&rdquo;. Telling
          them apart is one of the many small correctness details that separates 200 lines from
          200,000.
        </p>
      </InfoBox>

      <InteractiveChallenge
        question="A log record's header survives a crash intact, its 4-byte length field says 400 bytes, and there are exactly 400 bytes after it in the file — but only the first 200 were actually flushed before the power died; the rest is whatever was in that disk block already. What catches this?"
        options={[
          'The length prefix — the arithmetic will not add up',
          'Nothing, but it is harmless because the record will fail to parse',
          'The checksum, because the stored CRC will not match the bytes that are there',
          'The filesystem, which guarantees writes are all-or-nothing',
        ]}
        correctIndex={2}
        explanation={"The length prefix only proves the record is the size it claims to be, and here it is — 400 bytes are present. They are simply not all the RIGHT 400 bytes. Only a checksum computed over the payload before the write and verified after can tell that the content changed, which is exactly the bit-flip experiment above: valid framing, wrong bytes, silently served. Option 2 is the dangerous assumption — stale block contents can parse perfectly into a plausible key and value, which is worse than a parse failure, not better. Option 4 is a common and expensive misconception: most filesystems guarantee atomicity only for a single sector, and often not even that. Databases assume torn writes are possible and defend against them rather than trusting the layer below."}
      />

      <p>
        The store is now durable and it can tell corrupt bytes from real ones. It has a
        different problem: the file only ever gets bigger.
      </p>

      <h2>Step 6: The Log Grows Forever</h2>

      <p>
        An append-only log has an obvious consequence that is easy to say and hard to feel
        until you watch it. Update one key five hundred times:
      </p>

      <CodeBlock language="text" title="Real output — one key, 500 updates">
{`$ java Kv.java d4/data.log hammer hot-key 500
wrote 500 versions of 'hot-key'

$ java Kv.java d4/data.log stats
recovered 1 live keys from 500 log records (17,392 bytes)

$ java Kv.java d4/data.log get hot-key
GET hot-key -> version-500`}
      </CodeBlock>

      <p>
        <strong>One live key. Seventeen kilobytes.</strong> The useful content of this database
        is about 30 bytes and it is occupying 580 times that. Every superseded version is still
        sitting in the file, and replay dutifully reads all 500 records on every startup to
        arrive at a map with one entry in it.
      </p>

      <p>
        That ratio is <strong>space amplification</strong>, and its friend is startup time:
        recovery is O(size of log), not O(number of live keys), so an append-only store that
        never cleans up gets slower to start every day it runs.
      </p>

      <h3>Compaction</h3>

      <p>
        The fix follows directly from what the log is. If the map after replay is the truth,
        then a log containing exactly one record per live key would replay to the same map.
        So: write that log instead.
      </p>

      <CodeBlock language="java" title="Kv.java — compaction is fifteen lines">
{`long compact() throws IOException {
    Path tmp = log.resolveSibling(log.getFileName() + ".compact");
    try (Kv fresh = new Kv(tmp, true, false)) {
        // the index already knows the newest offset for every LIVE key.
        // deleted keys are simply not in it, so they are never copied.
        for (String k : new TreeSet<>(index.keySet())) fresh.put(k, get(k));
        fresh.ch.force(true);           // durable BEFORE we swap
    }
    ch.close(); raf.close();
    Files.move(tmp, log, StandardCopyOption.REPLACE_EXISTING);   // atomic rename
    return before;
}`}
      </CodeBlock>

      <p>
        Two details in there are load-bearing. The new log is fsynced <em>before</em> the
        rename, and the swap is a <code>rename</code>, which POSIX guarantees is atomic. A
        reader either sees the entire old log or the entire new one, never a half-built file.
        Getting this backwards &mdash; renaming first, syncing later &mdash; is a real way to
        lose an entire database to a power cut during maintenance.
      </p>

      <CodeBlock language="text" title="Real output — compacting the 500-version log">
{`$ java Kv.java d4/data.log compact
compaction: 1 live keys
  log before : 17,392 bytes  (500 records)
  log after  : 35 bytes  (1 records)
  reclaimed  : 99.8%`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output — something closer to a real workload">
{`$ java Kv.java d5/data.log churn 1000 20
1000 keys x 20 revisions, then deleted 500 of them

$ java Kv.java d5/data.log stats
recovered 500 live keys from 20500 log records (778,665 bytes)

$ java Kv.java d5/data.log compact
compaction: 500 live keys
  log before : 778,665 bytes  (20500 records)
  log after  : 19,396 bytes  (500 records)
  reclaimed  : 97.5%

$ java Kv.java d5/data.log get key:2
GET key:2 -> value-2-rev20        # newest revision survived
$ java Kv.java d5/data.log get key:1
GET key:1 -> null                 # deleted key stayed deleted`}
      </CodeBlock>

      <h3>Why a delete must be a record and not an absence</h3>

      <p>
        Deleting looks like it should be the one operation that <em>shrinks</em> a log. Remove
        the key from the map, and it is gone. Run that idea and watch what happens across a
        restart:
      </p>

      <CodeBlock language="text" title="Real output — the same delete, done two ways">
{`--- delete by REMOVING FROM THE MAP (writes nothing) ---
  before restart: get user:1 -> null
  after  restart: get user:1 -> alice   (1 records replayed)

--- delete by APPENDING A TOMBSTONE ---
  before restart: get user:1 -> null
  after  restart: get user:1 -> null   (2 records replayed, 51 bytes on disk)`}
      </CodeBlock>

      <InfoBox variant="danger" title="The deleted key came back">
        <p>
          <code>user:1</code> was deleted, the delete was observed to work, the process
          restarted, and <code>alice</code> was <strong>alive again</strong>. Nothing went
          wrong &mdash; replay did exactly its job. The <code>PUT</code> record was still in
          the log, because an append-only log cannot un-append, and there was nothing after it
          to say otherwise.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Deletion is not the removal of information. It is the addition of
          information</strong> &mdash; the fact that a deletion happened, and when. In a log,
          the absence of a record cannot mean anything, because the log has no way to represent
          absence. Only a record can.
        </p>
      </InfoBox>

      <p>
        So a delete appends a <code>DEL</code> record &mdash; a <strong>tombstone</strong> &mdash;
        and replay treats it as &ldquo;this key is dead as of here&rdquo;. The delete makes the
        file <em>bigger</em>, which feels wrong for about five seconds and then never again.
      </p>

      <p>
        Tombstones are also what makes compaction able to reclaim anything at all: it is the
        tombstone that authorises dropping the older <code>PUT</code>s for that key. And once
        the compacted log contains no records for a key, the tombstone itself has nothing left
        to suppress and can finally be dropped too &mdash; which is exactly what happened above,
        where 500 deletes plus 20,000 puts compacted down to 500 records and no tombstones at
        all.
      </p>

      <InfoBox variant="warning" title="This is where distributed databases get their scariest bug">
        <p>
          In a single-node store, dropping a tombstone at compaction is safe. In a replicated
          one it is not, and the reason is worth carrying around: if a replica was offline when
          the delete happened, and the tombstone is garbage-collected before that replica comes
          back, the returning node still holds the original <code>PUT</code>. Anti-entropy sees
          a value on one node and nothing on the other, concludes the second node is missing
          data, and helpfully replicates the deleted row back to everybody.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          These are called <strong>zombie records</strong>, and Cassandra&apos;s{' '}
          <code>gc_grace_seconds</code> (10 days by default) exists purely to keep tombstones
          around longer than any repair could take. It is one of the clearest cases in this
          whole site of an operational parameter that is completely opaque until you know what
          the log looks like, and completely obvious afterwards.
        </p>
      </InfoBox>

      <h3>Segments: why real engines do not have one big file</h3>

      <p>
        Our <code>compact()</code> has a flaw you can see from the signature: it rewrites the
        entire log into a new file, so it needs enough free disk for a second copy of the
        database, and the store can do nothing else while it runs. On a 500&nbsp;GB dataset that
        is unacceptable twice over.
      </p>

      <p>
        The fix is to stop having one file. Close the current log at some size threshold, open
        a fresh one, and only ever append to the newest. Now every closed segment is immutable,
        so it can be compacted in the background, one at a time, without blocking writes and
        without needing space for a whole second database.
      </p>

      <FlowChart
        title="One log versus segments"
        chart={"graph TD\n  subgraph ONE[\"one file: compaction is a stop-the-world rewrite\"]\n    L1[\"data.log — 500 GB, still being appended to\"]\n  end\n  subgraph SEG[\"segments: only the newest is mutable\"]\n    S1[\"seg-0001 — sealed, immutable\"]\n    S2[\"seg-0002 — sealed, immutable\"]\n    S3[\"seg-0003 — ACTIVE, appends go here\"]\n  end\n  S1 --> C[\"background compaction<br/>merge sealed segments,<br/>drop superseded records\"]\n  S2 --> C\n  C --> M[\"seg-0001-0002.merged\"]\n  W[\"writes\"] --> S3\n  R[\"reads\"] --> S3\n  R --> M\n  style S3 fill:#1a3329,stroke:#4ade80\n  style L1 fill:#3b1a1a,stroke:#f87171\n  style C fill:#1a2744,stroke:#5b9cf6"}
      />

      <p>
        That structure &mdash; an append-only active segment, sealed immutable segments behind
        it, and background merging that drops superseded records &mdash; is the{' '}
        <strong>LSM tree</strong>, and it is what RocksDB, LevelDB, Cassandra, and
        HBase are. It is also, with the compaction removed and a retention window put in its
        place, what a <a href="/springboot/kafka">Kafka</a> partition is: segment files, an
        append-only active one, and offsets that are byte positions into them. Kafka&apos;s
        log-compacted topics are this same mechanism with our exact tombstone semantics, which
        is why a null value in a compacted topic is called a tombstone there too.
      </p>

      <InteractiveChallenge
        question="A log-structured store compacts by keeping only the newest record per key. During compaction of an old segment it finds a PUT for user:7 and no tombstone anywhere in that segment. Can it drop the PUT?"
        options={[
          'Yes — if there is no tombstone in the segment, the key was never deleted',
          'No — a newer segment may hold a newer PUT or a tombstone for that key, so the decision needs the newer segments too',
          'Yes, but only if the segment is older than the retention window',
          'No, because compaction may never drop a PUT record under any circumstances',
        ]}
        correctIndex={1}
        explanation={"Records for one key are spread across segments in write order, so an old segment simply cannot see its own future. A newer segment may contain a newer PUT (making this one superseded) or a tombstone (making it deleted), and either way the old record must go — but neither fact is visible from inside the old segment alone. This is why real compaction merges a RANGE of segments and resolves each key across all of them, rather than cleaning files independently, and why merging is the part of an LSM engine where all the difficulty lives. Option 3 confuses compaction with retention: Kafka offers both, and they are different policies — retention drops old data by age regardless of liveness, compaction drops superseded data regardless of age."}
      />

      <p>
        One thing has been quietly assumed for the last three steps: that a read is cheap. It is
        worth checking whether that is true.
      </p>

      <h2>Step 7: Reads, and the Index That Makes Them Possible</h2>

      <p>
        It is not true. Think about what <code>get(&quot;user:7&quot;)</code> has to do with
        nothing but a log. The newest write wins, and the newest write is at the <em>end</em> — so
        a correct read has to walk the entire file to the last record for that key. Every read is
        a full scan.
      </p>

      <CodeBlock language="text" title="Real output — 100,000 records, 4.3 MB log">
{`log: 100,000 records, 4,477,780 bytes (4.3 MB)

scan  :    20 gets     1270 ms      63500.0 us/get
index : 1,000 gets      1.9 ms          1.92 us/get   (index build 81 ms, 100,000 keys)`}
      </CodeBlock>

      <p>
        Sixty-three <em>milliseconds</em> per read on a 4.3 MB file — and it grows linearly, so a
        4 GB log would take about a minute per get. That is not a slow database, it is a
        non-functional one. The indexed read is <strong>33,000x faster</strong>, and the fix is
        smaller than the problem suggests.
      </p>

      <p>
        You are already walking the whole log at startup to rebuild the map (Step 3). Record the
        byte <em>offset</em> of each record while you do it, and you get a lookup table for free:
      </p>

      <CodeBlock language="java" title="The index is a by-product of recovery you already do">
{`Map<String, Long> index = new HashMap<>();   // key -> byte offset of its newest record

// during replay, instead of storing the value, store where it lives:
index.put(key, offsetOfThisRecord);

// then a read is one positioned read, not a scan:
String get(String key) throws IOException {
    Long off = index.get(key);
    if (off == null) return null;
    return readRecordAt(off);      // ch.read(buf, off) - no walking
}`}
      </CodeBlock>

      <FlowChart
        title="Two read paths over the identical file"
        chart={"graph TD\n  A[\"get(user:7)\"] --> B{\"is there an index?\"}\n  B -->|\"no\"| C[\"open at offset 0\"]\n  C --> D[\"read every record<br/>to the end of the file\"]\n  D --> E[\"keep the LAST match<br/>63,500 us\"]\n  B -->|\"yes\"| F[\"index.get(key)<br/>-> byte offset\"]\n  F --> G[\"one positioned read<br/>1.92 us\"]\n  style E fill:#3b1a1a,stroke:#f87171\n  style G fill:#1a3329,stroke:#4ade80"}
      />

      <InfoBox variant="warning" title="What the index costs you">
        <p>
          <strong>Memory.</strong> Every key lives in RAM, forever. 100,000 keys built in 81ms and
          cost a few megabytes; a billion keys would not fit. This is the defining constraint of
          the <strong>Bitcask</strong> design (Riak&apos;s storage engine): all keys in memory, all
          values on disk, one disk seek per read — fast and simple, as long as your keyset fits.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          <strong>Startup time.</strong> That 81ms scan is not optional — it is your recovery time,
          and it grows with the log. It is exactly why Step 6&apos;s compaction matters and why
          real engines snapshot: nobody wants a service whose boot time is a function of its
          lifetime write volume.
        </p>
      </InfoBox>

      <p>
        When the keyset outgrows RAM you stop indexing every key and index every <em>n</em>th key
        instead — a <strong>sparse index</strong> over sorted segments, which is the LSM-tree
        design behind RocksDB, LevelDB and Cassandra. A read binary-searches the sparse index to
        find a nearby offset, then scans a short distance. Bloom filters go in front to answer
        &quot;this segment definitely does not contain your key&quot; without touching the disk at
        all.
      </p>

      <InteractiveChallenge
        question="Your log-structured store keeps every key in an in-memory hash index. Reads are fast, but the service now takes four minutes to start. What is the most likely cause, and the right fix?"
        options={[
          'The disk is failing — replace the hardware',
          'Startup replays the entire log to rebuild the index, so boot time grows with total write history; the fix is compaction plus periodic snapshots of the index',
          'The index hash function is too slow — switch to a faster hash',
          'The JVM heap is too small — increase -Xmx',
        ]}
        correctIndex={1}
        explanation={"Rebuilding the index is a full replay of the log, so startup time is proportional to how much has ever been written rather than to how much data currently exists — a store holding 1,000 live keys can still take minutes to boot if those keys were overwritten ten million times. Compaction fixes the underlying cause by collapsing superseded records so the log reflects live data instead of full history; snapshotting the index (or the hint files Bitcask writes alongside each segment) fixes the symptom by letting startup load a prebuilt index and replay only the tail. A bigger heap or faster hash does not help, because the cost is reading and parsing the whole file, not hashing."}
      />

      <h2>What You Just Built, In Real Names</h2>

      <CodeBlock language="text" title="The toy, and its production counterparts">
{`what we built            what it is called        where you have met it
-----------------------  ----------------------  ------------------------------
append before ack        write-ahead logging     Postgres WAL, MySQL redo log,
                                                 SQLite journal, etcd WAL
replay on startup        crash recovery          every database boot sequence
fsync knob               durability level        Postgres synchronous_commit,
                                                 MySQL innodb_flush_log_at_trx
                                                 _commit, Redis appendfsync
length + CRC per record  record framing          Kafka record batches,
                                                 Postgres WAL record headers
tombstone for delete     logical deletion        Kafka compacted topics,
                                                 Cassandra tombstones
compaction               log compaction / GC     Kafka log compaction,
                                                 LSM-tree merge in RocksDB
in-memory offset index   the keydir              Bitcask (Riak); the ancestor
                                                 of every LSM sparse index

An append-only log plus an in-memory index IS a database. Everything a
real engine adds - MVCC, transactions, secondary indexes, a query
planner - sits on top of these same primitives.`}
      </CodeBlock>

      <h2>What This Toy Does Not Do</h2>

      <CodeBlock language="text" title="The distance between this page and a real engine">
{`NOT IMPLEMENTED HERE:

  concurrency        one writer, no locking, no MVCC. Two threads calling
                     put() would interleave records and corrupt the file.
  transactions       no atomic multi-key writes. Real WALs write a
                     begin/commit pair and only replay COMMITTED groups.
  segments           one file that grows forever. Real engines roll to a
                     new segment at a size threshold and compact older ones
                     in the background, while still serving reads.
  snapshots          startup replays everything. Real engines checkpoint.
  range queries      a hash index answers "get key" and nothing else.
                     Ordered scans need a sorted structure - a B-tree, or
                     the sorted string tables of an LSM.
  fsync on macOS     ch.force() does NOT guarantee the drive flushed its
                     own write cache on macOS; that needs F_FULLFSYNC.
                     The numbers here are honest about the syscall, not
                     about the physical platter.
  secondary indexes, compression, encryption, replication.`}
      </CodeBlock>

      <InfoBox variant="tip" title="Where this connects to the rest of the section">
        <p>
          The fsync measurement in Step 4 is the single most transferable thing on this page. It
          is the same problem behind{' '}
          <a href="/from-scratch/consensus">Build Raft</a>: a Raft node must persist{' '}
          <code>currentTerm</code> and <code>votedFor</code> to disk <em>before</em> replying to a
          vote request, or a node that reboots can vote twice in one term and elect two leaders.
          Same syscall, same cost, and there the consequence is a split brain rather than a lost
          write.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Put the two together and you have the shape of etcd: this log, replicated by that
          algorithm.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default FromScratchStorage;
