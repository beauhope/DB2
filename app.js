const screens = {
  home: document.getElementById("homeScreen"),
  module: document.getElementById("moduleScreen"),
  lesson: document.getElementById("lessonScreen")
};

const moduleGrid = document.getElementById("moduleGrid");
const lessonList = document.getElementById("lessonList");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const toTop = document.getElementById("toTop");
const progressCount = document.getElementById("progressCount");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const moduleCurrentCrumb = document.getElementById("moduleCurrentCrumb");
const lessonModuleCrumb = document.getElementById("lessonModuleCrumb");
const lessonCurrentCrumb = document.getElementById("lessonCurrentCrumb");

let currentModuleId = null;
let currentLessonId = null;

const progressKey = "philosophy-review-progress";
const progress = loadProgress();

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(progressKey)) || { reviewedLessons: [] };
  } catch {
    return { reviewedLessons: [] };
  }
}

function saveProgress() {
  localStorage.setItem(progressKey, JSON.stringify(progress));
}

function isReviewed(lessonId) {
  return progress.reviewedLessons.includes(lessonId);
}

function setScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.remove("active"));
  screens[name].classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getModule(moduleId) {
  return PHILOSOPHY_DATA.modules.find((module) => module.id === moduleId);
}

function getLesson(moduleId, lessonId) {
  const module = getModule(moduleId);
  return module?.lessons.find((lesson) => lesson.id === lessonId);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const richHeadingKeywords = [
  "المحور الأول",
  "المحور الثاني",
  "المحور الثالث",
  "الخلاصة المتوازنة",
  "الخلاصة",
  "مفاهيم يجب حفظها",
  "السؤال الأساسي",
  "الفكرة الأساسية هنا",
  "الفكرة الأساسية",
  "طريقة التفكير",
  "جواب مختصر نموذجي",
  "الموضوع",
  "مثال بسيط",
  "مثال"
];

function normalizeRichText(text) {
  const headingAlternatives = richHeadingKeywords
    .map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  return String(text)
    .replace(/\r/g, "")
    .replace(new RegExp(`\\s*(${headingAlternatives})\\s*:\\s*`, "g"), "\n$1§COLON§ ")
    .replace(/(:)(?=([اأإآء-ي]))/g, "$1\n")
    .replace(/§COLON§/g, ":")
    .replace(/([؟.!])(?=([اأإآء-ي]))/g, "$1\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatRichText(text) {
  if (!text || !String(text).trim()) {
    return "<p>لا يوجد محتوى مضاف بعد.</p>";
  }

  const lines = normalizeRichText(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parts = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const headingMatch = line.match(/^([^:]+):\s*(.*)$/);

    if (headingMatch && richHeadingKeywords.includes(headingMatch[1])) {
      const heading = headingMatch[1];
      const rest = headingMatch[2].trim();

      if (heading === "مفاهيم يجب حفظها") {
        const conceptLines = rest ? [rest] : [];
        let cursor = index + 1;

        while (cursor < lines.length) {
          const nextLine = lines[cursor];
          const nextHeading = nextLine.match(/^([^:]+):\s*(.*)$/);
          if (richHeadingKeywords.includes(nextLine) || (nextHeading && richHeadingKeywords.includes(nextHeading[1]))) {
            break;
          }
          conceptLines.push(nextLine);
          cursor += 1;
        }

        parts.push(`<h3 class="subheading">${escapeHtml(heading)}</h3>`);
        parts.push(formatConceptTable(conceptLines));
        index = cursor - 1;
        continue;
      }

      if (heading.startsWith("المحور") && rest) {
        parts.push(`<h3 class="subheading">${escapeHtml(`${heading}: ${rest}`)}</h3>`);
      } else {
        parts.push(`<h3 class="subheading">${escapeHtml(heading)}</h3>`);
        if (rest) parts.push(`<p>${escapeHtml(rest)}</p>`);
      }
      continue;
    }

    if (richHeadingKeywords.includes(line)) {
      if (line === "مفاهيم يجب حفظها") {
        const conceptLines = [];
        let cursor = index + 1;

        while (cursor < lines.length) {
          const nextLine = lines[cursor];
          const nextHeading = nextLine.match(/^([^:]+):\s*(.*)$/);
          if (richHeadingKeywords.includes(nextLine) || (nextHeading && richHeadingKeywords.includes(nextHeading[1]))) {
            break;
          }
          conceptLines.push(nextLine);
          cursor += 1;
        }

        parts.push(`<h3 class="subheading">${escapeHtml(line)}</h3>`);
        parts.push(formatConceptTable(conceptLines));
        index = cursor - 1;
      } else {
        parts.push(`<h3 class="subheading">${escapeHtml(line)}</h3>`);
      }
      continue;
    }

    parts.push(`<p>${escapeHtml(line)}</p>`);
  }

  return parts.join("");
}

function formatConceptTable(lines) {
  const cleaned = lines.filter((line) => line && line !== "المفهوم" && line !== "معناه المبسط");
  const rows = [];

  for (let index = 0; index < cleaned.length; index += 2) {
    rows.push({
      concept: cleaned[index],
      meaning: cleaned[index + 1] || ""
    });
  }

  if (!rows.length) return "<p>لا توجد مفاهيم منظمة للعرض.</p>";

  return `
    <div class="concept-table-wrap concepts-table-wrap">
      <table class="concept-table concepts-table">
        <thead>
          <tr>
            <th>المفهوم</th>
            <th>معناه المبسط</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (row) => `
                <tr>
                  <td>${escapeHtml(row.concept)}</td>
                  <td>${escapeHtml(row.meaning)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function plainTextPreview(text, maxLength = 150) {
  const normalized = normalizeRichText(text).replace(/\n+/g, " ");
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength).trim()}...` : normalized;
}

function mindMapToSearchText(mindMap) {
  if (Array.isArray(mindMap)) return mindMap.join(" ");
  if (mindMap && typeof mindMap === "object") {
    return [
      mindMap.center,
      ...(mindMap.branches || []).flatMap((branch) => [
        branch.title,
        branch.question,
        ...(branch.points || [])
      ])
    ].filter(Boolean).join(" ");
  }
  return "";
}

function renderMindMap(mindMapData) {
  const mindMap = document.getElementById("mindMap");
  mindMap.innerHTML = "";

  if (mindMapData && !Array.isArray(mindMapData) && typeof mindMapData === "object") {
    mindMap.classList.add("structured");

    const center = document.createElement("li");
    center.className = "mind-map-center";
    center.innerHTML = `<strong>${escapeHtml(mindMapData.center || "خريطة ذهنية")}</strong>`;
    mindMap.appendChild(center);

    (mindMapData.branches || []).forEach((branch, index) => {
      const li = document.createElement("li");
      li.className = "mind-map-branch";
      li.innerHTML = `
        <span class="mind-map-number">${index + 1}</span>
        <div class="mind-map-text">
          <h4>${escapeHtml(branch.title || "فرع")}</h4>
          ${branch.question ? `<p class="mind-map-question">${escapeHtml(branch.question)}</p>` : ""}
          <ul>
            ${(branch.points || []).map((point) => `<li>${escapeHtml(point)}</li>`).join("")}
          </ul>
          ${branch.example ? `<p class="mind-map-example">${escapeHtml(branch.example)}</p>` : ""}
        </div>
      `;
      mindMap.appendChild(li);
    });
    return;
  }

  mindMap.classList.remove("structured");
  (mindMapData || []).forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="mind-map-number">${mindMap.children.length + 1}</span>
      <div class="mind-map-text rich-text">${formatRichText(item)}</div>
    `;
    mindMap.appendChild(li);
  });
}

