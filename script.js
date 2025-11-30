// ==================== FIREBASE IMPORTS ====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// ==================== FIREBASE CONFIG ====================
const firebaseConfig = {
  apiKey: "AIzaSyC0DRpfgfbUcLGdKewLqiCuWcgZ6-Trdpg",
  authDomain: "homey-147.firebaseapp.com",
  projectId: "homey-147",
  storageBucket: "homey-147.firebasestorage.app",
  messagingSenderId: "947232208629",
  appId: "1:947232208629:web:725267083700b80725b7bc",
  measurementId: "G-R2BMZDKRJJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ==================== GLOBAL VARIABLES ====================
let currentUser = null;
let allProperties = [];
let userProperties = [];
let userFavorites = [];
let userInquiries = [];
let receivedInquiries = [];
let currentPage = 1;
let currentFilter = 'all';
const itemsPerPage = 6;
let currentProperty = null;
let editingPropertyId = null;
let selectedImages = [];

// ==================== DOM ELEMENTS ====================
// Auth Elements
const authModal = document.getElementById('authModal');
const authButton = document.getElementById('authButton');
const closeAuthModal = document.getElementById('closeAuthModal');
const showLogin = document.getElementById('showLogin');
const showSignup = document.getElementById('showSignup');
const modalTitle = document.getElementById('modalTitle');
const authForm = document.getElementById('authForm');
const authSubmit = document.getElementById('authSubmit');
const authMessage = document.getElementById('authMessage');
const signupNameField = document.getElementById('signupNameField');
const signupPhoneField = document.getElementById('signupPhoneField');

// Dashboard Elements
const dashboardModal = document.getElementById('dashboardModal');
const dashboardLink = document.getElementById('dashboardLink');
const openDashboard = document.getElementById('openDashboard');
const closeDashboard = document.getElementById('closeDashboard');
const sellPropertyLink = document.getElementById('sellPropertyLink');
const openSellProperty = document.getElementById('openSellProperty');

// Sell Property Elements
const sellPropertyModal = document.getElementById('sellPropertyModal');
const closeSellProperty = document.getElementById('closeSellProperty');
const sellPropertyForm = document.getElementById('sellPropertyForm');
const cancelSellProperty = document.getElementById('cancelSellProperty');
const imageUploadArea = document.getElementById('imageUploadArea');
const propImages = document.getElementById('propImages');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');

// Property Modal Elements
const propertyModal = document.getElementById('propertyModal');
const closePropertyModal = document.getElementById('closePropertyModal');
const sendInquiryBtn = document.getElementById('sendInquiryBtn');
const favoriteBtn = document.getElementById('favoriteBtn');

// Inquiry Modal Elements
const inquiryModal = document.getElementById('inquiryModal');
const closeInquiry = document.getElementById('closeInquiry');
const inquiryForm = document.getElementById('inquiryForm');

// Other Elements
const propertiesGrid = document.getElementById('propertiesGrid');
const paginationContainer = document.getElementById('pagination');
const searchResults = document.getElementById('searchResults');
const searchBtn = document.getElementById('searchBtn');
const searchArea = document.getElementById('searchArea');
const propertyTypeSearch = document.getElementById('propertyTypeSearch');
const priceRange = document.getElementById('priceRange');

let isLoginMode = true;

// ==================== UTILITY FUNCTIONS ====================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = toast.querySelector('i');
  
  toast.className = `toast ${type}`;
  toastMessage.textContent = message;
  
  // Update icon based on type
  toastIcon.className = type === 'success' ? 'fas fa-check-circle' : 
                        type === 'error' ? 'fas fa-exclamation-circle' : 
                        'fas fa-info-circle';
  
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function formatPrice(price) {
  if (price >= 10000000) {
    return `৳ ${(price / 10000000).toFixed(2)} Crore`;
  } else if (price >= 100000) {
    return `৳ ${(price / 100000).toFixed(2)} Lakh`;
  } else {
    return `৳ ${price.toLocaleString()}`;
  }
}

function formatDate(timestamp) {
  if (!timestamp) return 'N/A';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function closeAllModals() {
  authModal.style.display = 'none';
  dashboardModal.style.display = 'none';
  sellPropertyModal.style.display = 'none';
  propertyModal.style.display = 'none';
  inquiryModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

// ==================== AUTH FUNCTIONS ====================
function setupAuthModal() {
  // Open auth modal
  authButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (currentUser) {
      signOut(auth).then(() => {
        showToast('Logged out successfully');
      });
    } else {
      authModal.style.display = 'flex';
    }
  });
  
  // Close auth modal
  closeAuthModal.addEventListener('click', () => {
    authModal.style.display = 'none';
    resetAuthForm();
  });
  
  // Toggle Login/Signup
  showLogin.addEventListener('click', () => {
    isLoginMode = true;
    showLogin.classList.add('active');
    showSignup.classList.remove('active');
    modalTitle.textContent = 'Sign In';
    authSubmit.textContent = 'Sign In';
    signupNameField.style.display = 'none';
    signupPhoneField.style.display = 'none';
  });
  
  showSignup.addEventListener('click', () => {
    isLoginMode = false;
    showSignup.classList.add('active');
    showLogin.classList.remove('active');
    modalTitle.textContent = 'Create Account';
    authSubmit.textContent = 'Sign Up';
    signupNameField.style.display = 'block';
    signupPhoneField.style.display = 'block';
  });
  
  // Form submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const name = document.getElementById('authName')?.value.trim();
    const phone = document.getElementById('authPhone')?.value.trim();
    
    authMessage.textContent = 'Please wait...';
    authMessage.style.color = 'var(--primary)';
    
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Welcome back!');
      } else {
        // Create user
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with name
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        
        // Create user document in Firestore
        await addDoc(collection(db, 'users'), {
          uid: userCredential.user.uid,
          name: name || '',
          email: email,
          phone: phone || '',
          address: '',
          favorites: [],
          createdAt: serverTimestamp()
        });
        
        showToast('Account created successfully!');
      }
      
      authModal.style.display = 'none';
      resetAuthForm();
      
    } catch (error) {
      authMessage.textContent = error.message;
      authMessage.style.color = 'var(--danger)';
    }
  });
  
  // Auth state listener
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    
    if (user) {
      authButton.textContent = 'Logout';
      dashboardLink.style.display = 'block';
      sellPropertyLink.style.display = 'block';
      
      // Load user data
      await loadUserData();
      
    } else {
      authButton.textContent = 'Sign In';
      dashboardLink.style.display = 'none';
      sellPropertyLink.style.display = 'none';
      userProperties = [];
      userFavorites = [];
      userInquiries = [];
      receivedInquiries = [];
    }
    
    // Refresh properties to update favorite buttons
    if (allProperties.length > 0) {
      renderProperties(getFilteredProperties());
    }
  });
}

