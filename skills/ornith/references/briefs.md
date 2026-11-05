# Tested Ornith briefs

Generated from the briefs the tests ran. Replace `<ROOT>` with the absolute work directory. Change the file names, labels and output format to fit your task, and keep the HOW, RULES and VALIDATE parts.
The `read`, `data` and `code` labels are the `ornith.sh --profile` to use.

## Log triage (`--profile read`, tested as `log` V2)

```text
Find the problems in the log file <ROOT>/app.log.
Write <ROOT>/out/report.txt with one line per distinct problem, in this format:
CLASS|<line number of first occurrence>|<number of occurrences>|<level>|<short message>

HOW
1. Do not read the whole file: it can be far larger than your memory. Use the Grep tool on app.log with output_mode "content", -n true, head_limit 0, and this pattern: (WARNING|ERROR|CRITICAL) |^Traceback|^\S*Error:|^\S*Exception:|[Ff]ault|Killed|panic
2. Skip lines at INFO level unless they report a failure.
3. Group lines: the same source location and the same message, ignoring numbers, are one class.
4. Count = lines in the class. First occurrence = its lowest line number. Level = WARNING, ERROR or CRITICAL; use ERROR when the line has no level.

RULES
- Use only what the files say. No outside knowledge. Never guess a number, name or path: if you cannot find it, write none.
- Copy numbers, names and paths exactly as printed.
- Output files are plain text in exactly the format above: no markdown, no comments, no extra lines.
- Think briefly. Do not draft the output in your reasoning; write it once with the Write tool.

VALIDATE, after writing the file
a. For each CLASS, Grep a distinctive fixed part of its message with output_mode "count", and correct the count if it differs.
b. Run one more case-insensitive Grep for: abort|fatal|died|timeout|exhausted|evicted|core dumped. Add any class you missed.
c. If anything changed, Write the file again. Then reply with only: DONE
```

## Bug or finding text: classify and extract (`--profile read`, tested as `bugs` V1)

```text
Classify the findings in <ROOT>/findings.txt. Each one starts with a line "## <id>".
Write <ROOT>/out/rows.txt with one line per finding, in this format:
<id>|<kind>|<severity>|<paths>
kind is one of: defect, gap, risk, note. severity is one of: blocking, high, med, low. paths is every file name or path the finding mentions, comma-separated, or none.

HOW
1. Read the whole file. If Read says it is too large, read it in chunks with offset and limit=400 until the end.
2. Choose kind from what the text describes:
   defect = something behaves wrongly now. gap = something needed is missing, such as a test, check or feature. risk = it works now but could fail later. note = information with nothing broken.
3. Choose severity from the impact:
   blocking = stops the work or a release. high = wrong results, lost data or a broken main path. med = a limited or workaround-able problem. low = cosmetic or minor.
4. Decide from the finding's own text only. If unsure between two severities, take the lower.
5. For paths, copy each token ending in .ts, .tsx, .mjs, .md, .json, .jsonl, .py, .sh, .yml or .yaml.

RULES
- Use only what the files say. No outside knowledge. Never guess a number, name or path: if you cannot find it, write none.
- Copy numbers, names and paths exactly as printed.
- Output files are plain text in exactly the format above: no markdown, no comments, no extra lines.
- Think briefly. Do not draft the output in your reasoning; write it once with the Write tool.
Then reply with only: DONE
```

## JSON and JSONL questions (`--profile data`, tested as `json` V3)

```text
Answer the questions in <ROOT>/questions.txt about the JSONL file <ROOT>/results.jsonl (one JSON object per line).
Write <ROOT>/out/answers.txt with one line per question, in this format:
Q<n>|<answer>
Answers are a bare number or a bare label, with no unit or explanation.

HOW
Compute every answer with a command, never by reading. Use Bash with python3 or jq on results.jsonl. Copy the command's output to the answer.
Rows may lack a field: treat a missing number as 0 in a sum.

RULES
- Use only what the files say. No outside knowledge. Never guess a number, name or path: if you cannot find it, write none.
- Copy numbers, names and paths exactly as printed.
- Output files are plain text in exactly the format above: no markdown, no comments, no extra lines.
- Think briefly. Do not draft the output in your reasoning; write it once with the Write tool.
Then reply with only: DONE
```

## Fixed-form report summary (`--profile read`, tested as `summary` V1)

