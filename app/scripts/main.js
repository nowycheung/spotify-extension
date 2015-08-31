"use strict";

var html = document.querySelector("html"),
    body = html.querySelector("body"),
    mainPageNode = body.querySelector("#wrapper");

html.setAttribute("id", "spotifylish");

var Spotifylish = {
    yahooImageApiUrl: "https://images.search.yahoo.com/images/view?o=js&p=",
    flickImageApiUrl: "https://api.flickr.com/services/rest?extras=url_c%2Curl_z&per_page=100&page=1&method=flickr.interestingness.getList&api_key=875eabc844125494f08d1fc16b35bcd1&format=json&nojsoncallback=1",
    imagesList: [],
    currentImageIndex: 0,
    animationSpeed: 10, // seconds
    init: function(){
        var slideShowDiv =  document.createElement("div"),
            self = this;
        
        slideShowDiv.id = "spotifySlideshow";

        if (mainPageNode && !mainPageNode.querySelector("#spotifySlideshow")) {
            var main = mainPageNode.querySelector("#main"),
                mainNav = mainPageNode.querySelector("#main-nav"),
                mainCheckerTimer,
                animationTimer;
            
            mainCheckerTimer = setInterval(function(){
                main = mainPageNode.querySelector("#main");
                if (main) {
                    clearInterval(mainCheckerTimer);
                    main.appendChild(slideShowDiv);

                    main.onmouseout = function(){
                        body.classList.add("unfocus");
                    };
                    main.onmouseover  = function(){
                        body.classList.remove("unfocus");
                    };

                    mainNav.onmouseout = main.onmouseout;
                    mainNav.onmouseover = main.onmouseover;
                }
            }, 100);

            animationTimer = setInterval(function(){
                if (self.imagesList.length > 0 && main) {
                    var url = self.imagesList[self.currentImageIndex].src;
                    slideShowDiv.style.backgroundImage = "url('" + url +"')";
                    slideShowDiv.style.webkitAnimation = "animatedRandom" + self.randomFromTo(1, 4) + " " + self.animationSpeed + "s ease infinite";

                    self.currentImageIndex++;

                    // Check the index
                    if (self.currentImageIndex >= self.imagesList.length) {
                        self.currentImageIndex = 0;
                    }
                }

            }, self.animationSpeed * 1000);

            // Load image immediately
            self.loadImage();
        }
    },
    dateToYMD: function(date) {
        date = date || new Date();
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();
        return y + "-" + (m <= 9 ? "0" + m : m) + "-" + (d <= 9 ? "0" + d : d);
    },
    randomFromTo: function(from, to) {
        return Math.floor(Math.random() * (to - from + 1) + from);
    },
    ajax: function (url,callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                callback(xhr.responseText);
            }
        };
        xhr.open("GET", url, true);
        xhr.send();
    },
    receiveMessage: function(event){
        if (event.data.spotifylish) {
            Spotifylish.updateStatus(event.data.spotifylish);
        }
    },
    updateStatus: function(data) {
        // Always update the playing status
        this.isPlaying = data.isPlaying;

        // Update the track name and the artist, might be use to search image
        if (data.trackName !== this.trackName &&  this.imagesList.length === 0) {
            this.trackName = data.trackName;
            this.trackArtist = this.trackArtist;
        }

        // if playing
        if (this.isPlaying) {
            this.startSlideshow();
        } else {
            this.stopSlideshow();
        }
    },
    startSlideshow: function() {
        body.classList.add("playing");
    },
    stopSlideshow: function() {
        body.classList.remove("playing");
    },
    loadImage: function() {
        var self = this;

        // Using Yahoo image search
        /*
        var query = this.trackArtist + " " + this.trackName;
        this.ajax(this.yahooImageApiUrl + query, function (responseText) {
            var data = JSON.parse(responseText);
            if (data.results) {
                data.results.forEach(function(img){
                    if (img.imgW > 600) {
                        console.log(img.iurl);
                    }
                });
            }
        });
        */

        // Using Flickr image
        var url = this.flickImageApiUrl + "&date=2015-08-28";   // date is harcoded temporary
        this.ajax(url, function (responseText) {
            var data = JSON.parse(responseText);
            if (data.photos && Array.isArray(data.photos.photo)) {
                self._imageLoaded = true;
                data.photos.photo.forEach(function(photo){
                    if (photo.width_c > 600) {
                        var img = new Image();
                        img.src = photo.url_c;
                        img.onload = function() {
                            self.imagesList.push({
                                src: this.src,
                                height: this.height,
                                width: this.width
                            });
                            body.classList.add("slideshow-ready");
                        };
                    }
                });
            }
        });
    }
};


// If main page, listen the message from iframe (child window)
if (mainPageNode) {
    Spotifylish.init();
    window.addEventListener("message", Spotifylish.receiveMessage, false);
}

// If app-player page, start sending the track information to main page.
if (window.frameElement && window.frameElement.id === "app-player") {   
    setInterval(function() {
        var trackNameNode = body.querySelector("#track-name"),
            trackArtistNode = body.querySelector("#track-artist"),
            isPlaying = body.querySelector("#play-pause.playing") ? true : false;

        window.parent.postMessage({
            spotifylish: {
                isPlaying: isPlaying,
                trackName: trackNameNode ? trackNameNode.innerText : false,
                trackArtist: trackArtistNode ? trackArtistNode.innerText : false,
            }
        }, "https://play.spotify.com/");
    }, 1000);
}
