// Property Filtering Functionality
document.addEventListener('DOMContentLoaded', function() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const propertyCards = document.querySelectorAll('.property-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      const filterValue = this.getAttribute('data-filter');
      
      // Show/hide property cards based on filter
      propertyCards.forEach(card => {
        if (filterValue === 'all') {
          card.style.display = 'block';
          card.classList.remove('hidden');
        } else {
          if (card.classList.contains(filterValue)) {
            card.style.display = 'block';
            card.classList.remove('hidden');
          } else {
            card.style.display = 'none';
            card.classList.add('hidden');
          }
        }
      });
    });
  });
  
  // Search Functionality
  const searchBtn = document.getElementById('searchBtn');
  const searchArea = document.getElementById('searchArea');
  const propertyType = document.getElementById('propertyType');
  const priceRange = document.getElementById('priceRange');
  const searchResults = document.getElementById('searchResults');
  
  searchBtn.addEventListener('click', function() {
    performSearch();
  });
  
  // Allow Enter key to trigger search
  searchArea.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
  
  function performSearch() {
    const area = searchArea.value.toLowerCase().trim();
    const type = propertyType.value;
    const price = priceRange.value;
    
    let visibleCount = 0;
    
    // Reset all filter buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');
    
    propertyCards.forEach(card => {
      let showCard = true;
      
      // Check area/location match
      if (area !== '') {
        const cardArea = card.getAttribute('data-area') || '';
        const cardTitle = card.querySelector('h3').textContent.toLowerCase();
        
        if (!cardArea.includes(area) && !cardTitle.includes(area)) {
          showCard = false;
        }
      }
      
      // Check property type match
      if (type !== '' && showCard) {
        const cardType = getCardType(type);
        if (!card.classList.contains(cardType)) {
          showCard = false;
        }
      }
      
      // Check price range match
      if (price !== '' && showCard) {
        const cardPrice = parseFloat(card.getAttribute('data-price')) || 0;
        
        if (!isPriceInRange(cardPrice, price)) {
          showCard = false;
        }
      }
      
      // Show or hide the card
      if (showCard) {
        card.style.display = 'block';
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.style.display = 'none';
        card.classList.add('hidden');
      }
    });
    
    // Display search results message
    displaySearchResults(visibleCount, area, type, price);
    
    // Scroll to properties section
    document.getElementById('properties').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
  
  function getCardType(selectedType) {
    const typeMap = {
      'flat': 'apartment',
      'house': 'house',
      'plot': 'plot',
      'commercial': 'commercial'
    };
    return typeMap[selectedType] || selectedType;
  }
  
  function isPriceInRange(cardPrice, priceRange) {
    // cardPrice is in lakh, convert to comparable format
    // Price ranges: "0-50", "50-100", "100-200", "200+"
    
    switch(priceRange) {
      case '0-50':
        return cardPrice < 50;
      case '50-100':
        return cardPrice >= 50 && cardPrice < 100;
      case '100-200':
        return cardPrice >= 100 && cardPrice < 200;
      case '200+':
        return cardPrice >= 200;
      default:
        return true;
    }
  }
  
  function displaySearchResults(count, area, type, price) {
    if (count === 0) {
      searchResults.className = 'search-results-message show no-results';
      searchResults.textContent = 'No properties found matching your criteria. Try adjusting your filters.';
    } else {
      searchResults.className = 'search-results-message show has-results';
      let message = `Found ${count} propert${count === 1 ? 'y' : 'ies'}`;
      
      const filters = [];
      if (area) filters.push(`in "${area}"`);
      if (type) filters.push(`type: ${type}`);
      if (price) filters.push(`price range: ${getPriceRangeText(price)}`);
      
      if (filters.length > 0) {
        message += ` matching ${filters.join(', ')}`;
      }
      
      searchResults.textContent = message;
    }
  }
  
  function getPriceRangeText(range) {
    const rangeMap = {
      '0-50': 'Up to 50 Lakh',
      '50-100': '50 Lakh - 1 Crore',
      '100-200': '1 - 2 Crore',
      '200+': 'Above 2 Crore'
    };
    return rangeMap[range] || range;
  }
});

// EMI Calculator Function
function calculateEMI() {
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const interestRate = parseFloat(document.getElementById('interestRate').value);
  const loanTerm = parseFloat(document.getElementById('loanTerm').value);
  
  if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm)) {
    document.getElementById('emiResult').textContent = 'Please enter valid numbers';
    return;
  }
  
  const monthlyInterestRate = interestRate / 12 / 100;
  const numberOfPayments = loanTerm * 12;
  
  const emi = loanAmount * monthlyInterestRate * 
              Math.pow(1 + monthlyInterestRate, numberOfPayments) / 
              (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
  
  document.getElementById('emiResult').textContent = 
    `Monthly EMI: ৳${emi.toFixed(2)}`;
}

// Price per Sq.Ft Calculator Function
function calculatePSF() {
  const totalPrice = parseFloat(document.getElementById('totalPrice').value);
  const areaSqFt = parseFloat(document.getElementById('areaSqFt').value);
  
  if (isNaN(totalPrice) || isNaN(areaSqFt)) {
    document.getElementById('psfResult').textContent = 'Please enter valid numbers';
    return;
  }
  
  const pricePerSqFt = totalPrice / areaSqFt;
  
  document.getElementById('psfResult').textContent = 
    `Price per Sq.Ft: ৳${pricePerSqFt.toFixed(2)}`;
}