function resetAuthForm() {
  authForm.reset();
  authMessage.textContent = '';
  isLoginMode = true;
  showLogin.classList.add('active');
  showSignup.classList.remove('active');
  modalTitle.textContent = 'Sign In';
  authSubmit.textContent = 'Sign In';
  signupNameField.style.display = 'none';
  signupPhoneField.style.display = 'none';
}

// ==================== USER DATA FUNCTIONS ====================
async function loadUserData() {
  if (!currentUser) return;
  
  try {
    // Get user document
    const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
    const userSnapshot = await getDocs(userQuery);
    
    if (!userSnapshot.empty) {
      const userData = userSnapshot.docs[0].data();
      userFavorites = userData.favorites || [];
    }
    
    // Load user's properties
    await loadUserProperties();
    
    // Load user's inquiries
    await loadUserInquiries();
    
    // Load received inquiries
    await loadReceivedInquiries();
    
  } catch (error) {
    console.error('Error loading user data:', error);
  }
}

async function loadUserProperties() {
  if (!currentUser) return;
  
  try {
    const q = query(
      collection(db, 'properties'), 
      where('createdBy', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    userProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading user properties:', error);
  }
}

async function loadUserInquiries() {
  if (!currentUser) return;
  
  try {
    const q = query(
      collection(db, 'inquiries'), 
      where('fromUserId', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    userInquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading user inquiries:', error);
  }
}

async function loadReceivedInquiries() {
  if (!currentUser) return;
  
  try {
    const q = query(
      collection(db, 'inquiries'), 
      where('toUserId', '==', currentUser.uid)
    );
    const snapshot = await getDocs(q);
    receivedInquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error loading received inquiries:', error);
  }
}

async function getUserDocument() {
  if (!currentUser) return null;
  
  const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
  const snapshot = await getDocs(userQuery);
  
  if (!snapshot.empty) {
    return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
  }
  return null;
}

// ==================== DASHBOARD FUNCTIONS ====================
function setupDashboard() {
  // Open dashboard
  openDashboard.addEventListener('click', (e) => {
    e.preventDefault();
    openDashboardModal();
  });
  
  // Close dashboard
  closeDashboard.addEventListener('click', () => {
    dashboardModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  
  // Dashboard navigation
  document.querySelectorAll('.dashboard-nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      
      // Update active button
      document.querySelectorAll('.dashboard-nav-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab
      document.querySelectorAll('.dashboard-tab').forEach(t => t.classList.remove('active'));
      document.getElementById(`tab-${tab}`).classList.add('active');
      
      // Load tab content
      loadDashboardTab(tab);
    });
  });
  
  // Add new property from dashboard
  document.getElementById('addNewPropertyBtn').addEventListener('click', () => {
    dashboardModal.style.display = 'none';
    openSellPropertyModal();
  });
  
  // Profile form submit
  document.getElementById('profileForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    await updateUserProfile();
  });
}

async function openDashboardModal() {
  if (!currentUser) {
    authModal.style.display = 'flex';
    return;
  }
  
  // Update user info in sidebar
  document.getElementById('dashboardUserName').textContent = currentUser.displayName || 'User';
  document.getElementById('dashboardUserEmail').textContent = currentUser.email;
  
  dashboardModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  
  // Load overview by default
  loadDashboardTab('overview');
}

async function loadDashboardTab(tab) {
  switch(tab) {
    case 'overview':
      loadOverviewTab();
      break;
    case 'my-properties':
      loadMyPropertiesTab();
      break;
    case 'my-inquiries':
      loadMyInquiriesTab();
      break;
    case 'received-inquiries':
      loadReceivedInquiriesTab();
      break;
    case 'favorites':
      loadFavoritesTab();
      break;
    case 'profile':
      loadProfileTab();
      break;
  }
}

function loadOverviewTab() {
  // Update stats
  document.getElementById('myPropertiesCount').textContent = userProperties.length;
  document.getElementById('myInquiriesCount').textContent = userInquiries.length;
  document.getElementById('receivedInquiriesCount').textContent = receivedInquiries.length;
  document.getElementById('favoritesCount').textContent = userFavorites.length;
  
  // Load recent activity
  const activityList = document.getElementById('recentActivityList');
  const activities = [];
  
  // Add recent properties
  userProperties.slice(0, 3).forEach(prop => {
    activities.push({
      type: 'property',
      title: `Listed: ${prop.title}`,
      date: prop.createdAt,
      icon: 'fa-home'
    });
  });
  
  // Add recent inquiries
  userInquiries.slice(0, 3).forEach(inq => {
    activities.push({
      type: 'inquiry',
      title: `Inquiry sent for property`,
      date: inq.createdAt,
      icon: 'fa-envelope'
    });
  });
  
  if (activities.length === 0) {
    activityList.innerHTML = '<p class="no-data">No recent activity</p>';
  } else {
    activityList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <i class="fas ${activity.icon}"></i>
        <div class="activity-info">
          <h4>${activity.title}</h4>
          <p>${formatDate(activity.date)}</p>
        </div>
      </div>
    `).join('');
  }
}

function loadMyPropertiesTab() {
  const container = document.getElementById('myPropertiesList');
  
  if (userProperties.length === 0) {
    container.innerHTML = '<p class="no-data">You haven\'t listed any properties yet. Click "Add New Property" to get started.</p>';
    return;
  }
  
  container.innerHTML = userProperties.map(prop => `
    <div class="property-list-card">
      <img src="${prop.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=60'}" alt="${prop.title}">
      <div class="property-list-card-info">
        <h4>${prop.title}</h4>
        <div class="price">${formatPrice(prop.price)}</div>
        <div class="location"><i class="fas fa-map-marker-alt"></i> ${prop.location}</div>
        <div class="property-card-actions">
          <button class="btn btn-small btn-outline" onclick="editProperty('${prop.id}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-small btn-danger" onclick="deleteProperty('${prop.id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function loadMyInquiriesTab() {
  const container = document.getElementById('myInquiriesList');
  
  if (userInquiries.length === 0) {
    container.innerHTML = '<p class="no-data">You haven\'t made any inquiries yet. Browse properties and send inquiries to sellers.</p>';
    return;
  }
  
  container.innerHTML = userInquiries.map(inq => {
    const property = allProperties.find(p => p.id === inq.propertyId);
    return `
      <div class="inquiry-card">
        <img src="${property?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=60'}" alt="Property">
        <div class="inquiry-card-info">
          <h4>${property?.title || 'Property'}</h4>
          <p class="inquiry-date">${formatDate(inq.createdAt)}</p>
          <p class="inquiry-message">"${inq.message.substring(0, 100)}${inq.message.length > 100 ? '...' : ''}"</p>
          <span class="inquiry-status ${inq.status || 'pending'}">${inq.status || 'Pending'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function loadReceivedInquiriesTab() {
  const container = document.getElementById('receivedInquiriesList');
  
  if (receivedInquiries.length === 0) {
    container.innerHTML = '<p class="no-data">No inquiries received yet. Once someone is interested in your property, their inquiry will appear here.</p>';
    return;
  }
  
  container.innerHTML = receivedInquiries.map(inq => {
    const property = userProperties.find(p => p.id === inq.propertyId);
    return `
      <div class="inquiry-card">
        <img src="${property?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=60'}" alt="Property">
        <div class="inquiry-card-info">
          <h4>${property?.title || 'Property'}</h4>
          <p class="inquiry-date">${formatDate(inq.createdAt)}</p>
          <p class="inquiry-message">"${inq.message.substring(0, 100)}${inq.message.length > 100 ? '...' : ''}"</p>
          <div class="inquiry-from">
            <strong>From:</strong> ${inq.fromName} | ${inq.fromEmail} | ${inq.fromPhone}
          </div>
          <span class="inquiry-status ${inq.status || 'pending'}">${inq.status || 'Pending'}</span>
        </div>
      </div>
    `;
  }).join('');
}

async function loadFavoritesTab() {
  const container = document.getElementById('favoritesList');
  
  if (userFavorites.length === 0) {
    container.innerHTML = '<p class="no-data">You haven\'t saved any favorites yet. Click the heart icon on properties you like.</p>';
    return;
  }
  
  const favoriteProperties = allProperties.filter(p => userFavorites.includes(p.id));
  
  if (favoriteProperties.length === 0) {
    container.innerHTML = '<p class="no-data">Your favorite properties are not available.</p>';
    return;
  }
  
  container.innerHTML = favoriteProperties.map(prop => `
    <div class="property-list-card">
      <img src="${prop.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=60'}" alt="${prop.title}">
      <div class="property-list-card-info">
        <h4>${prop.title}</h4>
        <div class="price">${formatPrice(prop.price)}</div>
        <div class="location"><i class="fas fa-map-marker-alt"></i> ${prop.location}</div>
        <div class="property-card-actions">
          <button class="btn btn-small" onclick="viewPropertyDetails('${prop.id}')">
            View Details
          </button>
          <button class="btn btn-small btn-outline" onclick="toggleFavorite('${prop.id}')">
            <i class="fas fa-heart-broken"></i> Remove
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function loadProfileTab() {
  const userData = await getUserDocument();
  
  if (userData) {
    document.getElementById('profileName').value = userData.name || currentUser.displayName || '';
    document.getElementById('profileEmail').value = currentUser.email;
    document.getElementById('profilePhone').value = userData.phone || '';
    document.getElementById('profileAddress').value = userData.address || '';
  }
}

async function updateUserProfile() {
  const profileMessage = document.getElementById('profileMessage');
  
  try {
    profileMessage.textContent = 'Updating...';
    profileMessage.style.color = 'var(--primary)';
    
    const name = document.getElementById('profileName').value.trim();
    const phone = document.getElementById('profilePhone').value.trim();
    const address = document.getElementById('profileAddress').value.trim();
    
    // Update Firebase Auth profile
    await updateProfile(currentUser, { displayName: name });
    
    // Update Firestore document
    const userData = await getUserDocument();
    if (userData) {
      await updateDoc(doc(db, 'users', userData.id), {
        name,
        phone,
        address,
        updatedAt: serverTimestamp()
      });
    }
    
    // Update dashboard sidebar
    document.getElementById('dashboardUserName').textContent = name || 'User';
    
    profileMessage.textContent = 'Profile updated successfully!';
    profileMessage.style.color = 'var(--success)';
    showToast('Profile updated successfully!');
    
    setTimeout(() => {
      profileMessage.textContent = '';
    }, 3000);
    
  } catch (error) {
    profileMessage.textContent = error.message;
    profileMessage.style.color = 'var(--danger)';
  }
}

// ==================== SELL PROPERTY FUNCTIONS ====================
function setupSellProperty() {
  // Open sell property modal from nav
  openSellProperty.addEventListener('click', (e) => {
    e.preventDefault();
    openSellPropertyModal();
  });
  
  // Close sell property modal
  closeSellProperty.addEventListener('click', () => {
    closeSellPropertyModal();
  });
  
  cancelSellProperty.addEventListener('click', () => {
    closeSellPropertyModal();
  });
  
  // Image upload
  imageUploadArea.addEventListener('click', () => {
    propImages.click();
  });
  
  propImages.addEventListener('change', handleImageSelect);
  
  // Drag and drop
  imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = 'var(--secondary)';
    imageUploadArea.style.background = '#fef5f5';
  });
  
  imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.style.borderColor = '#ddd';
    imageUploadArea.style.background = 'transparent';
  });
  
  imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.style.borderColor = '#ddd';
    imageUploadArea.style.background = 'transparent';
    
    const files = e.dataTransfer.files;
    handleImageFiles(files);
  });
  
  // Form submit
  sellPropertyForm.addEventListener('submit', handlePropertySubmit);
}

function openSellPropertyModal(propertyId = null) {
  if (!currentUser) {
    authModal.style.display = 'flex';
    showToast('Please sign in to list a property', 'warning');
    return;
  }
  
  editingPropertyId = propertyId;
  selectedImages = [];
  imagePreviewContainer.innerHTML = '';
  
  if (propertyId) {
    // Edit mode
    document.getElementById('sellPropertyTitle').textContent = 'Edit Property';
    document.getElementById('submitPropertyBtn').textContent = 'Update Property';
    loadPropertyForEdit(propertyId);
  } else {
    // Add mode
    document.getElementById('sellPropertyTitle').textContent = 'List Your Property';
    document.getElementById('submitPropertyBtn').textContent = 'List Property';
    sellPropertyForm.reset();
    document.getElementById('editPropertyId').value = '';
    
    // Pre-fill contact info
    if (currentUser) {
      document.getElementById('propContactName').value = currentUser.displayName || '';
    }
  }
  
  sellPropertyModal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeSellPropertyModal() {
  sellPropertyModal.style.display = 'none';
  document.body.style.overflow = 'auto';
  sellPropertyForm.reset();
  selectedImages = [];
  imagePreviewContainer.innerHTML = '';
  editingPropertyId = null;
  document.getElementById('sellPropertyMessage').textContent = '';
}

async function loadPropertyForEdit(propertyId) {
  try {
    const property = allProperties.find(p => p.id === propertyId);
    if (!property) return;
    
    document.getElementById('propTitle').value = property.title;
    document.getElementById('propType').value = property.type;
    document.getElementById('propPrice').value = property.price;
    document.getElementById('propArea').value = property.areaSqFt;
    document.getElementById('propBedrooms').value = property.bedrooms || '';
    document.getElementById('propBathrooms').value = property.bathrooms || '';
    document.getElementById('propLocation').value = property.location;
    document.getElementById('propAddress').value = property.address || '';
    document.getElementById('propDescription').value = property.description;
    document.getElementById('propContactName').value = property.contact?.name || '';
    document.getElementById('propContactPhone').value = property.contact?.phone || '';
    document.getElementById('editPropertyId').value = propertyId;
    
    // Set amenities
    const amenities = property.amenities || [];
    document.querySelectorAll('.amenities-checkboxes input[type="checkbox"]').forEach(cb => {
      cb.checked = amenities.includes(cb.value);
    });
    
    // Show existing images
    if (property.images && property.images.length > 0) {
      property.images.forEach((url, index) => {
        addImagePreview(url, index, true);
      });
      selectedImages = [...property.images];
    }
    
  } catch (error) {
    console.error('Error loading property for edit:', error);
  }
}

function handleImageSelect(e) {
  const files = e.target.files;
  handleImageFiles(files);
}

function handleImageFiles(files) {
  Array.from(files).forEach((file, index) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        selectedImages.push(file);
        addImagePreview(e.target.result, selectedImages.length - 1);
      };
      reader.readAsDataURL(file);
    }
  });
}

