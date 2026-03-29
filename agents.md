# Project Context for AI Agents

This repository holds standalone HTML/SASS templates for digital invitations.

- **Goal:** Maintain modular, DRY (Don't Repeat Yourself), and minimal code.
- **Architecture:** Each template lives in its own folder inside `/templates`. Each template has its own `/sass`, `/css`, `/images` folders and specific HTML outputs (`index.html` for the invite, `thumbnail.html` for OG images, `menu.html` for table menus).
- **Styling:** We use Dart Sass. Base variables (colors, fonts) should always be extracted to `_variables.scss` to allow easy theme generation. CSS is outputted as compressed.
- **Tech Stack:** HTML5, CSS3, Sass. (No JS frameworks for now, keep logic in vanilla JS within the HTML files).
