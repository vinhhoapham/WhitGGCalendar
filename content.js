///

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  const elements = document.getElementsByClassName("ui-li-static ui-body-inherit");

  var listOfClass = []

  for (var index = 0; index < elements.length; index++) {

    const currentItem = elements[index]

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

    function deliminate(aLongString) {
      const deliminatedString = aLongString.split(" ")
      event.timeLocation.building = deliminatedString[0]
      event.timeLocation.room = deliminatedString[1]
      event.timeLocation.days = deliminatedString[3]
      event.timeLocation.startTime= deliminatedString[4]
      event.timeLocation.endTime = deliminatedString[5]
    }

    if (!currentItem.hasAttribute('style')) {
      event.className = currentItem.children[0].textContent
      event.subClassName = currentItem.children[1].textContent
      event.professorsName = currentItem.children[2].textContent
      deliminate(currentItem.children[3].textContent)
      listOfClass.push(event)
    }

  }
  sendResponse(listOfClass)
})
