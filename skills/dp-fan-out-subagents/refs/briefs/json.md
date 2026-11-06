# JSON and JSONL questions (`--profile data`, tested as `json` V3)

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

Tested Ornith brief. Replace `<ROOT>` with the absolute work directory. Change file names, labels and output format to fit the task; keep the HOW, RULES and VALIDATE parts. The label is the `local.sh --profile`.

