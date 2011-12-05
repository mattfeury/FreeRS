/**
 * Ajax functions for loading things from the API and setting the appropriate templates
 */

// QUIZ functions
function createQuiz(quizName, lat, long, accuracy, callback) {
  $.mobile.showPageLoadingMsg();
  $.ajax({
    url: "api/quizzes",
    dataType: "json",
    async: false,
    data: { name: quizName, lat: lat, long: long, accuracy: accuracy },
    headers: {'X-HTTP-Method-Override': 'PUT'},
    type: 'POST',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();
      currentQuizId = data.quizId;

      callback();
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

        updateTimer(newTime);
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
function getQuizzesNear(lat, long, accuracy) {
  $.mobile.showPageLoadingMsg();
  $.ajax({
    url: "api/quizzes",
    dataType: "json",
    async: false,
    data: { 'lat': lat, 'long': long, 'accuracy': accuracy },
    type: 'POST',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();
      $('#quizzes').empty();
      $.each(data || [], function(i, item) {
        $( "#quiz-template" ).tmpl( item ).appendTo( "#quizzes" );
      });
      $.mobile.changePage('#quiz_list_page');
      $('#quiz_list_page').trigger('create');
    },
    error: function() {
      showError('No quizzes found', 'There are no quizzes made today within your vicinity');
    }
  });
}
function getMyQuizzes() {
  $.mobile.showPageLoadingMsg();
  $.ajax({
    url: "api/quizzes",
    dataType: "json",
    async: false,
    type: 'GET',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();
      $('#my-quizzes').empty();
      $.each(data || [], function(i, item) {
        $( "#quiz-template" ).tmpl( item ).appendTo( "#my-quizzes" );
      });
      $('#my_quiz_page').trigger('create');
    },
    error: ajaxError
  });
}
function getAndRenderQuizStats(quizId) {
  $.mobile.showPageLoadingMsg();
  $.ajax({
    url: "api/answer_results/" + quizId,
    dataType: "json",
    async: false,
    type: 'GET',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();

      $('#question-stats, #answerer-stats').empty();
      $.each(data.questions || [], function(i, item) {
        var $li = $( "#question-button-template" ).tmpl({ id: i+1 });
        $li.find('button').click(function() {
          //render stats
          renderAndViewQuestionStats(item);
        });
        $li.appendTo( "#question-stats" );
      });
      $.each(data.answerers || [], function(i, item) {
        var $li = $( "#answerer-button-template" ).tmpl({ id: item['userId'] });
        $li.find('button').click(function() {
          //render stats
          renderAndViewAnswererStats(item);
        });
        $li.appendTo( "#answerer-stats" );
      });


      $('#quiz_stats_page').trigger('create');
      
      $.mobile.changePage('#quiz_stats_page');
    },
    error: ajaxError
  });
}

// QUESTION functions
function addQuestion(quizId, numChoices, answer, start) {
  $.mobile.showPageLoadingMsg();
  $.ajax({
    url: "api/questions",
    dataType: "json",
    async: false,
    data: { 'quizID': quizId, 'numChoices': numChoices, 'correctChoice': answer },
    type: 'POST',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();
      $('#quiz')
        .find('.question').text(++currentQuestionNum)
        .find('.time')
          .attr('data-seconds', defaultTimePerQuestion)
          .text('0:' + defaultTimePerQuestion);

      if (start)
        activateQuiz();

      $.mobile.changePage('#give_quiz_page');
    },
    error: ajaxError
  });
}
function renderAndViewAnswererStats(data) {
  var userId = data['num_choices'] || 0,
      answers = data.answers || [];

  $('#questions').empty();
  
  $.each(answers ,function(i, answer) {
    var $li = $('#questions-template').tmpl({ id: i+1, isCorrect: answer });

    $li.appendTo( "#questions" );

  });
  $.mobile.changePage('#answerer_stats_page');

}
function renderAndViewQuestionStats(data) {
  var numChoices = data['num_choices'] || 0,
      correct = data['correct_choice'] || 0,
      answers = data.answers || [];

  $('#choices').empty();
  for(var i=0; i<numChoices; i++) {
    var $li = $('#choice-template').tmpl({ answer: i, answerChar: alphaChars.charAt(i) });
    if (i == correct)
      $li.addClass('correct');

    $li.appendTo( "#choices" );
  }

  var maxCount = 0;
  $.each(answers ,function(i, answer) {
    var $li = $('#choices .choice[data-answer="'+answer.answer+'"]');
    if (answer.count > maxCount)
      maxCount = answer.count;

    $li
      .find('.bar')
        .attr('data-count', answer.count)
      .end()
      .find('.count')
        .text(answer.count);
  });
  $('#choices .choice').each(function(i, item) {
    var $bar = $(this).find('.bar'),
        count = $bar.attr('data-count');
    $bar
      .css('width', ((parseInt(count) / maxCount * 100) || 0) + '%')
  });
  $.mobile.changePage('#bar_graph_page');
}

