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
    	$dbQuery = sprintf("SELECT current_question_id FROM quizzes WHERE id=%d",
    	  ($quizID));
    return getDBResultRecord($dbQuery)['current_question_id'];
  }

  function answerQuestion($quizID, $answer) {
    $userId = idForCurrentUser();
    $questionID = getCurrentQuestionforQuiz($quizID);
    
    	$dbQuery = sprintf("INSERT INTO answers (question_id, user_id, answer) VALUES (%d, %d, %d)
    	                    ON DUPLICATE KEY UPDATE answer=%d",
    	  ($questionID),
      ($userId),
      ($answer),
      ($answer));
    	$result = getDBResultInserted($dbQuery, 'id');
    	header("Content-type: application/json");
    	echo json_encode($result); 
  }

?>
