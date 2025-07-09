// Main JavaScript file - Enhanced and Cleaned

// Global variables
let currentUser = null
let users = []
let posts = []
let postImages = []

// Initialize app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializeApp()
})

// Initialize the application
function initializeApp() {
  loadUsersFromStorage()
  loadPostsFromStorage()
  checkAuthStatus()
  initializeEventListeners()
  loadPosts()
  initializeSearch()
}

// Load users from localStorage
function loadUsersFromStorage() {
  const savedUsers = localStorage.getItem("microblog_users")
  if (savedUsers) {
    users = JSON.parse(savedUsers)
  }
}

// Save users to localStorage
function saveUsersToStorage() {
  localStorage.setItem("microblog_users", JSON.stringify(users))
}

// Load posts from localStorage
function loadPostsFromStorage() {
  const savedPosts = localStorage.getItem("microblog_posts")
  if (savedPosts) {
    posts = JSON.parse(savedPosts)
  }
}

// Save posts to localStorage
function savePostsToStorage() {
  localStorage.setItem("microblog_posts", JSON.stringify(posts))
}

// Check authentication status
function checkAuthStatus() {
  const savedUser = localStorage.getItem("microblog_current_user")
  if (savedUser) {
    currentUser = JSON.parse(savedUser)
    updateAuthUI()
  }
}

// Update authentication UI
function updateAuthUI() {
  const authButtons = document.getElementById("authButtons")
  const userMenu = document.getElementById("userMenu")
  const fabBtn = document.getElementById("fabBtn")

  if (currentUser) {
    if (authButtons) authButtons.style.display = "none"
    if (userMenu) userMenu.style.display = "flex"
    if (fabBtn) fabBtn.style.display = "block"
    updateUserInfoInModals()
  } else {
    if (authButtons) authButtons.style.display = "flex"
    if (userMenu) userMenu.style.display = "none"
    if (fabBtn) fabBtn.style.display = "none"
  }
}

// Update user info in modals
function updateUserInfoInModals() {
  if (!currentUser) return

  const modalUserAvatar = document.getElementById("modalUserAvatar")
  const modalUserName = document.getElementById("modalUserName")
  const modalUserUsername = document.getElementById("modalUserUsername")
  const commentUserAvatar = document.getElementById("commentUserAvatar")

  if (modalUserAvatar) modalUserAvatar.src = currentUser.avatar
  if (modalUserName) modalUserName.textContent = currentUser.name
  if (modalUserUsername) modalUserUsername.textContent = `@${currentUser.username}`
  if (commentUserAvatar) commentUserAvatar.src = currentUser.avatar
}

