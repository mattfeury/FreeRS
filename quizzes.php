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

  function makeSession() {
    print_r($_SESSION);
    if(isset($_SESSION['qId']))
      $_SESSION['qId']=$_SESSION['qId']+1;
    else
      $_SESSION['qId']=1;

    echo "made qId=". $_SESSION['qId'];
  }
  function getSession() {
    echo "qId=". $_SESSION['qId'];
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
?>
