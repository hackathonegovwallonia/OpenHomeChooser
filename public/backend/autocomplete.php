<?php
try{
include_once('config.php');

$q = $_GET['query'];
if(isset($_GET['query']) && strlen($_GET['query']) > 2){

$mysqli = new mysqli($config['database']['host'], $config['database']['user'], 
  $config['database']['password'], $config['database']['name']);

/* check connection */
if (mysqli_connect_errno()) {
      printf("Connect failed: %s\n", mysqli_connect_error());
          exit();
}
$query = "SELECT * FROM pois WHERE name LIKE '%".$mysqli->real_escape_string($_GET['query'])."%' LIMIT 10";
$results = array();
if ($result = $mysqli->query($query)) {


    while ($row = $result->fetch_row()) {
        $d = new stdClass();
        $d->value = $row[1];
        $d->data = array(
            'lat' => $row[2],
            'lng' => $row[3],
        );
        array_push($results, $d);
    }
    $result->close();
}

/* close connection */
$mysqli->close();
}
header('Content-type: application/json');
echo json_encode(array('success' => 1, 'suggestions' => $results));

}catch(Exception $e){
  echo json_encode(array('success' => 0, 'message' => $e->getMessage()));
}
?>
