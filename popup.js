// Send messages to content.js whenever a button is clicled
function popupDidLoad() {
  var title = document.getElementById("titleText")
}

function clickAction(e) {

  chrome.tabs.query({
      currentWindow: true,
      active: true
    },
    function(tabs) {
      message = {
        time: {
          startDate: document.getElementById('sDate').value,
          endDate: document.getElementById('eDate').value
        }

      }
      chrome.tabs.sendMessage(tabs[0].id, message)
    })
}


// Listen for the user clicking the button
// Execute request

popupDidLoad()

document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('createButton').addEventListener('click', clickAction);
});
