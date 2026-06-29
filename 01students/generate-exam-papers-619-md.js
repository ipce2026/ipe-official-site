const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "course-qna-data.js"), "utf8");

const examConfigs = [
  {
    courseId: "skin-management-junior",
    subject: "皮膚管理",
    fileName: "exam-skin-management-619.md",
    picks: [48, 14, 55, 23, 70, 12, 84, 31, 1, 45, 59, 71, 25, 81, 18, 5, 96, 42, 56, 66, 27, 73, 4, 76, 11],
    distributionNote: "A 6 題、B 7 題、C 6 題、D 6 題",
  },
  {
    courseId: "aroma-body-junior",
    subject: "芳香美體",
    fileName: "exam-aroma-body-619.md",
    picks: [39, 7, 74, 16, 92, 45, 31, 22, 58, 86, 50, 21, 69, 36, 43, 98, 4, 54, 59, 12, 82, 5, 40, 51, 38],
    distributionNote: "A 6 題、B 7 題、C 6 題、D 6 題",
  },
  {
    courseId: "hot-waxing-junior",
    subject: "熱蠟美肌",
    fileName: "exam-hot-waxing-619.md",
    picks: [39, 3, 132, 57, 167, 1, 60, 154, 27, 80, 186, 24, 100, 171, 7, 116, 17, 25, 136, 53, 194, 78, 15, 67, 99],
    distributionNote: "A 4 題、B 13 題、C 4 題、D 4 題",
  },
];

function parseCourse(courseId) {
  const marker = `"${courseId}": \``;
  const start = source.indexOf(marker);
  if (start === -1) throw new Error(`Course not found: ${courseId}`);

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

function renderMarkdown(config, questionMap) {
  const questions = config.picks.map((number) => {
    const question = questionMap.get(number);
    if (!question) throw new Error(`${config.subject} missing question ${number}`);
    return question;
  });

  const questionLines = questions.flatMap((question, index) => [
    `### 第 ${index + 1} 題`,
    `${question.stem}`,
    ``,
    `A. ${question.options.A || ""}`,
    `B. ${question.options.B || ""}`,
    `C. ${question.options.C || ""}`,
    `D. ${question.options.D || ""}`,
    ``,
  ]);

  const answerSheetLines = Array.from({ length: 25 }, (_, index) => `${index + 1}. ____`).join("\n");

  const answerKeyLines = questions
    .map((question, index) => `${index + 1}. ${question.answer}（原題號：${question.originalNumber}）`)
    .join("\n");

  return [
    `# 6/19 台南場檢定考 - ${config.subject}`,
    ``,
    `共 25 題，單選題。`,
    `答案分布：${config.distributionNote}`,
    ``,
    `姓名：__________`,
    `座號：__________`,
    ``,
    `## 試題`,
    ``,
    ...questionLines,
    `## 作答卷`,
    ``,
    answerSheetLines,
    ``,
    `## 標準答案`,
    ``,
    answerKeyLines,
    ``,
  ].join("\n");
}

for (const config of examConfigs) {
  const questions = parseCourse(config.courseId);
  const questionMap = new Map(questions.map((question) => [question.originalNumber, question]));
  const markdown = renderMarkdown(config, questionMap);
  fs.writeFileSync(path.join(__dirname, config.fileName), markdown, "utf8");
}
