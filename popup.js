// Send messages to content.js whenever a button is clicled


var calendarIdList = []

var message = {}

function loadTermAndDate() {
  var startDateInput = document.getElementById('startDateInput')
  var endDateInput = document.getElementById('endDateInput')
  var title = document.getElementById("dateTitle")
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

function loadCalendarList() {
  chrome.runtime.sendMessage({
    signal: 'getCalendarList'
  })
  chrome.runtime.onMessage.addListener(function(request) {
    if (request.signal == 'loadCalendarList') {
      var calendarSelect = document.getElementById('calendarOption')
      for (var calendar of request.calendars) {
        var option = document.createElement('Option')
        if (calendar.hasOwnProperty('primary')) {
          option.text = 'Primary'
          calendarIdList.push('primary')
        } else {
          option.text = calendar.summary
          calendarIdList.push(calendar.id)
        }
      calendarSelect.add(option)
      }
    }

  })

}


function popupDidLoad() {
  loadTermAndDate()
  loadCalendarList()

}

function clickAction(e) {
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
        calendar: calendarIdList[calendarOption.selectedIndex],
        reminder: {
          beforeClass: reminderTime.value,
          betweenClass: reminderBetweenTime.value,
          options: notificationOption.options[notificationOption.selectedIndex].value
        }
      }
      chrome.tabs.sendMessage(tabs[0].id, {
        signal: "callToAction"
      })
      chrome.runtime.sendMessage(message)
    })
}


// Listen for the user clicking the button
// Execute request



document.addEventListener('DOMContentLoaded', function() {
  popupDidLoad()
  document.getElementById('createButton').onclick = clickAction
});
