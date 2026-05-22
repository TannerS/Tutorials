import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import InteractiveChallenge from '../../components/InteractiveChallenge';
import LessonLayout from '../../components/LessonLayout';

function Concurrency() {
  return (
    <LessonLayout
      title="Concurrency & Threads"
      sectionId="java"
      lessonIndex={7}
      prev={{ path: '/java/streams', label: 'Streams & Lambdas' }}
      next={{ path: '/java/io', label: 'I/O & File Handling' }}
    >
      <h2>Introduction to Concurrency</h2>
      <p>
        Concurrency allows multiple tasks to make progress simultaneously. Java was designed with
        built-in support for multithreading from day one, making it one of the most powerful
        languages for concurrent programming. Understanding threads is essential for building
        responsive applications, processing data in parallel, and utilizing modern multi-core
        processors.
      </p>

      <FlowChart
        title="Thread Lifecycle"
        chart={"graph LR\nA[NEW] --> B[RUNNABLE]\nB --> C[RUNNING]\nC --> D[BLOCKED/WAITING]\nD --> B\nC --> E[TERMINATED]\nB --> E"}
      />

      <h2>Creating Threads</h2>
      <p>
        There are two primary ways to create threads in Java: extending the <code>Thread</code>{' '}
        class or implementing the <code>Runnable</code> interface. The <code>Runnable</code>{' '}
        approach is preferred because Java only supports single inheritance, and implementing an
        interface keeps your class free to extend other classes.
      </p>

      <CodeBlock language="java" title="CreatingThreads.java">
{`// Approach 1: Extending Thread class
class MyThread extends Thread {
    private String name;

    public MyThread(String name) {
        this.name = name;
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(name + ": count " + i);
            try {
                Thread.sleep(100); // pause for 100ms
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }
}

// Approach 2: Implementing Runnable (preferred)
class MyRunnable implements Runnable {
    private String name;

    public MyRunnable(String name) {
        this.name = name;
    }

    @Override
    public void run() {
        for (int i = 0; i < 5; i++) {
            System.out.println(name + ": count " + i);
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return;
            }
        }
    }
}

public class ThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        // Using Thread subclass
        MyThread t1 = new MyThread("Thread-A");
        t1.start(); // start() creates new thread; don't call run() directly

        // Using Runnable
        Thread t2 = new Thread(new MyRunnable("Thread-B"));
        t2.start();

        // Using lambda (shortest approach)
        Thread t3 = new Thread(() -> {
            for (int i = 0; i < 5; i++) {
                System.out.println("Lambda-Thread: count " + i);
                try { Thread.sleep(100); }
                catch (InterruptedException e) { return; }
            }
        });
        t3.start();

        // Wait for all threads to complete
        t1.join();
        t2.join();
        t3.join();
        System.out.println("All threads finished.");
    }
}`}
      </CodeBlock>

      <InfoBox variant="warning" title="start() vs run()">
        <p>
          Always call <code>start()</code> to launch a new thread. Calling <code>run()</code>{' '}
          directly executes the code on the current thread — no new thread is created. This is a
          common beginner mistake that eliminates all concurrency benefits.
        </p>
      </InfoBox>

      <h2>Synchronization</h2>
      <p>
        When multiple threads access shared mutable data, race conditions can occur. Java
        provides the <code>synchronized</code> keyword to ensure that only one thread at a time
        can execute a critical section of code.
      </p>

      <CodeBlock language="java" title="SynchronizationExample.java">
{`public class BankAccount {
    private double balance;

    public BankAccount(double balance) {
        this.balance = balance;
    }

    // Synchronized method: only one thread can execute this at a time
    public synchronized void deposit(double amount) {
        double temp = balance;
        try { Thread.sleep(1); } catch (InterruptedException e) {}
        balance = temp + amount;
    }

    public synchronized void withdraw(double amount) {
        if (balance >= amount) {
            double temp = balance;
            try { Thread.sleep(1); } catch (InterruptedException e) {}
            balance = temp - amount;
        }
    }

    public synchronized double getBalance() {
        return balance;
    }
}

public class SyncDemo {
    public static void main(String[] args) throws InterruptedException {
        BankAccount account = new BankAccount(1000);

        Thread depositor = new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                account.deposit(10);
            }
        });

        Thread withdrawer = new Thread(() -> {
            for (int i = 0; i < 100; i++) {
                account.withdraw(10);
            }
        });

        depositor.start();
        withdrawer.start();
        depositor.join();
        withdrawer.join();

        // With synchronization: always 1000
        // Without synchronization: unpredictable result
        System.out.println("Final balance: $" + account.getBalance());
    }
}`}
      </CodeBlock>

      <h2>ExecutorService</h2>
      <p>
        Creating raw threads manually is low-level and error-prone. The{' '}
        <code>ExecutorService</code> framework provides a higher-level abstraction for managing
        thread pools, submitting tasks, and handling results.
      </p>

      <CodeBlock language="java" title="ExecutorExample.java">
{`import java.util.concurrent.*;
import java.util.List;
import java.util.ArrayList;

public class ExecutorExample {
    public static void main(String[] args) throws Exception {
        // Create a fixed thread pool with 4 threads
        ExecutorService executor = Executors.newFixedThreadPool(4);

        // Submit Runnable tasks (no return value)
        executor.submit(() -> System.out.println("Task 1 on " +
            Thread.currentThread().getName()));
        executor.submit(() -> System.out.println("Task 2 on " +
            Thread.currentThread().getName()));

        // Submit Callable tasks (with return value)
        Future<Integer> future = executor.submit(() -> {
            Thread.sleep(1000);
            return 42;
        });

        System.out.println("Doing other work while waiting...");
        Integer result = future.get(); // blocks until result is available
        System.out.println("Result: " + result);

        // Submit multiple tasks and collect results
        List<Future<String>> futures = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            final int taskId = i;
            futures.add(executor.submit(() -> {
                Thread.sleep(100);
                return "Result from task " + taskId;
            }));
        }

        for (Future<String> f : futures) {
            System.out.println(f.get());
        }

        // Always shut down the executor
        executor.shutdown();
        executor.awaitTermination(5, TimeUnit.SECONDS);
        System.out.println("All tasks complete.");
    }
}`}
      </CodeBlock>

      <h2>CompletableFuture</h2>
      <p>
        <code>CompletableFuture</code> (Java 8+) enables non-blocking, composable asynchronous
        programming. It supports chaining operations, combining multiple futures, and handling
        errors gracefully.
      </p>

      <CodeBlock language="java" title="CompletableFutureExample.java">
{`import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

public class CompletableFutureExample {
    public static void main(String[] args) {
        // Simple async task
        CompletableFuture<String> future = CompletableFuture.supplyAsync(() -> {
            sleep(1000);
            return "Hello from async!";
        });

        // Non-blocking: register callback
        future.thenAccept(result -> System.out.println("Got: " + result));

        // Chaining transformations
        CompletableFuture<Integer> chain = CompletableFuture
            .supplyAsync(() -> "Java Concurrency")
            .thenApply(String::length)
            .thenApply(len -> len * 2);

        System.out.println("Chain result: " + chain.join()); // 32

        // Combining two futures
        CompletableFuture<String> userFuture = CompletableFuture
            .supplyAsync(() -> { sleep(500); return "Alice"; });
        CompletableFuture<Integer> ageFuture = CompletableFuture
            .supplyAsync(() -> { sleep(300); return 30; });

        CompletableFuture<String> combined = userFuture
            .thenCombine(ageFuture, (name, age) -> name + " is " + age);
        System.out.println(combined.join()); // Alice is 30

        // Error handling
        CompletableFuture<String> withError = CompletableFuture
            .supplyAsync(() -> {
                if (true) throw new RuntimeException("Something failed");
                return "success";
            })
            .exceptionally(ex -> "Recovered: " + ex.getMessage());
        System.out.println(withError.join());

        // Wait for all futures to complete
        CompletableFuture<Void> all = CompletableFuture.allOf(
            CompletableFuture.runAsync(() -> sleep(100)),
            CompletableFuture.runAsync(() -> sleep(200)),
            CompletableFuture.runAsync(() -> sleep(300))
        );
        all.join();
        System.out.println("All futures completed.");
    }

    private static void sleep(long millis) {
        try { TimeUnit.MILLISECONDS.sleep(millis); }
        catch (InterruptedException e) { Thread.currentThread().interrupt(); }
    }
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Thread Pool Sizing">
        <p>
          For CPU-bound tasks, use a thread pool with roughly the same number of threads as CPU
          cores: <code>Runtime.getRuntime().availableProcessors()</code>. For I/O-bound tasks
          (network, file, database), you can use a larger pool since threads spend most of their
          time waiting. <code>Executors.newCachedThreadPool()</code> creates threads on demand and
          reuses idle ones, which works well for I/O-bound workloads.
        </p>
      </InfoBox>

      <h2>Test Your Knowledge</h2>

      <InteractiveChallenge
        question="What is the main risk when multiple threads access shared mutable data without synchronization?"
        options={[
          "The program runs slower",
          "A race condition leading to unpredictable results",
          "The JVM automatically prevents all concurrent access",
          "Threads are automatically serialized"
        ]}
        correctIndex={1}
        explanation="Without proper synchronization, multiple threads can read and write shared data at the same time, leading to race conditions. This can produce inconsistent, unpredictable results — for example, a bank balance being incorrect because two threads read the old value before either writes the new one. The JVM does NOT automatically prevent concurrent access; you must use synchronized, locks, or atomic variables."
      />
    </LessonLayout>
  );
}

export default Concurrency;