function addImagePreview(src, index, isUrl = false) {
  const preview = document.createElement('div');
  preview.className = 'image-preview';
  preview.innerHTML = `
    <img src="${src}" alt="Preview">
    <button type="button" class="remove-image" onclick="removeImage(${index}, ${isUrl})">
      <i class="fas fa-times"></i>
    </button>
  `;
  imagePreviewContainer.appendChild(preview);
}

window.removeImage = function(index, isUrl) {
  selectedImages.splice(index, 1);
  imagePreviewContainer.innerHTML = '';
  selectedImages.forEach((img, i) => {
    if (typeof img === 'string') {
      addImagePreview(img, i, true);
    } else {
      const reader = new FileReader();
      reader.onload = (e) => addImagePreview(e.target.result, i);
      reader.readAsDataURL(img);
    }
  });
};

async function handlePropertySubmit(e) {
  e.preventDefault();
  
  const messageEl = document.getElementById('sellPropertyMessage');
  const submitBtn = document.getElementById('submitPropertyBtn');
  
  try {
    messageEl.textContent = 'Processing...';
    messageEl.style.color = 'var(--primary)';
    submitBtn.disabled = true;
    
    // Get form values
    const title = document.getElementById('propTitle').value.trim();
    const type = document.getElementById('propType').value;
    const price = parseFloat(document.getElementById('propPrice').value);
    const areaSqFt = parseFloat(document.getElementById('propArea').value);
    const bedrooms = document.getElementById('propBedrooms').value;
    const bathrooms = document.getElementById('propBathrooms').value;
    const location = document.getElementById('propLocation').value;
    const address = document.getElementById('propAddress').value.trim();
    const description = document.getElementById('propDescription').value.trim();
    const contactName = document.getElementById('propContactName').value.trim();
    const contactPhone = document.getElementById('propContactPhone').value.trim();
    
    // Get amenities
    const amenities = [];
    document.querySelectorAll('.amenities-checkboxes input[type="checkbox"]:checked').forEach(cb => {
      amenities.push(cb.value);
    });
    
    // Upload new images
    const imageUrls = [];
    for (const img of selectedImages) {
      if (typeof img === 'string') {
        // Existing URL
        imageUrls.push(img);
      } else {
        // New file - upload to Firebase Storage
        messageEl.textContent = 'Uploading images...';
        const storageRef = ref(storage, `properties/${currentUser.uid}/${Date.now()}_${img.name}`);
        await uploadBytes(storageRef, img);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }
    }
    
    const propertyData = {
      title,
      type,
      price,
      priceDisplay: formatPrice(price),
      areaSqFt,
      bedrooms: bedrooms ? parseInt(bedrooms) : null,
      bathrooms: bathrooms ? parseInt(bathrooms) : null,
      location,
      area: location,
      address,
      description,
      amenities,
      images: imageUrls,
      contact: {
        name: contactName || currentUser.displayName || '',
        phone: contactPhone,
        email: currentUser.email
      },
      createdBy: currentUser.uid,
      status: 'available',
      updatedAt: serverTimestamp()
    };
    
    if (editingPropertyId) {
      // Update existing property
      await updateDoc(doc(db, 'properties', editingPropertyId), propertyData);
      showToast('Property updated successfully!');
    } else {
      // Add new property
      propertyData.createdAt = serverTimestamp();
      await addDoc(collection(db, 'properties'), propertyData);
      showToast('Property listed successfully!');
    }
    
    // Refresh data
    await loadProperties();
    await loadUserProperties();
    
    closeSellPropertyModal();
    
  } catch (error) {
    console.error('Error saving property:', error);
    messageEl.textContent = error.message;
    messageEl.style.color = 'var(--danger)';
  } finally {
    submitBtn.disabled = false;
  }
}

