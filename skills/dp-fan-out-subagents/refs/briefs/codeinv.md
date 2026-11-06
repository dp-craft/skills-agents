# Python code inventory (`--profile read`, tested as `codeinv` V0)

```text
List the top-level functions and classes of the Python files in <ROOT>/src.
Write <ROOT>/out/inventory.txt with one line per definition, in this format:
<file name>|<name>|<line number>|<one-sentence purpose>
Include only top-level definitions, not methods or nested functions.
Then reply with only: DONE
```

Tested Ornith brief. Replace `<ROOT>` with the absolute work directory. Change file names, labels and output format to fit the task; keep the HOW, RULES and VALIDATE parts. The label is the `local.sh --profile`.

