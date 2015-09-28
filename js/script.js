(function($){

//Model storing each marker info
var LocationModel = function() {
    var self = this;

    self.markers = [];
    self.markersInfo = ko.observableArray();
    self.foursquareIDs = [];
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
    self.wikiText = ko.observable();

/*Document*/
    var init = function() {
        createMap();
        initializeMarkers();
    }
/*Document*/
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
    }
/*Document*/
    self.showMarker = function(marker,_data){
        //console.log("show marker");
        marker.title = _data.name;
        marker.position = _data.geometry.location;
        marker.setMap(self.map);
    }
/*Document*/
    self.removeMarker = function(marker) {
        //console.log("remove Marker");
        marker.setMap(null);
    }
/*Document*/
    self.showDetail = function(marker,_data){
        //console.log("show detail");
        self.listVisible(false);
        self.detailVisible(true);
        self.showMarker(marker,_data);
        self.selectedMarkerInfo(_data);
    }
/*Document*/
    self.hideDetail = function(){
        //console.log("hide Detail");
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
        self.wikiText('');
        self.locations.foursquareIDs = [];
    }

    self.resetSearch = function(){
        console.log("reset search()");
        self.searchText[0].value = "";
        clearMapVisible();
    }

    var getWikiSearch = function(address){
        //filter out country text out of the address

        var regex = /,\sUSA/;
        var regex2 = /\s/g;
        var regex3 = /,/;
        var add = address.replace(regex, "").replace(regex2,"%20").replace(regex3,"%2C");
        //console.log(add);

        var wikiRequestTimeout = setTimeout(function(){
            self.wikiText("Failed to get wikipedia resources");
        }, 8000);

        var wikiUrl = "https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exsentences=4&exintro=&explaintext=&exsectionformat=plain&titles=" + add + "&generator=redirects&redirects=&grdprop=title&callback=wikiCallback";
        //console.log(wikiUrl);
        $.ajax({
              url: wikiUrl,
              dataType: 'jsonp',
              jsonp: 'callback',
              success: function(response){
                  for(key in response.query.pages){
                      //console.log(response.query.pages[key].extract);
                      self.wikiText(response.query.pages[key].extract);
                  }
              }
          });
          clearTimeout(wikiRequestTimeout);
      }


      var getFoursquarePlaces = function(_name, _geometry) {

          var client_id = "5OEUZBD0W0WYJWSM5MF55Y2ZVCXBYKAMJCNCIYOEXFMDEIPK";
          var client_secret = "0FBED51EERO35ZVHFV5BHQSDA52QDRMC55QMVU2U23LBRXL2";

          var regex = /,/;
          var regex2 = /\s/g;
          var regex3 = /\/\//;
          _name = _name.replace(regex, "");
          // https://api.foursquare.com/v2/venues/search
          var url = "https://api.foursquare.com/v2/venues/search?query=" + _name + "&ll=" + _geometry.H + "," + _geometry.L + "&limit=10&client_id=" + client_id + "&client_secret=" + client_secret + "&v=20150927";
          $.ajax({
              url: url,
              dataType: 'jsonp',
              jsonp: 'callback',
              success: function(response){
                 // console.log(response);
                  var venuesLength = response.response.venues.length;
                  for(var i = 0; i < venuesLength; i++){
                      self.locations.foursquareIDs.push(response.response.venues[i].id);
                  }
                  console.log(self.locations.foursquareIDs);
                  self.locations.foursquareIDs.forEach(function(id){
                      console.log(id);
                      var detailUrl = "https://api.foursquare.com/v2/venues/" + id + "?&client_id=" + client_id + "&client_secret=" + client_secret + "&v=20150927";
                      console.log(detailUrl);
                      $.ajax({
                          url: detailUrl,
                          dataType: 'jsonp',
                          jsonp: 'callback',
                          success: function(response){
                              console.log(response);
                              var venueInfo = response.response.venue;
                              self.locations.markersInfo.push({
                                  name: venueInfo.name,
                                  address: venueInfo.location.address + ", " + venueInfo.location.formattedAddress[1],
                                  website: venueInfo.url,
                                  phone: venueInfo.contact.formattedPhone,
                                  photo: null,
                                  rating: venueInfo.rating,
                                  hours: null,
                                  price: null,
                                  tips: venueInfo.tips,
                                  types: venueInfo.categories,
                                  geometry: {lat: venueInfo.location.lat, lng: venueInfo.location.lng},
                                  id: venueInfo.id
                              });
                              var markerLength = self.locations.markersInfo().length
                              if(venueInfo.hasOwnProperty("hours")){
                                  self.locations.markersInfo()[markerLength-1].hours = venueInfo.hours.status;
                              }
                              if(venueInfo.hasOwnProperty("price")){
                                  self.locations.markersInfo()[markerLength-1].price = venueInfo.price.currency;
                              }
                              if(venueInfo.hasOwnProperty("bestPhoto")){
                                  self.locations.markersInfo()[markerLength-1].photo = {pre: venueInfo.bestPhoto.prefix, suf:venueInfo.bestPhoto.suffix};
                              }

                              console.log("markersInfo");
                              console.log(self.locations.markersInfo());
                          }
                      })
                  })
              }
          })
      }

/*Document*/
     var createMap = function() {
        if( typeof google === "object" && typeof google.maps === "object"){

            /* Google API Key: AIzaSyA8fuDDvxtlbFvtbiZJ7KqQiZiqlCSTRfk  */
            console.log("creating map object..")
             //initialize a map centering on the USA
            self.map = new google.maps.Map(document.getElementById('map'), {
              center: {lat: 39.388, lng: -100.279},
              scrollwheel: true,
              panControl: false,
              mapTypeControl: false,
              zoom: 5,
              zoomControlOptions: {
                  style: google.maps.ZoomControlStyle.SMALL,
                  position: google.maps.ControlPosition.RIGHT_BOTTOM
              }
            });

            // MAP UI //
            // Assign the search box and link it to the UI element.
           var input = document.getElementById('searchField');
           var searchBox = new google.maps.places.SearchBox(input);
           self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
           //Assign the clear-search button next to search bar
           var clearButton = document.getElementById("clear-search");
           self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(clearButton);

           var dollarFilter = document.getElementById("dollar-filter");
           self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(dollarFilter);
           var starFilter = document.getElementById("star-filter");
           self.map.controls[google.maps.ControlPosition.TOP_LEFT].push(starFilter);

           //Assign the sideLIst to display
           var sideList = document.getElementById("side-list");
           self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(sideList);
           //Assign detail box below sideLIst
           var listDetail = document.getElementById("list-detail");
           listDetail.index = 1;        //takes the same spot as side-List
           self.map.controls[google.maps.ControlPosition.LEFT_TOP].push(listDetail);
           //Activate google autocomplete service
           self.service = new google.maps.places.PlacesService(self.map);

           // MAP LISTENERS //
    /*Document*/
           //hide currently selected marker
           self.map.addListener('click', function(){
               console.log("map is clicked");
               if(self.selectedMarkerInfo){self.hideDetail();}
           });
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
              var place_api = '';
              //grabs results from searchBox
              var places = searchBox.getPlaces();
              var len = places.length;
              if (len == 0) {
                    console.log("no Searchbox result");
                    return;
               }else if (len == 1){
                   place_api = 'GOOGLE';
                   //when only one result is returned, it has to be a particular location.
                   if(places[0].types[0] === "locality"){
                       console.log("make wiki request for " + places[0].formatted_address);
                       getWikiSearch(places[0].formatted_address);
                   }
               }else if (places.length > 1){
                   place_api = 'FOURSQUARE';
                   //use foursquare API to search instead
                   getFoursquarePlaces(self.searchText[0].value, self.map.getCenter());
                   //Don't grab more than 10 markers to avoid google's OVER_QUERY_LIMIT
                    places.splice(9, places.length-10);
               }

              // Clear out the old markers and list location info
              console.log("clearing map variables (except search text)")
              clearMapVisible();

              // For each place, create a new marker and grab the place_id
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
                              self.selectedMarker.setAnimation(google.maps.Animation.BOUNCE);
                              setTimeout(function(){
                                    self.selectedMarker.setAnimation(null);
                              }, 700);
                          };
                      }));
                  })(place);

                  if (place.geometry.viewport) {
                      // Only geocodes have viewport.
                      bounds.union(place.geometry.viewport);
                  } else {
                      bounds.extend(place.geometry.location);
                  }

                  self.map.fitBounds(bounds);

                  self.service.getDetails({placeId:place.place_id}, function(_place, _status) {
                       //console.log("build markersInfo array")
                       if (_status === google.maps.places.PlacesServiceStatus.OK) {
                           self.locations.markersInfo.push({
                               name: _place.name,
                               address: _place.formatted_address,
                               website: _place.website,
                               phone: _place.formatted_phone_number,
                               photo: null,
                               rating: _place.rating,
                               price: null,
                               hours: null,
                               types: _place.types,
                               geometry: _place.geometry,
                               id: _place.place_id,
                           });
                           //console.log(self.locations.markersInfo());
                       }else if (_status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
                         console.log("reaches query limit");
                       }else if (_status === google.maps.places.PlacesServiceStatus.ERROR){
                         console.log("error contacting google server for location details");
                     }
                   });

              }else if(place_api === "FOURSQUARE"){
                  console.log("checking for foursquare data");
                  console.log(self.locations.markersInfo());
              }

              /*
              for(var k = 0; k < places.length; k++){
                  place = places[k];
                  var icon = {
                      url: place.icon,
                      size: new google.maps.Size(50, 50),
                      origin: new google.maps.Point(0, 0),
                      anchor: new google.maps.Point(17, 34),
                      scaledSize: new google.maps.Size(25, 25)
                  };
                  //build marker array from place
                  (function(placeCopy, kCopy){
                      setTimeout((function(){
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
                              var j = self.locations.markersInfo().map(
                                            function(e){return e.geometry.location.H;}).indexOf(this.position.H);
                              var k = self.locations.markersInfo().map(
                                            function(e){return e.geometry.location.L;}).indexOf(this.position.L);
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
                  */

                  /*
                  //build markersInfo array
                  self.service.getDetails({placeId:place.place_id}, function(_place, _status) {
                       //console.log("build markersInfo array")
                       if (_status === google.maps.places.PlacesServiceStatus.OK) {
                           self.locations.markersInfo.push({
                               name: _place.name,
                               address: _place.formatted_address,
                               website: _place.website,
                               phone: _place.formatted_phone_number,
                               photo: _place.photos,
                               rating: _place.rating,
                               price_level: _place.price_level,
                               opening_hours: _place.opening_hours,
                               reviews: _place.reviews,
                               types: _place.types,
                               geometry: _place.geometry,
                               id: _place.place_id,
                               visible: true
                           });
                           if(_place.types[0] !== "locality"){
                               var streetName = _place.formatted_address.substring(0,  _place.formatted_address.indexOf(','));
                               console.log(streetName);
                               //getFoursquareSearch(_place.name, _place.geometry, streetName);
                           }
                           //console.log(self.locations.markersInfo());
                       }else if (_status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT){
                         console.log("reaches query limit");
                       }else if (_status === google.maps.places.PlacesServiceStatus.ERROR){
                         console.log("error contacting google server for location details");
                     }
                   });
                 }
                  self.map.fitBounds(bounds);
                  */
              });

          }else {
              console.log("google maps API wasn't loaded properly");
          }
    }

    //get the map started with the init()
    init();

}

ko.applyBindings(new NeighborhoodViewModel());

}(jQuery));