function getAllLessons() {
  return PHILOSOPHY_DATA.modules.flatMap((module) => module.lessons);
}

function updateOverallProgress() {
  const allLessons = getAllLessons();
  const total = allLessons.length;
  const reviewedCount = allLessons.filter((lesson) => isReviewed(lesson.id)).length;
  const percentage = total ? Math.round((reviewedCount / total) * 100) : 0;

  progressCount.textContent = `${reviewedCount} من ${total} درس`;
  progressText.textContent = total
    ? `تمت مراجعة ${percentage}% من الدروس المتاحة في النموذج.`
    : "ستظهر نسبة التقدم بعد إضافة الدروس.";
  progressFill.style.width = `${percentage}%`;
}

function renderModules() {
  updateOverallProgress();
  moduleGrid.innerHTML = "";
  PHILOSOPHY_DATA.modules.forEach((module) => {
    const reviewedCount = module.lessons.filter((lesson) => isReviewed(lesson.id)).length;
    const total = module.lessons.length;
    const percentage = total ? Math.round((reviewedCount / total) * 100) : 0;
    const card = document.createElement("article");
    card.className = "module-card";
    card.innerHTML = `
      <div class="module-card-header">
        <h3>${module.title}</h3>
        <p class="muted">${module.description}</p>
      </div>
      <div class="module-meta">
        <div class="module-stat">
          <strong>${total}</strong>
          <span>عدد الدروس</span>
        </div>
        <div class="module-stat">
          <strong>${reviewedCount}</strong>
          <span>دروس مراجعة</span>
        </div>
      </div>
      <div class="module-progress" aria-hidden="true"><span style="width: ${percentage}%"></span></div>
      <button class="module-action" type="button" ${total ? "" : "disabled"}>
        ${total ? "ابدئي المراجعة" : "المحتوى قيد الإعداد"}
      </button>
    `;
    card.querySelector(".module-action").addEventListener("click", () => openModule(module.id));
    moduleGrid.appendChild(card);
  });
}

