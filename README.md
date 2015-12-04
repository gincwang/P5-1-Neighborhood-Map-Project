# P5-1-Neighborhood-Map-Project
Click here for the project on github:
http://gincwang.github.io/P5-1-Neighborhood-Map-Project/

Framework/Libraries: Knockout.js, jQuery

API: Google Maps API, Foursquare API, Wikipedia API

## How to use this map
  * The map will default to San Jose, CA on initial load, and if you grant webpage access to your current location, it will move your map to the new location.
  * By default the search result returns items with keyword "sushi", the number of result will depend on your location.
  * You can click on any result from the list, and details about the location should expand.
  * When you hover over any item from the list, the corresponding marker should appear on map.
  * You can type in the search bar to search for a city or any type of business.
  * On the top right corner are your filters, which you can use to filter your results based on Price/Ratings.
  * For filtering price, you can click on any of the "$" to select single items, or hold down "ctrl" key when you click to select multiple items.
  * For filtering rating, you can choose from number between 1 ~ 9, and the filter will weed out any location with rating lower than that number.
  * Click the "Filter" button to filter your results.

## Features

### Searching
* Autocomplete feature is powered by Google
* if you search for a city location, the location data will come from Google.
* Searching for city (e.g. 'San Jose, CA') will fetch a few intro paragraph from Wikipedia to display in location detail.
* Searching for anything else, the location data will come from Foursquare.

### Filtering
* You have the option to either filter your results by Price/Rating.
* Use "ctrl" click to select/deselect multiple Price filters.
* Choose between 1-9 to filter out any location with rating less than that number.


## Limitations
* No meaningful location detail will display if you search for a particular address, like "123 Mango St, City, State" - instead, search for point of interest terms like "coffee" or "starbucks" or "mcdonalds" 