// ANSWER functions
function sendAnswer(answer) {
  $.mobile.showPageLoadingMsg();
  $.ajax({
    url: "api/answers",
    dataType: "json",
    async: false,
    data: { 'quizID': currentQuizId, 'answer': answer },
    type: 'POST',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();
      alert('Submitted');
    },
    error: function() {
      $.mobile.hidePageLoadingMsg();
      showError('Error', 'There is no active question in this quiz. Or you have not picked a quiz');
    }
  });
}
var alphaChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
function showAnswerResultsForCurrentQuestion() {
  if (! currentQuizId) return false;
  
  $.mobile.showPageLoadingMsg();

  $.ajax({
    url: "api/quiz_results/" + currentQuizId,
    dataType: "json",
    async: false,
    data: { 'quizID': currentQuizId },
    type: 'GET',
    success: function(data) {
      $.mobile.hidePageLoadingMsg();

      renderAndViewQuestionStats(data);
    },
    error: ajaxError
  });

}

// UTILITY functions
function updateTimer(newTime) {
  var $quiz = $('#quiz');

  $quiz
    .find('.time')
      .attr('data-seconds', newTime)
      .text((newTime < 0) ? 0 : newTime)
      .siblings('.noun')
        .text('second'.pluralize(newTime));

  if (newTime <= 0) {
    $quiz.addClass('paused').removeClass('playing');
    clearTimeout(tickerInterval);
    deactivateQuiz();
    if ($('#results-slider').val() === 'on') {
      showAnswerResultsForCurrentQuestion();
    }
  }
}
String.prototype.pluralize = function(count, plural) {
  if (! plural)
    plural = this + 's';

  return (count == 1 ? this : plural).toString()
}

// GLOBALS
window.currentUser = null;
window.currentQuizId = null;
window.currentQuestionNum = 0;
window.tickerInterval = -1;
window.position = null;

var defaultTimePerQuestion = 30;
$(function() {
  function getLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        window.position = position;
      });
    } else {
      showError('No location','Your browser does not support getting your location. Please try a different one, like Google Chrome');
    }
  }
  getLocation();
  
  $('#quiz')
    .delegate('button.play', 'click', activateQuiz)
    .delegate('button.pause', 'click', deactivateQuiz)
    .delegate('button.more-time', 'click', function() {
      var seconds = $('#quiz .time').attr('data-seconds');
      updateTimer(parseInt(seconds) + 30);
    })
    .delegate('button.less-time', 'click', function() {
      var seconds = $('#quiz .time').attr('data-seconds');
      updateTimer(parseInt(seconds) - 15);      
    });

  $('#quizzes')
    .delegate('.quiz button', 'click', function() {
      currentQuizId = $(this).attr('data-id');
      $.mobile.changePage('#take_quiz_page');
    });
  $('#my-quizzes')
    .delegate('.quiz button', 'click', function() {
      var qId = $(this).attr('data-id');
      getAndRenderQuizStats(qId);
    });
  $('#remote')
    .delegate('button[data-answer]', 'click', function() {
      var answer = $(this).attr('data-answer');
      sendAnswer(answer);
    });
  $('.finish-quiz').click(function() {
    deactivateQuiz();
    currentQuizId = null;
    $.mobile.changePage('#landing_page');    
  });


  $('#add_question_page').bind('pagebeforeshow',function(event, ui){
    $('#add_question_page')
      .find('.answer input')
        .val('');
  });
  $('#bar_graph_page').bind('pagebeforeshow',function(event, ui){
    if (currentQuizId != null)
      $(this).find('#add-q').show();
    else
      $(this).find('#add-q').hide();
  });
  // If we are in app and no current quiz is defined, we cannot render.
  // Bring back to landing.
  //
  // This'll help when people "refresh" or go directly to a page. Since we
  // have to do tricky things with user's state, we need them to go through the flow
  $('.needs-quiz').bind('pagebeforeshow',function(event, ui){
    if (! currentQuizId)
      $.mobile.changePage('#landing_page');      
  });
  $('.needs-location').bind('pagebeforeshow',function(event, ui){
    if (! position) {
      getLocation();
      $.mobile.changePage('#landing_page');
    }
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
  // Get a list of this user's quizzes
  $('#my_quiz_page').bind('pagebeforeshow', function() {
    getMyQuizzes();
	});

  // Get a name and location and create the quiz.
  $('#make-quiz').click(function() {
    if (! position) {
      getLocation();
      return false;
    }
    var quizName = prompt('Enter Quiz Name:'),
        lat = position.coords.latitude,
        long = position.coords.longitude,
        accuracy = position.coords.accuracy;

    if (quizName && lat && long) {
      var callback = function() { $.mobile.changePage('#add_question_page'); }
      createQuiz(quizName, lat, long, accuracy, callback);
    }
    return false;
  });
  $('#take-quiz').click(function() {
    if (! position) {
      getLocation();
      return false;
    }
    var lat = position.coords.latitude,
        long = position.coords.longitude,
        accuracy = position.coords.accuracy;
    
    getQuizzesNear(lat, long, accuracy);
    return false;
  });

  // Start quiz. Take them to create their first question
  $('#start-quiz').click(function() {
    if (! currentQuizId) {
      showError('No quiz selected','Or something went wrong.');
      return false;
    }
    
    $.mobile.changePage('#add_question_page');
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

    if (currentQuizId && numChoices && answer)
      addQuestion(currentQuizId, numChoices, answer-1, start); //0 index the answer
    else
      showError('Error', 'You must select a number of choices and answer');
  });

});

/******************************************************************************/

function ajaxError(jqXHR, textStatus, errorThrown){
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
