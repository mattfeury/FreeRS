/**
 * Ajax functions for loading things from the API and setting the appropriate templates
 */

function loadCategoriesIfNeeded() {

  $.ajax({
    url: "api/categories",
    dataType: "json",
    async: false,
    success: function(data) {
      categoriesLoaded = true;

      // template on create product page
      $( "#category_option_template" ).tmpl( data ).appendTo( ".add_product_categories" );
      // template on list categories page
      $( "#category_list_row_template" ).tmpl( data ).appendTo( "#categories_list" );
    },
    error: ajaxError
  });
}

// Loads all the products for the user
function loadUserProducts() {
  $( "#products_list" ).empty();
  $.ajax({
    url: "api/user_product",
    dataType: "json",
    async: false,
    success: function(data) {
      //Create The New Rows From Template
      addProducts(data);      
      $( "#product_list_row_template" ).tmpl( data ).appendTo( "#products_list" );
      $('#products_list').listview('refresh');
    },
    error: function() { showError('No Products','You have not posted any products up!'); }
  });
}
function createQuiz(quizName, lat, long, accuracy, callback) {
  $.ajax({
    url: "api/quizzes",
    dataType: "json",
    async: false,
    data: { name: quizName, lat: lat, long: long, accuracy: accuracy },
    type: 'POST',
    success: function(data) {
      currentQuizId = data.quizId;
      //TODO stats
      $('#quiz_view_page')
        .find('.stat-holder').empty();

      callback();
    },
    error: ajaxError
  });
}
function addQuestion(quizId, numChoices, answer, start) {
  $.ajax({
    url: "api/questions",
    dataType: "json",
    async: false,
    data: { 'quizID': quizId, 'numChoices': numChoices, 'correctChoice': answer },
    type: 'POST',
    success: function(data) {
      $('#quiz')
        .find('.question').text(++currentQuestionNum)
        .find('.time').text('0:30');

      if (start)
        activateQuiz();

      $.mobile.changePage('#give_quiz_page');
    },
    error: ajaxError
  });
}
function activateQuiz() {
  if (! currentQuizId) return false;

  $.ajax({
    url: "api/activate_quiz",
    dataType: "json",
    async: false,
    data: { 'quizID': currentQuizId },
    type: 'POST',
    success: function(data) {
      $('#quiz')
        .removeClass('paused')
        .addClass('playing');
    
      //start timer
      tickerInterval = setInterval(function() {
        var $quiz = $('#quiz');
        if ($quiz.is('.paused')) {
          clearTimeout(tickerInterval);
          return false;
        }
        var newTime = $quiz.find('.time').attr('data-seconds') - 1;

        $quiz.find('.time')
          .attr('data-seconds', newTime)
          .text((newTime < 0) ? 0 : newTime);

        if (newTime <= 0) {
          $quiz.addClass('paused').removeClass('playing');
          clearTimeout(tickerInterval);
          deactivateQuiz();
        }

      }, 1000);
      
    },
    error: ajaxError
  });
}
function deactivateQuiz() {
  if (! currentQuizId) return false;

  var $quiz = $('#quiz');
  if ($quiz.is('.playing')) {
    $quiz.addClass('paused').removeClass('playing');
  }
  clearTimeout(tickerInterval);

  $.ajax({
    url: "api/deactivate_quiz",
    dataType: "json",
    async: false,
    data: { 'quizID': currentQuizId },
    type: 'POST',
    success: function(data) {
      console.log("deact"); 
    },
    error: ajaxError
  });
}

window.currentUser = null;
window.currentQuizId = null;
window.currentQuestionNum = 0;
window.tickerInterval = -1;

var defaultTimePerQuestion = 30;
$(function() {
  $.ajax({
    url: "/user",
    dataType: 'text',
    success: function(data) {
      currentUser = data;
    },
    error: function() { showError('Not logged in', 'You don\'t appear to be logged in'); }
  });
  
  $('#quiz')
    .delegate('button.play', 'click', activateQuiz)
    .delegate('button.pause', 'click', deactivateQuiz);

  $('#add_question_page').bind('pagebeforeshow',function(event, ui){
    $('#add_question_page')
      .find('.answer input')
        .val('');
  });
  // If we are in app and no current quiz is defined, we cannot render.
  // Bring back to landing.
  //
  // This'll help when people "refresh" or go directly to a page. Since we
  // have to do tricky things with user's state, we need them to go through the flow
  $('.needs-state').bind('pagebeforeshow',function(event, ui){
    if (! currentQuizId)
      $.mobile.changePage('#landing_page');      
  });

  
  // Before viewing the Professor's give quiz page, reset default values
	$('#give_quiz_page').bind('pagebeforeshow', function() {
    $('#give_quiz_page')
      .find('.time')
        .text(defaultTimePerQuestion)
        .attr('data-seconds', defaultTimePerQuestion)
      .end()
      .find('.question')
        .text(currentQuestionNum);
	});

  // Get a name and location and create the quiz.
  $('#make-quiz').click(function() {
    function makeQuiz(position) {
      var quizName = prompt('Enter Quiz Name:'),
          lat = position.coords.latitude,
          long = position.coords.longitude,
          accuracy = position.coords.accuracy;

      if (quizName && lat && long) {
        console.log(quizName, lat, long);
        var callback = function() { $.mobile.changePage('#quiz_view_page'); }
        createQuiz(quizName, lat, long, accuracy, callback);
      }
    }
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(makeQuiz);
    } else {
      showError('No location','Your browser does not support getting your location. Please try a different one, like Google Chrome');
    }
    return false;
  });

  // Start quiz. Take them to create their first question
  $('#start-quiz').click(function() {
    if (! currentQuizId) {
      showError('No quiz selected','Or something went wrong.');
      return false;
    }
    
    //var callback = function() { $.mobile.changePage('#add_question_page'); }
    $.mobile.changePage('#add_question_page');
    //activateQuiz(currentQuiz.id, callback);
  });
  $('.add-question').click(function() {
    if (! currentQuizId) {
      showError('No quiz selected','Or something went wrong.');
      return false;
    }
    var $this = $(this),
        $page = $this.closest('#add_question_page'),
        numChoices = $page.find('.choices select').val(),
        answer = $page.find('.answer input').val(),
        start = $this.attr('data-start');

    addQuestion(currentQuizId, numChoices, answer, start);
  });

});

/******************************************************************************/

function ajaxError(jqXHR, textStatus, errorThrown){
	console.log('ajaxError '+textStatus+' '+errorThrown);
	showError(textStatus, errorThrown);
}

function showError(name, description) {
	$('#error_message').remove();
	$("#error_message_template").tmpl( {errorName: name, errorDescription: description} ).appendTo( "#error_dialog_content" );
	$.mobile.changePage($('#error_dialog'), {
		transition: "pop",
		reverse: false,
		changeHash: false
	});

}
