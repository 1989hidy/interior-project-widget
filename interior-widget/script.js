/*
 * 데모 모드: API가 아직 없거나 로컬 파일로 index.html을 열었을 때 사용됩니다.
 * 실제 Notion 연결 후에는 /api/project, /api/processes 응답이 자동으로 우선 적용됩니다.
 */
const DEMO_DATA = {
  expectedStartDate: "2026-10-06",
  processes: [
    { order: 1, name: "철거", tag: "철거", status: "예정", startDate: "2026-10-06", endDate: "2026-10-07" },
    { order: 2, name: "배관공사(에어컨)", tag: "에어컨", status: "예정", startDate: "2026-10-08", endDate: "2026-10-08" }
  ]
};

// Notion에서 '완료'라는 상태명을 다르게 쓴다면 여기만 수정하세요.
const SETTINGS = { completedStatus: "완료", timeZone: "Asia/Seoul" };

const $ = (selector) => document.querySelector(selector);

function kstDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SETTINGS.timeZone, year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function dateAtMidnight(dateString) {
  // YYYY-MM-DD 문자열을 UTC 자정으로 해석해 시간대에 따른 하루 밀림을 막습니다.
  return new Date(`${dateString}T00:00:00Z`);
}

function daysBetween(from, to) {
  return Math.round((dateAtMidnight(to) - dateAtMidnight(from)) / 86400000);
}

function formatDate(dateString) {
  if (!dateString) return "";
  const [, month, day] = dateString.split("-");
  return `${month}/${day}`;
}

function formatRange(process) {
  if (!process.startDate) return "일정 미정";
  if (!process.endDate || process.startDate === process.endDate) return formatDate(process.startDate);
  return `${formatDate(process.startDate)} ~ ${formatDate(process.endDate)}`;
}

function render(data) {
  const today = kstDateString();
  const processes = [...(data.processes || [])]
    .filter((process) => process.startDate)
    .sort((a, b) => a.order - b.order || a.startDate.localeCompare(b.startDate));

  if (data.expectedStartDate) {
    const difference = daysBetween(today, data.expectedStartDate);
    $("#d-day").textContent = difference > 0 ? `D-${difference}` : difference === 0 ? "D-DAY" : `D+${Math.abs(difference)}`;
    $("#start-date").textContent = `예상 착공 ${data.expectedStartDate}`;
  } else {
    $("#d-day").textContent = "—";
    $("#start-date").textContent = "착공일을 설정해주세요.";
  }

  if (!processes.length) {
    $("#next-content").innerHTML = '<span class="empty">공정 일정이 없습니다.</span>';
    $("#today-content").innerHTML = '<span class="empty">오늘 예정된 공정이 없습니다.</span>';
  } else {
    const next = processes
      .filter((process) => process.status !== SETTINGS.completedStatus && (process.endDate || process.startDate) >= today)
      .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
    $("#next-content").innerHTML = next
      ? `${escapeHtml(next.name)}<span class="date-range">${formatRange(next)}</span>`
      : '<span class="empty">예정된 공정이 없습니다.</span>';

    const todays = processes.filter((process) => process.startDate <= today && (process.endDate || process.startDate) >= today);
    $("#today-content").innerHTML = todays.length
      ? `<div class="today-list">${todays.map((process) => `<span class="today-item">${escapeHtml(process.name)}</span>`).join("")}</div>`
      : '<span class="empty">오늘 예정된 공정이 없습니다.</span>';
  }

  const completed = processes.filter((process) => process.status === SETTINGS.completedStatus).length;
  const percentage = processes.length ? Math.round((completed / processes.length) * 100) : 0;
  $("#progress-value").textContent = `${percentage}%`;
  $("#progress-bar").style.width = `${percentage}%`;
  $(".progress-track").setAttribute("aria-valuenow", percentage);
  $("#progress-detail").textContent = processes.length ? `${completed} / ${processes.length} 공정 완료` : "공정 데이터를 기다리고 있습니다.";
}

function escapeHtml(text = "") {
  const element = document.createElement("span");
  element.textContent = text;
  return element.innerHTML;
}

async function loadWidget() {
  try {
    const [projectResponse, processesResponse] = await Promise.all([fetch("/api/project"), fetch("/api/processes")]);
    if (!projectResponse.ok || !processesResponse.ok) throw new Error("API 응답 오류");
    const project = await projectResponse.json();
    const processes = await processesResponse.json();
    render({ expectedStartDate: project.expectedStartDate, processes: processes.processes });
  } catch (error) {
    // file:// 미리보기와 API 설정 전에는 데모 데이터를 보여 줍니다.
    if (location.protocol === "file:" || location.hostname === "localhost") render(DEMO_DATA);
    else {
      console.error("위젯 데이터를 불러오지 못했습니다.", error);
      $("#start-date").textContent = "데이터를 불러오지 못했습니다.";
      $("#next-content").innerHTML = '<span class="empty">데이터를 불러오지 못했습니다.</span>';
      $("#today-content").innerHTML = '<span class="empty">데이터를 불러오지 못했습니다.</span>';
    }
  }
}

loadWidget();
