#!/usr/bin/env node

import { lstatSync, mkdirSync, readFileSync, realpathSync, watch } from "node:fs";
import { writeFileSync } from "node:fs";
import { basename, dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const argumentsList = process.argv.slice(2);
const watchMode = argumentsList.includes("--watch");
const positional = argumentsList.filter((argument) => argument !== "--watch");
const sourcePath = resolve(positional[0] ?? join(scriptDirectory, "template.md"));
const sourceStem = basename(sourcePath, extname(sourcePath));
const outputPath = resolve(
  positional[1] ?? join(scriptDirectory, "build", `${sourceStem}.html`),
);
const themePath = join(scriptDirectory, "theme.css");
const aliceBookUrl =
  "https://webdam.di.ens.fr/Alice/";
const sourceRepositoryUrl =
  "https://github.com/StarGazerM/modern-query-processing-notes";
const sourceRepositoryRevision = process.env.NOTES_GITHUB_REVISION;

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>');
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableDivider(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isBlockStart(lines, index) {
  const line = lines[index] ?? "";
  const next = lines[index + 1] ?? "";
  return (
    line.trim() === "" ||
    /^#{1,3}\s+/.test(line) ||
    /^```/.test(line) ||
    /^:::/.test(line) ||
    /^\$\$/.test(line.trim()) ||
    /^>\s?/.test(line) ||
    /^[-*]\s+/.test(line) ||
    /^\d+\.\s+/.test(line) ||
    /^---+$/.test(line.trim()) ||
    (line.includes("|") && isTableDivider(next))
  );
}

function findClosingMarker(lines, start) {
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].trim() === ":::") return index;
  }
  return -1;
}

function findMarker(lines, start, marker) {
  for (let index = start; index < lines.length; index += 1) {
    if (lines[index].trim() === marker) return index;
  }
  return -1;
}

function sourceLanguage(path) {
  return {
    ".md": "markdown",
    ".rs": "rust",
    ".toml": "toml",
  }[extname(path)] ?? "text";
}

function sourceMarker(line, kind, anchor) {
  const trimmed = line.trim();
  return [
    `// ${kind}: ${anchor}`,
    `# ${kind}: ${anchor}`,
    `<!-- ${kind}: ${anchor} -->`,
  ].includes(trimmed);
}

function renderSourceExcerpt(reference, label, state) {
  const separator = reference.lastIndexOf("#");
  const requestedPath = separator >= 0 ? reference.slice(0, separator) : reference;
  const anchor = separator >= 0 ? reference.slice(separator + 1) : "";
  if (
    !requestedPath ||
    requestedPath.includes("\0") ||
    (separator >= 0 && !/^[a-zA-Z0-9_-]+$/.test(anchor))
  ) {
    throw new Error(`Invalid source reference: ${reference}`);
  }

  const absolutePath = resolve(scriptDirectory, requestedPath);
  const repositoryPath = relative(scriptDirectory, absolutePath);
  if (
    repositoryPath === ".." ||
    repositoryPath.startsWith(`..${sep}`) ||
    resolve(scriptDirectory, repositoryPath) !== absolutePath
  ) {
    throw new Error(`Source excerpt must stay inside this repository: ${reference}`);
  }
  if (!repositoryPath.startsWith(`examples${sep}`)) {
    throw new Error(`Source excerpt must come from examples/: ${reference}`);
  }
  if (lstatSync(absolutePath).isSymbolicLink()) {
    throw new Error(`Source excerpt cannot be a symbolic link: ${reference}`);
  }
  const realPath = realpathSync(absolutePath);
  const realRepositoryPath = relative(realpathSync(scriptDirectory), realPath);
  if (
    realRepositoryPath === ".." ||
    realRepositoryPath.startsWith(`..${sep}`)
  ) {
    throw new Error(`Source excerpt resolves outside this repository: ${reference}`);
  }

  const allLines = readFileSync(absolutePath, "utf8")
    .replaceAll("\r\n", "\n")
    .split("\n");
  if (allLines.at(-1) === "") allLines.pop();
  if (allLines.length === 0) {
    throw new Error(`Source excerpt is empty: ${reference}`);
  }

  let firstIndex = 0;
  let lastIndex = allLines.length - 1;
  if (anchor) {
    const starts = allLines
      .map((line, index) => sourceMarker(line, "ANCHOR", anchor) ? index : -1)
      .filter((index) => index >= 0);
    const ends = allLines
      .map((line, index) => sourceMarker(line, "ANCHOR_END", anchor) ? index : -1)
      .filter((index) => index >= 0);
    if (starts.length !== 1 || ends.length !== 1 || starts[0] >= ends[0]) {
      throw new Error(
        `Source anchor ${anchor} in ${requestedPath} needs one ordered ANCHOR and ANCHOR_END marker`,
      );
    }
    firstIndex = starts[0] + 1;
    lastIndex = ends[0] - 1;
    if (firstIndex > lastIndex) {
      throw new Error(`Source anchor ${anchor} in ${requestedPath} is empty`);
    }
  }

  const firstLine = firstIndex + 1;
  const lastLine = lastIndex + 1;
  const visibleLines = allLines.slice(firstIndex, lastIndex + 1);
  if (visibleLines.length > 120) {
    throw new Error(
      `Source excerpt ${reference} has ${visibleLines.length} lines; limit excerpts to 120`,
    );
  }
  const renderedLines = visibleLines
    .map(
      (sourceLine, offset) =>
        `<span class="source-line" data-line="${firstLine + offset}">${escapeHtml(sourceLine)}</span>`,
    )
    .join("");
  const webPath = repositoryPath.split(sep).join("/");
  const encodedPath = webPath.split("/").map(encodeURIComponent).join("/");
  const lineFragment = firstLine === lastLine
    ? `#L${firstLine}`
    : `#L${firstLine}-L${lastLine}`;
  const lineLabel = firstLine === lastLine
    ? `line ${firstLine}`
    : `lines ${firstLine}–${lastLine}`;
  state.sourceDependencies.add(absolutePath);

  state.sourceExcerptNumber += 1;
  const titleId = `source-${state.sourceExcerptNumber}-title`;
  const sourceAction = sourceRepositoryRevision
    ? `<a class="source-link" href="${escapeHtml(`${sourceRepositoryUrl}/blob/${encodeURIComponent(sourceRepositoryRevision)}/${encodedPath}${lineFragment}`)}" aria-label="Open ${escapeHtml(webPath)}, ${lineLabel}, on GitHub">Open ${lineLabel}<span class="source-external-arrow" aria-hidden="true"> ↗</span></a>`
    : `<span class="source-link source-link-pending">Local source · exact link after publish</span>`;

  return `<figure class="source-excerpt" data-source-path="${escapeHtml(webPath)}" data-source-start="${firstLine}" data-source-end="${lastLine}">
  <figcaption class="source-caption">
    <span class="source-caption-copy">
      <span class="source-kicker">Runnable source</span>
      <strong id="${titleId}">${label ? renderInline(label) : basename(webPath)}</strong>
      <code>${escapeHtml(webPath)}</code>
    </span>
    ${sourceAction}
  </figcaption>
  <pre tabindex="0" aria-labelledby="${titleId}"><code class="language-${sourceLanguage(webPath)}">${renderedLines}</code></pre>
</figure>`;
}

function renderMarkdown(markdown, state) {
  const lines = markdown.replaceAll("\r\n", "\n").split("\n");
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (trimmed === "") {
      index += 1;
      continue;
    }

    if (trimmed.startsWith(":::source ")) {
      const match = trimmed.match(/^:::source\s+([^|\s]+)(?:\s*\|\s*(.+))?$/);
      if (!match) {
        throw new Error(
          `Source excerpt near line ${index + 1} must use :::source path[#anchor] | Label`,
        );
      }
      output.push(renderSourceExcerpt(match[1], match[2] ?? "", state));
      index += 1;
      continue;
    }

    if (trimmed === ":::cards") {
      const closeIndex = findClosingMarker(lines, index + 1);
      if (closeIndex < 0) {
        throw new Error(`Card grid near line ${index + 1} has no closing ::: marker`);
      }
      const cards = lines
        .slice(index + 1, closeIndex)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const match = entry.match(/^\[([^\]]+)\]\(([^)\s]+)\)\s*\|\s*(.+)$/);
          if (!match) {
            throw new Error(
              `Card near line ${index + 1} must use [Title](url) | Description`,
            );
          }
          return `<a class="course-card" href="${escapeHtml(match[2])}">
  <strong>${renderInline(match[1])}</strong>
  <span>${renderInline(match[3])}</span>
  <span class="course-card-action" aria-hidden="true">Read on&nbsp;→</span>
</a>`;
        });
      output.push(`<section class="course-card-grid">${cards.join("\n")}</section>`);
      index = closeIndex + 1;
      continue;
    }

    if (trimmed.startsWith("::::review")) {
      const closeIndex = findMarker(lines, index + 1, "::::");
      if (closeIndex < 0) {
        throw new Error(`Review path near line ${index + 1} has no closing :::: marker`);
      }

      state.reviewNumber += 1;
      const title = trimmed.slice("::::review".length).trim() || "Optional review";
      const reviewId = `review-${state.reviewNumber}-${slugify(title)}`;
      const previousReview = state.review;
      const review = {
        number: state.reviewNumber,
        exchangeNumber: 0,
      };
      state.review = review;
      const body = renderMarkdown(lines.slice(index + 1, closeIndex).join("\n"), state);
      state.review = previousReview;
      const exchangeCount = review.exchangeNumber;
      const exchangeLabel = exchangeCount === 1 ? "exchange" : "exchanges";
      output.push(`
<section class="review-gate" aria-labelledby="${reviewId}-choice">
  <header class="review-gate-heading" id="${reviewId}-choice">
    <span class="review-eyebrow">Optional feature conversation</span>
    <strong>Would a quick review of ${renderInline(title)} help?</strong>
  </header>
  <a class="review-route review-route-fast" href="#${reviewId}-resume">
    <span class="review-route-copy">
      <span class="review-route-label">No</span>
      <strong>Continue with the main conversation</strong>
    </span>
    <span class="review-route-action" aria-hidden="true">↓</span>
  </a>
  <div class="review-or" aria-hidden="true"><span>or</span></div>
  <details class="review-path" id="${reviewId}">
    <summary>
      <span class="review-summary-copy">
        <span class="review-route-label">Yes</span>
        <strong>Open ${exchangeCount} short ${exchangeLabel}</strong>
        <span class="review-title">Review ${renderInline(title)}</span>
      </span>
      <span class="review-toggle">
        <span class="review-when-closed">Open detour</span>
        <span class="review-when-open">Close detour</span>
      </span>
    </summary>
    <div class="review-print-label">Optional feature conversation R${state.reviewNumber} · ${renderInline(title)}</div>
    <div class="review-body">${body}</div>
  </details>
</section>
<span class="review-resume" id="${reviewId}-resume" tabindex="-1">
  <span class="visually-hidden">Main conversation resumes</span>
</span>`);
      index = closeIndex + 1;
      continue;
    }

    if (trimmed.startsWith(":::compare")) {
      const rustIndex = findMarker(lines, index + 1, ":::rust");
      if (rustIndex < 0) {
        throw new Error(`Comparison near line ${index + 1} has no :::rust marker`);
      }
      const closeIndex = findClosingMarker(lines, rustIndex + 1);
      if (closeIndex < 0) {
        throw new Error(`Comparison near line ${index + 1} has no closing ::: marker`);
      }
      const nextNoticeIndex = findMarker(lines, rustIndex + 1, ":::notice");
      const noticeIndex = nextNoticeIndex >= 0 && nextNoticeIndex < closeIndex
        ? nextNoticeIndex
        : -1;

      state.comparisonNumber += 1;
      const number = String(state.comparisonNumber).padStart(2, "0");
      const title = trimmed.slice(":::compare".length).trim() || `Comparison ${number}`;
      const titleId = `comparison-${state.comparisonNumber}-title`;
      const leftEnd = rustIndex;
      const rightEnd = noticeIndex >= 0 ? noticeIndex : closeIndex;
      const leftBody = lines.slice(index + 1, leftEnd).join("\n");
      const rightBody = lines.slice(rustIndex + 1, rightEnd).join("\n");
      const noticeBody = noticeIndex >= 0
        ? lines.slice(noticeIndex + 1, closeIndex).join("\n")
        : "";
      output.push(`
<section class="compare-row" aria-labelledby="${titleId}">
  <header class="compare-heading">
    <span class="compare-number">${number}</span>
    <h2 id="${titleId}">${renderInline(title)}</h2>
  </header>
  <div class="compare-grid">
    <div class="compare-card python-card">
      <div class="eyebrow">${renderInline(state.leftSpeaker)}</div>
      ${renderMarkdown(leftBody, state)}
    </div>
    <div class="compare-card rust-card">
      <div class="eyebrow">${renderInline(state.rightSpeaker)}</div>
      ${renderMarkdown(rightBody, state)}
    </div>
  </div>
  ${noticeBody ? `<aside class="compare-notice"><strong>Notice.</strong><div>${renderMarkdown(noticeBody, state)}</div></aside>` : ""}
</section>`);
      index = closeIndex + 1;
      continue;
    }

    if (trimmed === ":::qa") {
      const replyIndex = lines.findIndex(
        (candidate, candidateIndex) =>
          candidateIndex > index && candidate.trim() === ":::answer",
      );
      if (replyIndex < 0) {
        throw new Error(`Dialogue block near line ${index + 1} has no :::answer marker`);
      }
      const closeIndex = findClosingMarker(lines, replyIndex + 1);
      if (closeIndex < 0) {
        throw new Error(`Dialogue block near line ${index + 1} has no closing ::: marker`);
      }

      let number;
      let exchangeId;
      if (state.review) {
        state.review.exchangeNumber += 1;
        number = `R${state.review.number}.${state.review.exchangeNumber}`;
        exchangeId = `review-${state.review.number}-exchange-${state.review.exchangeNumber}`;
      } else {
        state.exchangeNumber += 1;
        number = String(state.exchangeNumber).padStart(2, "0");
        exchangeId = `exchange-${state.exchangeNumber}`;
      }
      const leftTurn = lines.slice(index + 1, replyIndex).join("\n");
      const rightTurn = lines.slice(replyIndex + 1, closeIndex).join("\n");
      output.push(`
<section class="qa-row" id="${exchangeId}">
  <div class="question">
    <div class="eyebrow">${renderInline(state.leftSpeaker)} · ${number}</div>
    ${renderMarkdown(leftTurn, state)}
  </div>
  <div class="answer">
    <div class="eyebrow">${renderInline(state.rightSpeaker)}</div>
    ${renderMarkdown(rightTurn, state)}
  </div>
</section>`);
      index = closeIndex + 1;
      continue;
    }

    if (trimmed === ":::alice") {
      const closeIndex = findClosingMarker(lines, index + 1);
      if (closeIndex < 0) {
        throw new Error(`Alice note near line ${index + 1} has no closing ::: marker`);
      }
      const body = lines
        .slice(index + 1, closeIndex)
        .map((entry) => entry.trim())
        .filter(Boolean)
        .join(" ");
      output.push(`
<aside class="alice-note">
  <a href="${aliceBookUrl}">Foundations of Databases ("Alice")</a>
  <span aria-hidden="true">·</span>
  <span>${renderInline(body)}</span>
</aside>`);
      index = closeIndex + 1;
      continue;
    }

    if (trimmed.startsWith(":::recap")) {
      const closeIndex = findClosingMarker(lines, index + 1);
      if (closeIndex < 0) {
        throw new Error(`Recap near line ${index + 1} has no closing ::: marker`);
      }

      state.recapNumber += 1;
      const title =
        trimmed.slice(":::recap".length).trim() || "What we have established";
      const titleId = `recap-${state.recapNumber}-title`;
      const body = lines.slice(index + 1, closeIndex).join("\n");
      output.push(`
<section class="recap" aria-labelledby="${titleId}">
  <header class="recap-heading">
    <span class="recap-kicker">Recap</span>
    <h2 id="${titleId}">${renderInline(title)}</h2>
  </header>
  <div class="recap-body">${renderMarkdown(body, state)}</div>
</section>`);
      index = closeIndex + 1;
      continue;
    }

    if (
      trimmed.startsWith(":::law") ||
      trimmed.startsWith(":::definition") ||
      trimmed.startsWith(":::notation")
    ) {
      const closeIndex = findClosingMarker(lines, index + 1);
      if (closeIndex < 0) {
        throw new Error(`Callout near line ${index + 1} has no closing ::: marker`);
      }
      const isDefinition = trimmed.startsWith(":::definition");
      const isNotation = trimmed.startsWith(":::notation");
      const marker = isDefinition
        ? ":::definition"
        : isNotation
          ? ":::notation"
          : ":::law";
      const kind = isDefinition ? "definition" : isNotation ? "notation" : "law";
      const defaultTitle = isDefinition ? "Definition" : isNotation ? "Notation" : "Law";
      const title = trimmed.slice(marker.length).trim() || defaultTitle;
      const body = lines.slice(index + 1, closeIndex).join("\n");
      output.push(`
<aside class="callout ${kind}">
  <div class="callout-title">${renderInline(title)}</div>
  ${renderMarkdown(body, state)}
</aside>`);
      index = closeIndex + 1;
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = renderInline(headingMatch[2]);
      output.push(`<h${level} id="${slugify(content)}">${content}</h${level}>`);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim();
      const body = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        body.push(lines[index]);
        index += 1;
      }
      if (index >= lines.length) {
        throw new Error("Unclosed fenced code block");
      }
      output.push(
        `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ""}>${escapeHtml(body.join("\n"))}</code></pre>`,
      );
      index += 1;
      continue;
    }

    if (trimmed === "$$" || trimmed.startsWith("$$")) {
      const mathLines = [];
      if (trimmed !== "$$" && trimmed.endsWith("$$") && trimmed.length > 4) {
        mathLines.push(trimmed.slice(2, -2));
        index += 1;
      } else {
        if (trimmed.length > 2) mathLines.push(trimmed.slice(2));
        index += 1;
        while (index < lines.length && !lines[index].trim().endsWith("$$")) {
          mathLines.push(lines[index]);
          index += 1;
        }
        if (index >= lines.length) throw new Error("Unclosed display-math block");
        mathLines.push(lines[index].trim().slice(0, -2));
        index += 1;
      }
      output.push(`<div class="math-block">$$${escapeHtml(mathLines.join("\n"))}$$</div>`);
      continue;
    }

    if (line.includes("|") && isTableDivider(lines[index + 1] ?? "")) {
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const headHtml = headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("");
      const bodyHtml = rows
        .map(
          (row) =>
            `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`,
        )
        .join("");
      output.push(`<table><thead><tr>${headHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`);
      continue;
    }

    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      const ordered = /^\d+\.\s+/.test(line);
      const pattern = ordered ? /^\d+\.\s+(.+)$/ : /^[-*]\s+(.+)$/;
      const items = [];
      while (index < lines.length) {
        const match = lines[index].match(pattern);
        if (!match) break;
        items.push(`<li>${renderInline(match[1])}</li>`);
        index += 1;
      }
      const tag = ordered ? "ol" : "ul";
      output.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quote.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }
      output.push(`<blockquote>${renderMarkdown(quote.join("\n"), state)}</blockquote>`);
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      output.push("<hr>");
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !isBlockStart(lines, index)) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return output.join("\n");
}