function openModule(moduleId) {
  currentModuleId = moduleId;
  const module = getModule(moduleId);
  moduleCurrentCrumb.textContent = module.title;
  document.getElementById("moduleLabel").textContent = "مجزوءة";
  document.getElementById("moduleTitle").textContent = module.title;
  document.getElementById("moduleDescription").textContent = module.description;
  renderLessons(module.lessons);
  setScreen("module");
}

function renderLessons(lessons) {
  lessonList.innerHTML = "";

  if (!lessons.length) {
    lessonList.innerHTML = `<div class="search-empty">لا توجد دروس مضافة بعد في هذا النموذج الأولي.</div>`;
    return;
  }

  lessons.forEach((lesson) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "lesson-item";
    item.innerHTML = `
      <h3>${lesson.title}</h3>
      <p class="muted">${plainTextPreview(lesson.summary)}</p>
      <span class="badge">${isReviewed(lesson.id) ? "تمت مراجعته" : "غير مراجع"}</span>
    `;
    item.addEventListener("click", () => openLesson(currentModuleId, lesson.id));
    lessonList.appendChild(item);
  });
}

function openLesson(moduleId, lessonId) {
  currentModuleId = moduleId;
  currentLessonId = lessonId;

  const module = getModule(moduleId);
  const lesson = getLesson(moduleId, lessonId);

  lessonModuleCrumb.textContent = module.title;
  lessonCurrentCrumb.textContent = lesson.title;
  document.getElementById("lessonModuleName").textContent = module.title;
  document.getElementById("lessonTitle").textContent = lesson.title;
  document.getElementById("lessonSummary").innerHTML = formatRichText(lesson.summary);
  document.getElementById("writingPrompt").innerHTML = formatRichText(lesson.writingPrompt);
  document.getElementById("modelAnswer").innerHTML = formatRichText(lesson.modelAnswer);
  document.getElementById("modelAnswer").classList.add("hidden");
  document.getElementById("toggleModelAnswer").textContent = "إظهار نموذج جواب مختصر";

  const assignmentSection = document.getElementById("assignmentSection");
  const assignmentText = document.getElementById("assignmentText");
  if (lesson.assignment && lesson.assignment.trim()) {
    assignmentText.innerHTML = formatRichText(lesson.assignment);
    assignmentSection.classList.remove("hidden");
  } else {
    assignmentText.innerHTML = "";
    assignmentSection.classList.add("hidden");
  }

  const markReviewed = document.getElementById("markReviewed");
  updateReviewButton(markReviewed, lesson.id);

  renderMindMap(lesson.mindMap);

  renderQuiz(lesson.questions);
  setScreen("lesson");
}

function updateReviewButton(button, lessonId) {
  const done = isReviewed(lessonId);
  button.textContent = done ? "تمت مراجعة هذا الدرس ✓" : "✓ أنهيت مراجعة هذا الدرس";
  button.classList.toggle("done", done);
}

