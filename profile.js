// Profile page functionality - Enhanced with Follow Button

let currentUser = null
let users = []
let posts = []
let profileUser = null

document.addEventListener("DOMContentLoaded", () => {
  initializeProfilePage()
})

function initializeProfilePage() {
  loadUsersFromStorage()
  loadPostsFromStorage()
  checkAuthStatus()

  if (!currentUser) {
    window.location.href = "login.html"
    return
  }

  loadProfileData()
  initializeProfileTabs()
  initializeEditProfile()
  initializeEventListeners()
  initializeSearch()
}

function loadUsersFromStorage() {
  const savedUsers = localStorage.getItem("microblog_users")
  if (savedUsers) {
    users = JSON.parse(savedUsers)
  }
}

function loadPostsFromStorage() {
  const savedPosts = localStorage.getItem("microblog_posts")
  if (savedPosts) {
    posts = JSON.parse(savedPosts)
  }
}

function checkAuthStatus() {
  const savedUser = localStorage.getItem("microblog_current_user")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
  }
}

function loadProfileData() {
  const urlParams = new URLSearchParams(window.location.search)
  const userId = urlParams.get("user")

  if (userId && userId !== currentUser.id) {
    // Viewing another user's profile
    profileUser = getUserById(userId)
    if (!profileUser) {
      showNotification("User not found", "error")
      window.location.href = "index.html"
      return
    }

    // Hide edit button and show follow button for other users' profiles
    const editBtn = document.getElementById("editProfileBtn")
    if (editBtn) editBtn.style.display = "none"

    // Add follow button
    addFollowButton()
  } else {
    // Viewing own profile
    profileUser = currentUser
  }

  updateProfileUI(profileUser)
  loadUserPosts(profileUser.id)
}

function addFollowButton() {
  const profileActions = document.querySelector(".profile-actions")
  if (!profileActions) return

  const isFollowing = currentUser.following && currentUser.following.includes(profileUser.id)

  const followBtn = document.createElement("button")
  followBtn.id = "followProfileBtn"
  followBtn.className = `btn ${isFollowing ? "btn-secondary following" : "btn-primary"}`
  followBtn.innerHTML = `
    <i class="fas ${isFollowing ? "fa-user-check" : "fa-user-plus"}"></i>
    ${isFollowing ? "Following" : "Follow"}
  `

  followBtn.addEventListener("click", () => toggleFollowProfile())

  profileActions.appendChild(followBtn)
}

function toggleFollowProfile() {
  if (!currentUser || !profileUser) return

  const isFollowing = currentUser.following && currentUser.following.includes(profileUser.id)
  const followBtn = document.getElementById("followProfileBtn")

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter((id) => id !== profileUser.id)
    profileUser.followers = profileUser.followers.filter((id) => id !== currentUser.id)

    followBtn.className = "btn btn-primary"
    followBtn.innerHTML = '<i class="fas fa-user-plus"></i> Follow'
    showNotification("Unfollowed successfully", "success")
  } else {
    // Follow
    if (!currentUser.following) currentUser.following = []
    if (!profileUser.followers) profileUser.followers = []

    currentUser.following.push(profileUser.id)
    profileUser.followers.push(currentUser.id)

    followBtn.className = "btn btn-secondary following"
    followBtn.innerHTML = '<i class="fas fa-user-check"></i> Following'
    showNotification("Following successfully", "success")
  }

  // Update storage
  saveUsersToStorage()
  localStorage.setItem("microblog_current_user", JSON.stringify(currentUser))

  // Update profile stats
  updateProfileUI(profileUser)
}

