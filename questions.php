<?php
	include 'db_helper.php';

  function addQuestion($quizID, $numChoices, $correctChoice) {
    $dbQuery = sprintf("INSERT INTO questions (quiz_id, num_choices, correct_choice) VALUES (%d, %d, %d)",
        ($quizID),
        ($numChoices),
        ($correctChoice));

    $result = getDBResultInserted($dbQuery, 'id');
    header("Content-type: application/json");

    $dbQuery = sprintf("UPDATE quizzes SET current_question_id=%d WHERE id=%d",
      ($result['id']),
      ($quizID)
      );

    if (getDBResultAffected($dbQuery) > 0 ) {
      echo json_encode($result); 
    }
  }

  function answerQuestion($questionID, $answer) {
    $userId = idForCurrentUser();
    	$dbQuery = sprintf("INSERT INTO answers (question_id, user_id, answer) VALUES (%d, %d, %d)",
    	  ($questionID),
      ($userId),
      ($answer));
    	$result = getDBResultInserted($dbQuery, 'id');
    	header("Content-type: application/json");
    	echo json_encode($result); 
  }

?>