// Global function for editing property
window.editProperty = function(propertyId) {
  dashboardModal.style.display = 'none';
  openSellPropertyModal(propertyId);
};

// Global function for deleting property
window.deleteProperty = async function(propertyId) {
  if (!confirm('Are you sure you want to delete this property?')) return;
  
  try {
    await deleteDoc(doc(db, 'properties', propertyId));
    
    // Refresh data
    await loadProperties();
    await loadUserProperties();
    loadMyPropertiesTab();
    
    showToast('Property deleted successfully!');
    
  } catch (error) {
    console.error('Error deleting property:', error);
    showToast('Error deleting property', 'error');
  }
};

// ==================== PROPERTY DISPLAY FUNCTIONS ====================
async function loadProperties() {
  try {
    propertiesGrid.innerHTML = `
      <div class="loading-properties">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Loading properties...</p>
      </div>
    `;
    
    const snapshot = await getDocs(collection(db, 'properties'));
    allProperties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Update stats
    document.getElementById('totalPropertiesStat').textContent = allProperties.length + '+';
    
    // Get users count
    const usersSnapshot = await getDocs(collection(db, 'users'));
    document.getElementById('totalUsersStat').textContent = usersSnapshot.size + '+';
    
    if (allProperties.length === 0) {
      propertiesGrid.innerHTML = `
        <div class="error-message">
          <i class="fas fa-home" style="font-size: 48px; margin-bottom: 15px;"></i>
          <h3>No Properties Available</h3>
          <p>Be the first to list a property!</p>
        </div>
      `;
      return;
    }
    
    renderProperties(allProperties);
    
  } catch (error) {
    console.error('Error loading properties:', error);
    propertiesGrid.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 15px;"></i>
        <h3>Failed to Load Properties</h3>
        <p>Please check your connection and try again.</p>
        <button class="btn" onclick="loadProperties()" style="margin-top: 15px;">Retry</button>
      </div>
    `;
  }
}

function getFilteredProperties() {
  let filtered = [...allProperties];
  
  if (currentFilter !== 'all') {
    filtered = filtered.filter(p => p.type === currentFilter);
  }
  
  return filtered;
}

function renderProperties(properties) {
  if (properties.length === 0) {
    propertiesGrid.innerHTML = `
      <div class="error-message">
        <i class="fas fa-search" style="font-size: 48px; margin-bottom: 15px;"></i>
        <h3>No Properties Found</h3>
        <p>Try adjusting your filters or search criteria.</p>
      </div>
    `;
    paginationContainer.innerHTML = '';
    return;
  }
  
  // Pagination
  const totalPages = Math.ceil(properties.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProperties = properties.slice(startIndex, endIndex);
  
  propertiesGrid.innerHTML = paginatedProperties.map(property => {
    const isFavorite = userFavorites.includes(property.id);
    return `
      <div class="property-card" data-type="${property.type}">
        <div class="property-img">
          <img src="${property.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1170&q=80'}" alt="${property.title}" loading="lazy">
          <span class="property-type-badge">${property.type}</span>
          <button class="property-favorite-btn ${isFavorite ? 'active' : ''}" onclick="toggleFavorite('${property.id}')" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
            <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
          </button>
        </div>
        <div class="property-info">
          <div class="property-price">${property.priceDisplay || formatPrice(property.price)}</div>
          <h3>${property.title}</h3>
          <div class="property-location">
            <i class="fas fa-map-marker-alt"></i> ${property.location}
          </div>
          <div class="property-meta">
            ${property.bedrooms ? `<span><i class="fas fa-bed"></i> ${property.bedrooms} Bed</span>` : ''}
            ${property.bathrooms ? `<span><i class="fas fa-bath"></i> ${property.bathrooms} Bath</span>` : ''}
            <span><i class="fas fa-vector-square"></i> ${property.areaSqFt} sq.ft</span>
          </div>
          <button class="btn" onclick="viewPropertyDetails('${property.id}')">View Details</button>
        </div>
      </div>
    `;
  }).join('');
  
  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  paginationContainer.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
    btn.textContent = i;
    btn.addEventListener('click', () => {
      currentPage = i;
      renderProperties(getFilteredProperties());
      document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
    });
    paginationContainer.appendChild(btn);
  }
}

// Global function for viewing property details
window.viewPropertyDetails = async function(propertyId) {
  try {
    const property = allProperties.find(p => p.id === propertyId);
    if (!property) return;
    
    currentProperty = property;
    
    // Update modal content
    document.getElementById('propertyTitle').textContent = property.title;
    document.getElementById('propertyPrice').textContent = property.priceDisplay || formatPrice(property.price);
    document.getElementById('propertyLocation').textContent = property.location;
    document.getElementById('propertyAreaDisplay').textContent = `${property.areaSqFt} sq.ft`;
    document.getElementById('propertyDescription').textContent = property.description || 'No description available.';
    
    // Status
    const statusEl = document.getElementById('propertyStatus');
    statusEl.textContent = property.status || 'Available';
    statusEl.className = `property-status ${property.status === 'sold' ? 'sold' : ''}`;
    
    // Bedrooms/Bathrooms
    const bedroomsMeta = document.getElementById('bedroomsMeta');
    const bathroomsMeta = document.getElementById('bathroomsMeta');
    
    if (property.bedrooms) {
      bedroomsMeta.querySelector('span').textContent = `${property.bedrooms} Bed`;
      bedroomsMeta.style.display = 'flex';
    } else {
      bedroomsMeta.style.display = 'none';
    }
    
    if (property.bathrooms) {
      bathroomsMeta.querySelector('span').textContent = `${property.bathrooms} Bath`;
      bathroomsMeta.style.display = 'flex';
    } else {
      bathroomsMeta.style.display = 'none';
    }
    
    // Images
    const mainImage = document.getElementById('mainPropertyImage');
    const thumbnailsContainer = document.getElementById('imageThumbnails');
    
    if (property.images && property.images.length > 0) {
      mainImage.src = property.images[0];
      
      thumbnailsContainer.innerHTML = '';
      property.images.forEach((img, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${img}" alt="Thumbnail">`;
        thumb.addEventListener('click', () => {
          mainImage.src = img;
          document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
          thumb.classList.add('active');
        });
        thumbnailsContainer.appendChild(thumb);
      });
    } else {
      mainImage.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1170&q=80';
      thumbnailsContainer.innerHTML = '';
    }
    
    // Amenities
    const amenitiesList = document.getElementById('amenitiesList');
    if (property.amenities && property.amenities.length > 0) {
      amenitiesList.innerHTML = property.amenities.map(amenity => `
        <div class="amenity-item">
          <i class="fas fa-check-circle"></i>
          <span>${amenity}</span>
        </div>
      `).join('');
    } else {
      amenitiesList.innerHTML = '<p>No amenities listed</p>';
    }
    
    // Contact info
    if (property.contact) {
      document.getElementById('agentName').textContent = property.contact.name || 'Property Owner';
      document.getElementById('agentPhone').textContent = `Phone: ${property.contact.phone || 'N/A'}`;
      document.getElementById('agentEmail').textContent = `Email: ${property.contact.email || 'N/A'}`;
    }
    
    // Favorite button
    const isFavorite = userFavorites.includes(propertyId);
    favoriteBtn.className = `favorite-btn ${isFavorite ? 'active' : ''}`;
    favoriteBtn.innerHTML = `<i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>`;
    
    propertyModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
  } catch (error) {
    console.error('Error loading property details:', error);
    showToast('Error loading property details', 'error');
  }
};

