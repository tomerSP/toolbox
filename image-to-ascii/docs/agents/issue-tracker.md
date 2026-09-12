# Issue tracker: GitHub

Image-to-ASCII issues and specs live in the shared repo's GitHub Issues. Use `gh` inside this repo;
infer the repository from its git remote.

## Operations

- Create/publish: `gh issue create --title "..." --body-file <file>`
- Read/fetch ticket: `gh issue view <number> --comments`;
  fetch labels with `gh issue view <number> --json labels`.
- List: `gh issue list --state open --json number,title,body,labels,comments`;
  filter by label/state as needed.
- Comment: `gh issue comment <number> --body-file <file>`
- Label: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`
- Close: `gh issue close <number> --comment "..."`

## Pull requests as a triage surface

**PRs as a request surface: no.**
