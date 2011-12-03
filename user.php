<?php
	include 'db_helper.php';
	
	function jsonForCurrentUser() {
    global $_USER;
    $result = $_USER;
    header("Content-type: application/json");
		echo json_encode($result);
  }
?>