function parseFrontMatter(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) return [{}, normalized];
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) throw new Error("Front matter has no closing --- marker");

  const metadata = {};
  for (const line of normalized.slice(4, end).split("\n")) {
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    metadata[key] = value;
  }
  return [metadata, normalized.slice(end + 5)];
}

function parseNavigationLink(value, field) {
  if (!value) return null;
  const match = value.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/);
  if (!match) {
    throw new Error(
      `Front matter field ${field} must use [Title](relative-url)`,
    );
  }
  return { title: match[1], href: match[2] };
}

function renderConversationNavigation(previous, next) {
  if (!previous && !next) return "";
  const renderLink = (target, direction) => {
    if (!target) return `<span class="conversation-nav-spacer" aria-hidden="true"></span>`;
    const previousLink = direction === "previous";
    const label = previousLink ? "Previous conversation" : "Next conversation";
    const arrow = previousLink ? "←" : "→";
    return `<a class="conversation-nav-link conversation-nav-${direction}" href="${escapeHtml(target.href)}" rel="${previousLink ? "prev" : "next"}">
  <span class="conversation-nav-arrow" aria-hidden="true">${arrow}</span>
  <span class="conversation-nav-copy">
    <span class="conversation-nav-label">${label}</span>
    <strong>${renderInline(target.title)}</strong>
  </span>
</a>`;
  };
  return `<nav class="conversation-nav" id="conversation-navigation" aria-label="Conversation navigation">
  ${renderLink(previous, "previous")}
  ${renderLink(next, "next")}
</nav>`;
}