function renderQuiz(questions) {
  const quizList = document.getElementById("quizList");
  quizList.innerHTML = "";

  questions.forEach((question, index) => {
    const card = document.createElement("div");
    card.className = "question-card";
    card.innerHTML = `
      <div class="question-title">
        <span>السؤال ${index + 1}</span>
        <p>${question.text}</p>
      </div>
      <div class="question-actions">
        <button class="choice-button" type="button" data-choice="true">صح</button>
        <button class="choice-button" type="button" data-choice="false">خطأ</button>
        <button class="answer-toggle" type="button">إظهار التصحيح</button>
      </div>
      <p class="correction hidden">${question.correction}</p>
    `;

    const correction = card.querySelector(".correction");
    card.querySelectorAll(".choice-button").forEach((button) => {
      button.addEventListener("click", () => {
        card.querySelectorAll(".choice-button").forEach((btn) => {
          btn.classList.remove("selected", "correct", "wrong");
        });
        button.classList.add("selected");
        const choice = button.dataset.choice === "true";
        button.classList.add(choice === question.answer ? "correct" : "wrong");
        correction.textContent = `${choice === question.answer ? "إجابة صحيحة." : "إجابة غير صحيحة."} ${question.correction}`;
        correction.classList.remove("hidden");
      });
    });

    card.querySelector(".answer-toggle").addEventListener("click", (event) => {
      correction.textContent = question.correction;
      correction.classList.toggle("hidden");
      event.currentTarget.textContent = correction.classList.contains("hidden")
        ? "إظهار التصحيح"
        : "إخفاء التصحيح";
    });

    quizList.appendChild(card);
  });
}

function searchLessons(query) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    renderModules();
    setScreen("home");
    return;
  }

  const matches = [];
  PHILOSOPHY_DATA.modules.forEach((module) => {
    module.lessons.forEach((lesson) => {
      const text = [
        module.title,
        lesson.title,
        lesson.summary,
        mindMapToSearchText(lesson.mindMap),
        lesson.writingPrompt
      ].join(" ").toLowerCase();

      if (text.includes(normalized)) {
        matches.push({ module, lesson });
      }
    });
  });

  moduleGrid.innerHTML = "";
  if (!matches.length) {
    moduleGrid.innerHTML = `<div class="search-empty">لا توجد نتائج مطابقة للبحث.</div>`;
  } else {
    matches.forEach(({ module, lesson }) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "module-card";
      card.innerHTML = `
        <h3>${lesson.title}</h3>
        <p class="muted">${module.title}</p>
        <p class="muted">${plainTextPreview(lesson.summary)}</p>
      `;
      card.addEventListener("click", () => openLesson(module.id, lesson.id));
      moduleGrid.appendChild(card);
    });
  }
  setScreen("home");
}

document.getElementById("backToHome").addEventListener("click", () => {
  renderModules();
  setScreen("home");
});

document.getElementById("brandHome").addEventListener("click", (event) => {
  event.preventDefault();
  searchInput.value = "";
  renderModules();
  setScreen("home");
});

document.getElementById("backToModule").addEventListener("click", () => {
  openModule(currentModuleId);
});

document.getElementById("moduleHomeCrumb").addEventListener("click", () => {
  searchInput.value = "";
  renderModules();
  setScreen("home");
});

document.getElementById("lessonHomeCrumb").addEventListener("click", () => {
  searchInput.value = "";
  renderModules();
  setScreen("home");
});

lessonModuleCrumb.addEventListener("click", () => {
  openModule(currentModuleId);
});

document.getElementById("markReviewed").addEventListener("click", (event) => {
  if (!isReviewed(currentLessonId)) {
    progress.reviewedLessons.push(currentLessonId);
  } else {
    progress.reviewedLessons = progress.reviewedLessons.filter((id) => id !== currentLessonId);
  }
  saveProgress();
  updateReviewButton(event.currentTarget, currentLessonId);
});

document.getElementById("toggleModelAnswer").addEventListener("click", (event) => {
  const answer = document.getElementById("modelAnswer");
  answer.classList.toggle("hidden");
  event.currentTarget.textContent = answer.classList.contains("hidden")
    ? "إظهار نموذج جواب مختصر"
    : "إخفاء نموذج جواب مختصر";
});

document.querySelectorAll(".toc-button").forEach((button) => {
  button.addEventListener("click", () => {
    document.getElementById(button.dataset.target)?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
});

searchInput.addEventListener("input", (event) => searchLessons(event.target.value));

clearSearch.addEventListener("click", () => {
  searchInput.value = "";
  renderModules();
  setScreen("home");
});

toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

window.addEventListener("scroll", () => {
  toTop.classList.toggle("visible", window.scrollY > 240);
});

renderModules();
