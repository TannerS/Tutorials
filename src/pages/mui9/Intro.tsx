import CodeBlock from '../../components/CodeBlock';
import FlowChart from '../../components/FlowChart';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function Mui9Intro() {
  return (
    <LessonLayout
      title="MUI v9 — Where the Library Actually Is"
      sectionId="mui9"
      lessonIndex={0}
      prev={null}
      next={{ path: '/mui9/silent-breaks', label: 'The Breaks That Do Not Warn You' }}
    >
      <InfoBox variant="tip" title="✅ Version notice — this section is the current release">
        <p>
          This section teaches <strong><code>@mui/material@9.4.0</code></strong>, which is the
          current stable release. Every version number, API shape and CSS string on these pages was
          read out of a real install of 9.4.0 rather than from documentation.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          If you are working in the v4 codebase, that material lives in its own section:{' '}
          <a href="/mui/intro">MUI (Material UI)</a>, which covers{' '}
          <code>@material-ui/core@4.12.4</code>, <code>makeStyles</code> and{' '}
          <code>withStyles</code>. The two sections are deliberately separate because the
          libraries are separate — different package names, different styling engines, different
          theme keys.
        </p>
      </InfoBox>

      <p>
        The single most useful fact about MUI in 2026 is that the version you are most likely to
        read about online is not the version that exists. Tutorials, Stack Overflow answers and
        LLM output overwhelmingly describe v5, because v5 was the big rewrite and generated the
        most writing. Four majors have shipped since.
      </p>

      <h2>The Version Landscape, Verified</h2>

      <CodeBlock language="bash" title="Read from the npm registry, not from memory">
{`$ npm view @mui/material dist-tags
latest     = 9.4.0
latest-v7  = 7.3.11
latest-v6  = 6.5.0
latest-v5  = 5.18.0

$ npm view @mui/material version
9.4.0

# published majors:  5, 6, 7, 9
# there is NO 8.x. The version list goes 7.3.11 -> 9.0.0-alpha.0`}
      </CodeBlock>

      <InfoBox variant="note" title="The missing 8">
        <p>
          There is genuinely no <code>8.x</code> release of <code>@mui/material</code> — the
          published majors are 5, 6, 7 and 9. This is worth knowing purely so that you do not
          waste an afternoon hunting for migration notes that were never written. If you see a
          &quot;MUI v8&quot; guide anywhere, it is describing something that does not exist.
        </p>
      </InfoBox>

      <h2>What Package Am I Even Importing?</h2>

      <p>
        The rename at v5 is the fault line that splits every piece of MUI documentation in half.
        Before it, the packages were <code>@material-ui/*</code> and the project was called
        Material-UI. From v5 on they are <code>@mui/*</code> and the project is MUI:
      </p>

      <CodeBlock language="text" title="The rename — this is how you date a code sample instantly">
{`v4 and earlier                    v5 and later
--------------------------------  --------------------------------
@material-ui/core                 @mui/material
@material-ui/icons                @mui/icons-material
@material-ui/lab                  @mui/lab
@material-ui/styles               @mui/styles      (bridge only - see below)
                                  @mui/system      (the sx/styled engine)

Styling engine:  JSS              emotion (or Pigment CSS, opt-in)`}
      </CodeBlock>

      <p>
        So the import line alone dates a snippet. If you are reading{' '}
        <code>import Button from &apos;@material-ui/core/Button&apos;</code>, you are looking at
        code that is at least five majors old regardless of when the blog post was published.
      </p>

      <h2>Verified Facts About the Installed Package</h2>

      <CodeBlock language="text" title="Read out of node_modules/@mui/material/package.json">
{`version        9.4.0
peer react     ^17.0.0 || ^18.0.0 || ^19.0.0
module type    commonjs
main           ./index.js`}
      </CodeBlock>

      <p>
        Note the React peer range: v9 still supports React 17. That is unusually generous, and it
        means upgrading MUI does not force a React upgrade at the same time — a genuinely useful
        property when you are trying to change one variable at a time.
      </p>

      <h2>The One-Way Door: @mui/styles</h2>

      <p>
        If your v4 codebase leans on <code>makeStyles</code>, the tempting migration path is the{' '}
        <code>@mui/styles</code> bridge package, which provides a <code>makeStyles</code> that
        works against the new theme. It is real, and it is a dead end:
      </p>

      <CodeBlock language="bash" title="Where the bridge stops">
{`$ npm view @mui/styles dist-tags
latest    = 6.4.8      <- NOTE: the latest tag is BEHIND the newest stable
latest-v6 = 6.5.0      <- the actual highest stable release
next      = 7.0.0-beta.4

# There is no stable @mui/styles@7, and none for 9.
# Every 7.x entry in the version list is an alpha or a beta.`}
      </CodeBlock>

      <InfoBox variant="danger" title="Adopting @mui/styles caps you at v6, permanently">
        <p>
          The bridge never shipped a stable 7. So a codebase that migrates{' '}
          <code>makeStyles</code> onto <code>@mui/styles</code> can reach v6 and then stops — it
          cannot go to 7 or 9 without doing the styling migration it was trying to avoid. The
          bridge buys time, and charges the same work later plus two extra majors of drift.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          If you have a <code>makeStyles</code>-heavy codebase and want a{' '}
          <code>makeStyles</code>-shaped API that is <em>not</em> capped, look at{' '}
          <strong>tss-react</strong> instead. It gives you the same hook shape on top of emotion,
          and MUI ships a <code>jss-to-tss-react</code> codemod for the conversion.
        </p>
      </InfoBox>

      <p>
        In v9 the old entry point does not silently misbehave — it throws with a message that
        tells you exactly what happened:
      </p>

      <CodeBlock language="text" title="Real output — calling makeStyles from @mui/material/styles on 9.4.0">
{`MUI: makeStyles is no longer exported from @mui/material/styles.`}
      </CodeBlock>

      <p>
        Also gone: <code>createMuiTheme</code> is <strong>absent</strong> from{' '}
        <code>@mui/material/styles</code> in 9.4.0. The v4 spelling was renamed to{' '}
        <code>createTheme</code> at v5, kept as a deprecated alias for a while, and has since been
        removed outright.
      </p>

      <h2>How to Tell Which Version a Codebase Is On</h2>

      <FlowChart
        title="Dating a MUI codebase from its source"
        chart={"graph TD\n  A[\"open any component file\"] --> B{\"import path?\"}\n  B -->|\"@material-ui/core\"| C[\"v4 or earlier\"]\n  B -->|\"@mui/material\"| D{\"how is it styled?\"}\n  D -->|\"makeStyles from @mui/styles\"| E[\"v5 or v6<br/>capped at 6.x\"]\n  D -->|\"styled() / sx\"| F{\"Grid props?\"}\n  F -->|\"item xs={6}\"| G[\"v5 or v6 Grid\"]\n  F -->|\"size={6}\"| H[\"v7 or v9\"]\n  style C fill:#3b1a1a,stroke:#f87171\n  style E fill:#3d2f14\n  style H fill:#1a3329,stroke:#4ade80"}
      />

      <CodeBlock language="bash" title="Or just ask the build what actually resolved">
{`# what the manifest DECLARES (a lockfile or override can make this a lie)
grep '"@mui/material"' package.json

# what actually RESOLVED - the truth
npm ls @mui/material

# read it straight out of the installed package
node -p "require('@mui/material/package.json').version"

# grep-level smell tests, no install needed
grep -rl "@material-ui/"        # -> v4
grep -rl "@mui/styles"          # -> capped at v6
grep -rl "Grid item"            # -> v5/v6 Grid API
grep -rl "createMuiTheme"       # -> v4 spelling`}
      </CodeBlock>

      <h2>What This Section Covers</h2>

      <CodeBlock language="text" title="Five lessons, in reading order">
{`1. This page                  the version landscape, verified
2. The Breaks That Do Not     the changes that produce NO error and
   Warn You                   silently alter your layout - breakpoints,
                              spacing, Grid. Read this one even if you
                              read nothing else.
3. Styling in v9              styled() and sx: what each is for, what
                              they cost, and how to choose
4. Theming with CSS           CSS variables, colorSchemes, useColorScheme,
   Variables                  and dark mode without a flash
5. Cheat sheet                the whole translation table

For the v4 side - makeStyles, withStyles, JSS, the classes prop -
see the separate MUI (Material UI) section.`}
      </CodeBlock>

      <InfoBox variant="warning" title="Read lesson 2 before you upgrade anything">
        <p>
          The v4 to v9 jump has a category of change that is genuinely dangerous: calls that still
          compile, still run, produce no warning, and mean something <em>different</em> than they
          used to. A responsive breakpoint that silently moves by 360 pixels does not announce
          itself in a test suite or a typecheck — it shows up as a layout that looks subtly wrong
          on tablets, weeks later. That is the next lesson.
        </p>
      </InfoBox>
    </LessonLayout>
  );
}

export default Mui9Intro;
