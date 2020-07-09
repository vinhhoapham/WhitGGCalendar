// This is the event will be extracted by the extension
var colorArray = [...Array(11).keys()]
class course {
  constructor() {
    this.details = {
      name: "",
      subName: "",
      professor: "",
      timeLocation: {
        building: "",
        room: "",
        days: "",
        startTime: "",
        endTime: ""
      },
      color: ""

    }
  }
  // THIS FUNCTION breaks down the content of the time, location line
  getTimeLocationInfo(line) {
    const deliminatedString = line.split(" ")
    this.details.timeLocation.building = deliminatedString[0]
    this.details.timeLocation.room = deliminatedString[1]
    this.details.timeLocation.days = deliminatedString[3]
    this.details.timeLocation.startTime = deliminatedString[4]
    this.details.timeLocation.endTime = deliminatedString[5]
  }
  // THIS FUNCTION breaks down the content of the line that contains time
  getClassInfo(line) {
    const spanElements = line.querySelectorAll('span')
    this.details.name = line.querySelectorAll('strong')[0].textContent
    this.details.subName = spanElements[0].textContent
    this.details.professor = spanElements[1].textContent
  }
  getColor() {
    const index = Math.floor(Math.random() * colorArray.length)
    const result = (colorArray[index] + 1).toString()
    colorArray.splice(index, 1)
    if (colorArray.length == 0) {
      colorArray = [...Array(11).keys()]
    }
    this.details.color = result
  }
}

var message = {
  signal: ""
}

function getClassesFromPage() {
  const elements = document.getElementsByClassName('basicList wide')[1].querySelectorAll('tbody > tr')
  const listOfClasses = []
  // Iterating loop
  for (var index = 0; index < elements.length; index++) {
    if (!elements[index].firstChild) break;
    //currenItem = the current item which is being selected
    const currentLine = elements[index].querySelectorAll('td')
    var currentCourse = new course()
    currentCourse.getClassInfo(currentLine[1])
    currentCourse.getTimeLocationInfo(currentLine[2].textContent)
    currentCourse.getColor()
    listOfClasses.push(currentCourse)
  }
  return listOfClasses
}

function getTermFormPage() {
  const termOptions = document.querySelectorAll('select')[2]
  const selectedTerm = termOptions.options[termOptions.selectedIndex].value
  return selectedTerm
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.signal) {
    case 'callToAction':
      message.classes = getClassesFromPage()
      message.signal = 'createEvent'
      chrome.runtime.sendMessage(message)
      break;
    case 'getTerm':
      sendResponse(getTermFormPage())
      break;
    default:
      alert('Error: unknown signal')
  }
})
