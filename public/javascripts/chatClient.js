var socket = io.connect();

var messageContainerId = "messageContainer";
var inputElemId = "messageInput";
var toggleButtonId = "toggleChat";
var chatContainerId = "chatContainer";
var chatDisplayId = "chatDisplay";

socket.on('new message', showMessage);

socket.on('server message', showServerMessage);

socket.on('messages', function(messages){
  showAllMessages(messages);
});

socket.on('joined chat', function(nick) {
  addToUserList(nick);
});

socket.on('left chat', function(nick) {
  removeFromUserList(nick);
});

socket.on('users', function(nicks) {
  //empty the list
  $('#clientContainer div').remove();
  //refill with data
  for(var i=0; i<nicks.length; i++) {
    addToUserList(nicks[i]);
  }
});


  addEventListener("keydown", keyDown);

  function keyDown(event) {
    if(event.keyCode===13) { //enter
      sendMessage();
    }
  }

  function sendMessage() {
  	var messageElem = document.getElementById(inputElemId);
    if(messageElem.value !== ""){
      socket.emit('new message', messageElem.value);  
    }
  	messageElem.value = "";
  } 

  function showAllMessages(messages) {
    var container = document.getElementById(messageContainerId);
    for(var i=0; i<messages.length; i++){
      container.innerHTML += renderMessage(messages[i]);
    }
    container.scrollTop = container.scrollHeight;
  }

  function showMessage(msg) {
  	var container = document.getElementById(messageContainerId);
  	container.innerHTML += renderMessage(msg);
    container.scrollTop = container.scrollHeight;
  } 

  function showServerMessage(msg) {
    var container = document.getElementById(messageContainerId);
    var rendered = "<div>" +
                      "<span class='server-message'>" + msg + "</span>" +
                    "</div>"
    $("#messageContainer").append(rendered);
    container.scrollTop = container.scrollHeight;
  }

  function renderMessage(msg) {
    return "<div class='message'>"
          + "<span class='user-name'>" + msg.nick + "</span>"
          + "<span class='message-body'>" + ": " + msg.msg + "</span>"
          + "</div>"; 
  }

  function renderNick(nick) {
    return "<div class='user-name user-list'>" + nick + "</div>";
  }

  function addToUserList(nick) {
    $('div.client-container').append(renderNick(nick));
  }

  /* Removes the first found instance of given nickname under clientContainer element.
   * Currently a user can have multiple connections simultaneously, so we only remove
   * the first instance from the user list.
   */
  function removeFromUserList(nick) {
    $('#clientContainer div').filter(function(){ return $(this).text() === nick;}).first().remove();
  }

  function toggleChat() {
    var toggleButton = document.getElementById(toggleButtonId);
    var chatDisplay = document.getElementById(chatDisplayId);

    if(toggleButton.innerHTML === 'Hide') {
      toggleButton.innerHTML = 'Show';
      chatDisplay.style.display = 'none';
    } else {
      toggleButton.innerHTML = 'Hide';
      chatDisplay.style.display = '';
    }
  }