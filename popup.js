function GGCalendarAuthorize(){
  var CLIENT_ID = '1083921700317-amqqsouvip3mc3j0orp4ai0btne4l7jh.apps.googleusercontent.com'
  var API_KEY = 'AIzaSyD6SCfV0QB1zn0n-hxFJzAsNeHKwg1Wa_4';
  var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"];
  var SCOPES = "https://www.googleapis.com/auth/calendar.events";

  function initClient() {
    gapi.client.init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES
    }).then(function () {
      // Listen for sign-in state changes.
      gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

      // Handle the initial sign-in state.
      updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
      authorizeButton.onclick = handleAuthClick;
      signoutButton.onclick = handleSignoutClick;
    }, function(error) {
      appendPre(JSON.stringify(error, null, 2));
    });
  }

}


function createEvents(listOfClass){
  alert(listOfClass.length)
  GGCalendarAuthorize()
}

function clickAction(e){
  chrome.tabs.query({currentWindow: true, active: true},
    function (tabs) {
      chrome.tabs.sendMessage(tabs[0].id, 'Create Calendar', createEvents)
    })
}



document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('CreateButton').addEventListener('click', clickAction);
});
