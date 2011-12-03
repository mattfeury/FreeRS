<?php
	include 'db_helper.php';

  // helper
  function idForCurrentUser() {
    global $_USER;

    if (! isset($_USER['uid'])) {
  		$GLOBALS["_PLATFORM"]->sandboxHeader("HTTP/1.1 500 Internal Server Error");
	  	die();
    }

    return $_USER['uid'];
  }

  function listProducts($catId) {
    $dbQuery = sprintf("SELECT * FROM products WHERE category_id = '%s' ORDER BY date_created DESC",
      mysql_real_escape_string($catId));
		$result = getDBResultsArray($dbQuery);
		header("Content-type: application/json");
    echo json_encode($result);
	}
	
  function listUserProducts() {
    $dbQuery = sprintf("SELECT * FROM products WHERE user_id = '%s' ORDER BY date_created DESC",
      mysql_real_escape_string(idForCurrentUser()));
		$result = getDBResultsArray($dbQuery);
		header("Content-type: application/json");
    echo json_encode($result);
	}

  function getProduct($id) {
    $dbQuery = sprintf("SELECT * FROM products WHERE id = '%s'",
    mysql_real_escape_string($id));
    $result=getDBResultRecord($dbQuery);
    header("Content-type: application/json");
    echo json_encode($result);
  }
	
  function addProduct($title, $description, $price, $categoryId) {

    $userId = idForCurrentUser();

		$dbQuery = sprintf("INSERT INTO products (user_id, title, description, price, category_id) VALUES ('%s', '%s', '%s', '%s', '%s')",
      mysql_real_escape_string($userId),
      mysql_real_escape_string($title),
      mysql_real_escape_string($description),
      mysql_real_escape_string($price),
      mysql_real_escape_string($categoryId));
	
		$result = getDBResultInserted($dbQuery,'productId');
		
		header("Content-type: application/json");
    echo json_encode($result);
  }

	
  function updateProduct($id, $description, $price, $categoryId) {
		$dbQuery = sprintf("UPDATE products SET description = '%s', price = '%s', category_id = '%s' WHERE id = '%s' AND user_id = '%s'",
			mysql_real_escape_string($description),
			mysql_real_escape_string($price),
			mysql_real_escape_string($categoryId),
      mysql_real_escape_string($id),
      mysql_real_escape_string(idForCurrentUser()));
		
		$result = getDBResultAffected($dbQuery);
		
		header("Content-type: application/json");
		echo json_encode($result);
	}

	function deleteProduct($id) {
		$dbQuery = sprintf("DELETE FROM products WHERE id = '%s' AND user_id = '%s'",
      mysql_real_escape_string($id),
      mysql_real_escape_string(idForCurrentUser()));

		$result = getDBResultAffected($dbQuery);

		header("Content-type: application/json");
		echo json_encode($result);
  }
?>
