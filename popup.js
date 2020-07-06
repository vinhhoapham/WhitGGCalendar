// Send messages to content.js whenever a button is clicled
const startDateInput = document.getElementById('sDate')
const endDateInput = document.getElementById('eDate')
var calendarIdList = []
var select = document.getElementById('calendarOption')
var message = {}

function loadTermAndDate() {
  var title = document.getElementById("titleText")
  const selectedTerm = ""
  chrome.tabs.query({
      currentWindow: true,
      active: true
    },
    function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        signal: 'getTerm'
      }, function(respone) {
        const year = respone.slice(0, 4)
        const term = respone.slice(-2)
        switch (term) {
          case 'FA':
            title.textContent = term + 'LL ' + year
            startDateInput.value = year + '-08-30'
            endDateInput.value = year + '-12-10'
            break;
          case 'SP':
            title.textContent = term + 'RING ' + year
            startDateInput.value = year + '-01-18'
            endDateInput.value = year + '-05-08'
            break;
          default:
            break;
        }

      })
    }
  )
}

function loadCalendarList(){
  chrome.runtime.sendMessage({
    signal: 'getCalendarList'
  })
  chrome.runtime.onMessage.addListener(function(request){
    if (request.signal == 'loadCalendarList') {
      console.log(request)

      for (var calendar of request.calendars) {
        var option = document.createElement('Option')
        if (calendar.hasOwnProperty('primary')) {
          option.text = 'Primary'
          calendarIdList.push('primary')
        } else {
          option.text = calendar.summary
          calendarIdList.push(calendar.id)
        }
        select.add(option)
      }
    }

  })

}

function popupDidLoad() {
  loadTermAndDate()
  loadCalendarList()
}

function clickAction(e) {
  console.log(e)
  chrome.tabs.query({
      currentWindow: true,
      active: true
    },
    function(tabs) {
      message = {
        signal: "sendInput",
        time: {
          startDate: startDateInput.value,
          endDate: endDateInput.value
        },
        calendar: calendarIdList[select.selectedIndex],
        reminder: {
          beforeClass: reminderTime.value,
          betweenClass: reminderBetweenTime.value,
          options: notificationOption.options[notificationOption.selectedIndex].value
        }
      }
      chrome.tabs.sendMessage(tabs[0].id, {signal: "callToAction"})
      chrome.runtime.sendMessage(message)
      console.log(message)
    })
}


// Listen for the user clicking the button
// Execute request



document.addEventListener('DOMContentLoaded', function() {
  popupDidLoad()
  document.getElementById('createButton').onclick = clickAction
});
