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
//Handle the request when a message is sent

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  // Get elments from the list
  const elements = document.getElementsByClassName("ui-li-static ui-body-inherit");
  const endDate = request.time.endDate.replace(/-/g, '')
  const beginDate = request.time.startDate
  var colorArray = [...Array(11).keys()]
  var listOfClasses = []
  // Iterating loop
  for (var index = 0; index < elements.length; index++) {

    //currenItem = the current item which is being selected
    const currentItem = elements[index]


    //Initalize an event belong to a class on the schedule
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

    // THIS FUNCTION breaks down the content of the fourth line
    function deliminate(aLongString) {
      const deliminatedString = aLongString.split(" ")
      event.timeLocation.building = deliminatedString[0]
      event.timeLocation.room = deliminatedString[1]
      event.timeLocation.days = deliminatedString[3]
      event.timeLocation.startTime = deliminatedString[4]
      event.timeLocation.endTime = deliminatedString[5]
    }

    function eventConvert(object) {
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
      const timeZone = 'America/Los_Angeles'
      const color = (function() {
        const index = Math.floor(Math.random() * colorArray.length)
        const result = (colorArray[index] + 1).toString()
        colorArray.splice(index, 1)
        return result
      })
      const desc = object.subClassName +'\n' + object.professorsName
      const event = {
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
          "RRULE:FREQ=WEEKLY;UNTIL=" + endDate + ";BYDAY=" + classDays
        ],
        "colorId": color(),
        "description": desc
      }

      return event

    }

    if (!currentItem.hasAttribute('style')) {
      event.className = currentItem.children[0].textContent
      event.subClassName = currentItem.children[1].textContent
      event.professorsName = currentItem.children[2].textContent
      deliminate(currentItem.children[3].textContent)
      listOfClasses.push(eventConvert(event))
    } else {
      break
    }

  }

  chrome.runtime.sendMessage({
    Message: listOfClasses
  })

})
