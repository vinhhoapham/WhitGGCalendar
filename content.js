// This is the event will be extracted by the extension
var event = {
  className: "",
  subClassName: "",
  professorsName: "",
  timeLocation: {
    building: "",
    room: "",
    days: "",
    startTime: "",
    endTime: ""
  }
}

// This array belong to color
var colorArray = [...Array(11).keys()]
// This function converts the time extracted from my.Whitman to
// a string that Google Calendar can understand

function timeConvert(time) {
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
function dayConvert(day) {
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

// THIS FUNCTION breaks down the content of the time location line
function timelocLineBreakDown(line) {
  const deliminatedString = line.split(" ")
  event.timeLocation.building = deliminatedString[0]
  event.timeLocation.room = deliminatedString[1]
  event.timeLocation.days = deliminatedString[3]
  event.timeLocation.startTime = deliminatedString[4]
  event.timeLocation.endTime = deliminatedString[5]
}

//Convert the event into Google Calendar ready event
function eventConvert(object, beginDate, endDate) {
  // necessary constants
  const startTime = timeConvert(object.timeLocation.startTime)
  const endTime = timeConvert(object.timeLocation.endTime)
  const classDays = dayConvert(object.timeLocation.days)
  const startDate = (function() {
    const aDayInMilliSec = 86400000
    days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
    var date = new Date(beginDate.slice(0, 4), beginDate.slice(5, 7) - 1, beginDate.slice(8, 10))

    while (days[date.getDay()] != classDays.slice(0, 2)) {
      date = new Date(date.getTime() + aDayInMilliSec)
    }

    result = date.getUTCFullYear() + '-'
    result += addValueBelowTwoDigits(date.getMonth() + 1) + '-'
    result += addValueBelowTwoDigits(date.getDate())
    return result
  })
  const stopDate = endDate.replace(/-/g, '')
  const timeZone = 'America/Los_Angeles'
  const color = (function() {
    const index = Math.floor(Math.random() * colorArray.length)
    const result = (colorArray[index] + 1).toString()
    colorArray.splice(index, 1)
    return result
  })
  const desc = object.subClassName + '\n' + object.professorsName
  const googleCalendarEvent = {
    "summary": object.className,
    "location": object.timeLocation.building + " " + object.timeLocation.room,
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
    "colorId": color(),
    "description": desc
  }

  return googleCalendarEvent

}

// THIS FUNCTION breaks down  the content of the time
function classInfoBreakDown(line){
  const spanElements = line.querySelectorAll('span')
  event.className = line.querySelectorAll('strong')[0].textContent
  event.subClassName = spanElements[0].textContent
  event.professorsName = spanElements[1].textContent
}

//Handle the request when a message is sent

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  alert('this was called')
  // Get elments from the webpage
  const elements = document.getElementsByClassName('basicList wide')[1].querySelectorAll('tbody > tr')
  console.log(elements)
  const endDate = request.time.endDate
  const beginDate = request.time.startDate
  var listOfClasses = []
  // Iterating loop
  for (var index = 0; index < elements.length; index++) {

    if (!elements[index].firstChild) break;
    //currenItem = the current item which is being selected
    const currentItem = elements[index].querySelectorAll('td')

    classInfoBreakDown(currentItem[1])
    timelocLineBreakDown(currentItem[2].textContent)

    listOfClasses.push(eventConvert(event, beginDate, endDate))

  }

  console.log(listOfClasses)

  chrome.runtime.sendMessage({
    Message: listOfClasses
  })

})
