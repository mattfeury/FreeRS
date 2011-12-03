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

	function listQuizzes() {
		$dbQuery = sprintf("SELECT * FROM quizzes");
		$result = getDBResultsArray($dbQuery);
		header("Content-type: application/json");
		echo json_encode($result);
  }

  function addQuiz($name) {
    $userId = idForCurrentUser();
    
		$dbQuery = sprintf("INSERT INTO quizzes (user_id, name) VALUES ('%s', '%s')",
      mysql_real_escape_string($userId),
      mysql_real_escape_string($name));

		$result = getDBResultInserted($dbQuery);
		header("Content-type: application/json");
		echo json_encode($result); 
  }

  function createQuiz($name, $lat, $long, $accuracy) {
    $userId = idForCurrentUser();
    
	$dbQuery = sprintf("INSERT INTO quizzes (user_id, name, loc_lat, loc_long, accuracy) VALUES ('%s', '%s', '%f', '%f', '%d')",
      mysql_real_escape_string($userId),
      mysql_real_escape_string($name),
      ($lat),
      ($long),
      ($accuracy)
      );

		$result = getDBResultInserted($dbQuery);
		header("Content-type: application/json");
		echo json_encode($result);   
  }

  function setActivateQuiz($quizID, $activate) {
    $dbQuery = sprintf("UPDATE quizzes SET active='%d' WHERE id=%d",
        ($activate),
        ($quizID));
    if (getDBResultAffected($dbQuery) > 0 ) {
        echo json_encode(array('success'=> true));
    }
    else {
        echo json_encode(array('success'=> false));
    }
  }

  function activateQuiz($quizID) {
    setActivateQuiz($quizID, 1);
  }

  function deactivateQuiz($quizID) {
    setActivateQuiz($quizID, 0);
  }
?>
