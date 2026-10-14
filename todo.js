const STORAGE_KEY = "taskflow.tasks.v1";
const todayDate = toDateKey(new Date());
let tasks = [];
let selectedDate = todayDate;
let displayedMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let activeFilter = "selected";
let editingTaskId = null;

// Get the parts of the page that the task manager updates.
const calendarGrid = document.querySelector("#calendar-grid");
const monthHeading = document.querySelector("#month-heading");
const taskList = document.querySelector("#task-list");
const taskDialog = document.querySelector("#task-dialog");
const taskForm = document.querySelector("#task-form");
const taskTitleInput = document.querySelector("#task-title");
const taskDateInput = document.querySelector("#task-due-date");
const storageNotice = document.querySelector("#storage-notice");

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Build local dates from date keys so they are not shifted by time zones.
function fromDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isValidDateKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = fromDateKey(value);
  return toDateKey(date) === value;
}

function isStoredTask(value) {
  if (value === null || typeof value !== "object") return false;
  if (typeof value.id !== "string" || value.id.length === 0) return false;
  if (typeof value.title !== "string" || value.title.trim().length === 0) return false;
  if (value.title.length > 120 || !isValidDateKey(value.dueDate)) return false;
  if (typeof value.completed !== "boolean") return false;
  if (typeof value.createdAt !== "string" || Number.isNaN(Date.parse(value.createdAt))) return false;
  return true;
}

function showStorageNotice(message) {
  storageNotice.textContent = message;
  storageNotice.hidden = false;
}

function loadTasks() {
  let storedValue;

  try {
    storedValue = localStorage.getItem(STORAGE_KEY);
  } catch {
    showStorageNotice("Task storage is unavailable in this browser session. Changes may not persist after you leave this page.");
    return [];
  }
  if (storedValue === null) return [];

  // Check saved data before using it, since localStorage can be edited or corrupted.
  try {
    const parsed = JSON.parse(storedValue);
    if (!Array.isArray(parsed) || !parsed.every(isStoredTask)) {
      localStorage.removeItem(STORAGE_KEY);
      showStorageNotice("Saved task data was invalid and has been cleared. You can start with a fresh task list.");
      return [];
    }
    return parsed;
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      showStorageNotice("Saved task data could not be read or cleared. Please check your browser storage settings.");
      return [];
    }
    showStorageNotice("Saved task data could not be read and has been cleared. You can start with a fresh task list.");
    return [];
  }
}

function saveTasks() {
  try {
    // Save the latest list so tasks are still here after a page refresh.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    storageNotice.hidden = true;
  } catch {
    showStorageNotice("Your changes are visible now, but could not be saved in this browser. Check available storage and permissions.");
  }
}

function formatDate(dateKey, options = { weekday: "long", month: "long", day: "numeric", year: "numeric" }) {
  return new Intl.DateTimeFormat(undefined, options).format(fromDateKey(dateKey));
}

function getTaskStatus(task) {
  if (task.completed) return "completed";
  if (task.dueDate < todayDate) return "overdue";
  return "pending";
}

function renderCalendar() {
  const year = displayedMonth.getFullYear();
  const month = displayedMonth.getMonth();
  monthHeading.textContent = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(displayedMonth);
  calendarGrid.replaceChildren();

  ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].forEach((label) => {
    const weekday = document.createElement("div");
    weekday.className = "weekday";
    weekday.setAttribute("role", "columnheader");
    weekday.textContent = label;
    calendarGrid.append(weekday);
  });

  const firstOfMonth = new Date(year, month, 1);
  // Move the first calendar row back to Monday to line up the weekday headings.
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index);
    const dateKey = toDateKey(date);
    const dayTasks = tasks.filter((task) => task.dueDate === dateKey);
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "calendar-day";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", `${formatDate(dateKey)}${dayTasks.length ? `, ${dayTasks.length} task${dayTasks.length === 1 ? "" : "s"}` : ""}`);
    cell.setAttribute("aria-pressed", String(dateKey === selectedDate));
    if (date.getMonth() !== month) cell.classList.add("is-other-month");
    if (dateKey === todayDate) cell.classList.add("is-today");
    if (dateKey === selectedDate) cell.classList.add("is-selected");

    const dayNumber = document.createElement("span");
    dayNumber.className = "day-number";
    dayNumber.textContent = String(date.getDate());
    const indicators = document.createElement("span");
    indicators.className = "day-indicators";
    indicators.setAttribute("aria-hidden", "true");
    dayTasks.slice(0, 3).forEach((task) => {
      const dot = document.createElement("i");
      dot.className = `day-indicator${task.completed ? " is-completed" : ""}`;
      indicators.append(dot);
    });
    cell.append(dayNumber, indicators);
    cell.addEventListener("click", () => {
      selectedDate = dateKey;
      if (date.getMonth() !== displayedMonth.getMonth() || date.getFullYear() !== displayedMonth.getFullYear()) {
        displayedMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      }
      activeFilter = "selected";
      updateFilterButtons();
      render();
    });
    calendarGrid.append(cell);
  }
}

