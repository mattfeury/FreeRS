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
    
    header("Content-type: application/json");

    $result = fetchQuestionResults($questionID, false);
    $result = array_merge(getQuestion($questionID), array("answers" => $result));
    echo json_encode($result);
  }

  /**
   * Returns question info (num choices, correct) and answers (count per answer)
   */
  function getAllQuestionResultsForQuiz($quizID) {
		$result =  fetchQuestionsForQuiz($quizID, false);
    $questionResults = array();
    
    foreach ($result as $row) {
      $qResult = fetchQuestionResults($row['id'], false);
      $qResult = array_merge(getQuestion($row['id']), array("answers" => $qResult));
      $questionResults[] = $qResult;
    }

    return $questionResults;
  }

  function getAllStatsForQuiz($quizId) {
    $questionStats = array("questions" => getAllQuestionResultsForQuiz($quizId));
    $answererStats = array();
    $users = usersWhoTookQuiz($quizId);
    foreach ($users as $userId) {
      $answererStats[] = array("userId" => $userId['user_id'], "answers" => getQuizResultsForUser($quizId, $userId['user_id']));
    }

    header("Content-type: application/json");
    echo json_encode(array_merge($questionStats, array("answerers" => $answererStats)));
  }

  function getQuestionResults($questionID) {
    $result = fetchQuestionResults($questionID);
    $result = array_merge(getQuestion($questionID), array("answers" => $result));
    header("Content-type: application/json");
    echo json_encode($result); 
  }

  function fetchQuestionResults($questionID, $forceError = true) {
      $dbQuery = sprintf("SELECT answer, COUNT(*) as count FROM answers WHERE question_id=%d GROUP BY answer",
      ($questionID));
      return getDBResultsArray($dbQuery, $forceError);
  }

  function fetchQuestionsForQuiz($quizID, $error = true) {
    $dbQuery = sprintf("SELECT id, correct_choice FROM questions WHERE quiz_id=%d ORDER BY id ASC",
      ($quizID)
      );

		return getDBResultsArray($dbQuery, $error);
  }

  function getQuizResultsForUser($quizID, $userId) {
    $questions = fetchQuestionsForQuiz($quizID, false);
    $results = array();

    foreach ($questions as $question) {
      $dbQuery = sprintf("SELECT answer FROM answers WHERE question_id=%d and user_id='%s'",
        ($question['id']),
        mysql_real_escape_string($userId)
        );
        
      $answer = getDBResultRecord($dbQuery, false);
      if ($answer['answer'] == $question['correct_choice']) {
        $results[] = true;
      } else {
        $results[] = false;
      }

    }

    return $results;
  }
  function usersWhoTookQuiz($quizId) {
    $dbQuery = sprintf("SELECT DISTINCT user_id from answers INNER JOIN questions WHERE quiz_id=%d and questions.id = answers.question_id", $quizId);
    $result = getDBResultsArray($dbQuery, false);

    return $result;
  }
  

?>