```text
Summarize the report <ROOT>/report.md in English.
Write <ROOT>/out/summary.txt in this format:
GOAL: <one sentence>
RESULT: <the main conclusion, max 2 sentences>
KEY: <number with unit> | <what it is, naming the model or configuration it belongs to>
  (exactly 5 KEY lines)
CAVEAT: <the most important limitation stated by the report>
OPEN: <one question the report leaves unanswered, or none>

HOW
1. Read the whole report. If Read says it is too large, read it in chunks with offset and limit=400 until the end.
2. Take RESULT from the report's own summary and conclusion, not from one table.
3. Keep the report's certainty: if it says untested, inferred, not significant or a tie, say so too. Never call something best or proven when the report does not.
4. Before using a number, read its table row and column. Name the model or configuration from that same row. Never move a number from one configuration to another.
5. Choose KEY numbers that decide the conclusion, not context such as dates or file sizes.

RULES
- Use only what the files say. No outside knowledge. Never guess a number, name or path: if you cannot find it, write none.
- Copy numbers, names and paths exactly as printed.
- Output files are plain text in exactly the format above: no markdown, no comments, no extra lines.
- Think briefly. Do not draft the output in your reasoning; write it once with the Write tool.
Then reply with only: DONE
```

## Grouping documents by type (`--profile read`, tested as `classify` V2)

```text
Classify the documents in <ROOT>/items.txt. Each one starts with "=== ITEM <nnn> ===" and shows the start of a document.
Write <ROOT>/out/labels.txt with one line per item, in this format:
<nnn>|<label>
label is one of: benchmark-report, research, feature-spec, task-list, code-review, skill, agent-definition, plan.

HOW
1. Read the whole file. If Read says it is too large, read it in chunks with offset and limit=400 until the end.
2. Choose by the document's purpose:
   benchmark-report = our own measurements on hardware, with results.
   research = external knowledge from sources or a study of options, not our measurements.
   feature-spec = requirements for a feature: user stories, functional requirements, acceptance criteria.
   task-list = a checklist of implementation tasks, often with IDs such as T001.
   code-review = findings about existing code or a change.
   skill = instructions for an AI skill, usually with front matter holding name and description.
   agent-definition = a role definition for an AI subagent, usually with front matter and "You are".
   plan = how a piece of work will be done: phases, steps, decisions, design.
3. Use the content, not one keyword. Pick exactly one label, and never leave an item out.

RULES
- Use only what the files say. No outside knowledge. Never guess a number, name or path: if you cannot find it, write none.
- Copy numbers, names and paths exactly as printed.
- Output files are plain text in exactly the format above: no markdown, no comments, no extra lines.
- Think briefly. Do not draft the output in your reasoning; write it once with the Write tool.

VALIDATE, after writing the file
a. Grep items.txt for "^=== ITEM" with output_mode "count". Grep out/labels.txt for "^[0-9]+\|" with output_mode "count". They must match. Add any missing item and remove any duplicate.
b. Check that every label is one of the allowed words.
c. Reread the items where you hesitated, and test the label against its definition.
d. If anything changed, Write the file again. Then reply with only: DONE
```

## Python code inventory (`--profile read`, tested as `codeinv` V0)

```text
List the top-level functions and classes of the Python files in <ROOT>/src.
Write <ROOT>/out/inventory.txt with one line per definition, in this format:
<file name>|<name>|<line number>|<one-sentence purpose>
Include only top-level definitions, not methods or nested functions.
Then reply with only: DONE
```

## Code from a clear spec (`--profile code`, tested as `impl` V0)

Run from inside the repository.

```text
Implement SPEC.md in this repository. Then reply with only: DONE
```

## Writing tests (`--profile code`, tested as `testgen` V0)

Run from inside the repository.

```text
Write tests for src/semver.ts in tests/semver.test.ts, using vitest. Then reply with only: DONE
```

## Multi-file rename (`--profile code`, tested as `edit` V0)

Run from inside the repository.

```text
Do the change in CHANGE.md. Then reply with only: DONE
```

## Bug fix (`--profile code`, tested as `bugfix` V0)

Run from inside the repository.

```text
Fix the bug described in BUG.md. Then reply with only: DONE
```

## Split a document (`--profile data`, tested as `docsplit` V3)

