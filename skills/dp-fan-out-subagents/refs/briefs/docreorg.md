# Sort mixed sections into topic files (`--profile data`, tested as `docreorg` V3)

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
3. Run: python3 /home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents/scripts/doc_apply.py <ROOT>/doc.md <ROOT>/out/manifest.json <ROOT>/out
It refuses overlaps and bad ranges, and lists unassigned lines that are not blank. Fix the manifest and rerun until nothing is unassigned.
4. Run: python3 /home/dev/work/dippe/skills-agents/skills/dp-fan-out-subagents/scripts/doc_check.py <ROOT>/doc.md <ROOT>/out --ignore README.md
Repeat until it prints PASS. Write any README.md only after that.

Then reply with only: DONE
```

Tested Ornith brief. Replace `<ROOT>` with the absolute work directory. Change file names, labels and output format to fit the task; keep the HOW, RULES and VALIDATE parts. The label is the `local.sh --profile`.

