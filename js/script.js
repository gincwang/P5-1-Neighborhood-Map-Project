
//Model storing each marker info
var LocationModel = function() {
    var self = this;

    self.markers = [];
    self.markersInfo = ko.observableArray();
}


//the viewmodel that controls all the views
var NeighborhoodViewModel = function() {
    var self = this;

    self.locations = new LocationModel();
    self.map = null;
    self.selectedMarker = null;

    self.init = function() {
        self.createMap();
    }

    self.createMap = function() {

        /* Google API Key: AIzaSyA8fuDDvxtlbFvtbiZJ7KqQiZiqlCSTRfk   */
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

        // Create the search box and link it to the UI element.
       var input = document.getElementById('searchField');
       var searchBox = new google.maps.places.SearchBox(input);
       self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

       //populate
       var sideList = document.getElementById("side-list");
       self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(sideList);

       // Bias the SearchBox results towards current map's viewport.
       self.map.addListener('bounds_changed', function() {
         console.log("bounds_changed()");
         searchBox.setBounds(self.map.getBounds());
       });


       // Listen for the event fired when the user selects a prediction and retrieve
       // more details for that place.
       searchBox.addListener('places_changed', function() {
          console.log("places_changed()");
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
          self.locations.markersInfo([]);

          // For each place, get the icon, name and location.
          var bounds = new google.maps.LatLngBounds();
          var count = 0;    //counter for marker animation delay when dropped
          places.forEach(function(place) {
              console.log(place);
              count++;

              self.locations.markersInfo.push({
                  name: place.name,
                  address: place.formatted_address}
              );

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

          self.map.fitBounds(bounds);
      });


    }

    //get the map started with the init()
    self.init();

}

ko.applyBindings(new NeighborhoodViewModel());
