/** 09/29/15  Gin Wang
    Udacity Project 5 Neighborhood Map Project
    http://gincwang.github.io/P5-1-Neighborhood-Map-Project/ **/
var app = app || {};

(function($){
"use strict";

/**
  * @desc called by google maps api callback when loaded, to initialize all the objects and bindings
  * @param  none
  * @return none
*/
app.load = function() {
    var nvm = new app.NeighborhoodViewModel();
    ko.applyBindings(nvm);
    nvm.load();
}

/**
  * @desc model for storing location-related parameters
  * @param  none
  * @return none
*/
var LocationModel = function() {
    var self = this;

    self.markers = [];
    self.markersInfo = ko.observableArray();
    self.listVisibleArray = ko.observableArray();
    self.foursquareIDs = [];
};

/**
  * @desc model for storing filter-related parameters
  * @param  none
  * @return none
*/
var FilterModel = function() {
    var self = this;

    self.availablePrice = ['$', '$$', '$$$', '$$$$'];
    self.price = ko.observableArray();
    self.rating = ko.observable(1);
};

/**
  * @desc main viewmodel, controls everything on map
  * @param  none
  * @return none
*/
app.NeighborhoodViewModel = function() {
    var self = this;

    self.map = null;
    self.locations = new LocationModel();
    self.filters = new FilterModel();
    self.searchText = $('#searchField');
    self.searchBox;

    self.listVisible = ko.observable(true);
    self.detailVisible = ko.observable(false);
    self.hoverMarker = null;
    self.selectedMarker = null;
    self.selectedMarkerInfo = ko.observable();
    self.placeService = null;
    self.wikiText = ko.observable();

    /**
        @desc - gets called to populate everything on map
        @param - none
        @return - none
    */
    self.load = function() {
        $("#map").text = "";         //clear the error text
        createMap();
        initializeMarkers();
    };

    /**
        @desc - VM has 2 markers - the hover marker and selected marker, and they
                are initialized here, but not yet added to map
        @param - none
        @return - none
    */
    var initializeMarkers = function(){
        if(typeof google === "object" && typeof google.maps === "object"){
            self.selectedMarker = new google.maps.Marker({
                position: {lat:0, lng:0}
            });
            self.hoverMarker = new google.maps.Marker({
                position: {lat:0, lng:0}
            });
        }else {
            console.log("google maps wasn't loaded properly");
        }
    };

    /**
        @desc - populates marker with _data location info
        @param - marker: google.maps.Marker object,
                  _data: location object with Lat/Lng and name property
        @return - none
    */
    self.showMarker = function(marker,_data){
        marker.title = _data.name;
        marker.position = new google.maps.LatLng(_data.geometry.H, _data.geometry.L, false);
        marker.setMap(self.map);
    };

    /**
        @desc - removes marker from map view
        @param - marker: google.maps.Marker object
        @return - none
    */
    self.removeMarker = function(marker) {
        marker.setMap(null);
    };

    /**
        @desc - show location detail view and selected marker on map
        @param - marker: google.maps.Marker object
                  _data: location object with Lat/Lng and name property
        @return - none
    */
    self.showDetail = function(marker,_data){
        //console.log("show detail");
        self.listVisible(false);
        self.detailVisible(true);
        //remove the duplicate marker when "selected marker" on it is active
        self.locations.markers.forEach(function (mk) {
            if(Math.abs(mk.position.H - _data.geometry.H) < 0.00001 && Math.abs(mk.position.L - _data.geometry.L) < 0.00001){
                console.log("match found");
                self.removeMarker(mk);
            }
        });
        self.showMarker(marker,_data);
        self.selectedMarkerInfo(_data);
        self.selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function(){
              self.selectedMarker.setAnimation(null);
        }, 700);
    };
    /**
        @desc - hides location detail view, and remove selected marker from map
        @param - none
        @return - none
    */
    self.hideDetail = function(){
        //console.log("hide Detail");
        var smi = self.selectedMarkerInfo();
        self.detailVisible(false);
        self.listVisible(true);
        if(smi){
            self.locations.markers.forEach(function (mk) {
                if((mk.position.H - smi.geometry.H) < 0.00001 && (mk.position.L - smi.geometry.L) < 0.00001){
                    mk.setMap(self.map);
                }
            });
        }
        self.removeMarker(self.selectedMarker);
        self.selectedMarkerInfo(null);
    };

    /**
        @desc - reset all map variables except search text
        @param - none
        @return - none
    */
    var clearMapVisible = function(){
        self.locations.markersInfo.removeAll();
        self.locations.markers.forEach(function(marker) {
            marker.setMap(null);
        });
        self.locations.markers = [];
        self.listVisible(true);
        self.detailVisible(false);
        self.selectedMarkerInfo(null);
        self.wikiText('');
        self.locations.foursquareIDs = [];
    };

    /**
        @desc - reset all map variables, including search text
        @param - none
        @return - none
    */
    self.resetSearch = function(){
        console.log("reset search()");
        self.searchText[0].value = "";
        clearMapVisible();
    };

    /**
        @desc - slide in and out the filter menu
        @param - none
        @return - none
    */
    self.toggleFilter = function(){
        $(".filter-group").toggleClass("slide");
    };


    /**
        @desc - filter out location data based on current result filter
        @param - none
        @return - none
    */
    self.filterResults = function(){

        var place = null;
        for(var i=0, length = self.locations.markersInfo().length; i < length; i++){
            /*goes through each markersInfo object and compare criteria against
            currently selected filters*/
            place = self.locations.markersInfo()[i];
            var showPrice = false;
            var showRating = false;

            //check against price filter
            if(self.filters.price().length === 0){      //no price filter
                console.log("no price filter");
                showPrice = true;
            }else {
                if(place.price){
                    for(var j = 0; j < self.filters.price().length; j++){
                        if(place.price === self.filters.price()[j]){
                            console.log("price matched!" + place.price + " " + self.filters.price()[j]);
                            showPrice = true;
                            break;
                        }
                    }
                }
            }

            //check against rating filter
            if(self.filters.rating() <= 1){    //no rating filter
                showRating = true;
            }else {
                if(place.rating){
                    if(place.rating >= self.filters.rating()){
                        console.log("rating matched!" + place.rating + " " + self.filters.rating());
                        showRating = true;
                    }
                }
            }

            //markersInfo object is only shown if both Price and Rating filters have been satisfied
            if(showPrice === true && showRating === true){
                //this location is shown
                place.visible = true;
                //in order to trigger observableArray update for object field changes, need
                //to remove the object and add it back to the array
                self.locations.markersInfo.splice(i, 1);
                self.locations.markersInfo.splice(i, 0, place);
                self.locations.markers[i].setMap(self.map);
            }else {
                //this location is filtered
                place.visible = false;
                //in order to trigger observableArray update for object field changes, need
                //to remove the object and add it back to the array
                self.locations.markersInfo.splice(i, 1);
                self.locations.markersInfo.splice(i, 0, place);
                self.locations.markers[i].setMap(null);
            }
        }
    };

    /**
      * @desc - gets wikipedia intro paragraph for locations with type "locality"
      * @param - none
      * @return - none
    */
    var getWikiSearch = function(address){
        //filter out country text from the address
        var regex = /,\sUSA/;
        var regex2 = /\s/g;
        var regex3 = /,/;
        var add = address.replace(regex, "").replace(regex2,"%20").replace(regex3,"%2C");

        var wikiRequestTimeout = setTimeout(function(){
            self.wikiText("Failed to get wikipedia resources");
        }, 8000);

        var wikiUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exsentences=4&exintro=&explaintext=&exsectionformat=plain&titles=" + add + "&generator=redirects&redirects=&grdprop=title&callback=wikiCallback";

        $.ajax({
              url: wikiUrl,
              dataType: 'jsonp',
              jsonp: 'callback',
              success: function(response){
                  for(var key in response.query.pages){
                      self.wikiText(response.query.pages[key].extract);
                      clearTimeout(wikiRequestTimeout);
                  }
              }
          });

      };

      /**
          @desc - gets location info from foursquare API, then populate venue details to markersInfo array and set up markers on the map
          @param - _name: search text
                   _geometry: location data with LatLng
          @return - none
      */
      var getFoursquarePlaces = function(_name, _geometry) {
          //not secure for client-side app
          var client_id = "5OEUZBD0W0WYJWSM5MF55Y2ZVCXBYKAMJCNCIYOEXFMDEIPK";
          var client_secret = "0FBED51EERO35ZVHFV5BHQSDA52QDRMC55QMVU2U23LBRXL2";
          var regex = /,/;
          _name = _name.replace(regex, "");
          //fetch at most 20 results
          var url = "https://api.foursquare.com/v2/venues/search?query=" + _name + "&ll=" + _geometry.lat() + "," + _geometry.lng() + "&limit=20&client_id=" + client_id + "&client_secret=" + client_secret + "&v=20150927";

          var foursquareRequestTimeout = setTimeout(function(){
              window.alert("foursquare API can't be reached");
          }, 8000);

          $.ajax({
              url: url,
              dataType: 'jsonp',
              jsonp: 'callback',
              success: function(response){
                  clearTimeout(foursquareRequestTimeout);
                  //store all venue id to model's foursquareID
                  var venuesLength = response.response.venues.length;
                  for(var i = 0; i < venuesLength; i++){
                      self.locations.foursquareIDs.push(response.response.venues[i].id);
                  }

                  //for each foursquareID, fire off ajax request for location details
                  self.locations.foursquareIDs.forEach(function(id){
                      var detailUrl = "https://api.foursquare.com/v2/venues/" + id + "?&client_id=" + client_id + "&client_secret=" + client_secret + "&v=20150927";

                      $.ajax({
                          url: detailUrl,
                          dataType: 'jsonp',
                          jsonp: 'callback',
                          success: function(response){
                              //store location detail into model's markersInfo array
                              var venueInfo = response.response.venue;
                              //need to pre-process a few fields that might give access error when stored
                              var photoObject = null;
                              var priceObject = null;
                              var tipsObject = null;
                              var typesObject = null;
                              if(venueInfo.bestPhoto){
                                  photoObject = {pre: venueInfo.bestPhoto.prefix, suf:venueInfo.bestPhoto.suffix};
                              }
                              if(venueInfo.price){
                                  priceObject = "";
                                  var tier = venueInfo.price.tier;
                                  for(var i=0; i<tier; i++){
                                      priceObject = priceObject.concat("$");
                                  }
                              }
                              if(venueInfo.tips){
                                  tipsObject = venueInfo.tips.groups[0].items;
                                  var cutOff = 3;
                                  if(tipsObject.length > cutOff){
                                      tipsObject.splice(cutOff, tipsObject.length - cutOff);
                                  }
                              }
                              if(venueInfo.categories.length > 0){
                                  typesObject = venueInfo.categories[0].name;
                              }


                              //push location into markersInfo array
                              self.locations.markersInfo.push({
                                  name: venueInfo.name,
                                  address: venueInfo.location.address + ", " + venueInfo.location.formattedAddress[1],
                                  website: venueInfo.url,
                                  phone: venueInfo.contact,
                                  photo: photoObject,
                                  rating: venueInfo.rating,
                                  ratingColor: venueInfo.ratingColor,
                                  hours: venueInfo.hours,
                                  price: priceObject,
                                  tips: tipsObject,
                                  types: typesObject,
                                  geometry: {H: venueInfo.location.lat, L: venueInfo.location.lng},
                                  id: venueInfo.id,
                                  visible: true
                              });

                              //add a new marker onto map for each markersInfo object
                              var markerLength = self.locations.markersInfo().length;
                              (function(venueCopy){
                                  self.locations.markers.push(new google.maps.Marker({
                                      map: self.map,
                                      icon: "https://playfoursquare.s3.amazonaws.com/press/2014/foursquare-icon-16x16.png",         //use foursquare logo as attribution
                                      title: venueCopy.name,
                                      position: {lat: venueCopy.location.lat, lng: venueCopy.location.lng},
                                      animation: google.maps.Animation.DROP
                                  }));

                                  //add click listener to each marker
                                  self.locations.markers[self.locations.markers.length-1].addListener('click',(function(index){
                                      return function(){
                                          console.log("marker clicked");
                                          self.showDetail(self.selectedMarker, self.locations.markersInfo()[markerLength - 1]);
                                      };
                                  })());
                              })(venueInfo);

                      }
                  })
              })
              //since foursquare locations don't have recommended viewport settings built-in,
              //choose a convenient zoom level that's similar to foursquare search radius
              self.map.setZoom(12);
          }
        })
    };

      /**
        * @desc creates the map object, and add all map listeners
        * @param  none
        * @return none
      */
     var createMap = function() {
        if( typeof google === "object" && typeof google.maps === "object"){

             //initialize a map centering on San Jose, CA
            self.map = new google.maps.Map(document.getElementById('map'), {
              center: {lat: 37.351073, lng:-121.887451},
              scrollwheel: true,
              panControl: false,
              mapTypeControl: false,
              zoom: 11,
              zoomControlOptions: {
                  style: google.maps.ZoomControlStyle.SMALL,
                  position: google.maps.ControlPosition.RIGHT_BOTTOM
              },
              styles: [
                        {
                          "elementType": "labels.text",
                          "stylers": [
                            { "visibility": "off" }
                          ]
                        },{
                          "featureType": "administrative.locality",
                          "stylers": [
                            { "visibility": "on" }
                          ]
                        }
                      ]
            });

            //try to get user's IP location as the new map center
            var initialLocation;
            var initialSearchText = "sushi";
            if(navigator.geolocation) {
               //browserSupportFlag = true;
               navigator.geolocation.getCurrentPosition(function(position) {
                   console.log(position);
                 initialLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
                 self.map.setCenter(initialLocation);
                 self.searchText[0].value = initialSearchText;
                 getFoursquarePlaces(initialSearchText, self.map.getCenter());
               }, function() {
                   console.log("no geolocation");
                   //still fail
                // handleNoGeolocation(browserSupportFlag);
                self.searchText[0].value = initialSearchText;
                getFoursquarePlaces(initialSearchText, self.map.getCenter());
               });
           }else {
               console.log("geolocation not supported..");
                self.searchText[0].value = initialSearchText;
                getFoursquarePlaces(initialSearchText, self.map.getCenter());
           }

            //// MAP UI ////
            //add filter buttons to map
            var toggleFilter = document.getElementById("filter-toggle");
            var dollarFilter = document.getElementById("dollarInput");
            var ratingFilter = document.getElementById("ratingInput");
            var filterButton = document.getElementById("filterBtn");
            self.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(toggleFilter);
            self.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(dollarFilter);
            self.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(ratingFilter);
            self.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(filterButton);

            // Assign the search box and link it to the UI element.
           var input = document.getElementById('searchField');
           self.searchBox = new google.maps.places.SearchBox(input);
           self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(input);
           //Assign the clear-search button next to search bar
           var clearButton = document.getElementById("clear-search");
           self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(clearButton);

           //Assign the sideList to display
           var sideList = document.getElementById("side-list");
           self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(sideList);

           //Assign detail box below sideLIst
           var listDetail = document.getElementById("list-detail");
           listDetail.index = 10;
           self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(listDetail);
           //Activate google autocomplete service
           self.service = new google.maps.places.PlacesService(self.map);



           //// MAP LISTENERS ////
           //hide currently selected marker
           self.map.addListener('click', function(){
               if(self.selectedMarkerInfo){self.hideDetail();}
           });

           // Bias the SearchBox results towards current map's viewport.
           self.map.addListener('bounds_changed', function() {
             self.searchBox.setBounds(self.map.getBounds());
           });

           // Listen for the event fired when the user selects a prediction and retrieve
           // more details for that place.
           self.searchBox.addListener('places_changed', changePlace);

        }else {
              console.log("google maps API wasn't loaded properly");
              window.alert("google maps wasn't loaded properly");
          }
      };

    var changePlace = function() {
          var place_api = '';
          //grabs results from searchBox
          var places = self.searchBox.getPlaces();
          var len = places.length;
          if (len === 0) {
                console.log("no Searchbox result");
                return;
           }else if (len === 1){
               place_api = 'GOOGLE';
               //when only one result is returned, it has to be a particular location.
               //when location is a city, wiki info request gets fired
               if(places[0].types[0] === "locality"){
                   console.log("make wiki request for " + places[0].formatted_address);
                   getWikiSearch(places[0].formatted_address);
               }
           }else if (places.length > 1){
               place_api = 'FOURSQUARE';
               //use foursquare API to search instead
               getFoursquarePlaces(self.searchText[0].value, self.map.getCenter());
           }

          // Clear out the old markers and list location info
          clearMapVisible();

          //creates marker for the google location, and adds it to markersInfo array.
          var bounds = new google.maps.LatLngBounds();
          var place;
          if(place_api === "GOOGLE"){
              //assumes there will only be one location when using GOOGLE api
              place = places[0];
              var icon = {
                  url: place.icon,
                  size: new google.maps.Size(50, 50),
                  origin: new google.maps.Point(0, 0),
                  anchor: new google.maps.Point(17, 34),
                  scaledSize: new google.maps.Size(25, 25)
              };
              //create marker for place
              (function(placeCopy){
                  self.locations.markers.push(new google.maps.Marker({
                      map: self.map,
                      icon: icon,
                      title: placeCopy.name,
                      position: placeCopy.geometry.location,
                      animation: google.maps.Animation.DROP
                  }));
                  //add click listener to each marker
                  self.locations.markers[0].addListener('click',(function(index){
                      return function(){
                          console.log("marker clicked");
                          self.showDetail(self.selectedMarker, self.locations.markersInfo()[0]);
                      };
                  })());
              })(place);

              //adjust google map zoom level based on recommendation
              if (place.geometry.viewport) {
                  // Only geocodes have viewport.
                  bounds.union(place.geometry.viewport);
              } else { bounds.extend(place.geometry.location); }
              self.map.fitBounds(bounds);

              //fires off ajax request for location detail.
              self.service.getDetails({placeId:place.place_id}, function(_place, _status) {
                   //no need to retrieve more info than necessary
                   if (_status === google.maps.places.PlacesServiceStatus.OK) {
                       self.locations.markersInfo.push({
                           name: _place.name,
                           address: _place.formatted_address,
                           website: null,
                           phone: null,
                           photo: null,
                           rating: null,
                           price: null,
                           hours: null,
                           tips: null,
                           types: _place.types,
                           geometry: _place.geometry.location,
                           id: _place.place_id,
                           visible: true
                       });
                       //console.log(self.locations.markersInfo());
                   }else if (_status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
                     console.log("reaches query limit");
                   }else if (_status === google.maps.places.PlacesServiceStatus.ERROR){
                     console.log("error contacting google server for location details");
                     window.alert("can't retrieve info from google server");
                 }
               });

              }else if(place_api === "FOURSQUARE"){
                  //foursquare data is already populated from other request
              }
          };


    /**
      * @desc custom ko binding for fading in/out elements
      * @param  none
      * @return none
    */
    ko.bindingHandlers.fadeVisible = {
        init: function(element, valueAccessor) {
            // Initially set the element to be instantly visible/hidden depending on the value
            var value = valueAccessor();
            $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
        },
        update: function(element, valueAccessor) {
            // Whenever the value subsequently changes, slowly fade the element in or out
            var value = valueAccessor();
            if(ko.unwrap(value)){ $(element).fadeIn(); }
             else { $(element).fadeOut(); }
        }
    };

};

}(jQuery));
