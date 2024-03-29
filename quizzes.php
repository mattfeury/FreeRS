<?php
	include 'db_helper.php';

	function listQuizzes() {
    $userId = idForCurrentUser();
		$dbQuery = sprintf("SELECT * FROM quizzes WHERE user_id='%s' ORDER BY id DESC",
		  mysql_real_escape_string($userId)
		  );
		$result = getDBResultsArray($dbQuery);
		header("Content-type: application/json");
		echo json_encode($result);
  }

  function cmpDist($a, $b) {
    if ($a['active'] == $b['active']) {
      if ($a['distance'] == $b['distance']) {
          return $a['created_at'] - $b['created_at'];
      }
      return ($a['distance'] < $b['distance']) ? -1 : 1;
    }
    return ($a['active'] < $b['active']) ? 1 : -1;
  }
  function listQuizzesWithinProximity($lat, $long, $accuracy, $proximity) {
		$dbQuery = sprintf("SELECT * FROM quizzes WHERE `created_at` >= CURRENT_DATE
  AND `created_at` < CURRENT_DATE + INTERVAL 1 DAY ORDER BY `created_at` DESC");
		$result = getDBResultsArray($dbQuery);
    $quizzes = array();
    
    foreach ($result as $row) {
      $distance = getDistance($lat, $long, $row["loc_lat"], $row["loc_long"]);
      if ($distance < $proximity) {
        $row['distance'] = $distance;
        $quizzes[] = $row;
      }
    }
    usort($quizzes, "cmpDist");
		header("Content-type: application/json");
		echo json_encode($quizzes);
  }

  function getDistance($lat1, $lon1, $lat2, $lon2) {
    $theta = $lon1 - $lon2;
    $dist = sin(deg2rad($lat1)) * sin(deg2rad($lat2)) +  cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * cos(deg2rad($theta));
    $dist = acos($dist);
    $dist = rad2deg($dist);
    $miles = $dist * 60 * 1.1515;

    // meters
    return ($miles * 1.609344) * 1000;
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

		$result = getDBResultInserted($dbQuery, "quizId");
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
