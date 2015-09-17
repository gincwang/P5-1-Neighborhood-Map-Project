(function($){

//Model storing each marker info
var LocationModel = function() {
    var self = this;

    self.markers = [];
    self.markersInfo = ko.observableArray();
}


//the viewmodel that controls all the views
var NeighborhoodViewModel = function() {
    var self = this;

    self.map = null;
    self.locations = new LocationModel();
    self.searchText = $('#searchField');

    self.listVisible = ko.observable(true);
    self.detailVisible = ko.observable(false);
    self.selectedMarker = null;
    self.hoverMarker = null;
    self.selectedMarkerInfo = ko.observable();
    self.placeService = null;

/*Document*/
    self.init = function() {
        self.createMap();
        self.initializeMarkers();
    }
/*Document*/
    self.initializeMarkers = function(){

        self.selectedMarker = new google.maps.Marker({
            position: {lat:0, lng:0}
        });

        self.hoverMarker = new google.maps.Marker({
            position: {lat:0, lng:0}
        });
    }
/*Document*/
    self.showMarker = function(marker,_data){
        //console.log("show marker");
        //console.log(marker);
        //console.log(_data);
        marker.title = _data.name;
        marker.position = _data.geometry.location;
        marker.setMap(self.map);
        //console.log(marker);
        //console.log(self.selectedMarker);

    }
/*Document*/
    self.removeMarker = function(marker) {
        //console.log("remove Marker");
        //console.log(marker);
        marker.setMap(null);
        //console.log(marker);
    }
/*Document*/
    self.showDetail = function(marker,_data){
        //console.log("show detail");
        //console.log(marker);
        //console.log(_data);
        self.listVisible(false);
        self.detailVisible(true);
        self.showMarker(marker,_data);
        //self.selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
        self.selectedMarkerInfo(_data);
    }
/*Document*/
    self.hideDetail = function(){
        console.log("hide Detail");
        self.detailVisible(false);
        self.listVisible(true);
        self.removeMarker(self.selectedMarker);
        self.selectedMarkerInfo(null);
    }

    //clear everything except the search text
    var clearMapVisible = function(){
        self.locations.markersInfo.removeAll();
        self.locations.markers.forEach(function(marker) {
            marker.setMap(null);
        });
        self.locations.markers = [];
        self.listVisible(true);
        self.detailVisible(false);
        self.selectedMarkerInfo(null);
    }

    self.resetSearch = function(){
        console.log("reset search()");
        self.searchText[0].value = "";
        clearMapVisible();

        //console.log(self.locations);
    }

/*Document*/
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

        self.map.addListener('click', function(){
            console.log("map is clicked");
            if(self.selectedMarkerInfo){
                self.hideDetail();
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

       var listDetail = document.getElementById("list-detail");
       self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(listDetail);

       self.service = new google.maps.places.PlacesService(self.map);
/*Document*/
       // Bias the SearchBox results towards current map's viewport.
       self.map.addListener('bounds_changed', function() {
         console.log("bounds_changed()");
         searchBox.setBounds(self.map.getBounds());
       });

/*Document*/
       // Listen for the event fired when the user selects a prediction and retrieve
       // more details for that place.
       searchBox.addListener('places_changed', function() {
          console.log("places_changed()");
          //grabs results from searchBox
          var places = searchBox.getPlaces();
          if (places.length == 0) {
                //no match was found
                return;
           }else if (places.length > 10){
               //Don't grab more than 10 markers to avoid google's OVER_QUERY_LIMIT
                places.splice(9, places.length-10);
           }

          // Clear out the old markers and list location info
          console.log("clearing map variables (except search text)")
          clearMapVisible();

          // For each place, create a new marker and grab the place_id
          var bounds = new google.maps.LatLngBounds();
          var place;
          for(var k = 0; k < places.length; k++){
              place = places[k];

              var icon = {
                  url: place.icon,
                  size: new google.maps.Size(50, 50),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(17, 34),
                  scaledSize: new google.maps.Size(25, 25)
              };

              (function(placeCopy, kCopy){
                  setTimeout((function(){
                  //build marker array from place
                  self.locations.markers.push(new google.maps.Marker({
                      map: self.map,
                      icon: icon,
                      title: placeCopy.name,
                      position: placeCopy.geometry.location,
                      animation: google.maps.Animation.DROP
                  }));
                  //add click listener to each marker
                  self.locations.markers[kCopy].addListener('click',(function(index){
                      return function(){
                          console.log("marker clicked");
                          console.log(this.position);
                          console.log(self.locations.markersInfo()[0].geometry.location);
                          var j = self.locations.markersInfo().map(function(e){return e.geometry.location.H;}).indexOf(this.position.H);
                          var k = self.locations.markersInfo().map(function(e){return e.geometry.location.L;}).indexOf(this.position.L);
                          if(j===k){
                              self.showDetail(self.selectedMarker, self.locations.markersInfo()[j]);
                              self.selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
                              setTimeout(function(){
                                    self.selectedMarker.setAnimation(null);
                              }, 700);
                          }else {
                              console.log("can't match marker location info");
                          }
                      };
                  })(kCopy));
                }), 50*kCopy);
              })(place,k);

              if (place.geometry.viewport) {
                  // Only geocodes have viewport.
                  bounds.union(place.geometry.viewport);
              } else {
                  bounds.extend(place.geometry.location);
              }

              self.service.getDetails({placeId:place.place_id}, function(_place, status) {
                   console.log("build markersInfo array")
                   console.log(_place);
                 //  console.log(status);
                   if (status === google.maps.places.PlacesServiceStatus.OK) {
                     //  console.log(place);
                       self.locations.markersInfo.push({
                           name: _place.name,
                           address: _place.formatted_address,
                           website: _place.website,
                           phone: _place.formatted_phone_number,
                           photos: _place.photos,
                           rating: _place.rating,
                           price_level: _place.price_level,
                           opening_hours: _place.opening_hours,
                           reviews: _place.reviews,
                           types: _place.types,
                           geometry: _place.geometry,
                           id: _place.place_id
                       });
                       console.log("markersInfo array");
                       console.log(self.locations.markersInfo());
                   }else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
                     console.log("reaches query limit");
                 }else if (status === google.maps.places.PlacesServiceStatus.ERROR){
                     console.log("error contacting google server for location details");
                 }
               });
             }
              self.map.fitBounds(bounds);
          });
    }

    //get the map started with the init()
    self.init();

}

ko.applyBindings(new NeighborhoodViewModel());

}(jQuery));
