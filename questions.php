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

  function getCurrentQuestionForQuiz($quizID) {
    	$dbQuery = sprintf("SELECT current_question_id FROM quizzes WHERE id=%d and active=1",
    	  ($quizID));
    	$result = getDBResultRecord($dbQuery);

    if ($result == NULL) {
      return -1;
    }

    return $result['current_question_id'];
  }

  function answerQuestion($quizID, $answer) {
    $userId = idForCurrentUser();
    $questionID = getCurrentQuestionforQuiz($quizID);

    if ($questionID == -1) {
      echo json_encode(array('success'=> false));
      return;
    }
    
    	$dbQuery = sprintf("REPLACE answers (question_id, user_id, answer) VALUES (%d, '%s', %d)",
    	  ($questionID),
      mysql_real_escape_string($userId),
      ($answer));
    	$result = getDBResultInserted($dbQuery, 'id');
    	header("Content-type: application/json");
    	echo json_encode($result); 
  }

?>
