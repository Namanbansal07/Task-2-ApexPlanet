# TaskFlow

TaskFlow is a responsive, three-module task-planning website built as a vanilla web development project. The separate Home, To-Do List, and Contact modules each own their HTML, CSS, and JavaScript files while sharing consistent branding and navigation.

## Modules and features

- **Home:** Landing page, responsive navigation, project overview, and links into the task planner and contact form.
- **To-Do List:** Month-view calendar, date selection, task creation/editing/completion/deletion, selected-date and seven task filters, and live task counters.
- **Contact:** Six-field contact form with accessible, inline client-side validation. A valid submission displays a local demo confirmation; no personal details are transmitted or stored.

## Technologies

Semantic HTML5, CSS3 (Grid, Flexbox, responsive media queries), and vanilla JavaScript. No frameworks or build tools are required.

## Folder structure

```text
TASK 2/
├── index.html
├── README.md
├── assets/
│   └── images/
│       └── taskflow-mark.svg
├── home/
│   ├── home.html
│   ├── home.css
│   └── home.js
├── todo/
│   ├── todo.html
│   ├── todo.css
│   └── todo.js
└── contact/
    ├── contact.html
    ├── contact.css
    └── contact.js
```

## Run in VS Code

1. Open the `TASK 2` folder in VS Code.
2. Install the **Live Server** extension if it is not already available.
3. Right-click `index.html` and select **Open with Live Server**. The entry page directs to the Home module.
4. Use the navigation bar to switch between modules.

The pages can also be opened directly from a local static web server. No build or package installation step is needed.

## Task persistence

Tasks are saved in the browser's `localStorage` under the `taskflow.tasks.v1` key. This keeps tasks after refreshing the same browser on the same origin. Dates use `YYYY-MM-DD` calendar-date strings, and invalid saved data is reported and cleared rather than being used. Clearing browser storage or using a different browser/origin removes access to those tasks. Contact form values are never stored.

## How the main logic works

- **Calendar:** The selected day is saved as a `YYYY-MM-DD` string. Clicking a day updates `selectedDate`, and the task panel shows tasks with the same due date. The calendar builds its day cells from the local year and month, so it does not turn a due date into the previous or next day because of a time-zone conversion.
- **Tasks:** Adding a task makes an object with a title, due date, completion state, and ID. Editing updates the matching task by ID. Completing changes its `completed` value, while deleting removes it from the task array. The calendar, counters, and task list are then rendered again from that array.
- **Saving:** `saveTasks()` converts the task array to JSON and stores it in `localStorage`. When the page opens, `loadTasks()` reads the JSON, checks its shape, and restores the list.
- **Contact form:** The submit event trims non-password values, checks each field, shows an inline message for invalid entries, and focuses the first invalid field. Passwords must be 8–128 characters, and the verification value must match exactly. Correcting an invalid value clears its error. Valid details show an in-browser confirmation only; they are not sent or saved.
- **HTML, CSS, and JavaScript:** Each module's HTML provides its page structure and controls, its CSS styles only that module, and its JavaScript responds to the controls and updates the page. The pages connect through regular relative navigation links.

## Contact form validation

- **Full Name:** Required; accepts Unicode letters and combining marks with spaces, apostrophes, or hyphens; rejects digits and other characters.
- **Email Address:** Required; surrounding whitespace is trimmed and the address must have a reasonable local-part, domain, and suffix.
- **Contact Number:** Required; accepts a 10-digit Indian mobile number starting with 6–9, optionally prefixed by `+91` and an optional space or hyphen.
- **Address:** Required; whitespace-only input is rejected, and trimmed length must be 5–250 characters. Common punctuation, house numbers, and postal codes are accepted.
- **Password:** Required; must contain 8–128 characters. The value is validated without trimming.
- **Verify Password:** Required; must match the password exactly.

Validation is client-side only. The form does not send or retain contact data.

## Testing

There is no test runner or package manifest in this static project. For a manual smoke test:

1. Open `index.html` using Live Server and follow each navigation link.
2. Use the responsive device toolbar at approximately 375px, 768px, 1024px, and 1440px widths; check the mobile menu and confirm there is no horizontal overflow.
3. In To-Do List, navigate months across year boundaries, use Today, add/edit/complete/delete tasks on different dates, test each filter, and refresh to confirm persistence.
4. In Contact, submit empty and malformed values, correct them, submit valid values, and use Reset to clear the values and inline states.
5. Use keyboard navigation to check focus visibility and the task dialog controls.

## Screenshots

Add project screenshots here after capturing the Home, To-Do List, and Contact pages at desktop and mobile sizes.

## Known limitations and future improvements

- Tasks are stored only in the current browser's local storage; there is no account sync or server backup.
- Contact validation confirms only the entered format; no backend or email delivery is connected.
- Future improvements could include task search, recurring reminders, accessible export/import, and automated browser tests.
