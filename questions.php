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

  function getQuestionInformation($questionID) {
    	$result = getQuestion($questionID);
    	header("Content-type: application/json");
    	echo json_encode($result); 
  }

  function getQuestion($questionID) {
    $dbQuery = sprintf("SELECT num_choices, correct_choice FROM questions WHERE id=%d",
      ($questionID)
      );
    return getDBResultRecord($dbQuery);
  }

  function getCurrentQuestionForQuiz($quizID, $active) {
    if ($active) {
     	$dbQuery = sprintf("SELECT current_question_id FROM quizzes WHERE id=%d and active=1",
    	    ($quizID));
  	  }
  	else {
     	$dbQuery = sprintf("SELECT current_question_id FROM quizzes WHERE id=%d",
      	 ($quizID));
  	}
    $result = getDBResultRecord($dbQuery);

    if ($result == NULL) {
      return -1;
    }

    return $result['current_question_id'];
  }

  function answerQuestion($quizID, $answer) {
    $userId = idForCurrentUser();
    $questionID = getCurrentQuestionforQuiz($quizID, true);

    if ($questionID == -1) {
      echo json_encode(array('success'=> false));
      return;
    }
    
    	$dbQuery = sprintf("INSERT INTO answers (question_id, user_id, answer) VALUES (%d, '%s', %d) ON DUPLICATE KEY UPDATE answer=%d",
    	  ($questionID),
      mysql_real_escape_string($userId),
      ($answer),
      ($answer));
    	$result = getDBResultInserted($dbQuery, 'id');
    	header("Content-type: application/json");
    	echo json_encode($result); 
  }

  function getQuestionResultsForQuiz($quizID) {
    $questionID = getCurrentQuestionforQuiz($quizID, false);

    if ($questionID == -1) {
      echo json_encode(array('success'=> false));
      return;
    }
    
    return getQuestionResults($questionID);
  }

  function getQuestionResults($questionID) {
    $dbQuery = sprintf("SELECT answer, COUNT(*) as count FROM answers WHERE question_id=%d GROUP BY answer",
      ($questionID));
    $result = getDBResultsArray($dbQuery);
    $result = array_merge(getQuestion($questionID), array("answers" => $result));
    header("Content-type: application/json");
    echo json_encode($result); 
  }

?>