function updateProfileUI(user) {
  // Update profile header
  const profileCover = document.getElementById("profileCover")
  const profileAvatar = document.getElementById("profileAvatar")
  const profileName = document.getElementById("profileName")
  const profileUsername = document.getElementById("profileUsername")
  const profileBio = document.getElementById("profileBio")

  if (profileCover) profileCover.src = user.coverImage
  if (profileAvatar) profileAvatar.src = user.avatar
  if (profileName) profileName.textContent = user.name
  if (profileUsername) profileUsername.textContent = `@${user.username}`
  if (profileBio) profileBio.textContent = user.bio || "No bio available"

  // Update meta information
  const locationElement = document.getElementById("profileLocation")
  const websiteElement = document.getElementById("profileWebsite")
  const joinDateElement = document.getElementById("profileJoinDate")

  if (locationElement) {
    if (user.location) {
      locationElement.style.display = "inline-flex"
      const span = locationElement.querySelector("span")
      if (span) span.textContent = user.location
    } else {
      locationElement.style.display = "none"
    }
  }

  if (websiteElement) {
    if (user.website) {
      websiteElement.style.display = "inline-flex"
      const link = websiteElement.querySelector("a")
      if (link) {
        link.href = user.website
        link.textContent = user.website.replace(/^https?:\/\//, "")
      }
    } else {
      websiteElement.style.display = "none"
    }
  }

  if (joinDateElement) {
    const span = joinDateElement.querySelector("span")
    if (span) {
      span.textContent = `Joined ${new Date(user.joinDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`
    }
  }

  // Update stats
  const postsCount = document.getElementById("postsCount")
  const followersCount = document.getElementById("followersCount")
  const followingCount = document.getElementById("followingCount")

  const userPosts = posts.filter((post) => post.userId === user.id)

  if (postsCount) postsCount.textContent = formatNumber(userPosts.length)
  if (followersCount) followersCount.textContent = formatNumber((user.followers || []).length)
  if (followingCount) followingCount.textContent = formatNumber((user.following || []).length)
}


function loadUserPosts(userId) {
  const userPosts = posts.filter((post) => post.userId === userId)
  const postsContainer = document.getElementById("userPosts")

  if (!postsContainer) return

  if (userPosts.length === 0) {
    postsContainer.innerHTML = `
            <div class="text-center p-4">
                <h3>No posts yet</h3>
                <p style="color: rgba(255, 255, 255, 0.6);">No posts have been published yet</p>
            </div>
        `
    return
  }

  // Sort posts by date (newest first)
  const sortedPosts = userPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  postsContainer.innerHTML = sortedPosts.map((post) => createPostHTML(post)).join("")
}

function createPostHTML(post) {
  const user = getUserById(post.userId)
  if (!user) return ""

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false
  const isOwnPost = currentUser ? post.userId === currentUser.id : false

  const imagesHTML =
    post.images && post.images.length > 0
      ? `
        <div class="post-images ${getImageGridClass(post.images.length)}">
            ${post.images
              .map(
                (img, index) => `
                <img src="${img}" alt="Post Image" class="post-image" onclick="openImageViewer('${post.id}', ${index})">
            `,
              )
              .join("")}
        </div>
    `
      : ""

  // Post options menu for own posts
  const postOptionsHTML = isOwnPost
    ? `
    <div class="post-options">
      <button class="post-options-btn" onclick="togglePostOptions('${post.id}')">
        <i class="fas fa-ellipsis-h"></i>
      </button>
      <div class="post-options-menu" id="options-${post.id}" style="display: none;">
        <button onclick="editPost('${post.id}')" class="option-item">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button onclick="deletePost('${post.id}')" class="option-item delete">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `
    : ""

  return `
        <div class="post fade-in" data-post-id="${post.id}">
            <div class="post-header">
                <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
                <div class="user-info">
                    <h4>${user.name}</h4>
                    <p class="username">@${user.username}</p>
                </div>
                <span class="post-time">${timeAgo(post.createdAt)}</span>
                ${postOptionsHTML}
            </div>
            <div class="post-content">
                ${post.content}
            </div>
            ${imagesHTML}
            <div class="post-actions">
                <button class="action-btn ${isLiked ? "liked" : ""}" onclick="toggleLike('${post.id}')">
                    <i class="fas fa-heart"></i>
                    <span>${formatNumber(post.likes.length)}</span>
                </button>
                <button class="action-btn" onclick="openPostModal('${post.id}')">
                    <i class="fas fa-comment"></i>
                    <span>${formatNumber(post.comments.length)}</span>
                </button>
                <button class="action-btn" onclick="sharePost('${post.id}')">
                    <i class="fas fa-share"></i>
                    <span>${formatNumber(post.shares || 0)}</span>
                </button>
            </div>
        </div>
    `
}

// Toggle post options menu
function togglePostOptions(postId) {
  const menu = document.getElementById(`options-${postId}`)
  if (menu) {
    menu.style.display = menu.style.display === "none" ? "block" : "none"
  }

  // Close other open menus
  document.querySelectorAll(".post-options-menu").forEach((otherMenu) => {
    if (otherMenu.id !== `options-${postId}`) {
      otherMenu.style.display = "none"
    }
  })
}

// Edit post function
function editPost(postId) {
  const post = posts.find((p) => p.id === postId)
  if (!post || post.userId !== currentUser.id) {
    showNotification("You can only edit your own posts", "error")
    return
  }

  const newContent = prompt("Edit your post:", post.content)
  if (newContent !== null && newContent.trim() !== "") {
    post.content = newContent.trim()
    savePostsToStorage()
    loadUserPosts(profileUser.id)
    showNotification("Post updated successfully", "success")
  }

  // Hide options menu
  togglePostOptions(postId)
}

// Delete post function
function deletePost(postId) {
  const post = posts.find((p) => p.id === postId)
  if (!post || post.userId !== currentUser.id) {
    showNotification("You can only delete your own posts", "error")
    return
  }

  if (confirm("Are you sure you want to delete this post?")) {
    posts = posts.filter((p) => p.id !== postId)
    savePostsToStorage()
    loadUserPosts(profileUser.id)
    updateProfileUI(profileUser) // Update post count
    showNotification("Post deleted successfully", "success")
  }

  // Hide options menu
  togglePostOptions(postId)
}

function initializeProfileTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn")
  const tabPanes = document.querySelectorAll(".tab-pane")

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", function () {
      const tabName = this.dataset.tab

      // Update active tab button
      tabBtns.forEach((b) => b.classList.remove("active"))
      this.classList.add("active")

      // Update active tab pane
      tabPanes.forEach((pane) => pane.classList.remove("active"))
      const targetPane = document.getElementById(`${tabName}Tab`)
      if (targetPane) targetPane.classList.add("active")

      // Load tab content
      loadTabContent(tabName)
    })
  })
}

