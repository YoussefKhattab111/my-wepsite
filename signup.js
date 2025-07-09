// Signup page functionality

// Declare debounce function
function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(this, args), wait)
  }
}

// Declare showNotification function
function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `

  // Add notification styles if not exist
  if (!document.querySelector(".notification-styles")) {
    const style = document.createElement("style")
    style.className = "notification-styles"
    style.textContent = `
      .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.5rem;
        padding: 1rem;
        color: white;
        z-index: 10000;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
      }
      .notification-success { border-color: #10b981; }
      .notification-error { border-color: #ef4444; }
      .notification-info { border-color: #3b82f6; }
      .notification-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
      }
      .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 1.2rem;
      }
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 5000)

  // Manual close
  notification.querySelector(".notification-close").addEventListener("click", () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  })
}

// Declare isValidEmail function
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Declare validatePassword function
function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const isValid = Object.values(requirements).every((req) => req)

  return { isValid, requirements }
}

// Declare isUsernameAvailable function
function isUsernameAvailable(username) {
  const users = JSON.parse(localStorage.getItem("microblog_users") || "[]")
  return !users.some((user) => user.username.toLowerCase() === username.toLowerCase())
}

// Declare isEmailAvailable function
function isEmailAvailable(email) {
  const users = JSON.parse(localStorage.getItem("microblog_users") || "[]")
  return !users.some((user) => user.email.toLowerCase() === email.toLowerCase())
}

// Declare generateId function
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

document.addEventListener("DOMContentLoaded", () => {
  // Check if already logged in
  const currentUser = localStorage.getItem("microblog_current_user")
  if (currentUser) {
    window.location.href = "index.html"
    return
  }

  initializeSignupPage()
})

function initializeSignupPage() {
  const signupForm = document.getElementById("signupForm")
  const passwordInput = document.getElementById("password")
  const confirmPasswordInput = document.getElementById("confirmPassword")
  const usernameInput = document.getElementById("username")
  if (usernameInput) {
    usernameInput.addEventListener("input", function () {
      // فقط الحروف الإنجليزية، الأرقام، والرموز المسموحة
      this.value = this.value.replace(/[^A-Za-z0-9_.-]/g, '')

      // لا يبدأ إلا بحرف إنجليزي
      this.value = this.value.replace(/^[^A-Za-z]+/, '')

      // لا يسمح بوجود رمزين متتاليين
      this.value = this.value.replace(/([_.-]){2,}/g, '$1')         // لا رمزين متكررين
      this.value = this.value.replace(/([_.-])([_.-])/g, '$1')       // لا رمزين مختلفين متتاليين
    })
  }
  const togglePasswordBtns = document.querySelectorAll(".toggle-password")

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignup)
  }

  if (passwordInput) {
    passwordInput.addEventListener("input", validatePasswordRequirements)
  }

  if (confirmPasswordInput) {
    confirmPasswordInput.addEventListener("input", validatePasswordMatch)
  }

  if (usernameInput) {
    usernameInput.addEventListener("input", debounce(checkUsernameAvailability, 500))
  }

  togglePasswordBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      togglePasswordVisibility(this)
    })
  })

  // Social signup buttons (demo only)
  initializeSocialSignup()
}

