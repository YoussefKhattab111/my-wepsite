function loginUser(identifier, password) {
  const users = JSON.parse(localStorage.getItem("microblog_users") || "[]")
  return users.find((user) =>
    (user.email.toLowerCase() === identifier.toLowerCase() || 
     user.username.toLowerCase() === identifier.toLowerCase()) &&
    user.password === password
  )
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `

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

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 5000)

  notification.querySelector(".notification-close").addEventListener("click", () => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  })
}

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = localStorage.getItem("microblog_current_user")
  if (currentUser) {
    window.location.href = "index.html"
    return
  }

  initializeLoginPage()
})

function initializeLoginPage() {
  const loginForm = document.getElementById("loginForm")
  const togglePasswordBtn = document.querySelector(".toggle-password")

  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener("click", togglePasswordVisibility)
  }

  initializeSocialLogin()
}

function handleLogin(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const identifier = formData.get("identifier")
  const password = formData.get("password")

  if (!identifier || !password) {
    showNotification("Please fill in all fields", "error")
    return
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const btnText = submitBtn.querySelector(".btn-text")
  const btnLoading = submitBtn.querySelector(".btn-loading")

  btnText.style.display = "none"
  btnLoading.style.display = "inline-flex"
  submitBtn.disabled = true

  setTimeout(() => {
    try {
      const loggedInUser = loginUser(identifier, password)
      if (loggedInUser) {
        localStorage.setItem("microblog_current_user", JSON.stringify(loggedInUser))
        showNotification("Login successful", "success")
        setTimeout(() => {
          window.location.href = "index.html"
        }, 1000)
      } else {
        throw new Error("Invalid email or password")
      }
    } catch (error) {
      showNotification(error.message, "error")
      btnText.style.display = "inline"
      btnLoading.style.display = "none"
      submitBtn.disabled = false
    }
  }, 1500)
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("password")
  const toggleIcon = document.querySelector(".toggle-password i")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    toggleIcon.className = "fas fa-eye-slash"
  } else {
    passwordInput.type = "password"
    toggleIcon.className = "fas fa-eye"
  }
}

function initializeSocialLogin() {
  const googleBtn = document.querySelector(".btn-google")
  const githubBtn = document.querySelector(".btn-github")

  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      showNotification("Google login not available currently", "info")
    })
  }

  if (githubBtn) {
    githubBtn.addEventListener("click", () => {
      showNotification("GitHub login not available currently", "info")
    })
  }
}
