/**
 * Ajax functions for loading things from the API and setting the appropriate templates
 */

// Categories array of {id, name} json objects
var categoriesLoaded = false,
    categoriesById = {};
function loadCategoriesIfNeeded() {
  if (categoriesLoaded) return false;

  $('.add_product_categories, #categories_list').empty();

  $.ajax({
    url: "api/categories",
    dataType: "json",
    async: false,
    success: function(data) {
      categoriesLoaded = true;

      $.each(data, function(i, item) {
        categoriesById[item.id] = item;
      });

      // template on create product page
      $( "#category_option_template" ).tmpl( data ).appendTo( ".add_product_categories" );
      // template on list categories page
      $( "#category_list_row_template" ).tmpl( data ).appendTo( "#categories_list" );
      setTimeout(function() {
        var myselect = $("select.add_product_categories");

        for(var i = 0; i < myselect.length; i++)
          myselect[i].selectedIndex = 0;

      }, 0);
    },
    error: ajaxError
  });
}
// Loads a given product with id = id
function loadProduct(id) {
  $( "#view_product_content" ).empty();    
  $.ajax({
    url: "api/product/" + id,
    dataType: "json",
    async: false,
    success: function(data, textStatus, jqXHR) {
      //Create The New Rows From Template
      addProduct(data);
      $( "#product_template" ).tmpl( data ).appendTo( "#view_product_content" );
      $('#view_product_content').trigger('create');
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
      currentQuiz = data;
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
    data: { quizID: quizId, num_choices: numChoices, correct_choice: answer },
    type: 'POST',
    success: function(data) {
      //TODO start
      $('#quiz')
        .find('.question').text(++currentQuestionNum)
        .find('.time').text('0:30')
        .find('.numChoices').text(data['num_choices']);

      $.mobile.changePage('#give_quiz_page');
    },
    error: ajaxError
  });
}


//stores our loaded products so we can cache them and not call the db all the time
var productsById = {};
function addProducts(products) {
  $.each(products, function(i, item) {
    addProduct(item);
  });
}
function addProduct(product) {
  productsById[product.id] = product;
}

window.currentUser = null;
$(function() {
  $.ajax({
    url: "/user",
    dataType: 'text',
    success: function(data) {
      currentUser = data;
      var $view = $('#view_product_content');
      if ($view.find('.contact[data-id]').attr('data-id') == data)
        $view.find('.actions').removeClass('not-mine').addClass('mine');
    },
    error: function() { showError('Not logged in', 'You don\'t appear to be logged in'); }
  });
  
  // Load categories if we need
  $('#list_categories_page').bind('pagebeforeshow',function(event, ui){
    loadCategoriesIfNeeded();
    $('#categories_list').listview('refresh');
  });
  
	//Load categories before viewing add product page for the first time
	$('#add_product_page, #edit_product_page').bind('pagebeforeshow', function() {
    loadCategoriesIfNeeded();
    $(this).find('select.add_product_categories').selectmenu('refresh');
	});

	$('#view_product_page').bind('pagebeforeshow', function() {
    //we can't always count on getting the id from the url since
    //sometimes jQuery doesn't update it, so we mostly rely on the link clicked
    //if, however, we navigate direct to the page, no link was clicked so we'll need
    //to load from the url
    var idFromUrl = location.hash.split('=').pop();
    if (! $('#view_product_content').children().length && idFromUrl)
      loadProduct(idFromUrl);
	});
  $('#list_products_page').bind('pagebeforeshow',function(event, ui){
    // same nastiness as above
    var idFromUrl = location.hash.split('=').pop();
    if (! $('#products_list').children().length && idFromUrl)
      loadProducts(idFromUrl);
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
    if (! currentQuiz || ! currentQuiz.id) {
      showError('No quiz selected','Or something went wrong.');
      return false;
    }
    
    //var callback = function() { $.mobile.changePage('#add_question_page'); }
    $.mobile.changePage('#add_question_page');
    //activateQuiz(currentQuiz.id, callback);
  });
  $('.add-question').click(function() {
    if (! currentQuiz || ! currentQuiz.id) {
      showError('No quiz selected','Or something went wrong.');
      return false;
    }
    var $this = $(this),
        numChoices = $this.siblings('.choices').find('select').val(),
        answer = $this.siblings('.answer').find('input').val();

    addQuestion(currentQuiz.id, numChoices, answer, true);
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