// ==================== FAVORITES FUNCTIONS ====================
window.toggleFavorite = async function(propertyId) {
  if (!currentUser) {
    authModal.style.display = 'flex';
    showToast('Please sign in to save favorites', 'warning');
    return;
  }
  
  try {
    const userData = await getUserDocument();
    if (!userData) return;
    
    const isFavorite = userFavorites.includes(propertyId);
    
    if (isFavorite) {
      // Remove from favorites
      await updateDoc(doc(db, 'users', userData.id), {
        favorites: arrayRemove(propertyId)
      });
      userFavorites = userFavorites.filter(id => id !== propertyId);
      showToast('Removed from favorites');
    } else {
      // Add to favorites
      await updateDoc(doc(db, 'users', userData.id), {
        favorites: arrayUnion(propertyId)
      });
      userFavorites.push(propertyId);
      showToast('Added to favorites');
    }
    
    // Update UI
    renderProperties(getFilteredProperties());
    
    // Update property modal if open
    if (propertyModal.style.display === 'flex' && currentProperty?.id === propertyId) {
      const newIsFavorite = userFavorites.includes(propertyId);
      favoriteBtn.className = `favorite-btn ${newIsFavorite ? 'active' : ''}`;
      favoriteBtn.innerHTML = `<i class="${newIsFavorite ? 'fas' : 'far'} fa-heart"></i>`;
    }
    
  } catch (error) {
    console.error('Error toggling favorite:', error);
    showToast('Error updating favorites', 'error');
  }
};