function matchesFilter(task) {
  switch (activeFilter) {
    case "selected": return task.dueDate === selectedDate;
    case "all": return true;
    case "today": return task.dueDate === todayDate;
    case "previous": return task.dueDate < todayDate;
    case "upcoming": return task.dueDate > todayDate;
    case "completed": return task.completed;
    case "pending": return !task.completed;
    case "overdue": return !task.completed && task.dueDate < todayDate;
    default: return task.dueDate === selectedDate;
  }
}

function createTaskCard(task) {
  const status = getTaskStatus(task);
  const card = document.createElement("article");
  card.className = "task-item";
  if (task.completed) card.classList.add("is-completed");
  if (status === "overdue") card.classList.add("is-overdue");

  const completeButton = document.createElement("button");
  completeButton.type = "button";
  completeButton.className = "task-complete";
  completeButton.setAttribute("aria-label", `${task.completed ? "Mark pending" : "Mark complete"}: ${task.title}`);
  completeButton.setAttribute("aria-pressed", String(task.completed));
  completeButton.textContent = task.completed ? "✓" : "";
  completeButton.addEventListener("click", () => toggleTaskCompletion(task.id));

  const taskCopy = document.createElement("div");
  taskCopy.className = "task-copy";

  const title = document.createElement("div");
  title.className = "task-title";
  // Use textContent so a task title is always displayed as text, not HTML.
  title.textContent = task.title;

  const dueDate = document.createElement("div");
  dueDate.className = "task-due";
  const overdueLabel = status === "overdue" ? "Overdue · " : "";
  dueDate.textContent = `${overdueLabel}${formatDate(task.dueDate, { month: "short", day: "numeric", year: "numeric" })}`;
  taskCopy.append(title, dueDate);

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.className = "task-action";
  editButton.setAttribute("aria-label", `Edit ${task.title}`);
  editButton.textContent = "✎";
  editButton.addEventListener("click", () => openTaskDialog(task));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "task-action delete-task";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
  deleteButton.textContent = "×";
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  actions.append(editButton, deleteButton);
  card.append(completeButton, taskCopy, actions);
  return card;
}

function showEmptyTaskMessage() {
  const emptyMessage = document.createElement("div");
  emptyMessage.className = "empty-state";

  const heading = document.createElement("strong");
  const detail = document.createElement("span");

  if (activeFilter === "selected") {
    heading.textContent = "A little breathing room.";
    detail.textContent = "Add a task for this date when you’re ready.";
  } else {
    heading.textContent = "Nothing on this list.";
    detail.textContent = "Try another filter or add a task.";
  }

  emptyMessage.append(heading, detail);
  taskList.append(emptyMessage);
}

function renderTasks() {
  const visibleTasks = tasks.filter(matchesFilter);
  visibleTasks.sort((firstTask, secondTask) => {
    if (firstTask.dueDate !== secondTask.dueDate) {
      return firstTask.dueDate.localeCompare(secondTask.dueDate);
    }
    return firstTask.createdAt.localeCompare(secondTask.createdAt);
  });

  const selectedDateLabel = document.querySelector("#selected-date-label");
  const visibleTaskCount = document.querySelector("#visible-task-count");

  if (activeFilter === "selected") {
    selectedDateLabel.textContent = formatDate(selectedDate);
  } else {
    const filterButton = document.querySelector(`[data-filter="${activeFilter}"]`);
    const taskWord = visibleTasks.length === 1 ? "task" : "tasks";
    selectedDateLabel.textContent = `${filterButton.textContent} · ${visibleTasks.length} ${taskWord}`;
  }

  visibleTaskCount.textContent = String(visibleTasks.length);
  taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    showEmptyTaskMessage();
    return;
  }

  visibleTasks.forEach((task) => {
    taskList.append(createTaskCard(task));
  });
}

function updateTaskCount() {
  let completedCount = 0;
  let pendingCount = 0;
  let overdueCount = 0;

  tasks.forEach((task) => {
    if (task.completed) {
      completedCount += 1;
    } else {
      pendingCount += 1;
      if (task.dueDate < todayDate) overdueCount += 1;
    }
  });

  document.querySelector("#total-count").textContent = String(tasks.length);
  document.querySelector("#completed-count").textContent = String(completedCount);
  document.querySelector("#pending-count").textContent = String(pendingCount);
  document.querySelector("#overdue-count").textContent = String(overdueCount);
}