```text
Split the document <ROOT>/doc.md into smaller files, one per top-level section (a line starting with "## ").
Write the files in <ROOT>/out/, named NN-<short-slug>.md with NN = 01, 02, ... in document order. Anything before the first "## " line goes to out/00-intro.md.
Also write out/README.md with one line per file, in order: - [<section heading>](<file name>)

METHOD
Do not retype any document text. You decide which lines go where; a script moves the bytes.
1. Find the section boundaries with the Grep tool on doc.md, pattern ^## , output_mode "content", -n true, head_limit 0. Read only the parts you need to decide.
2. Write <ROOT>/out/manifest.json in this form, ranges 1-based and inclusive, in output order:
{"files":[{"path":"<file name>","ranges":[[1,40],[90,120]]}]}
A section runs from its "## " line to the line before the next "## " line. The last one runs to the last line of the file. Get the line count with Grep pattern ^ and output_mode "count".
3. Run: python3 /home/dev/work/dippe/skills-agents/skills/ornith/scripts/doc_apply.py <ROOT>/doc.md <ROOT>/out/manifest.json <ROOT>/out
It refuses overlaps and bad ranges, and lists unassigned lines that are not blank. Fix the manifest and rerun until nothing is unassigned.
4. Run: python3 /home/dev/work/dippe/skills-agents/skills/ornith/scripts/doc_check.py <ROOT>/doc.md <ROOT>/out --ignore README.md
Repeat until it prints PASS. Write any README.md only after that.

Then reply with only: DONE
```

## Sort mixed sections into topic files (`--profile data`, tested as `docreorg` V3)

```text
The document <ROOT>/doc.md is a mix of sections from different reports, in random order. <ROOT>/TOPICS.txt lists the target files and what each is about.
Reorganize it: put each section (a "## " line and everything up to the next "## " line) into the target file it belongs to, in <ROOT>/out/. Within a file, order the sections so the report reads logically, starting with its summary or conclusion when it has one.
Write only the target files named in TOPICS.txt.

METHOD
Do not retype any document text. You decide which lines go where; a script moves the bytes.
1. Find the section boundaries with the Grep tool on doc.md, pattern ^## , output_mode "content", -n true, head_limit 0. Read only the parts you need to decide.
2. Write <ROOT>/out/manifest.json in this form, ranges 1-based and inclusive, in output order:
{"files":[{"path":"<file name>","ranges":[[1,40],[90,120]]}]}
A section runs from its "## " line to the line before the next "## " line. The last one runs to the last line of the file. Get the line count with Grep pattern ^ and output_mode "count".
3. Run: python3 /home/dev/work/dippe/skills-agents/skills/ornith/scripts/doc_apply.py <ROOT>/doc.md <ROOT>/out/manifest.json <ROOT>/out
It refuses overlaps and bad ranges, and lists unassigned lines that are not blank. Fix the manifest and rerun until nothing is unassigned.
4. Run: python3 /home/dev/work/dippe/skills-agents/skills/ornith/scripts/doc_check.py <ROOT>/doc.md <ROOT>/out --ignore README.md
Repeat until it prints PASS. Write any README.md only after that.

Then reply with only: DONE
```

## Per-document notes (`--profile read`, tested as `docnotes` V2)

One session per document.

```text
You analyze one benchmark report and write short structured notes that a script will parse.

Report: <ROOT>/docs/<REPORT>
Output: <ROOT>/out/01.txt

STEPS
1. Read the whole report with the Read tool. The left column it prints is the line number. If Read says the file is too large, read it in chunks with offset and limit=400 until the end. The report is not done until you have seen its last line.
2. Incidents are often only in a table row. Grep the report with -n true, -i true, output_mode "content", head_limit 0, and this pattern: crash|fault|interrupt|discard|contaminat|exclud|redone|re-?collect|re-?run|killed|OOM|abort|invalid|quarantin|DNF|hang|hung
   Check each hit against the report and keep those that describe a real event in a run.
3. Write the note, then reply with only: DONE 1

RULES
- Use only what the report says. No outside knowledge. If something is not in the report, write none.
- Copy numbers and paths exactly as printed.
- Every line number must be the one Read printed for that exact text.
- Plain text only: no markdown, no extra lines, no commentary. Think briefly.

NOTE format (one field per line, these labels, this order):
DOC: <file name>
TOPIC: <one sentence: what was tested or researched>
VERDICT: <the report's main conclusion, max 2 sentences, your own words>
CONFIG: <model; engine or runtime; key settings; or none>
PATHS: <every distinct path in the report that contains bench/runs/ or campaigns/, comma-separated; or none>
FACT|<line>|<number with unit as printed>|<what it measures, max 12 words>
  (exactly 5 FACT lines: the 5 numbers that matter most for the conclusion)
INCIDENT|<line>|<what went wrong, max 15 words>
  (one line for each place where a run crashed, faulted, was interrupted, discarded, contaminated, excluded, redone or re-collected; if there is none write INCIDENT|none)
OPEN: <one question the report leaves unanswered; or none>
```
