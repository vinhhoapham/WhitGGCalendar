// Initalize necessary constants
const API_KEY = 'AIzaSyD1Xyr_2_aX3Qr7w-SqfYwfXighY0Ngnb0'
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"]
var beginDate = ''
var endDate = ''
var classInformation = []
var inputInformation = {}
var failToCreate = false
// This function converts the time extracted from my.Whitman to
// a string that Google Calendar can understand

function convertTime(time) {

  const indicator = time.slice(-2)

  if (indicator == 'PM') {

    var hour = parseInt(time.slice(0, 2))

    if (hour != 12) {
      hour += 12
    }

    time = time.replace(time.slice(0, 2), hour.toString())

  }
  return time.slice(0, 5) + ":00"
}

// This function converts the days extracted from my.Whitman to
// a string that Google Calendar can understand
function convertDay(day) {
  var result = ""

  for (var index = 0; index < day.length; index++) {

    var initial = ""

    if (day[index + 1] == 'H') {
      initial = "TH"
      index++
    } else {
      switch (day[index]) {
        case "M":
          initial = "MO"
          break
        case "T":
          initial = "TU"
          break
        case "W":
          initial = "WE"
          break
        case "F":
          initial = "FR"
          break
        case "S":
          initial = "SU"
      }
    }

    result = result.concat(',' + initial)
  }
  return result.replace(result[0], '')
}

// This function converts a number less than 10 to a string
// with adding an additional zero
function addValueBelowTwoDigits(value) {
  var returnString = ''
  if (value < 10) {
    returnString += '0'
  }
  returnString += value
  return returnString
}

// Load GAPI
function onGAPILoad() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  })
}

function checkConsecutiveEvents(currentCourse) {
  var result = false
  beforeCourse = checkConsecutiveEvents.prevCourse
  if (beforeCourse.hasOwnProperty('details')) {

    const timeOfBeforeCourse = beforeCourse.details.timeLocation
    const timeOfCurrentCourse = currentCourse.details.timeLocation
    if (timeOfBeforeCourse.days[0] == timeOfCurrentCourse.days[0]) {
      if (parseInt(convertTime(timeOfCurrentCourse.startTime).slice(0,2)) - parseInt(convertTime(timeOfBeforeCourse.endTime)) < 2) {
         result = true
      }
    }
  }
  checkConsecutiveEvents.prevCourse = currentCourse
  return result
}

checkConsecutiveEvents.prevCourse = {}

function convertEventToGoogleCalendarReady(course, reminder) {
  // Initalize necessary constants
  const startTime = convertTime(course.details.timeLocation.startTime)
  const endTime = convertTime(course.details.timeLocation.endTime)
  const classDays = convertDay(course.details.timeLocation.days)
  const startDate = (function() {
    const aDayInMilliSec = 86400000
    const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
    var date = new Date(beginDate.slice(0, 4), beginDate.slice(5, 7) - 1, beginDate.slice(8, 10))

    while (days[date.getDay()] != classDays.slice(0, 2)) {
      date = new Date(date.getTime() + aDayInMilliSec)
    }

    var result = date.getUTCFullYear() + '-'
    result += addValueBelowTwoDigits(date.getMonth() + 1) + '-'
    result += addValueBelowTwoDigits(date.getDate())
    return result
  })
  const stopDate = endDate.replace(/-/g, '')
  const timeZone = 'America/Los_Angeles'
  const description = course.details.subName + '\n' + course.details.professor
  const setReminder = (function() {
      result = {
        useDefault: true
      }
      if (reminder.beforeClass != "") {

        result = {
          overrides: [{}]
        }
        result.useDefault = false
        result.overrides[0].minutes = parseInt(reminder.beforeClass)
        result.overrides[0].method = reminder.options
          if (reminder.betweenClass != "" && checkConsecutiveEvents(course)) {
            result.overrides[0].minutes = parseInt(reminder.betweenClass)
          }

        }
        return result
      })
      const googleCalendarEvent = {
      "summary": course.details.name,
      "location": course.details.timeLocation.building + " " + course.details.timeLocation.room,
      "start": {
        "dateTime": startDate() + "T" + startTime + "-07:00",
        "timeZone": timeZone
      },
      "end": {
        "dateTime": startDate() + "T" + endTime + "-07:00",
        "timeZone": timeZone
      },
      "recurrence": [
        "RRULE:FREQ=WEEKLY;UNTIL=" + stopDate + ";BYDAY=" + classDays
      ],
      "colorId": course.details.color,
      "description": description,
      "reminders": setReminder()
    }

    return googleCalendarEvent

  }

  function initalizeToken() {
    chrome.identity.getAuthToken({
      interactive: true
    }, function(token) {
      // Set GAPI auth token
      console.log(token)
      gapi.auth.setToken({
        'access_token': token,
      });
    })
  }

  function createEventsOnGoogleCalendar(listOfClasses, calendar, reminder) {

    listOfClasses.sort(function(classA, classB) {
      if (classA.details.timeLocation.days[0] < classB.details.timeLocation.days[0]) {
        return -1
      }
      if (classA.details.timeLocation.days[0] == classB.details.timeLocation.days[0]) {
        const timeA = convertTime(classA.details.timeLocation.startTime)
        const timeB = convertTime(classB.details.timeLocation.startTime)

        if (timeA < timeB) {
          return -1
        } else {
          return 1
        }
      }

    })
    const numberOfClasses = listOfClasses.length

    // Classes loaded successfully

    // Creating events
    for (var index = 0; index < numberOfClasses; index++) {

      // Initalize
      // CurrentClass is the class the API executing
      const currentClass = convertEventToGoogleCalendarReady(listOfClasses[index], reminder)
      // Initalize google calendar event
      const request = gapi.client.calendar.events.insert({
        'calendarId': calendar,
        'resource': currentClass
      })

      // Excute events
      request.execute(function(event) {
        console.log(event)
        if (event.hasOwnProperty('code')) {
          alert(' Error ' + event.code + ': ' + event.message )
          failToCreate = true
        }
        console.log(failToCreate)
        if (!failToCreate && index == numberOfClasses -1 ) {
          alert('Successfully create events on google calendar ')}
      })

    }

  }

  // Waiting the message from content script
  // If receive the message, execute request
  // creating events on google calendar
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    initalizeToken()
    switch (request.signal) {
      case 'sendInput':
        inputInformation = request
        break;
      case 'createEvent':
        beginDate = inputInformation.time.startDate
        endDate = inputInformation.time.endDate
        createEventsOnGoogleCalendar(request.classes, inputInformation.calendar, inputInformation.reminder)
        break;

      case 'getCalendarList':
        var messageToAPI = gapi.client.calendar.calendarList.list();
        messageToAPI.execute(function(response) {
          chrome.runtime.sendMessage({
            signal: 'loadCalendarList',
            calendars: response.items
          })
        })
        break;
      default:
        break;
    }
  })
