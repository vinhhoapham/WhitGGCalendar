// Initalize necessary constants and variable
const API_KEY = 'AIzaSyD1Xyr_2_aX3Qr7w-SqfYwfXighY0Ngnb0'
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
var beginDate = ''
var endDate = ''
var inputInformation = {}
var isFailed = false

// Convert the time get from myWhitman page into
// google calendar api format
function convertTime (time) {
  const periodIndicator = time.slice(-2)

  // Convert into 2400 hour format
  if (periodIndicator === 'PM') {
    var hour = parseInt(time.slice(0, 2))

    if (hour !== 12) {
      hour += 12
    }

    // Replace the old hour to the new, fomratted hour
    time = time.replace(time.slice(0, 2), hour.toString())
  }
  return time.slice(0, 5) + ':00'
}

// Convert the day get from myWhitman page into
// Google calendar api format
function convertDay (day) {
  var googleCalendarDays = ''

  // Convert each string get from myWhitman to a ready format
  for (var index = 0; index < day.length; index++) {
    var initial = ''

    // Check if for the 'TH' (aka Thursday) case
    // if that is the case skip the next character
    if (day[index + 1] === 'H') {
      initial = 'TH'
      index++
    } else {
      // Handle the normal cases
      switch (day[index]) {
        case 'M':
          initial = 'MO'
          break
        case 'T':
          initial = 'TU'
          break
        case 'W':
          initial = 'WE'
          break
        case 'F':
          initial = 'FR'
          break
        case 'S':
          initial = 'SU'
      }
    }

    googleCalendarDays = googleCalendarDays.concat(',' + initial)
  }
  return googleCalendarDays.replace(googleCalendarDays[0], '')
}

// This function handles the case when the value is 1 digit
// and needed to add an additional zero before
function addValueBelowTwoDigits (value) {
  var resultString = ''

  if (value < 10) {
    resultString += '0'
  }

  resultString += value
  return resultString
}

// Initalize apiKey and discoveryDocs when GAPI load
// Don't change the name of the function
function onGAPILoad() {
  gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS
  })
}

function checkConsecutiveEvents(currentCourse) {
  var isConsecutive = false
  // Set the before course to the previous Course
  var beforeCourse  = checkConsecutiveEvents.prevCourse

  if (beforeCourse.hasOwnProperty('details')) {
    const timeOfBeforeCourse  = beforeCourse.details.timeLocation
    const timeOfCurrentCourse = currentCourse.details.timeLocation
    if (timeOfBeforeCourse.days[0] === timeOfCurrentCourse.days[0]) {
      if (parseInt(convertTime(timeOfCurrentCourse.startTime).slice(0, 2)) - parseInt(convertTime(timeOfBeforeCourse.endTime)) < 2) {
        isConsecutive = true
      }
    }
  }

  checkConsecutiveEvents.prevCourse = currentCourse
  return isConsecutive
}

checkConsecutiveEvents.prevCourse = {}

function convertEventToGoogleCalendarReady (course, reminder) {
  const startTime = convertTime(course.details.timeLocation.startTime)
  const endTime = convertTime(course.details.timeLocation.endTime)
  const classDays = convertDay(course.details.timeLocation.days)
  const startDate = (function() {
    const aDayInMilliSec = 86400000
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    var date = new Date(beginDate.slice(0, 4), beginDate.slice(5, 7) - 1, beginDate.slice(8, 10))
    // Check if the day of start date is matched with the class day
    while (days[date.getDay()] !== classDays.slice(0, 2)) {
      date = new Date(date.getTime() + aDayInMilliSec)
    }
    // Add year
    var correctedStartDate = date.getUTCFullYear() + '-'
    // Add month
    correctedStartDate += addValueBelowTwoDigits(date.getMonth() + 1) + '-'
    // Add date
    correctedStartDate += addValueBelowTwoDigits(date.getDate())
    return correctedStartDate
  })
  // Remove - in original stopDate for Google Calendar API format
  const stopDate = endDate.replace(/-/g, '')
  const timeZone = 'America/Los_Angeles'
  const description = course.details.subName + '\n' + course.details.professor
  const setReminder = (function() {
    // Set the default into user's default notification type
    var reminderRule = {
      useDefault: true
    }
    // Check if the user has typed in reminder check box
    if (reminder.beforeClass !== '') {
      reminderRule = {
        overrides: [{}]
      }
      reminderRule.useDefault = false
      // Change the minutes of notifications into the user's input
      reminderRule.overrides[0].minutes = parseInt(reminder.beforeClass)
      // Change the type of notification into user's input
      reminderRule.overrides[0].method = reminder.options
      // Check if the user has typed in reminder between class check box
      if (reminder.betweenClass !== '' && checkConsecutiveEvents(course)) {
        // Change the minutes of the notification to the user's inpu
        reminderRule.overrides[0].minutes = parseInt(reminder.betweenClass)
      }
    }
    return reminderRule
  })

  const googleCalendarEvent = {
    'summary': course.details.name,
    'location': course.details.timeLocation.building + ' ' + course.details.timeLocation.room,
    'start': {
      'dateTime': startDate() + 'T' + startTime + '-07:00',
      'timeZone': timeZone
    },
    'end': {
      'dateTime': startDate() + 'T' + endTime + '-07:00',
      'timeZone': timeZone
    },
    'recurrence': [
      'RRULE:FREQ=WEEKLY;UNTIL=' + stopDate + ';BYDAY=' + classDays
    ],
    'colorId': course.details.color,
    'description': description,
    'reminders': setReminder()
  }

  return googleCalendarEvent
}

// Get the user permission and identity
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
  const numberOfClasses = listOfClasses.length

  // Criteria for the sort:
  // 1. Day
  // 2. Time
  // The purpose of this sort is for set reminders between class

  listOfClasses.sort(function (classA, classB) {
    // days[0] is the first day of that class
    if (classA.details.timeLocation.days[0] < classB.details.timeLocation.days[0]) {
      return -1
    }
    if (classA.details.timeLocation.days[0] === classB.details.timeLocation.days[0]) {
      const timeA = convertTime(classA.details.timeLocation.startTime)
      const timeB = convertTime(classB.details.timeLocation.startTime)

      if (timeA < timeB) {
        return -1
      } else {
        return 1
      }
    }
  })

  for (var index = 0; index < numberOfClasses; index++) {
    const currentClass = convertEventToGoogleCalendarReady(listOfClasses[index], reminder)
    // Generate the events
    const request = gapi.client.calendar.events.insert({
      'calendarId': calendar,
      'resource': currentClass
    })

    // Excute the request
    request.execute(function (event) {
      // Alert if found an error
      console.log(event)
      if (event.hasOwnProperty('code')) {
        alert(' Error ' + event.code + ': ' + event.message)
        isFailed = true
      }
      console.log(isFailed)
      if (!isFailed && index == numberOfClasses - 1) {
        alert('Successfully create events on google calendar ')
      }
    })

  }

}

// Waiting for the signals from other scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  initalizeToken()
  switch (request.signal) {
    case 'sendInput':
      inputInformation = request
      break;

    case 'createEvent':
      beginDate = inputInformation.time.startDate
      endDate   = inputInformation.time.endDate
      createEventsOnGoogleCalendar(request.classes, inputInformation.calendar, inputInformation.reminder)
      break;

    case 'getCalendarList':
      var messageToAPI = gapi.client.calendar.calendarList.list()
      messageToAPI.execute(function (response) {
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
