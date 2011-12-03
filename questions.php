<?php
	include 'db_helper.php';

  function addQuestion($quizID, $numChoices, $correctChoice) {
	$dbQuery = sprintf("INSERT INTO questions (quiz_id, num_choices, correct_choice) VALUES ('%s', '%s', '%s')",
      mysql_real_escape_string($quizID),
      mysql_real_escape_string($numChoices),
      mysql_real_escape_string($correctChoice));

	$result = getDBResultInserted($dbQuery);
	header("Content-type: application/json");
	echo json_encode($result); 
  }

?>
