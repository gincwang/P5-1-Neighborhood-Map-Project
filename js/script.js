(function($){

//Model storing each marker info
var LocationModel = function() {
    var self = this;

    self.markers = [];
    self.placeIDs = [];
    self.markersInfo = ko.observableArray();
}


//the viewmodel that controls all the views
var NeighborhoodViewModel = function() {
    var self = this;

    self.locations = new LocationModel();
    self.map = null;
    self.selectedMarker = null;
    self.placeService = null;
    self.searchText = $('#searchField');

    self.init = function() {
        self.createMap();
    }
    
    self.showMarker = function(){
        console.log("list item is hovered");
        if(!self.selectedMarker){
            self.selectedMarker = new google.maps.Marker({
                map: self.map,
                title: this.name,
                position: this.geometry.location
            });
        }else if(self.selectedMarker.position != this.geometry.location){
            self.selectedMarker.setMap(null);
            self.selectedMarker = new google.maps.Marker({
                map: self.map,
                title: this.name,
                position: this.geometry.location
            });
        }else {
            return;
        }
    }

    self.removeMarker = function() {
        self.selectedMarker.setMap(null);
        self.selectedMarker = null;
    }

    self.createMap = function() {

        /* Google API Key: AIzaSyA8fuDDvxtlbFvtbiZJ7KqQiZiqlCSTRfk  */
        console.log("self.createMap()")
         //initialize a map centering on the USA
        self.map = new google.maps.Map(document.getElementById('map'), {
          center: {lat: 39.388, lng: -100.279},
          scrollwheel: true,
          panControl: false,
          zoom: 5,
          zoomControlOptions: {
              style: google.maps.ZoomControlStyle.SMALL,
              position: google.maps.ControlPosition.RIGHT_BOTTOM
          },
          mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
              position: google.maps.ControlPosition.TOP_RIGHT
          }
        });

        // Assign the search box and link it to the UI element.
       var input = document.getElementById('searchField');
       var searchBox = new google.maps.places.SearchBox(input);
       self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

       //Assign the clear-search button next to search bar
       var clearButton = document.getElementById("clear-search");
       self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(clearButton);

       //Assign the sideLIst to display
       var sideList = document.getElementById("side-list");
       self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(sideList);

       self.service = new google.maps.places.PlacesService(self.map);

       // Bias the SearchBox results towards current map's viewport.
       self.map.addListener('bounds_changed', function() {
         console.log("bounds_changed()");
         searchBox.setBounds(self.map.getBounds());
       });


       // Listen for the event fired when the user selects a prediction and retrieve
       // more details for that place.
       searchBox.addListener('places_changed', function() {
          console.log("places_changed()");
          //grabs results from searchBox
          var places = searchBox.getPlaces();

          if (places.length == 0) {
            //no match was found
           return;
          }

          // Clear out the old markers and list location info
          self.locations.markers.forEach(function(marker) {
              marker.setMap(null);
          });
          self.locations.markers = [];
          self.locations.markersInfo.removeAll();
          self.locations.placeIDs = [];
          console.log("clearing variables")
          console.log(self.locations.markersInfo());

          // For each place, create a new marker and grab the place_id
          var bounds = new google.maps.LatLngBounds();
          var count = 0;    //counter for marker animation delay when dropped
          places.forEach(function(place) {
              count++;
              //console.log(place);

              self.locations.placeIDs.push({
                  placeId: place.place_id
              });


              var icon = {
                  url: place.icon,
                  size: new google.maps.Size(50, 50),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(17, 34),
                  scaledSize: new google.maps.Size(25, 25)
              };

              //add marker to marker array for each place onto the map
              setTimeout(function(){
                  self.locations.markers.push(new google.maps.Marker({
                      map: self.map,
                      icon: icon,
                      title: place.name,
                      position: place.geometry.location,
                      animation: google.maps.Animation.DROP
                  }));

              }, 50 * count);


              if (place.geometry.viewport) {
                  // Only geocodes have viewport.
                  bounds.union(place.geometry.viewport);
              } else {
                  bounds.extend(place.geometry.location);
              }
          });


          //For each place_id, grab additional info about the place
          self.locations.placeIDs.forEach(function(id){
              self.service.getDetails(id, function(place, status) {
                  //console.log(place);
                  if (status === google.maps.places.PlacesServiceStatus.OK) {
                      console.log(place);
                      self.locations.markersInfo.push({
                          name: place.name,
                          address: place.formatted_address,
                          website: place.website,
                          phone: place.formatted_phone_number,
                          photos: place.photos,
                          rating: place.rating,
                          price_level: place.price_level,
                          opening_hours: place.opening_hours,
                          reviews: place.reviews,
                          types: place.types,
                          geometry: place.geometry
                      });

                      //console.log(self.locations.markersInfo()[0].photos[0].getUrl({'maxWidth': 35, 'maxHeight': 35}));
                  }
                  });
          });

          self.map.fitBounds(bounds);
      });


    }

    self.resetSearch = function(){
        console.log("reset search()");
        self.searchText[0].value = "";

        self.locations.markersInfo.removeAll();

        self.locations.markers.forEach(function(marker) {
            marker.setMap(null);
        });

        self.locations.markers = [];
        self.locations.placeIDs = [];
        //console.log(self.locations);
    }

    //get the map started with the init()
    self.init();




}

ko.applyBindings(new NeighborhoodViewModel());

}(jQuery));