// ==================== INQUIRY FUNCTIONS ====================
function setupInquiryModal() {
  sendInquiryBtn.addEventListener('click', () => {
    if (!currentUser) {
      propertyModal.style.display = 'none';
      authModal.style.display = 'flex';
      showToast('Please sign in to send inquiries', 'warning');
      return;
    }
    
    if (currentProperty.createdBy === currentUser.uid) {
      showToast('This is your own property', 'warning');
      return;
    }
    
    openInquiryModal();
  });
  
  closeInquiry.addEventListener('click', () => {
    inquiryModal.style.display = 'none';
  });
  
  inquiryForm.addEventListener('submit', handleInquirySubmit);
}

function openInquiryModal() {
  // Pre-fill user info
  document.getElementById('inquiryName').value = currentUser.displayName || '';
  document.getElementById('inquiryEmail').value = currentUser.email || '';
  document.getElementById('inquiryPropertyId').value = currentProperty.id;
  document.getElementById('inquiryMessage').value = `Hi, I'm interested in your property "${currentProperty.title}" listed at ${currentProperty.priceDisplay || formatPrice(currentProperty.price)}. Please contact me with more details.`;
  
  // Show property info
  document.getElementById('inquiryPropertyInfo').innerHTML = `
    <img src="${currentProperty.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=400&q=60'}" alt="${currentProperty.title}">
    <div>
      <h4>${currentProperty.title}</h4>
      <p>${currentProperty.priceDisplay || formatPrice(currentProperty.price)}</p>
    </div>
  `;
  
  propertyModal.style.display = 'none';
  inquiryModal.style.display = 'flex';
}