function loadTabContent(tabName) {
  switch (tabName) {
    case "posts":
      loadUserPosts(profileUser.id)
      break
    case "followers":
      loadFollowers(profileUser)
      break
    case "following":
      loadFollowing(profileUser)
      break
  }
}

function loadFollowers(user) {
  const followersContainer = document.getElementById("followersList")
  if (!followersContainer) return

  const followers = (user.followers || []).map((id) => getUserById(id)).filter(Boolean)

  if (followers.length === 0) {
    followersContainer.innerHTML = `
            <div class="text-center p-4">
                <h3>No followers</h3>
                <p style="color: rgba(255, 255, 255, 0.6);">No one is following this user yet</p>
            </div>
        `
    return
  }

  followersContainer.innerHTML = followers
    .map(
      (follower) => `
        <div class="user-card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 0.5rem; margin-bottom: 1rem;">
            <img src="${follower.avatar}" alt="${follower.name}" class="user-avatar">
            <div class="user-info" style="flex: 1;">
                <h4>${follower.name}</h4>
                <p>@${follower.username}</p>
                <p class="bio" style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">${follower.bio || "No bio available"}</p>
            </div>
            <button class="btn btn-primary" onclick="goToProfile('${follower.id}')" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                View Profile
            </button>
        </div>
    `,
    )
    .join("")
}

function loadFollowing(user) {
  const followingContainer = document.getElementById("followingList")
  if (!followingContainer) return

  const following = (user.following || []).map((id) => getUserById(id)).filter(Boolean)

  if (following.length === 0) {
    followingContainer.innerHTML = `
            <div class="text-center p-4">
                <h3>Not following anyone</h3>
                <p style="color: rgba(255, 255, 255, 0.6);">This user is not following anyone yet</p>
            </div>
        `
    return
  }

  followingContainer.innerHTML = following
    .map(
      (followedUser) => `
        <div class="user-card" style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: rgba(255, 255, 255, 0.1); border-radius: 0.5rem; margin-bottom: 1rem;">
            <img src="${followedUser.avatar}" alt="${followedUser.name}" class="user-avatar">
            <div class="user-info" style="flex: 1;">
                <h4>${followedUser.name}</h4>
                <p>@${followedUser.username}</p>
                <p class="bio" style="color: rgba(255, 255, 255, 0.6); font-size: 0.9rem;">${followedUser.bio || "No bio available"}</p>
            </div>
            <button class="btn btn-primary" onclick="goToProfile('${followedUser.id}')" style="padding: 0.5rem 1rem; background: linear-gradient(135deg, #a855f7, #ec4899); color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                View Profile
            </button>
        </div>
    `,
    )
    .join("")
}

