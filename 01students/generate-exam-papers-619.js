const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "course-qna-data.js"), "utf8");

const examConfigs = [
  {
    courseId: "skin-management-junior",
    subject: "皮膚管理",
    fileName: "exam-skin-management-619.html",
    subtitle: "6/19 台南場檢定考",
    picks: [48, 14, 55, 23, 70, 12, 84, 31, 1, 45, 59, 71, 25, 81, 18, 5, 96, 42, 56, 66, 27, 73, 4, 76, 11],
    distributionNote: "正確答案分布：A 6 題、B 7 題、C 6 題、D 6 題",
  },
  {
    courseId: "aroma-body-junior",
    subject: "芳香美體",
    fileName: "exam-aroma-body-619.html",
    subtitle: "6/19 台南場檢定考",
    picks: [39, 7, 74, 16, 92, 45, 31, 22, 58, 86, 50, 21, 69, 36, 43, 98, 4, 54, 59, 12, 82, 5, 40, 51, 38],
    distributionNote: "正確答案分布：A 6 題、B 7 題、C 6 題、D 6 題",
  },
  {
    courseId: "hot-waxing-junior",
    subject: "熱蠟美肌",
    fileName: "exam-hot-waxing-619.html",
    subtitle: "6/19 台南場檢定考",
    picks: [39, 3, 132, 57, 167, 1, 60, 154, 27, 80, 186, 24, 100, 171, 7, 116, 17, 25, 136, 53, 194, 78, 15, 67, 99],
    distributionNote: "正確答案分布：A 4 題、B 13 題、C 4 題、D 4 題",
  },
];

function parseCourse(courseId) {
  const marker = `"${courseId}": \``;
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error(`Course not found: ${courseId}`);
  }

  const rest = source.slice(start);
  const firstLineBreak = rest.indexOf("\n");
  const end = rest.indexOf("\n`,");
  const body = rest.slice(firstLineBreak + 1, end);

  return body
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(/^(\d+)\(([A-D])\)\s*(.*)$/);
      if (!match) return null;

      const questionText = match[3];
      const options = {};
      const optionPattern = /(?:\(|\b)([A-D])(?:\)|[.、])\s*([\s\S]*?)(?=\s*(?:\(|\b)[A-D](?:\)|[.、])\s*|$)/g;
      let optionMatch;
      let stem = questionText;

      while ((optionMatch = optionPattern.exec(questionText)) !== null) {
        if (optionMatch.index < stem.length) {
          stem = questionText.slice(0, optionMatch.index).trim();
        }
        options[optionMatch[1]] = optionMatch[2].trim();
      }

      return {
        originalNumber: Number(match[1]),
        answer: match[2],
        stem,
        options,
      };
    })
    .filter(Boolean);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderQuestion(question, displayNumber) {
  const optionLabels = ["A", "B", "C", "D"];
  const optionsHtml = optionLabels
    .map((label) => `<li><span class="option-label">(${label})</span> ${escapeHtml(question.options[label] || "")}</li>`)
    .join("");

  return `
    <article class="question-card">
      <div class="question-no">${displayNumber}</div>
      <div class="question-body">
        <p class="question-stem">${escapeHtml(question.stem)}</p>
        <ol class="options-list">${optionsHtml}</ol>
      </div>
    </article>
  `;
}

function renderAnswerSheet() {
  const rows = Array.from({ length: 25 }, (_, index) => {
    const number = index + 1;
    return `
      <tr>
        <td>${number}</td>
        <td></td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `;
  }).join("");

  return `
      <table class="answer-table compact-answer-table">
        <thead>
          <tr>
            <th>題號</th>
            <th>A</th>
            <th>B</th>
            <th>C</th>
            <th>D</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
  `;
}