async function handleInquirySubmit(e) {
  e.preventDefault();
  
  const messageEl = document.getElementById('inquiryFormMessage');
  
  try {
    messageEl.textContent = 'Sending...';
    messageEl.style.color = 'var(--primary)';
    
    const inquiryData = {
      propertyId: document.getElementById('inquiryPropertyId').value,
      propertyTitle: currentProperty.title,
      fromUserId: currentUser.uid,
      fromName: document.getElementById('inquiryName').value.trim(),
      fromEmail: document.getElementById('inquiryEmail').value.trim(),
      fromPhone: document.getElementById('inquiryPhone').value.trim(),
      message: document.getElementById('inquiryMessage').value.trim(),
      toUserId: currentProperty.createdBy,
      status: 'pending',
      createdAt: serverTimestamp()
    };
    
    await addDoc(collection(db, 'inquiries'), inquiryData);
    
    showToast('Inquiry sent successfully!');
    inquiryModal.style.display = 'none';
    inquiryForm.reset();
    
    // Refresh inquiries
    await loadUserInquiries();
    
  } catch (error) {
    console.error('Error sending inquiry:', error);
    messageEl.textContent = error.message;
    messageEl.style.color = 'var(--danger)';
  }
}

// ==================== SEARCH & FILTER FUNCTIONS ====================
function setupSearchAndFilters() {
  // Filter buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      currentFilter = btn.dataset.filter;
      currentPage = 1;
      
      // Clear search results message
      searchResults.className = 'search-results-message';
      searchResults.textContent = '';
      
      renderProperties(getFilteredProperties());
    });
  });
  
  // Search
  searchBtn.addEventListener('click', performSearch);
  searchArea.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
  });
}

