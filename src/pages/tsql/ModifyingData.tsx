import CodeBlock from '../../components/CodeBlock';
import InfoBox from '../../components/InfoBox';
import LessonLayout from '../../components/LessonLayout';

function TsqlModifyingData() {
  return (
    <LessonLayout
      title="Modifying Data — OUTPUT, MERGE, Upserts"
      sectionId="tsql"
      lessonIndex={4}
      prev={{ path: '/tsql/aggregation', label: 'Aggregation & Window Functions' }}
      next={{ path: '/tsql/views', label: 'Views, Reusable SQL & Numbers Tables' }}
    >
      <p>
        <code>INSERT</code>, <code>UPDATE</code> and <code>DELETE</code> are standard. What earns
        attention here is the <code>OUTPUT</code> clause, which is genuinely excellent, and{' '}
        <code>MERGE</code>, which is famous and which you should mostly not use.
      </p>

      <h2>UPDATE ... FROM — A T-SQL Extension</h2>

      <CodeBlock language="sql" title="Updating one table from another">
{`UPDATE [c]
SET    [c].[Latest Recorded Population] = [s].[Population]
FROM   [Dimension].[City]           AS [c]
INNER JOIN [Integration].[City_Staging] AS [s]
        ON [s].[WWI City ID] = [c].[WWI City ID]
WHERE  [c].[Valid To] = '9999-12-31 23:59:59.9999999';`}
      </CodeBlock>

      <InfoBox variant="danger" title="If the join matches multiple rows you get a silent arbitrary winner">
        <p>
          Standard SQL would raise an error. T-SQL does not: if the source has two rows for the same
          key, the <code>UPDATE</code> succeeds and one of them wins —{' '}
          <strong>non-deterministically</strong>, with no warning, and <code>@@ROWCOUNT</code> reports
          the target row as updated once. Nothing in the result tells you the data was ambiguous.
        </p>
        <CodeBlock language="sql" title="Check the source is unique first">
{`SELECT
     [WWI City ID]
    ,COUNT(*) AS [Duplicate Count]
FROM   [Integration].[City_Staging]
GROUP BY [WWI City ID]
HAVING COUNT(*) > 1;`}
        </CodeBlock>
      </InfoBox>

      <h2>The OUTPUT Clause</h2>

      <p>
        <code>OUTPUT</code> exposes the <code>inserted</code> and <code>deleted</code> pseudo-tables
        — the same ones triggers see — directly in a DML statement. An <code>UPDATE</code> can hand
        you the before <em>and</em> after values in one round trip:
      </p>

      <CodeBlock language="sql" title="Before and after, atomically">
{`UPDATE [dbo].[Account]
SET    [Balance] = [Balance] + 1
OUTPUT
     deleted.[Id]
    ,deleted.[Balance]  AS [Old Balance]
    ,inserted.[Balance] AS [New Balance]
WHERE  [Id] = 3;`}
      </CodeBlock>

      <CodeBlock language="text" title="Real output">
{`Id | Old Balance | New Balance
---|-------------|------------
 3 | 80          | 81`}
      </CodeBlock>

      <CodeBlock language="text" title="Which pseudo-table exists when">
{`INSERT   inserted only
UPDATE   both — deleted = before, inserted = after
DELETE   deleted only

OUTPUT ... INTO @TableVariable   capture instead of returning
OUTPUT without INTO              returns a result set to the client

Note: inserted/deleted are NOT bracketed by convention — they are
keywords rather than user identifiers.`}
      </CodeBlock>

      <InfoBox variant="tip" title="The pattern this unlocks: claim rows atomically">
        <p>
          A work-queue dequeue that is safe under concurrency, in a single statement — no explicit
          transaction, no race between selecting and marking:
        </p>
        <CodeBlock language="sql" title="Atomic claim">
{`UPDATE TOP (10) [dbo].[JobQueue]
SET    [Status]    = N'processing'
      ,[ClaimedBy] = @WorkerId
OUTPUT
     inserted.[Job Id]
    ,inserted.[Payload]
WHERE  [Status] = N'pending';`}
        </CodeBlock>
        <p style={{ marginTop: '0.5rem' }}>
          Because the update and the read are one statement, two workers cannot claim the same row.
          Doing this as <code>SELECT</code> then <code>UPDATE</code> needs an explicit transaction and
          a locking hint to be equally safe.
        </p>
      </InfoBox>

      <h2>Identity Columns</h2>

      <CodeBlock language="sql" title="Getting the generated key back">
{`CREATE TABLE [dbo].[Account]
(
     [Id]      INT IDENTITY(1,1) NOT NULL
    ,[Balance] INT NOT NULL
    ,CONSTRAINT [PK_Account] PRIMARY KEY CLUSTERED([Id])
);
GO

INSERT INTO [dbo].[Account]([Balance]) VALUES (100);

SELECT SCOPE_IDENTITY();      -- CORRECT: last identity in THIS scope
SELECT @@IDENTITY;            -- WRONG-ish: last in this SESSION,
                              -- including one made by a TRIGGER
SELECT IDENT_CURRENT('dbo.Account');  -- last for that TABLE, any session`}
      </CodeBlock>

      <InfoBox variant="danger" title="@@IDENTITY is a classic production bug">
        <p>
          If a trigger on the table inserts an audit row into another table with its own identity
          column, <code>@@IDENTITY</code> returns the <em>audit</em> row&apos;s id. Your code then
          associates child records with the wrong parent. The bug appears the day someone adds a
          trigger, in code written years earlier and never touched.
        </p>
        <p style={{ marginTop: '0.5rem' }}>
          Use <code>SCOPE_IDENTITY()</code>, or better <code>OUTPUT inserted.[Id]</code>, which is
          unambiguous and works for multi-row inserts where the identity functions give you only one
          value.
        </p>
      </InfoBox>

      <h2>MERGE — Read This Before Using It</h2>

      <CodeBlock language="sql" title="The shape">
{`MERGE INTO [Dimension].[City] AS [t]
USING [Integration].[City_Staging] AS [s]
   ON [t].[WWI City ID] = [s].[WWI City ID]
WHEN MATCHED THEN
    UPDATE SET [t].[Latest Recorded Population] = [s].[Population]
WHEN NOT MATCHED BY TARGET THEN
    INSERT ([WWI City ID], [City]) VALUES ([s].[WWI City ID], [s].[City])
WHEN NOT MATCHED BY SOURCE THEN
    DELETE;`}
      </CodeBlock>

      <p>
        It reads beautifully and does upsert, insert and delete in one statement. It also has a long,
        well-documented history of bugs and concurrency hazards, and experienced SQL Server
        practitioners broadly advise against it in new code.
      </p>

      <CodeBlock language="text" title="The concrete objections">
{`- Under concurrency MERGE can deadlock or raise a duplicate-key error
  unless the target is hinted WITH (HOLDLOCK). Almost no example on the
  internet includes it.

- "WHEN NOT MATCHED BY SOURCE THEN DELETE" applies to the ENTIRE target
  table, not just rows related to your source. A filter you forgot means
  you delete everything not in this batch.

- If the source produces duplicate keys, MERGE raises an error rather
  than picking arbitrarily (unlike UPDATE...FROM). That is BETTER, but
  it surprises people migrating from UPDATE...FROM.

- Multiple long-standing correctness bugs have been reported over the
  years. Many teams simply ban it.`}
      </CodeBlock>

      <CodeBlock language="sql" title="The boring alternative that behaves predictably">
{`BEGIN TRANSACTION;

    UPDATE [t]
    SET    [t].[Latest Recorded Population] = [s].[Population]
    FROM   [Dimension].[City]               AS [t]
    INNER JOIN [Integration].[City_Staging] AS [s]
            ON [s].[WWI City ID] = [t].[WWI City ID];

    INSERT INTO [Dimension].[City]([WWI City ID], [City])
    SELECT
         [s].[WWI City ID]
        ,[s].[City]
    FROM [Integration].[City_Staging] AS [s]
    WHERE NOT EXISTS (SELECT 1
                      FROM [Dimension].[City] AS [t]
                      WHERE [t].[WWI City ID] = [s].[WWI City ID]);

COMMIT TRANSACTION;`}
      </CodeBlock>

      <p>
        Two statements in a transaction. More typing, no surprises, and every developer on the team
        can read it.
      </p>

      <h2>Deleting Efficiently</h2>

      <CodeBlock language="sql" title="DELETE vs TRUNCATE, and batching">
{`-- DELETE     logs every row, fires triggers, can be filtered,
--            keeps the identity seed
-- TRUNCATE   minimal logging, no triggers, no WHERE clause,
--            RESETS the identity seed, blocked if referenced by an FK
--
-- Both are transactional — TRUNCATE can be rolled back. That surprises
-- people coming from MySQL, where it cannot.

TRUNCATE TABLE [Integration].[City_Staging];

-- Large deletes: batch them so the log and the locks stay small
WHILE 1 = 1
BEGIN
    DELETE TOP (5000)
    FROM [dbo].[AuditLog]
    WHERE [Created] < @Cutoff;

    IF @@ROWCOUNT = 0 BREAK;
END`}
      </CodeBlock>
    </LessonLayout>
  );
}

export default TsqlModifyingData;