function renderKey(questions, distributionNote) {
  const cells = questions
    .map(
      (question, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${question.answer}</td>
          <td>${question.originalNumber}</td>
        </tr>
      `
    )
    .join("");

  return `
    <section class="page key-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">Answer Key</p>
          <h2>標準答案</h2>
        </div>
        <div class="meta-block compact">${escapeHtml(distributionNote)}</div>
      </div>

      <table class="key-table">
        <thead>
          <tr>
            <th>題號</th>
            <th>答案</th>
            <th>原題號</th>
          </tr>
        </thead>
        <tbody>${cells}</tbody>
      </table>
    </section>
  `;
}

function renderExam(config, questionMap) {
  const selectedQuestions = config.picks.map((number) => {
    const question = questionMap.get(number);
    if (!question) {
      throw new Error(`${config.subject} missing question ${number}`);
    }
    return question;
  });

  const questionsHtml = selectedQuestions.map((question, index) => renderQuestion(question, index + 1)).join("");

  const answerSheetHtml = renderAnswerSheet();
  const keyHtml = renderKey(selectedQuestions, config.distributionNote);

  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(config.subtitle)} ${escapeHtml(config.subject)} 試卷</title>
  <style>
    :root {
      --ink: #1f2937;
      --muted: #6b7280;
      --line: #d7dce3;
      --soft: #f6f7f9;
      --accent: #8c6a2d;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif;
      color: var(--ink);
      background: #eef1f5;
      line-height: 1.55;
    }
    .document {
      width: min(100%, 980px);
      margin: 0 auto;
      padding: 24px 16px 48px;
    }
    .page {
      background: #fff;
      margin: 0 auto 24px;
      padding: 28px 30px 34px;
      border-radius: 18px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      border-bottom: 2px solid var(--line);
      padding-bottom: 16px;
      margin-bottom: 18px;
    }
    .eyebrow {
      margin: 0 0 6px;
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    h1, h2 {
      margin: 0;
      font-family: "Noto Serif TC", "PMingLiU", serif;
      font-weight: 700;
    }
    h1 { font-size: 30px; }
    h2 { font-size: 24px; }
    .subhead {
      margin: 8px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    .meta-block {
      min-width: 220px;
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 14px;
      background: var(--soft);
      font-size: 14px;
      line-height: 1.8;
    }
    .meta-block.compact {
      font-weight: 700;
      color: var(--accent);
    }
    .notice {
      display: grid;
      grid-template-columns: 1.1fr 1fr;
      gap: 10px;
      margin-bottom: 14px;
    }
    .notice-item {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 12px 14px;
      background: #fcfcfd;
      font-size: 14px;
    }
    .notice-item.answer-box {
      padding: 10px;
    }
    .question-list {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 12px;
      align-items: start;
    }
    .question-card {
      display: grid;
      grid-template-columns: 28px 1fr;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 10px;
      padding: 8px 9px;
      break-inside: avoid;
    }
    .question-no {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      background: var(--ink);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 12px;
    }
    .question-stem {
      margin: 0 0 5px;
      font-weight: 700;
      font-size: 12px;
      line-height: 1.4;
    }
    .options-list {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 2px;
      font-size: 11px;
      line-height: 1.35;
    }
    .option-label {
      display: inline-block;
      min-width: 28px;
      color: var(--accent);
      font-weight: 700;
    }
    .answer-table, .key-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      font-size: 15px;
    }
    .answer-table th, .answer-table td, .key-table th, .key-table td {
      border: 1px solid var(--line);
      text-align: center;
      padding: 10px 8px;
      height: 40px;
    }
    .answer-table th, .key-table th {
      background: var(--soft);
      font-weight: 700;
    }
    .key-table td:nth-child(2) {
      font-weight: 700;
      color: var(--accent);
    }
    .compact-answer-table {
      font-size: 10px;
    }
    .compact-answer-table th,
    .compact-answer-table td {
      padding: 3px 2px;
      height: 18px;
    }
    .footer-note {
      margin-top: 10px;
      color: var(--muted);
      font-size: 11px;
    }
    @media (max-width: 760px) {
      .page { padding: 22px 18px 28px; border-radius: 14px; }
      .page-header { flex-direction: column; }
      .notice { grid-template-columns: 1fr; }
      .meta-block { min-width: 0; width: 100%; }
      .question-list { grid-template-columns: 1fr; }
      .question-card { grid-template-columns: 30px 1fr; }
      .question-no { width: 30px; height: 30px; font-size: 12px; }
    }
    @media print {
      @page {
        size: A4 portrait;
        margin: 7mm;
      }
      body { background: #fff; }
      .document { width: 100%; max-width: none; padding: 0; }
      .page {
        box-shadow: none;
        border-radius: 0;
        margin: 0;
        min-height: auto;
        page-break-after: always;
        padding: 0;
      }
      .page.one-page {
        page-break-after: always;
      }
      .page:last-child { page-break-after: auto; }
      .page-header {
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      h1 { font-size: 18px; }
      h2 { font-size: 16px; }
      .eyebrow { font-size: 9px; margin-bottom: 2px; }
      .subhead { font-size: 10px; margin-top: 4px; }
      .meta-block {
        font-size: 10px;
        padding: 6px 8px;
        min-width: 190px;
        line-height: 1.5;
      }
      .notice {
        grid-template-columns: 1fr 270px;
        gap: 8px;
        margin-bottom: 8px;
      }
      .notice-item {
        font-size: 10px;
        padding: 7px 8px;
        line-height: 1.4;
      }
      .question-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px 8px;
      }
      .question-card {
        grid-template-columns: 22px 1fr;
        padding: 5px 6px;
        gap: 6px;
        border-radius: 8px;
      }
      .question-no {
        width: 22px;
        height: 22px;
        font-size: 10px;
      }
      .question-stem {
        font-size: 10px;
        margin-bottom: 3px;
        line-height: 1.28;
      }
      .options-list {
        font-size: 9px;
        gap: 1px;
        line-height: 1.24;
      }
      .option-label {
        min-width: 20px;
      }
      .compact-answer-table {
        font-size: 8.5px;
      }
      .compact-answer-table th,
      .compact-answer-table td {
        height: 14px;
        padding: 1px;
      }
      .footer-note {
        margin-top: 6px;
        font-size: 9px;
      }
    }
  </style>
</head>
<body>
  <main class="document">
    <section class="page one-page">
      <div class="page-header">
        <div>
          <p class="eyebrow">IPE Certification Exam</p>
          <h1>${escapeHtml(config.subtitle)} ${escapeHtml(config.subject)}</h1>
          <p class="subhead">共 25 題，單選題。請於作答卷填寫答案。</p>
        </div>
        <div class="meta-block">
          <div>姓名：________________</div>
          <div>座號：________________</div>
          <div>考試日期：2026 / 06 / 19</div>
          <div>考試地點：台南場</div>
        </div>
      </div>

      <div class="notice">
        <div class="notice-item">
          請使用藍筆或黑筆作答。每題僅有 1 個正確答案。作答前請先核對科目與座號。
        </div>
        <div class="notice-item answer-box">
          ${answerSheetHtml}
        </div>
      </div>

      <div class="question-list">${questionsHtml}</div>
      <p class="footer-note">本頁為單張 A4 列印版。標準答案與原題號對照附於後頁，便於監考與核對。</p>
    </section>
    ${keyHtml}
  </main>
</body>
</html>`;
}

for (const config of examConfigs) {
  const questions = parseCourse(config.courseId);
  const questionMap = new Map(questions.map((question) => [question.originalNumber, question]));
  const html = renderExam(config, questionMap);
  fs.writeFileSync(path.join(__dirname, config.fileName), html, "utf8");
}

const indexHtml = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>6/19 台南場檢定考試卷</title>
  <style>
    body {
      margin: 0;
      font-family: "Microsoft JhengHei", "Noto Sans TC", sans-serif;
      background: linear-gradient(180deg, #f5f1e8 0%, #eef2f6 100%);
      color: #1f2937;
    }
    .wrap {
      width: min(100%, 880px);
      margin: 0 auto;
      padding: 48px 20px 56px;
    }
    .hero {
      background: #fff;
      border-radius: 24px;
      padding: 32px 28px;
      box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
      margin-bottom: 22px;
    }
    .eyebrow {
      margin: 0 0 8px;
      color: #8c6a2d;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    h1 {
      margin: 0 0 10px;
      font-size: 34px;
      font-family: "Noto Serif TC", "PMingLiU", serif;
    }
    p {
      margin: 0;
      color: #5b6472;
      line-height: 1.8;
    }
    .grid {
      display: grid;
      gap: 16px;
    }
    .card {
      background: #fff;
      border-radius: 20px;
      padding: 22px;
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
    }
    .card h2 {
      margin: 0 0 8px;
      font-size: 24px;
    }
    .card p {
      margin-bottom: 14px;
    }
    .links {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 700;
      color: #fff;
      background: #1f2937;
    }
    a.secondary {
      background: #8c6a2d;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="hero">
      <p class="eyebrow">IPE Certification Exam</p>
      <h1>6/19 台南場檢定考試卷</h1>
      <p>每一份檔案都已包含試卷、作答卷與標準答案，可直接開啟列印。</p>
    </section>
    <section class="grid">
      ${examConfigs
        .map(
          (config) => `
            <article class="card">
              <h2>${escapeHtml(config.subject)}</h2>
              <p>${escapeHtml(config.distributionNote)}</p>
              <div class="links">
                <a href="${escapeHtml(config.fileName)}">開啟試卷</a>
              </div>
            </article>
          `
        )
        .join("")}
    </section>
  </main>
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "exam-papers-619.html"), indexHtml, "utf8");
