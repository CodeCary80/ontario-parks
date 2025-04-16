let selectedRating = 0;
        
// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const distance = urlParams.get('distance') || '2.1';
const elevation = urlParams.get('elevation') || '815';
const time = urlParams.get('time') || '0:03:54';
const trailName = urlParams.get('trail') || 'Whiskey Rapids Trail';

// Update stats with URL parameters if available
document.addEventListener('DOMContentLoaded', function() {
    // Update the stats from URL parameters
    document.querySelectorAll('.stat-value')[1].textContent = distance + ' km';
    document.querySelectorAll('.stat-value')[2].textContent = elevation + ' m';
    document.querySelectorAll('.stat-value')[3].textContent = time;
    
    // Set up star rating
    setupStarRating();
});

// Function to handle star rating
function setupStarRating() {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightStars(rating);
        });
        
        star.addEventListener('click', function() {
            selectedRating = parseInt(this.getAttribute('data-rating'));
            highlightStars(selectedRating);
        });
    });
    
    // Reset stars when mouse leaves rating container
    document.querySelector('.rating-stars').addEventListener('mouseleave', function() {
        highlightStars(selectedRating);
    });
}

// Function to highlight stars up to a certain rating
function highlightStars(rating) {
    const stars = document.querySelectorAll('.star');
    
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        if (starRating <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

// Function to submit the review
function submitReview() {
    const reviewText = document.querySelector('.review-textarea').value;
    
    if (selectedRating === 0) {
        alert('Please select a rating');
        return;
    }
    
    console.log('Review submitted:', {
        trail: trailName,
        rating: selectedRating,
        review: reviewText,
        distance: distance,
        elevation: elevation,
        time: time
    });
    
    // Show confirmation and redirect
    alert('Thank you for your review!');
    goToHome();
}

// Function to go back to home/selection page
function goToHome() {
    window.location.href = './index.html';
}