// Initialize event listeners
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
      if (!currentUser) {
        showNotification("Please login first", "error")
        return
      }
      openModal("createPostModal")
    })
  }

  // Create post modal
  const publishPostBtn = document.getElementById("publishPostBtn")
  if (publishPostBtn) {
    publishPostBtn.addEventListener("click", publishPost)
  }

  // Image upload
  const addImageBtn = document.getElementById("addImageBtn")
  if (addImageBtn) {
    addImageBtn.addEventListener("click", () => {
      openModal("imageUploadModal")
    })
  }

  // Image file input
  const imageFileInput = document.getElementById("imageFileInput")
  if (imageFileInput) {
    imageFileInput.addEventListener("change", handleImageFileUpload)
  }

  // Image URL input
  const addImageUrlBtn = document.getElementById("addImageUrlBtn")
  if (addImageUrlBtn) {
    addImageUrlBtn.addEventListener("click", handleImageUrlUpload)
  }

  // Comment functionality
  const addCommentBtn = document.getElementById("addCommentBtn")
  if (addCommentBtn) {
    addCommentBtn.addEventListener("click", addComment)
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

// Initialize search functionality
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

// Search users
function searchUsers(query) {
  const searchTerm = query.toLowerCase()
  return users
    .filter((user) => user.name.toLowerCase().includes(searchTerm) || user.username.toLowerCase().includes(searchTerm))
    .slice(0, 10)
}

// Display search results
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

// Load and display posts
function loadPosts() {
  const postsContainer = document.getElementById("postsContainer")
  if (!postsContainer) return

  if (posts.length === 0) {
    postsContainer.innerHTML = `
            <div class="text-center p-4">
                <h3>No posts yet</h3>
                <p style="color: rgba(255, 255, 255, 0.6);">Be the first to post something!</p>
            </div>
        `
    return
  }

  // Sort posts by date (newest first)
  const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  postsContainer.innerHTML = sortedPosts.map((post) => createPostHTML(post)).join("")
}

// Create HTML for a post
function createPostHTML(post) {
  const user = getUserById(post.userId)
  if (!user) return ""

  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false
  const isFollowing = currentUser ? isUserFollowing(post.userId) : false
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

  const followButtonHTML =
    currentUser && !isOwnPost
      ? `
        <button class="follow-btn ${isFollowing ? "following" : ""}" 
                onclick="toggleFollow('${post.userId}')" 
                data-user-id="${post.userId}">
            ${isFollowing ? "Following" : "Follow"}
        </button>
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
                <img src="${user.avatar}" alt="${user.name}" class="user-avatar" onclick="goToProfile('${user.id}')">
                <div class="user-info">
                    <h4 onclick="goToProfile('${user.id}')" style="cursor: pointer;">${user.name}</h4>
                    <p class="username">@${user.username}</p>
                </div>
                <span class="post-time">${timeAgo(post.createdAt)}</span>
                ${followButtonHTML}
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
    loadPosts()
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
    loadPosts()
    showNotification("Post deleted successfully", "success")
  }

  // Hide options menu
  togglePostOptions(postId)
}

// Get image grid class based on count
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

// Publish a new post
function publishPost() {
  const content = document.getElementById("postContent").value.trim()

  if (!content && postImages.length === 0) {
    showNotification("Please write something or add an image", "error")
    return
  }

  if (!currentUser) {
    showNotification("Please login first", "error")
    return
  }

  const newPost = {
    id: generateId(),
    userId: currentUser.id,
    content: content,
    images: [...postImages],
    createdAt: new Date().toISOString(),
    likes: [],
    comments: [],
    shares: 0,
  }

  posts.unshift(newPost)
  savePostsToStorage()

  // Reset form
  document.getElementById("postContent").value = ""
  postImages = []
  updateImagePreview()

  closeModal("createPostModal")
  showNotification("Post published successfully", "success")

  // Reload posts
  loadPosts()
}

// Handle image file upload
function handleImageFileUpload(e) {
  const files = Array.from(e.target.files)
  files.forEach((file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        addImageToPost(e.target.result)
      }
      reader.readAsDataURL(file)
    }
  })
  closeModal("imageUploadModal")
}

// Handle image URL upload
function handleImageUrlUpload() {
  const imageUrlInput = document.getElementById("imageUrlInput")
  const url = imageUrlInput.value.trim()

  if (url && isValidURL(url)) {
    addImageToPost(url)
    imageUrlInput.value = ""
    closeModal("imageUploadModal")
  } else {
    showNotification("Please enter a valid URL", "error")
  }
}

// Add image to post
function addImageToPost(imageUrl) {
  if (postImages.length < 4) {
    postImages.push(imageUrl)
    updateImagePreview()
  } else {
    showNotification("Maximum 4 images allowed", "error")
  }
}

// Update image preview
function updateImagePreview() {
  const previewContainer = document.getElementById("postImagesPreview")
  if (!previewContainer) return

  if (postImages.length === 0) {
    previewContainer.innerHTML = ""
    previewContainer.classList.remove("has-images")
    return
  }

  previewContainer.classList.add("has-images")
  previewContainer.innerHTML = postImages
    .map(
      (img, index) => `
        <div class="preview-image">
            <img src="${img}" alt="Image Preview">
            <button class="remove-image" onclick="removeImageFromPost(${index})">&times;</button>
        </div>
    `,
    )
    .join("")
}

// Remove image from post
function removeImageFromPost(index) {
  postImages.splice(index, 1)
  updateImagePreview()
}

// Toggle like on post
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

// Toggle follow user
function toggleFollow(userId) {
  if (!currentUser) {
    showNotification("Please login first", "error")
    return
  }

  if (userId === currentUser.id) {
    showNotification("You cannot follow yourself", "error")
    return
  }

  const targetUser = getUserById(userId)
  if (!targetUser) return

  const isFollowing = currentUser.following.includes(userId)

  if (isFollowing) {
    // Unfollow
    currentUser.following = currentUser.following.filter((id) => id !== userId)
    targetUser.followers = targetUser.followers.filter((id) => id !== currentUser.id)
    showNotification("Unfollowed successfully", "success")
  } else {
    // Follow
    currentUser.following.push(userId)
    targetUser.followers.push(currentUser.id)
    showNotification("Following successfully", "success")
  }

  // Update storage
  saveUsersToStorage()
  localStorage.setItem("microblog_current_user", JSON.stringify(currentUser))

  // Update UI
  const followBtn = document.querySelector(`[data-user-id="${userId}"]`)
  if (followBtn) {
    const newIsFollowing = currentUser.following.includes(userId)
    followBtn.textContent = newIsFollowing ? "Following" : "Follow"
    followBtn.classList.toggle("following", newIsFollowing)
  }
}

// Open post modal
function openPostModal(postId) {
  const post = posts.find((p) => p.id === postId)
  if (!post) return

  const user = getUserById(post.userId)
  const postDetails = document.getElementById("postDetails")
  const commentsList = document.getElementById("commentsList")

  // Display post details
  postDetails.innerHTML = createPostHTML(post)

  // Display comments
  commentsList.innerHTML = post.comments
    .map((comment) => {
      const commentUser = getUserById(comment.userId)
      return `
            <div class="comment">
                <img src="${commentUser.avatar}" alt="${commentUser.name}" class="user-avatar">
                <div class="comment-content">
                    <div class="comment-author">${commentUser.name}</div>
                    <div class="comment-text">${comment.content}</div>
                    <div class="comment-time">${timeAgo(comment.createdAt)}</div>
                </div>
            </div>
        `
    })
    .join("")

  // Store current post ID for commenting
  window.currentPostId = postId

  openModal("postModal")
}

// Add comment to post
function addComment() {
  const commentInput = document.getElementById("commentInput")
  const content = commentInput.value.trim()

  if (!content) return

  if (!currentUser) {
    showNotification("Please login first", "error")
    return
  }

  const postId = window.currentPostId
  const post = posts.find((p) => p.id === postId)
  if (!post) return

  const newComment = {
    id: generateId(),
    userId: currentUser.id,
    content: content,
    createdAt: new Date().toISOString(),
  }

  post.comments.push(newComment)
  savePostsToStorage()

  commentInput.value = ""
  showNotification("Comment added successfully", "success")

  // Refresh modal content
  openPostModal(postId)

  // Update main feed
  loadPosts()
}

// Share post
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

// Open image viewer
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

// Go to profile
function goToProfile(userId) {
  window.location.href = `profile.html?user=${userId}`
}

// Logout function
function logout() {
  currentUser = null
  localStorage.removeItem("microblog_current_user")
  updateAuthUI()
  showNotification("Logged out successfully", "success")

  // Reload posts to update UI
  loadPosts()
}

// Utility functions
function getUserById(userId) {
  return users.find((user) => user.id === userId)
}

function isUserFollowing(userId) {
  return currentUser && currentUser.following && currentUser.following.includes(userId)
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
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