function renderDocument(source, theme) {
  const [metadata, body] = parseFrontMatter(source);
  const title = metadata.title ?? sourceStem;
  const subtitle = metadata.subtitle ?? "";
  const author = metadata.author ?? "";
  const date = metadata.date ?? "";
  const status = metadata.status ?? "";
  const layout = slugify(metadata.layout ?? "dialogue");
  const leftSpeaker = metadata.left_speaker ?? "Ada";
  const rightSpeaker = metadata.right_speaker ?? "Alice";
  const previous = parseNavigationLink(metadata.previous, "previous");
  const next = parseNavigationLink(metadata.next, "next");
  const byline = [author, date]
    .filter(Boolean)
    .map((item) => `<span>${renderInline(item)}</span>`)
    .join("");
  const state = {
    exchangeNumber: 0,
    comparisonNumber: 0,
    reviewNumber: 0,
    recapNumber: 0,
    sourceExcerptNumber: 0,
    review: null,
    sourceDependencies: new Set(),
    leftSpeaker,
    rightSpeaker,
  };

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
  <style>${theme}</style>
  <script>
    window.MathJax = {
      tex: { inlineMath: [["$", "$"], ["\\\\(", "\\\\)"]] },
      svg: { fontCache: "global" }
    };
  </script>
  <script defer src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"></script>
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <article class="page layout-${layout}" id="lecture-note">
    <header class="title-block">
      ${status ? `<p class="status-badge">${renderInline(status)}</p>` : ""}
      <h1>${renderInline(title)}</h1>
      ${subtitle ? `<p class="subtitle">${renderInline(subtitle)}</p>` : ""}
      ${byline ? `<div class="byline">${byline}</div>` : ""}
    </header>
    <nav class="site-nav" aria-label="Course website">
      <a href="index.html">Home</a>
      <a href="syllabus.html">Syllabus</a>
      <a href="schedule.html">Schedule</a>
      <a href="project.html">Project</a>
      <a href="index.html#course-notes">Notes</a>
      <a href="https://github.com/StarGazerM/modern-query-processing-notes">Source</a>
    </nav>
    <main id="main-content">${renderMarkdown(body, state)}</main>
    ${renderConversationNavigation(previous, next)}
    <footer class="site-footer">
      <span>Modern Query Processing · Fall 2026</span>
      <a href="https://pldi.me/">Yihao Sun</a>
    </footer>
  </article>
  <script>
    (() => {
      let reviewsOpenedForPrint = [];
      window.addEventListener("beforeprint", () => {
        reviewsOpenedForPrint = [
          ...document.querySelectorAll("details.review-path:not([open])"),
        ];
        for (const review of reviewsOpenedForPrint) review.open = true;
      });
      window.addEventListener("afterprint", () => {
        for (const review of reviewsOpenedForPrint) review.open = false;
        reviewsOpenedForPrint = [];
      });
    })();
  </script>
</body>
</html>`;
  return { html, sourceDependencies: state.sourceDependencies };
}

let rebuildTimer;
const watchedSourceDependencies = new Map();

const scheduleBuild = () => {
  clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(() => {
    try {
      build();
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
    }
  }, 80);
};

function syncSourceWatchers(sourceDependencies) {
  for (const [path, watcher] of watchedSourceDependencies) {
    if (!sourceDependencies.has(path)) {
      watcher.close();
      watchedSourceDependencies.delete(path);
    }
  }
  for (const path of sourceDependencies) {
    if (!watchedSourceDependencies.has(path)) {
      watchedSourceDependencies.set(path, watch(path, scheduleBuild));
    }
  }
}

function build() {
  const source = readFileSync(sourcePath, "utf8");
  const theme = readFileSync(themePath, "utf8");
  const { html: rendered, sourceDependencies } = renderDocument(source, theme);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, rendered);
  if (watchMode) syncSourceWatchers(sourceDependencies);
  console.log(`Rendered ${sourcePath}\n      -> ${outputPath}`);
}

try {
  build();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

if (watchMode && process.exitCode !== 1) {
  console.log("Watching the note, theme, and included source. Press Ctrl-C to stop.");
  watch(sourcePath, scheduleBuild);
  watch(themePath, scheduleBuild);
}
