import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

export default function ExtractComponents() {
  return (
    <LessonLayout
      title="Extracting Components Instead of Conditionals"
      sectionId="react-antipatterns"
      lessonIndex={5}
      prev={{ path: '/react-antipatterns/components', label: 'Component Anti-Patterns' }}
      next={{ path: '/react-antipatterns/bestpractices', label: 'Best Practices Checklist' }}
    >
      <InfoBox variant="info" title="This Builds On the Previous Lesson">
        The last lesson fixed &quot;ternary pyramids&quot; with early returns and guard
        clauses — that&apos;s the right move when each branch is a single line, like{' '}
        <code>return &lt;Spinner /&gt;</code>. This lesson is the next level up: what to do
        when each branch isn&apos;t one line, it&apos;s a whole chunk of real UI. The fix
        there isn&apos;t restructuring the <code>if</code>s — it&apos;s getting rid of most
        of them by moving each branch into its own component. The refactor has a name:{' '}
        <strong>Extract Component</strong>, a React-flavored version of Martin Fowler&apos;s
        classic &quot;Extract Function&quot; refactoring.
      </InfoBox>

      <h2>The Refactor: One Big Conditional → Header + Branch Components</h2>
      <p>
        Here&apos;s a component that fetches a person and renders different profile UI
        depending on their type. Nothing about the fetch is wrong — the problem is what
        happens inside the <code>return</code>:
      </p>

      <CodeBlock language="jsx" title="❌ BEFORE — One component owns every branch">
{`function DisplayPerson({ personId }) {
  const [person, setPerson] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(\`/api/people/\${personId}\`).then((res) => {
      if (!cancelled) setPerson(res.data);
    });
    return () => { cancelled = true; };
  }, [personId]);

  if (!person) return <Spinner />;

  return (
    <>
      <div className="header">
        <h1>Welcome {person.name}</h1>
      </div>

      {person.type === 'teacher' ? (
        <div className="teacher-profile">
          <h2>Subjects Taught</h2>
          <ul>{person.subjects.map((s) => <li key={s}>{s}</li>)}</ul>
          <p>Department: {person.department}</p>
          <p>Years teaching: {person.yearsTeaching}</p>
          {/* imagine another 40 lines here: office hours, class roster... */}
        </div>
      ) : (
        <div className="student-profile">
          <h2>Enrolled Courses</h2>
          <ul>{person.courses.map((c) => <li key={c}>{c}</li>)}</ul>
          <p>Grade level: {person.gradeLevel}</p>
          <p>GPA: {person.gpa}</p>
          {/* imagine another 40 lines here: schedule, advisor, grades... */}
        </div>
      )}
    </>
  );
}`}
      </CodeBlock>

      <p>
        This works. The problem shows up later: every time someone touches the teacher
        branch, they&apos;re editing <code>DisplayPerson</code>. Every time someone adds a
        console.log to debug the student view, they&apos;re scrolling past teacher JSX to
        find it. And neither branch can be reused, tested, or even read on its own — they&apos;re
        welded to the ternary. Here&apos;s the same behavior with each branch pulled out:
      </p>

      <CodeBlock language="jsx" title="✅ AFTER — Header, TeacherProfile, and StudentProfile are separate components">
{`function Header({ name }) {
  return (
    <div className="header">
      <h1>Welcome {name}</h1>
    </div>
  );
}

function TeacherProfile({ person }) {
  return (
    <div className="teacher-profile">
      <h2>Subjects Taught</h2>
      <ul>{person.subjects.map((s) => <li key={s}>{s}</li>)}</ul>
      <p>Department: {person.department}</p>
      <p>Years teaching: {person.yearsTeaching}</p>
    </div>
  );
}

function StudentProfile({ person }) {
  return (
    <div className="student-profile">
      <h2>Enrolled Courses</h2>
      <ul>{person.courses.map((c) => <li key={c}>{c}</li>)}</ul>
      <p>Grade level: {person.gradeLevel}</p>
      <p>GPA: {person.gpa}</p>
    </div>
  );
}

function DisplayPerson({ personId }) {
  const [person, setPerson] = useState(null);

  useEffect(() => {
    let cancelled = false;
    axios.get(\`/api/people/\${personId}\`).then((res) => {
      if (!cancelled) setPerson(res.data);
    });
    return () => { cancelled = true; };
  }, [personId]);

  if (!person) return <Spinner />;

  return (
    <>
      <Header name={person.name} />
      {person.type === 'teacher' ? (
        <TeacherProfile person={person} />
      ) : (
        <StudentProfile person={person} />
      )}
    </>
  );
}`}
      </CodeBlock>

      <FlowChart
        title="What Actually Changed — the Component Tree, Not the Behavior"
        chart={
          'graph TD\n' +
          '  subgraph Before["Before — one component, internal branching"]\n' +
          '    D1["DisplayPerson"] -->|"contains ALL the JSX for both branches"| J1["header + teacher JSX + student JSX, all in one function"]\n' +
          '  end\n' +
          '  subgraph After["After — composition, no internal branching"]\n' +
          '    D2["DisplayPerson — picks WHICH component, owns none of their JSX"] --> H["Header"]\n' +
          '    D2 --> T["TeacherProfile — only exists, only re-renders, when type is teacher"]\n' +
          '    D2 --> S["StudentProfile — only exists, only re-renders, when type is student"]\n' +
          '  end\n' +
          '  style D1 fill:#3b1a1a\n' +
          '  style D2 fill:#1a3329\n' +
          '  style T fill:#1a2744\n' +
          '  style S fill:#1a2744'
        }
      />

      <InfoBox variant="tip" title="This Is the Single Responsibility Principle, Applied to JSX">
        <p>
          <code>DisplayPerson</code> now has exactly one job: decide which profile to show.{' '}
          <code>TeacherProfile</code> has exactly one job: render a teacher. Neither has to
          understand the other. This is the same idea covered in{' '}
          <a href="/solid/srp">Single Responsibility</a> — a component (like a class) should
          have one reason to change. Before the refactor, <code>DisplayPerson</code> had two
          reasons to change (teacher UI, student UI) plus a third (the fetch). After, it has
          exactly one.
        </p>
        <p>
          It also makes each branch independently testable — you can render{' '}
          <code>&lt;TeacherProfile person={'{'}mockTeacher{'}'}/&gt;</code> in a test with no
          fetch, no loading state, and no student code anywhere in the file being tested.
        </p>
      </InfoBox>

      <h2>Scaling Past Two Branches: The Component Map</h2>
      <p>
        A ternary is fine for two branches. The moment a third type shows up — say,{' '}
        <code>admin</code> — the ternary either grows into a nested ternary (the exact
        pyramid the previous lesson warned about) or an if/else chain:
      </p>

      <CodeBlock language="jsx" title="❌ Every new type means editing this chain again">
{`return (
  <>
    <Header name={person.name} />
    {person.type === 'teacher' ? (
      <TeacherProfile person={person} />
    ) : person.type === 'student' ? (
      <StudentProfile person={person} />
    ) : person.type === 'admin' ? (
      <AdminProfile person={person} />
    ) : (
      <GuestProfile person={person} />
    )}
  </>
);`}
      </CodeBlock>

      <p>
        Each new type doesn&apos;t just add a component — it adds another <code>: type
        === '...' ?</code> clause to an existing, working chain, which is exactly the kind
        of edit that&apos;s easy to get wrong (wrong order, a typo&apos;d type string,
        a misplaced parenthesis). Once every branch is already its own component, there&apos;s a
        better option: a plain object mapping each type to the component that renders it.
      </p>

      <CodeBlock language="jsx" title="✅ Adding a type means adding a map entry, not editing the chain">
{`const PROFILE_BY_TYPE = {
  teacher: TeacherProfile,
  student: StudentProfile,
  admin: AdminProfile,
};

function DisplayPerson({ personId }) {
  const [person, setPerson] = useState(null);
  // ...same fetch as before...

  if (!person) return <Spinner />;

  const Profile = PROFILE_BY_TYPE[person.type] ?? GuestProfile;

  return (
    <>
      <Header name={person.name} />
      <Profile person={person} />
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="note" title="You've Just Written the Strategy Pattern">
        A component map is a plain-JavaScript version of the{' '}
        <a href="/patterns/strategy">Strategy pattern</a> — instead of one big conditional
        deciding <em>how</em> to behave, you pick <em>which already-written behavior</em> to
        use from a lookup table. It also buys you the{' '}
        <a href="/solid/ocp">Open/Closed Principle</a> for free: supporting a new person type
        means writing a new component and adding one line to{' '}
        <code>PROFILE_BY_TYPE</code> — nothing about <code>DisplayPerson</code> itself, or
        any existing profile component, has to change or even be re-read.
      </InfoBox>

      <h2>Making It Type-Safe: Discriminated Unions</h2>
      <p>
        Extraction pays off again once TypeScript enters the picture. A teacher and a student
        don&apos;t share the same shape — <code>subjects</code> and <code>gradeLevel</code>{' '}
        only make sense for one type or the other. Model that directly with a{' '}
        <strong>discriminated union</strong>, keyed on the same <code>type</code> field the
        branching already uses:
      </p>

      <CodeBlock language="ts" title="A discriminated union — one field decides which shape you have">
{`type Teacher = {
  type: 'teacher';
  name: string;
  subjects: string[];
  department: string;
  yearsTeaching: number;
};

type Student = {
  type: 'student';
  name: string;
  courses: string[];
  gradeLevel: number;
  gpa: number;
};

type Person = Teacher | Student;`}
      </CodeBlock>

      <p>
        Without extraction, a single component handling the whole <code>Person</code> union
        would need an <code>if (person.type === 'teacher')</code> narrowing check before it
        could safely read <code>person.subjects</code> — TypeScript won&apos;t let you read
        a teacher-only field on a value that might be a student. With extraction, that
        narrowing check already happened once, at the point where <code>DisplayPerson</code>{' '}
        decided which component to render. Each extracted component&apos;s prop type can just{' '}
        <em>be</em> the narrow type:
      </p>

      <CodeBlock language="tsx" title="Each component's props are the ALREADY-NARROWED type — no runtime check needed inside">
{`function TeacherProfile({ person }: { person: Teacher }) {
  // person.subjects is just... there. No narrowing, no optional chaining,
  // no "this might actually be a Student" to guard against — TypeScript
  // already guarantees it by the time this component runs.
  return (
    <div className="teacher-profile">
      <h2>Subjects Taught</h2>
      <ul>{person.subjects.map((s) => <li key={s}>{s}</li>)}</ul>
      <p>Department: {person.department}</p>
      <p>Years teaching: {person.yearsTeaching}</p>
    </div>
  );
}

function StudentProfile({ person }: { person: Student }) {
  return (
    <div className="student-profile">
      <h2>Enrolled Courses</h2>
      <ul>{person.courses.map((c) => <li key={c}>{c}</li>)}</ul>
      <p>Grade level: {person.gradeLevel}</p>
      <p>GPA: {person.gpa}</p>
    </div>
  );
}

function DisplayPerson({ person }: { person: Person }) {
  return (
    <>
      <Header name={person.name} />
      {person.type === 'teacher' ? (
        <TeacherProfile person={person} />   // TS has narrowed person to Teacher here
      ) : (
        <StudentProfile person={person} />   // ...and to Student here
      )}
    </>
  );
}`}
      </CodeBlock>

      <InfoBox variant="tip" title="Try passing the wrong type">
        If you write <code>&lt;TeacherProfile person={'{'}someStudent{'}'} /&gt;</code>{' '}
        anywhere in this file, TypeScript rejects it at compile time — <code>Student</code>{' '}
        has no <code>subjects</code> or <code>department</code> field, so it doesn&apos;t
        satisfy <code>{'{ person: Teacher }'}</code>. That&apos;s a mistake the ternary
        version can only catch by actually running the wrong branch in the browser.
      </InfoBox>

      <h2>When to Stop Extracting</h2>
      <p>
        Extraction is a tool, not a rule to apply everywhere. Two things to watch for:
      </p>

      <CodeBlock language="jsx" title="❌ Extracting a component with no real content just adds indirection">
{`// This component does nothing a plain expression didn't already do.
function NameLabel({ name }) {
  return <span>{name}</span>;
}

// Just write this instead:
<span>{person.name}</span>`}
      </CodeBlock>

      <p>
        Extract a branch when it has real structure worth naming and isolating — multiple
        elements, a list, its own local state, its own event handlers. A single{' '}
        <code>&lt;span&gt;</code> around one value doesn&apos;t clear that bar; it&apos;s a
        wrapper that exists only to be a wrapper.
      </p>

      <InfoBox variant="warning" title="Watch for prop drilling as branches grow further">
        If <code>TeacherProfile</code> itself later grows and gets split into{' '}
        <code>ScheduleTable</code>, <code>OfficeHours</code>, and <code>ClassRoster</code>,
        watch how far <code>person</code> travels unchanged through props. Passing the same
        object down three or four layers is a sign to reach for{' '}
        <a href="/state-mgmt/intro">Context</a> or the <code>children</code> prop instead of
        threading it further — that&apos;s a separate lesson&apos;s worth of nuance, not a
        reason to avoid extracting in the first place.
      </InfoBox>

      <h2>Key Takeaways</h2>
      <p>
        <strong>Extract a component when a conditional branch is real UI</strong>, not just a
        one-liner — that&apos;s what turns &quot;fix the ternary&quot; into &quot;fix the
        architecture.&quot; <strong>Past two branches, reach for a component map</strong>{' '}
        instead of a longer chain — it&apos;s the Strategy pattern, and it means new types
        cost one line, not an edited conditional. <strong>Let extraction do your type
        narrowing for you</strong> — a discriminated union plus one component per variant
        means no component ever has to ask &quot;wait, which kind of person is this&quot; at
        runtime. And <strong>don&apos;t extract components with nothing in them</strong> —
        the goal is fewer places to look for a bug, not more files to open to find one.
      </p>
    </LessonLayout>
  );
}
