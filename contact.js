const form = document.querySelector("#contact-form");
const fields = {
  fullName: document.querySelector("#full-name"),
  email: document.querySelector("#email"),
  phone: document.querySelector("#phone"),
  address: document.querySelector("#address"),
  password: document.querySelector("#password"),
  verifyPassword: document.querySelector("#verify-password")
};
const successMessage = document.querySelector("#success-message");
const errors = {
  fullName: document.querySelector("#name-error"),
  email: document.querySelector("#email-error"),
  phone: document.querySelector("#phone-error"),
  address: document.querySelector("#address-error"),
  password: document.querySelector("#password-error"),
  verifyPassword: document.querySelector("#verify-password-error")
};
const emailPattern = /^[A-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)*\.[A-Z]{2,}$/i;

function validateName(value) {
  // Unicode letter matching also allows names written in non-English alphabets.
  return /^[\p{L}\p{M}]+(?:[ '\u2019-][\p{L}\p{M}]+)*$/u.test(value);
}

function validateEmail(value) {
  return value.length <= 254 && emailPattern.test(value);
}

function validateContactNumber(value) {
  return /^(?:\+91[\s-]?)?[6-9]\d{9}$/.test(value);
}

function validateAddress(value) {
  return value.length >= 5 && value.length <= 250;
}

function validatePassword(value) {
  return value.length >= 8 && value.length <= 128;
}

function showErrorMessage(name, message) {
  errors[name].textContent = message;
  fields[name].setAttribute("aria-invalid", String(Boolean(message)));
}

function validateField(name) {
  const field = fields[name];
  const value = name === "password" || name === "verifyPassword" ? field.value : field.value.trim();
  let message = "";

  if (!value) {
    message = `${field.labels[0].textContent} is required.`;
  } else if (name === "fullName" && !validateName(value)) {
    message = "Use letters, spaces, apostrophes, or hyphens only.";
  } else if (name === "email" && !validateEmail(value)) {
    message = "Enter a valid email address, such as name@example.com.";
  } else if (name === "phone" && !validateContactNumber(value)) {
    message = "Enter a valid 10-digit Indian mobile number, optionally with +91.";
  } else if (name === "address" && !validateAddress(value)) {
    message = "Address must be between 5 and 250 characters.";
  } else if (name === "password" && !validatePassword(value)) {
    message = "Password must be between 8 and 128 characters.";
  } else if (name === "verifyPassword" && value !== fields.password.value) {
    message = "Passwords do not match.";
  }

  showErrorMessage(name, message);
  return message === "";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  successMessage.hidden = true;
  let firstInvalidField = null;

  // Check every field and remember the first one that needs attention.
  Object.keys(fields).forEach((name) => {
    const isValid = validateField(name);
    if (!isValid && !firstInvalidField) firstInvalidField = fields[name];
  });

  if (firstInvalidField) {
    firstInvalidField.focus();
    return;
  }

  fields.fullName.value = fields.fullName.value.trim();
  fields.email.value = fields.email.value.trim();
  successMessage.textContent = "Thanks! Your details look good. This demo does not send them to a server.";
  successMessage.hidden = false;
});

Object.entries(fields).forEach(([name, field]) => {
  field.addEventListener("input", () => {
    if (field.getAttribute("aria-invalid") === "true") validateField(name);
    if (name === "password" && fields.verifyPassword.value) {
      validateField("verifyPassword");
    }
    successMessage.hidden = true;
  });
  field.addEventListener("blur", () => {
    const hasValue = name === "password" || name === "verifyPassword" ? field.value : field.value.trim();
    if (hasValue) {
      validateField(name);
    }
  });
});

form.addEventListener("reset", () => {
  Object.keys(fields).forEach((name) => showErrorMessage(name, ""));
  successMessage.textContent = "";
  successMessage.hidden = true;
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