function performSearch() {
  const area = searchArea.value.toLowerCase().trim();
  const type = propertyTypeSearch.value;
  const price = priceRange.value;
  
  let filtered = [...allProperties];
  
  // Reset filters
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
  currentFilter = 'all';
  currentPage = 1;
  
  // Apply filters
  if (area) {
    filtered = filtered.filter(p => 
      p.location?.toLowerCase().includes(area) ||
      p.title?.toLowerCase().includes(area) ||
      p.area?.toLowerCase().includes(area)
    );
  }
  
  if (type) {
    filtered = filtered.filter(p => p.type === type);
  }
  
  if (price) {
    filtered = filtered.filter(p => {
      const priceLakh = p.price / 100000;
      switch(price) {
        case '0-50': return priceLakh <= 50;
        case '50-100': return priceLakh > 50 && priceLakh <= 100;
        case '100-200': return priceLakh > 100 && priceLakh <= 200;
        case '200+': return priceLakh > 200;
        default: return true;
      }
    });
  }
  
  // Show results message
  searchResults.className = filtered.length === 0 
    ? 'search-results-message show no-results'
    : 'search-results-message show has-results';
  searchResults.textContent = filtered.length === 0
    ? 'No properties found. Try different filters.'
    : `Found ${filtered.length} propert${filtered.length === 1 ? 'y' : 'ies'}`;
  
  renderProperties(filtered);
  document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
}

// ==================== CALCULATOR FUNCTIONS ====================
function setupCalculators() {
  document.getElementById('calculateEMIBtn').addEventListener('click', calculateEMI);
  document.getElementById('calculatePSFBtn').addEventListener('click', calculatePSF);
}

function calculateEMI() {
  const loan = parseFloat(document.getElementById('loanAmount').value);
  const rate = parseFloat(document.getElementById('interestRate').value);
  const years = parseFloat(document.getElementById('loanTerm').value);
  const result = document.getElementById('emiResult');
  
  if (isNaN(loan) || isNaN(rate) || isNaN(years) || years === 0) {
    result.textContent = 'Please enter valid values';
    result.style.color = 'var(--danger)';
    return;
  }
  
  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  const emi = loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
  
  result.textContent = `Monthly EMI: ৳ ${emi.toFixed(2).toLocaleString()}`;
  result.style.color = 'var(--success)';
}

function calculatePSF() {
  const price = parseFloat(document.getElementById('totalPrice').value);
  const area = parseFloat(document.getElementById('areaSqFtCalc').value);
  const result = document.getElementById('psfResult');
  
  if (isNaN(price) || isNaN(area) || area === 0) {
    result.textContent = 'Please enter valid values';
    result.style.color = 'var(--danger)';
    return;
  }
  
  result.textContent = `Price per Sq.Ft: ৳ ${(price / area).toFixed(2).toLocaleString()}`;
  result.style.color = 'var(--success)';
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Property modal
  closePropertyModal.addEventListener('click', () => {
    propertyModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentProperty = null;
  });
  
  favoriteBtn.addEventListener('click', () => {
    if (currentProperty) {
      toggleFavorite(currentProperty.id);
    }
  });
  
  // Close modals on outside click
  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.style.display = 'none';
      resetAuthForm();
    }
    if (e.target === dashboardModal) {
      dashboardModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
    if (e.target === sellPropertyModal) {
      closeSellPropertyModal();
    }
    if (e.target === propertyModal) {
      propertyModal.style.display = 'none';
      document.body.style.overflow = 'auto';
      currentProperty = null;
    }
    if (e.target === inquiryModal) {
      inquiryModal.style.display = 'none';
    }
  });
  
  // Close modals on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
  
  // Smooth scroll for nav links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href === '#' || this.id === 'authButton' || this.id === 'openDashboard' || this.id === 'openSellProperty') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
  
  // Header scroll effect
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// ==================== INITIALIZE APP ====================
document.addEventListener('DOMContentLoaded', () => {
  setupAuthModal();
  setupDashboard();
  setupSellProperty();
  setupInquiryModal();
  setupSearchAndFilters();
  setupCalculators();
  setupEventListeners();
  loadProperties();
});

// Make loadProperties global for retry button
window.loadProperties = loadProperties;