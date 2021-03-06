// var restaurant;
var newMap;

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	initMap();
});

/**
 * Initialize leaflet map
 */
initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.newMap = L.map('map', {
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				zoom: 16,
				scrollWheelZoom: false
			});
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
				mapboxToken: 'pk.eyJ1IjoiaW12cG4yMiIsImEiOiJjaml2bnlycGExM3FuM3FxbTc0eWM2NHV2In0.ESs374xN3guFAGO_1EPdmQ',
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
				'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
				'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'
			}).addTo(newMap);
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
		}
	});
};

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
	if (error) { // Got an error!
	  console.error(error);
	} else {
	  self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		center: restaurant.latlng,
		scrollwheel: false
	  });
	  fillBreadcrumb();
	  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
	}
  });
} */

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = '<i class=\'fa fa-map-marker\'></i>' + restaurant.address;

	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.src = DBHelper.imageUrlForRestaurant(restaurant);
	if (image.src == 'http://localhost:8080/no-image') {
		image.classList.add('fallback-image-icon');
	}
	image.alt = `${restaurant.name} restaurant image`;

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}
	// fill reviews
	// Get the reviews data for restaurant
	DBHelper.fetchReviewsForRestaurant(restaurant.id, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			fillReviewsHTML(res);
			getLocalReviews();
		}
	});
};

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');
		row.setAttribute('tabindex', 0);

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = this.restaurant.reviews) => {
	const ul = document.getElementById('reviews-list');
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		noReviews.setAttribute('tabindex', 0);
		container.appendChild(noReviews);
		return;
	} else {
		reviews.forEach(review => {
			// ul.prepend(createReviewHTML(review));
			ul.insertBefore(createReviewHTML(review), ul.childNodes[ul.childNodes.length-2]);
		});
		// container.insertBefore(ul, container.lastChild);
	}
};

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	li.setAttribute('tabindex', 0);
	const name = document.createElement('p');
	name.className = 'review-user';
	name.innerHTML = '<i class=\'fa fa-user\'></i>' + review.name;
	name.setAttribute('tabindex', 0);
	li.appendChild(name);

	const date = document.createElement('p');
	date.className = 'review-date';
	date.innerHTML = `<i class='fa fa-calendar'></i> ${moment(review.createdAt).format('Do MMM YYYY')}`;
	date.setAttribute('tabindex', 0);
	li.appendChild(date);

	const rating = document.createElement('p');
	rating.className = 'review-rating';
	// rating.innerHTML = `<i class='fa fa-star'></i>Rating: ${review.rating}`;
	rating.innerHTML = '';
	rating.setAttribute('tabindex', 0);
	rating.setAttribute('aria-label', `Rating: ${review.rating} out of 5 stars`);

	// Filled star for rating
	for (i=0; i<review.rating; i++) {
		let star = document.createElement('i');
		star.className = 'fa fa-star checked';
		rating.appendChild(star);
	}
	for (i=review.rating; i<5; i++) {
		let star = document.createElement('i');
		star.className = 'far fa-star';
		rating.appendChild(star);
	}
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.className = 'review-comments';
	comments.innerHTML = review.comments;
	comments.setAttribute('tabindex', 0);
	li.appendChild(comments);

	return li;
};

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
	results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/* Function to handle Review form */
document.getElementById('newReviewForm')
	.addEventListener('submit', e => {
		e.preventDefault();
		e.stopImmediatePropagation();

		// calculate rating, name and review and store in a json
		let review = {};
		review.restaurant_id = self.restaurant.id;
		review.name = document.getElementById('userName').value;
		review.rating = document.querySelector('#star_rating input:checked')
					? document.querySelector('#star_rating input:checked').value : 5;
		review.comments = document.getElementById('userComment').value;
		review.createdAt = moment();

		// Validate data first

		// Save this into Localstore
		addReviewToLocalStore(review);

		// Clear form
		e.target.reset();
})


/* Fetch reviews from server*/
getReviewsFromServer = (restaurantId) => {
	fetch(`http://localhost:1337/reviews/?restaurant_id=${restaurantId}`, {
		method: 'GET'
	}).then(res => res.json())
	.then(res => {
		fillReviewsHTML(res);
	}).catch(err => {
		console.log(`Unable to fetch review, Error: ${err}`);
		return null;
	});
}

/* Fetch POST review*/
addReviewToServer = (review, callback) => {
	fetch(`http://localhost:1337/reviews/`, {
		method: 'POST',
		headers: {
            "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(review)
	}).then(res => res.json()).then(res => {
		callback(null, res);
	}).catch(err => {
		callback(err, null);
	});
}

// Define array for storing new reviews
let newReviews = localStorage.getItem('newReviews') ? JSON.parse(localStorage.getItem('newReviews')) : [];
localStorage.setItem('newReviews', JSON.stringify(newReviews));

addReviewToLocalStore = (review) => {
	if (navigator.onLine) {
		addReviewToServer(review, (err, res) => {
			if (err) {
				console.log(`Failed to add review, Error: ${err}`);
			} else {
				// Add new review to IndexDB
				IDbOperationsHelper.addReviewToIdb(res);
			}
		});
	} else {
		newReviews.push(review);
		localStorage.setItem('newReviews', JSON.stringify(newReviews));
	}
	fillReviewsHTML([review]);
};

getLocalReviews = () => {
	let localReviews = JSON.parse(localStorage.getItem('newReviews'));
	localReviews = localReviews.filter(r => r.restaurant_id == self.restaurant.id);
	fillReviewsHTML(localReviews);
};

// Now check for Online network
window.addEventListener('online',  () => {
	let localReviews = JSON.parse(localStorage.getItem('newReviews'));
	localReviews.forEach(review => {
		addReviewToServer(review, (err, res) => {
			if (err) {
				console.log(`Failed to add review, Error: ${err}`);
			} else {
				// Add new review to IndexDB
				IDbOperationsHelper.addReviewToIdb(res);
			}
		});
		// Delete review from local store
		window.localStorage.removeItem('newReviews');
	})

});