function initializeEditProfile() {
  const editProfileBtn = document.getElementById("editProfileBtn")
  const editProfileForm = document.getElementById("editProfileForm")
  const bioTextarea = document.getElementById("editBio")
  const bioCharCount = document.getElementById("bioCharCount")

  if (editProfileBtn) {
    editProfileBtn.addEventListener("click", () => {
      openEditProfileModal()
    })
  }

  if (editProfileForm) {
    editProfileForm.addEventListener("submit", handleEditProfile)
  }

  if (bioTextarea && bioCharCount) {
    bioTextarea.addEventListener("input", () => {
      const count = bioTextarea.value.length
      bioCharCount.textContent = count
      bioCharCount.style.color = count > 160 ? "#ef4444" : "rgba(255, 255, 255, 0.6)"
    })
  }

  // Image upload handlers
  const coverImageInput = document.getElementById("coverImageInput")
  const avatarImageInput = document.getElementById("avatarImageInput")

  if (coverImageInput) {
    coverImageInput.addEventListener("change", handleCoverImageUpload)
  }

  if (avatarImageInput) {
    avatarImageInput.addEventListener("change", handleAvatarImageUpload)
  }
}

function openEditProfileModal() {
  // Populate form with current user data
  const editName = document.getElementById("editName")
  const editBio = document.getElementById("editBio")
  const editLocation = document.getElementById("editLocation")
  const editWebsite = document.getElementById("editWebsite")
  const editCoverPreview = document.getElementById("editCoverPreview")
  const editAvatarPreview = document.getElementById("editAvatarPreview")
  const bioCharCount = document.getElementById("bioCharCount")

  if (editName) editName.value = currentUser.name
  if (editBio) {
    editBio.value = currentUser.bio || ""
    if (bioCharCount) bioCharCount.textContent = editBio.value.length
  }
  if (editLocation) editLocation.value = currentUser.location || ""
  if (editWebsite) editWebsite.value = currentUser.website || ""
  if (editCoverPreview)
    editCoverPreview.src = currentUser.coverImage || "https://via.placeholder.com/400x150/6366f1/ffffff?text=Cover"
  if (editAvatarPreview) editAvatarPreview.src = currentUser.avatar

  openModal("editProfileModal")
}

function handleEditProfile(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const updatedData = {
    name: formData.get("name"),
    bio: formData.get("bio"),
    location: formData.get("location"),
    website: formData.get("website"),
  }

  // Validate bio length
  if (updatedData.bio && updatedData.bio.length > 160) {
    showNotification("Bio must be 160 characters or less", "error")
    return
  }

  // Validate website URL
  if (updatedData.website && !isValidURL(updatedData.website)) {
    showNotification("Please enter a valid website URL", "error")
    return
  }

  // Update user data
  Object.assign(currentUser, updatedData)

  // Update in users array
  const userIndex = users.findIndex((u) => u.id === currentUser.id)
  if (userIndex !== -1) {
    users[userIndex] = currentUser
  }

  // Save to storage
  saveUsersToStorage()
  localStorage.setItem("microblog_current_user", JSON.stringify(currentUser))

  // Update UI
  updateProfileUI(currentUser)

  closeModal("editProfileModal")
  showNotification("Profile updated successfully", "success")
}

function handleCoverImageUpload(e) {
  const file = e.target.files[0]
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const editCoverPreview = document.getElementById("editCoverPreview")
      if (editCoverPreview) {
        editCoverPreview.src = e.target.result
        currentUser.coverImage = e.target.result
      }
    }
    reader.readAsDataURL(file)
  }
}


function handleAvatarImageUpload(e) {
  const file = e.target.files[0]
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const editAvatarPreview = document.getElementById("editAvatarPreview")
      if (editAvatarPreview) {
        editAvatarPreview.src = e.target.result
        currentUser.avatar = e.target.result
      }
    }
    reader.readAsDataURL(file)
  }
}

function initializeEventListeners() {
  // Logout button
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout)
  }

  // FAB button
  const fabBtn = document.getElementById("fabBtn")
  if (fabBtn) {
    fabBtn.addEventListener("click", () => {
      window.location.href = "index.html"
    })
  }

  // Modal close buttons
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("close")) {
      const modal = e.target.closest(".modal")
      if (modal) {
        closeModal(modal.id)
      }
    }
  })

  // Close modals when clicking outside
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal")) {
      closeModal(e.target.id)
    }
  })
}

function initializeSearch() {
  const searchInput = document.getElementById("searchInput")
  const searchResults = document.getElementById("searchResults")

  if (!searchInput || !searchResults) return

  searchInput.addEventListener(
    "input",
    debounce((e) => {
      const query = e.target.value.trim()

      if (query.length < 2) {
        searchResults.style.display = "none"
        return
      }

      const results = searchUsers(query)
      displaySearchResults(results, searchResults)
    }, 300),
  )

  // Hide search results when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
      searchResults.style.display = "none"
    }
  })
}

// Utility functions
function getUserById(userId) {
  return users.find((user) => user.id === userId)
}