function handleSignup(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const userData = {
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  }

  // Validate inputs
  if (!validateSignupForm(userData)) {
    return
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const btnText = submitBtn.querySelector(".btn-text")
  const btnLoading = submitBtn.querySelector(".btn-loading")

  // Show loading state
  btnText.style.display = "none"
  btnLoading.style.display = "inline-flex"
  submitBtn.disabled = true

  // Simulate API call delay
  setTimeout(() => {
    try {
      const newUser = registerUser(userData)
      localStorage.setItem("microblog_current_user", JSON.stringify(newUser))

      showNotification("Account created successfully", "success")

      // Redirect to home page
      setTimeout(() => {
        window.location.href = "index.html"
      }, 1000)
    } catch (error) {
      showNotification(error.message, "error")

      // Reset button state
      btnText.style.display = "inline"
      btnLoading.style.display = "none"
      submitBtn.disabled = false
    }
  }, 2000)
}

function validateSignupForm(userData) {
  // Check required fields
  const requiredFields = ["firstName", "lastName", "username", "email", "password", "confirmPassword"]
  for (const field of requiredFields) {
    if (!userData[field] || !userData[field].trim()) {
      showNotification("Please fill in all required fields", "error")
      return false
    }
  }

  // Validate email
  if (!isValidEmail(userData.email)) {
    showNotification("Please enter a valid email address", "error")
    return false
  }

  // Validate username
  if (userData.username.length < 3) {
    showNotification("Username must be at least 3 characters long", "error")
    return false
  }

  if (!/^[a-zA-Z0-9_]+$/.test(userData.username)) {
    showNotification("Username can only contain letters, numbers, and underscores", "error")
    return false
  }

  // Validate password
  const passwordValidation = validatePassword(userData.password)
  if (!passwordValidation.isValid) {
    showNotification("Password does not meet requirements", "error")
    return false
  }

  // Check password match
  if (userData.password !== userData.confirmPassword) {
    showNotification("Passwords do not match", "error")
    return false
  }

  // Check username availability
  if (!isUsernameAvailable(userData.username)) {
    showNotification("Username is already taken", "error")
    return false
  }

  // Check email availability
  if (!isEmailAvailable(userData.email)) {
    showNotification("Email is already registered", "error")
    return false
  }

  return true
}

function registerUser(userData) {
  const users = JSON.parse(localStorage.getItem("microblog_users") || "[]")

  const newUser = {
    id: generateId(),
    firstName: userData.firstName,
    lastName: userData.lastName,
    name: `${userData.firstName} ${userData.lastName}`,
    username: userData.username,
    email: userData.email,
    password: userData.password,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.firstName + " " + userData.lastName)}&background=a855f7&color=fff&size=200`,
    bio: "",
    location: "",
    website: "",
    joinDate: new Date().toISOString(),
    followers: [],
    following: [],
  }

  users.push(newUser)
  localStorage.setItem("microblog_users", JSON.stringify(users))

  return newUser
}

function validatePasswordRequirements() {
  const password = document.getElementById("password").value
  const validation = validatePassword(password)

  // Update requirement indicators
  Object.keys(validation.requirements).forEach((requirement) => {
    const element = document.querySelector(`[data-requirement="${requirement}"]`)
    if (element) {
      const icon = element.querySelector("i")
      if (validation.requirements[requirement]) {
        element.classList.add("valid")
        icon.className = "fas fa-check"
      } else {
        element.classList.remove("valid")
        icon.className = "fas fa-times"
      }
    }
  })

  // Update submit button state
  updateSubmitButtonState()
}

function validatePasswordMatch() {
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const matchIndicator = document.querySelector(".password-match")

  if (confirmPassword.length === 0) {
    matchIndicator.innerHTML = ""
    return
  }

  const checkIcon = matchIndicator.querySelector(".fa-check")
  const timesIcon = matchIndicator.querySelector(".fa-times")

  if (password === confirmPassword) {
    checkIcon.style.display = "inline"
    timesIcon.style.display = "none"
  } else {
    checkIcon.style.display = "none"
    timesIcon.style.display = "inline"
  }

  updateSubmitButtonState()
}

function checkUsernameAvailability() {
  const username = document.getElementById("username").value.trim()
  const statusContainer = document.querySelector(".username-status")
  const feedbackContainer = document.querySelector(".username-feedback")

  if (username.length < 3) {
    statusContainer.innerHTML = ""
    feedbackContainer.innerHTML = ""
    updateSubmitButtonState()
    return
  }

  // Show loading
  statusContainer.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'

  // Simulate API call
  setTimeout(() => {
    const isAvailable = isUsernameAvailable(username)

    if (isAvailable) {
      statusContainer.innerHTML = '<i class="fas fa-check text-success"></i>'
      feedbackContainer.innerHTML = '<span class="text-success">Username is available</span>'
    } else {
      statusContainer.innerHTML = '<i class="fas fa-times text-error"></i>'
      feedbackContainer.innerHTML = '<span class="text-error">Username is already taken</span>'
    }

    updateSubmitButtonState()
  }, 500)
}

function updateSubmitButtonState() {
  const submitBtn = document.querySelector('button[type="submit"]')
  const password = document.getElementById("password").value
  const confirmPassword = document.getElementById("confirmPassword").value
  const username = document.getElementById("username").value

  const passwordValidation = validatePassword(password)
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0
  const usernameValid = username.length >= 3 && isUsernameAvailable(username)

  const isFormValid = passwordValidation.isValid && passwordsMatch && usernameValid

  submitBtn.disabled = !isFormValid
}

function togglePasswordVisibility(button) {
  const passwordInput = button.parentNode.querySelector("input")
  const icon = button.querySelector("i")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    icon.className = "fas fa-eye-slash"
  } else {
    passwordInput.type = "password"
    icon.className = "fas fa-eye"
  }
}

function initializeSocialSignup() {
  const googleBtn = document.querySelector(".btn-google")
  const githubBtn = document.querySelector(".btn-github")

  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      showNotification("Google signup not available currently", "info")
    })
  }

  if (githubBtn) {
    githubBtn.addEventListener("click", () => {
      showNotification("GitHub signup not available currently", "info")
    })
  }
}
