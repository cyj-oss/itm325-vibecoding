# ITM 325 Vibe Coding

[Open the interactive book](https://cyj-oss.github.io/itm325-vibecoding/)

Follow the course in the same order as the guidebook. Each lesson separates explanations, prompts, commands, file contents, and results to check. Copy buttons appear only on inputs students are meant to use.

## Course sequence

1. The terminal
2. Claude Code
3. VS Code
4. Web basics and the Pomodoro project, including Netlify deployment in Lesson 4.7
5. Git and GitHub
6. Next.js
7. Ohana Link
8. Databases
9. Authentication and authorization concepts

Choose Windows or Mac at the top of the book. Installation lessons link to the existing [first setup guide](https://github.com/cyj-oss/itm325-setup) and [project setup guide](https://github.com/cyj-oss/itm325-setup2).

The course uses Claude Code with a Claude account. Git and GitHub are different tools, and committing requires a Git author name and email separately from GitHub sign-in.

## Design themes

Lesson 7.3 includes [English theme files](themes-english.zip). Choose one theme and copy its complete file into `.claude/skills/design-theme/SKILL.md` inside your project. The guides are classroom adaptations inspired by familiar products, not official brand specifications.

## Maintaining this book

The site is a static book hosted with GitHub Pages. No student account or local installation is needed to read it.

- `book.json` contains the chapter index.
- `chapter-01.json` through `chapter-09.json` contain the lessons, in teaching order.
- `prompt-inventory.json` records the preserved prompts and their source locations for review.
- `app.js` and `styles.css` control the reading experience.
- `image*.png` and `image*.jpeg` are teaching images from the guidebook.

Reading position and completion checkmarks are stored only in the reader's browser. Clearing browser storage removes that local progress.

The original Word guidebook remains separate. Later chapters can be revised independently without changing the navigation or the earlier lessons. Authentication and authorization are currently conceptual lessons; this edition does not implement account screens or complete access policies.

Some classroom database prompts deliberately disable RLS for disposable practice data. They are retained with a visible explanation of their scope. This is not a production-ready security configuration.
