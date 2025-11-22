// ==================== FIREBASE INITIALIZATION ====================
const firebaseConfig = {
  apiKey: "AIzaSyC0DRpfgfbUcLGdKewLqiCuWcgZ6-Trdpg",
  authDomain: "homey-147.firebaseapp.com",
  projectId: "homey-147",
  storageBucket: "homey-147.firebasestorage.app",
  messagingSenderId: "947232208629",
  appId: "1:947232208629:web:725267083700b80725b7bc",
  measurementId: "G-R2BMZDKRJJ"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// ==================== AUTH MODAL LOGIC ====================
const authModal = document.getElementById('authModal');
const authButton = document.getElementById('authButton');
const closeModal = document.querySelector('.modal .close');
const showLogin = document.getElementById('showLogin');
const showSignup = document.getElementById('showSignup');
const modalTitle = document.getElementById('modalTitle');
const authSubmit = document.getElementById('authSubmit');
const authForm = document.getElementById('authForm');
const authMessage = document.getElementById('authMessage');

let isLoginMode = true;

// Open modal
authButton.addEventListener('click', (e) => {
  e.preventDefault();
  authModal.style.display = 'flex';
});

// Close modal
closeModal.onclick = () => {
  authModal.style.display = 'none';
  authMessage.textContent = '';
};
window.onclick = (e) => {
  if (e.target === authModal) {
    authModal.style.display = 'none';
    authMessage.textContent = '';
  }
};

// Toggle Login / Sign Up
showLogin.onclick = () => {
  isLoginMode = true;
  showLogin.classList.add('active');
  showSignup.classList.remove('active');
  modalTitle.textContent = 'Sign In';
  authSubmit.textContent = 'Sign In';
};
showSignup.onclick = () => {
  isLoginMode = false;
  showSignup.classList.add('active');
  showLogin.classList.remove('active');
  modalTitle.textContent = 'Create Account';
  authSubmit.textContent = 'Sign Up';
};

// Form submit
authForm.onsubmit = (e) => {
  e.preventDefault();
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPassword').value;

  authMessage.textContent = 'Please wait...';

  if (isLoginMode) {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        authModal.style.display = 'none';
        authMessage.textContent = '';
      })
      .catch(err => authMessage.textContent = err.message);
  } else {
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        authModal.style.display = 'none';
        authMessage.textContent = '';
      })
      .catch(err => authMessage.textContent = err.message);
  }
};

// Update navbar button (Sign In to Logout)
auth.onAuthStateChanged(user => {
  if (user) {
    authButton.textContent = 'Logout';
  } else {
    authButton.textContent = 'Sign In';
  }
});

// Re-attach correct behavior after login/logout
authButton.addEventListener('click', function(e) {
  e.preventDefault();
  if (authButton.textContent === 'Logout') {
    auth.signOut().then(() => {
      authButton.textContent = 'Sign In';
    });
  } else {
    authModal.style.display = 'flex';
  }
});

// ==================== SMOOTH SCROLL FOR ALL NAV LINKS (FIXED!) ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ==================== PROPERTY FILTERING & SEARCH ====================
document.addEventListener('DOMContentLoaded', function () {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const propertyCards = document.querySelectorAll('.property-card');
  const searchBtn = document.getElementById('searchBtn');
  const searchArea = document.getElementById('searchArea');
  const propertyType = document.getElementById('propertyType');
  const priceRange = document.getElementById('priceRange');
  const searchResults = document.getElementById('searchResults');

  // Category Filter Buttons
  filterButtons.forEach(button => {
    button.addEventListener('click', function () {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');

      const filterValue = this.getAttribute('data-filter');

      propertyCards.forEach(card => {
        if (filterValue === 'all' || card.classList.contains(filterValue)) {
          card.style.display = 'block';
          card.classList.remove('hidden');
        } else {
          card.style.display = 'none';
          card.classList.add('hidden');
        }
      });
    });
  });

  // Search Functionality
  function performSearch() {
    const area = searchArea.value.toLowerCase().trim();
    const type = propertyType.value;
    const price = priceRange.value;

    let visibleCount = 0;

    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');

    propertyCards.forEach(card => {
      let showCard = true;

      if (area !== '') {
        const cardArea = (card.getAttribute('data-area') || '').toLowerCase();
        const cardTitle = card.querySelector('h3').textContent.toLowerCase();
        if (!cardArea.includes(area) && !cardTitle.includes(area)) showCard = false;
      }

      if (type !== '' && showCard) {
        const typeMap = { 'flat': 'apartment', 'house': 'house', 'plot': 'plot', 'commercial': 'commercial' };
        if (!card.classList.contains(typeMap[type] || type)) showCard = false;
      }

      if (price !== '' && showCard) {
        const cardPrice = parseFloat(card.getAttribute('data-price')) || 0;
        switch (price) {
          case '0-50': showCard = cardPrice <= 50; break;
          case '50-100': showCard = cardPrice > 50 && cardPrice <= 100; break;
          case '100-200': showCard = cardPrice > 100 && cardPrice <= 200; break;
          case '200+': showCard = cardPrice > 200; break;
        }
      }

      if (showCard) {
        card.style.display = 'block';
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });

    searchResults.className = visibleCount === 0 
      ? 'search-results-message show no-results'
      : 'search-results-message show has-results';
    searchResults.textContent = visibleCount === 0 
      ? 'No properties found. Try different filters.'
      : `Found ${visibleCount} propert${visibleCount === 1 ? 'y' : 'ies'}`;

    document.getElementById('properties').scrollIntoView({ behavior: 'smooth' });
  }

  searchBtn.addEventListener('click', performSearch);
  searchArea.addEventListener('keypress', e => { if (e.key === 'Enter') performSearch(); });
});

// ==================== CALCULATORS ====================
function calculateEMI() {
  const loan = parseFloat(document.getElementById('loanAmount').value);
  const rate = parseFloat(document.getElementById('interestRate').value);
  const years = parseFloat(document.getElementById('loanTerm').value);

  if (isNaN(loan) || isNaN(rate) || isNaN(years) || years === 0) {
    document.getElementById('emiResult').textContent = 'Please enter valid values';
    return;
  }

  const monthlyRate = rate / 12 / 100;
  const months = years * 12;
  const emi = loan * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);

  document.getElementById('emiResult').textContent = `Monthly EMI: ৳${emi.toFixed(2)}`;
}

function calculatePSF() {
  const price = parseFloat(document.getElementById('totalPrice').value);
  const area = parseFloat(document.getElementById('areaSqFt').value);

  if (isNaN(price) || isNaN(area) || area === 0) {
    document.getElementById('psfResult').textContent = 'Please enter valid values';
    return;
  }

  document.getElementById('psfResult').textContent = `Price per Sq.Ft: ৳${(price / area).toFixed(2)}`;
}