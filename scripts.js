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
// Loads all the products from a category
function loadProducts(catId) {
  $( "#products_list" ).empty();
  $.ajax({
    url: "api/categories/" + catId,
    dataType: "json",
    async: false,
    success: function(data) {
      //Create The New Rows From Template
      addProducts(data);
      $( "#product_list_row_template" ).tmpl( data ).appendTo( "#products_list" );
      $('#products_list').listview('refresh');
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



  // Links to category pages should load the products
  // and populate the template
  $('a.category').live('click', function() {
    var id = $(this).attr('data-id');
    loadProducts(id);
  });
  
  // Links to product pages should load the product info
  // and populate the template
  $('a.product').live('click', function() {	
    var pId = $(this).attr('data-id');
    loadProduct(pId);
  });

  // Links to edit product page should populate the template
  // We already have the product cached
  $('a.edit').live('click', function() {	
    var pId = $(this).attr('data-id');
    if (productsById[pId]) {
      // Set the edit template with this product
      $('#edit_product_content .product_form').empty();
      $('#edit_product_template').tmpl( productsById[pId] ).appendTo('#edit_product_content .product_form');

      // Select the right category
      setTimeout(function() {
        var myselect = $("#edit_product_content select");
        var index = 0;
        myselect.find('option').each(function(i, item) {
          if ($(item).attr('value') == productsById[pId]['category_id'])
            index = i;
        });

        myselect[0].selectedIndex = index;
        myselect.selectmenu('refresh');
      }, 0);
    }
  });

	//Handles the add product form
	$('#add_button').bind('click', function() {
    var $form = $('#add_product_content'),
        data = {
          title: $form.find('#add_product_title').val(),
          description: $form.find('#add_product_description').val(),
          price: $form.find('#add_product_price').val(),
          categoryId: $form.find('.add_product_categories').val()
        };

    if (data.title.trim() === '') {
      showError('Product title required', 'Please insert a valid product name.');
      return false;
    }

		$.ajax({
			url: "api/product",
			dataType: "json",
	    async: false,
			data: data,
			type: 'POST',
      success: function(data) {
        //reset form
        $form
          .find('#add_product_title').val('').end()
          .find('#add_product_description').val('').end()
          .find('#add_product_price').val('').end()
          .find('.add_product_categories').val('');

        //load the new product in the template since we redirect there
        loadProduct(data.productId);
      },
	    error: ajaxError
		});
	});

  //Handles the edit product form
  $('#edit_button').bind('click', function() {
    var $form = $('#edit_product_content'),
        id = $form.find('.title').attr('data-id'),
        data = {
          description: $form.find('#edit_product_description').val(),
          price: $form.find('#edit_product_price').val(),
          categoryId: $form.find('.add_product_categories').val()
        };
    
    $.ajax({
      url: "api/product/" + id,
      dataType: "json",
      async: false,
      data: data,
      headers: {'X-HTTP-Method-Override': 'PUT'},
      type: 'POST',
      success: function(data) {
        loadProduct(id);
      },        
      error: ajaxError
		});
  });
  //Delete button
	$('#remove_button').bind('click', function() {
    if (! confirm("Really delete (cannot be undone)?"))
      return false;

    var $form = $('#edit_product_content'),
        id = $form.find('.title').attr('data-id');

		$.ajax({
			url: "api/product/"+id,
			dataType: "json",
	    async: false,
			type: 'DELETE',
	    error: ajaxError
		});
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
