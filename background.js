// Initalize necessary constants
// This part belongs to creating events
const API_KEY = 'AIzaSyD1Xyr_2_aX3Qr7w-SqfYwfXighY0Ngnb0'
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
// This part subjects to change


function onGAPILoad() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  }).then(function() {

    // Authorization
    chrome.identity.getAuthToken({
      interactive: true
    }, function(token) {
      gapi.auth.setToken({
        'access_token': token
      })

      // Waiting the message from content script
      // If receive the message, execute request
      // creating events on google calendar
      chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

        //Initalize necessary variables
        const classes = request.Message
        const numberOfClasses = classes.length
        var successfulRequest = 0
        // Classes loaded successfully

        // Creating events
        for (var index = 0; index < numberOfClasses; index++) {

          // Initalize
          // CurrentClass is the class the API executing
          const currentClass = classes[index]
          // Initalize google calendar event
          const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': currentClass
          })

          // Excute events
          request.execute(function(event) {
            if (event.status = "confirmed") {
              successfulRequest += 1
            }
            console.log(event)
          })

        }

        var notiMessage = (function() {
          switch (successfulRequest) {
            case numberOfClasses:
              return "All of your classes are on Google Calendar"
            case 0:
              return "None of your classes are on Google Calendar"
            default:
              return numberOfClasses + " classes out of " + numberOfClasses + " are on Google Calendar"
          }
        })


        alert(notiMessage())
      })


    })

  }, function(error) {
    alert('Authentication fail')
  });
}