function updateFilterButtons() {
  document.querySelectorAll(".filter-button").forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function render() {
  renderCalendar();
  updateTaskCount();
  renderTasks();
}

function toggleTaskCompletion(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  render();
}

function resetTaskErrors() {
  document.querySelector("#title-error").textContent = "";
  document.querySelector("#date-error").textContent = "";
  taskTitleInput.setAttribute("aria-invalid", "false");
  taskDateInput.setAttribute("aria-invalid", "false");
}

function openTaskDialog(task = null) {
  editingTaskId = task ? task.id : null;
  document.querySelector("#dialog-title").textContent = task ? "Edit task" : "Add a task";
  document.querySelector("#save-task-button").textContent = task ? "Save changes" : "Save task";
  taskTitleInput.value = task ? task.title : "";
  taskDateInput.value = task ? task.dueDate : selectedDate;
  resetTaskErrors();
  taskDialog.showModal();
  taskTitleInput.focus();
}

function closeTaskDialog() {
  taskDialog.close();
  taskForm.reset();
  resetTaskErrors();
  editingTaskId = null;
}

function createTaskId() {
  if (globalThis.crypto && globalThis.crypto.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addTask(title, dueDate) {
  tasks.push({
    id: createTaskId(),
    title,
    dueDate,
    completed: false,
    createdAt: new Date().toISOString()
  });
}

function updateTask(taskId, title, dueDate) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return false;

  task.title = title;
  task.dueDate = dueDate;
  return true;
}

function saveTask(event) {
  event.preventDefault();
  resetTaskErrors();

  const title = taskTitleInput.value.trim();
  const dueDate = taskDateInput.value;
  let firstInvalidField = null;

  if (!title) {
    document.querySelector("#title-error").textContent = "Enter a title for this task.";
    taskTitleInput.setAttribute("aria-invalid", "true");
    firstInvalidField = taskTitleInput;
  }

  if (!isValidDateKey(dueDate)) {
    document.querySelector("#date-error").textContent = "Choose a valid due date.";
    taskDateInput.setAttribute("aria-invalid", "true");
    if (!firstInvalidField) firstInvalidField = taskDateInput;
  }

  if (firstInvalidField) {
    firstInvalidField.focus();
    return;
  }

  if (editingTaskId) {
    const taskWasUpdated = updateTask(editingTaskId, title, dueDate);
    if (!taskWasUpdated) {
      closeTaskDialog();
      showStorageNotice("That task could not be found. Refresh the page and try again.");
      return;
    }
  } else {
    addTask(title, dueDate);
  }

  selectedDate = dueDate;
  const selectedDateParts = fromDateKey(dueDate);
  displayedMonth = new Date(selectedDateParts.getFullYear(), selectedDateParts.getMonth(), 1);
  activeFilter = "selected";
  updateFilterButtons();
  saveTasks();
  closeTaskDialog();
  render();
}

document.querySelector("#add-task-button").addEventListener("click", () => openTaskDialog());
document.querySelector("#close-dialog").addEventListener("click", closeTaskDialog);
document.querySelector("#cancel-dialog").addEventListener("click", closeTaskDialog);
taskDialog.addEventListener("click", (event) => {
  if (event.target === taskDialog) closeTaskDialog();
});
taskForm.addEventListener("submit", saveTask);

document.querySelector("#previous-month").addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1);
  renderCalendar();
});
document.querySelector("#next-month").addEventListener("click", () => {
  displayedMonth = new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1);
  renderCalendar();
});
document.querySelector("#today-button").addEventListener("click", () => {
  selectedDate = todayDate;
  const todayParts = fromDateKey(todayDate);
  displayedMonth = new Date(todayParts.getFullYear(), todayParts.getMonth(), 1);
  activeFilter = "selected";
  updateFilterButtons();
  render();
});
document.querySelector(".filter-list").addEventListener("click", (event) => {
  const button = event.target.closest(".filter-button");
  if (!button) return;
  activeFilter = button.dataset.filter;
  updateFilterButtons();
  renderTasks();
});

const menuToggle = document.querySelector(".menu-toggle");
const navigationLinks = document.querySelector(".navigation-links");
if (menuToggle && navigationLinks) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    menuToggle.setAttribute("aria-label", isExpanded ? "Open navigation menu" : "Close navigation menu");
    navigationLinks.classList.toggle("is-open", !isExpanded);
  });
  navigationLinks.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      navigationLinks.classList.remove("is-open");
    }
  });
}

tasks = loadTasks();
render();
