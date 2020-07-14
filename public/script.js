(function() {
  var isPlaying = false; var totalTime = 0; var timePassed = 0;

  function updateProgressBar(){
    if(!isPlaying) return;

    progressPercentage= (timePassed / totalTime) * 100;
    timePassed += 1000;
    if(progressPercentage >= 100) progressPercentage = 100;
    $('div#progressbar').css({'width':progressPercentage+'%'});
  }

  function fetchDetails(){
    $.ajax({
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: {
          'Authorization': 'Bearer ' + access_token
        },
        success: function(response) {
          if(response == null) return;
          if(response.is_playing && response.currently_playing_type != 'ad'){
            isPlaying = true;

            if(response.item != null){
              song = response.item.name;
              artist = response.item.artists[0].name;
              albumArt = response.item.album.images[0].url;
            }

            if(response.progress_ms != null)
              timePassed = response.progress_ms;

            //if new song is playing
            if((currentSong != song || currentArtist != artist)
              || (currentSong == "" && currentArtist == "")){

                var trackID = response.item.id;
              $.ajax({
                  url: 'https://api.spotify.com/v1/tracks/'+trackID,
                  headers: {
                    'Authorization': 'Bearer ' + access_token
                  },
                  success: function(response2) {
                    totalTime = response2.duration_ms;
                    console.log(song + ' by '+ artist+'. Total duration: '+totalTime);
                  }
                });

                $("#container").fadeOut(500, function(){
                  $("#albumArt").attr("src", albumArt);
                  timePassed = 0;
                  updateProgressBar();

                  $("#albumArt").load(function(){
                    $("#song").html(song);
                    $("#artist").html(artist);
                    $('#container').fadeIn();
                  });
                });

                currentSong = song;
                currentArtist = artist;
              }
              //if was paused and resumed
              else if($("#container").css('display') == "none"){
                $('#container').fadeIn(500, function(){
                  updateProgressBar();
                });
              }
          }
          //if response says not playing song
          else{
            isPlaying = false;
            //if was previously playing, hide the layout
            if($("#container").css('display') != "none"){
              $('#container').fadeOut();
            }
          }
        }
    });
  }

  function RefreshToken(){
    $.ajax({
      url: '/refresh_token',
      data: {
        'refresh_token': refresh_token
      }
    }).done(function(data) {
      access_token = data.access_token;
    });
  }

  /**
   * Obtains parameters from the hash of the URL
   * @return Object
   */
  function getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    while ( e = r.exec(q)) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
    }
    return hashParams;
  }
  var params = getHashParams();

  var access_token = params.access_token,
      refresh_token = params.refresh_token,
      error = params.error;

  var currentSong="";
  var currentArtist = "";

  var song=""; var artist = ""; var albumArt = "";

  if (error) {
    alert('There was an error during the authentication');
  } else {
    if (access_token) {

      $('#login').hide();

      fetchDetails();
      setInterval(fetchDetails, 10000);
      setInterval(updateProgressBar, 1000);
      setInterval(RefreshToken, 3600000);
    } else {
      $('#container').fadeOut();
      // render initial screen
      $('#login').show();
      $('#container').hide();
    }
  }
})();