function getImageGridClass(count) {
  switch (count) {
    case 1:
      return "single"
    case 2:
      return "double"
    case 3:
      return "triple"
    case 4:
      return "quad"
    default:
      return "quad"
  }
}

function timeAgo(date) {
  const now = new Date()
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000)

  if (diffInSeconds < 60) return "now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return new Date(date).toLocaleDateString("en-US")
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
  if (num >= 1000) return (num / 1000).toFixed(1) + "K"
  return num.toString()
}

function isValidURL(string) {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function searchUsers(query) {
  const searchTerm = query.toLowerCase()
  return users
    .filter((user) => user.name.toLowerCase().includes(searchTerm) || user.username.toLowerCase().includes(searchTerm))
    .slice(0, 10)
}

function displaySearchResults(results, container) {
  if (results.length === 0) {
    container.innerHTML = '<div class="search-result-item">No results found</div>'
  } else {
    container.innerHTML = results
      .map(
        (user) => `
            <div class="search-result-item" onclick="goToProfile('${user.id}')">
                <img src="${user.avatar}" alt="${user.name}">
                <div class="search-result-info">
                    <h4>${user.name}</h4>
                    <p>@${user.username}</p>
                </div>
            </div>
        `,
      )
      .join("")
  }
  container.style.display = "block"
}

function toggleLike(postId) {
  if (!currentUser) {
    showNotification("Please login first", "error")
    return
  }

  const post = posts.find((p) => p.id === postId)
  if (!post) return

  const likeIndex = post.likes.indexOf(currentUser.id)

  if (likeIndex === -1) {
    post.likes.push(currentUser.id)
  } else {
    post.likes.splice(likeIndex, 1)
  }

  savePostsToStorage()

  // Update UI
  const postElement = document.querySelector(`[data-post-id="${postId}"]`)
  if (postElement) {
    const likeBtn = postElement.querySelector(".action-btn")
    const likeCount = likeBtn.querySelector("span")

    if (post.likes.includes(currentUser.id)) {
      likeBtn.classList.add("liked")
    } else {
      likeBtn.classList.remove("liked")
    }

    likeCount.textContent = formatNumber(post.likes.length)
  }
}

function openPostModal(postId) {
  // Redirect to main page with post modal
  window.location.href = `index.html?post=${postId}`
}

function sharePost(postId) {
  const post = posts.find((p) => p.id === postId)
  if (!post) return

  post.shares = (post.shares || 0) + 1
  savePostsToStorage()

  // Copy post URL to clipboard
  const postUrl = `${window.location.origin}/?post=${postId}`

  if (navigator.clipboard) {
    navigator.clipboard.writeText(postUrl).then(() => {
      showNotification("Post link copied to clipboard", "success")
    })
  } else {
    showNotification("Post shared successfully", "success")
  }

  // Update UI
  const postElement = document.querySelector(`[data-post-id="${postId}"]`)
  if (postElement) {
    const shareBtn = postElement.querySelectorAll(".action-btn")[2]
    const shareCount = shareBtn.querySelector("span")
    shareCount.textContent = formatNumber(post.shares)
  }
}

function openImageViewer(postId, imageIndex) {
  const post = posts.find((p) => p.id === postId)
  if (!post || !post.images[imageIndex]) return

  const modal = document.createElement("div")
  modal.className = "modal"
  modal.style.display = "block"
  modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3>View Image</h3>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body text-center">
                <img src="${post.images[imageIndex]}" alt="Post Image" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
            </div>
        </div>
    `

  document.body.appendChild(modal)

  // Close modal events
  modal.querySelector(".close").onclick = () => document.body.removeChild(modal)
  modal.onclick = (e) => {
    if (e.target === modal) document.body.removeChild(modal)
  }
}

function goToProfile(userId) {
  if (userId === currentUser.id) {
    window.location.href = "profile.html"
  } else {
    window.location.href = `profile.html?user=${userId}`
  }
}

function logout() {
  currentUser = null
  localStorage.removeItem("microb log_current_user")
  showNotification("Logged out successfully", "success")
  window.location.href = "login.html"
}

function saveUsersToStorage() {
  localStorage.setItem("microblog_users", JSON.stringify(users))
}

function savePostsToStorage() {
  localStorage.setItem("microblog_posts", JSON.stringify(posts))
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

function openModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "block"
    document.body.style.overflow = "hidden"
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.style.display = "none"
    document.body.style.overflow = "auto"
  }
}

// Close post options when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".post-options")) {
    document.querySelectorAll(".post-options-menu").forEach((menu) => {
      menu.style.display = "none"
    })
  }
})
