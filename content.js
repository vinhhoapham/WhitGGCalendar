// This is array for generating colors
var colorArray = [...Array(11).keys()]

class course {
  constructor() {
    this.details = {
      name: '',
      subName: '',
      professor: '',
      timeLocation: {
        building: '',
        room: '',
        days: '',
        startTime: '',
        endTime: ''
      },
      color: ''

    }
  }
  // THIS FUNCTION breaks down the content of the time, location line
  // from myWhitman

  getTimeLocationInfo (line) {
    const deliminatedString = line.split(' ')

    this.details.timeLocation.building  = deliminatedString[0]
    this.details.timeLocation.room      = deliminatedString[1]
    this.details.timeLocation.days      = deliminatedString[3]
    this.details.timeLocation.startTime = deliminatedString[4]
    this.details.timeLocation.endTime   = deliminatedString[5]
  }
  // THIS FUNCTION breaks down the content of the line that contains time

  getClassInfo (line) {
    const spanElements     = line.querySelectorAll('span')
    this.details.name      = line.querySelectorAll('strong')[0].textContent
    this.details.subName   = spanElements[0].textContent
    this.details.professor = spanElements[1].textContent
  }

  // Generate a color for the course
  getColor() {
    // Get an index from the array
    const index  = Math.floor(Math.random() * colorArray.length)
    // result is the color generated
    const result = (colorArray[index] + 1).toString()
    colorArray.splice(index, 1)
    // Regenerate the color array, after all color is used
    if (colorArray.length == 0) {
      colorArray = [...Array(11).keys()]
    }
    this.details.color = result
  }
}

var message = {
  signal: ''
}

function getClassesFromPage() {
  const lineContainsClassInfos = document.getElementsByClassName('basicList wide')[1].querySelectorAll('tbody > tr')
  const listOfClasses = []

  for (var index = 0; index < lineContainsClassInfos.length; index++) {
    // For some reasons, myWhitman contains some unreal classes
    // this line weed out those classes
    if (!lineContainsClassInfos[index].firstChild) break;

    const currentLine = lineContainsClassInfos[index].querySelectorAll('td')
    var currentCourse = new course()
    currentCourse.getClassInfo(currentLine[1])
    currentCourse.getTimeLocationInfo(currentLine[2].textContent)
    currentCourse.getColor()
    listOfClasses.push(currentCourse)
  }
  return listOfClasses
}

function getTermFormPage() {
  // The select contains the chosen semester
  const termOptions  = document.querySelectorAll('select')[2]
  const selectedTerm = termOptions.options[termOptions.selectedIndex].value
  return selectedTerm
}

// Handle singals from other scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  switch (request.signal) {
    case 'callToAction':
      message.classes = getClassesFromPage()
      message.signal  = 'createEvent'
      chrome.runtime.sendMessage(message)
      break;

    case 'getTerm':
      sendResponse(getTermFormPage())
      break;

    default:
      alert('Error: unknown signal')
      break;
  }
})
