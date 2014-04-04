<?php
try{
include_once('config.php');

$csv = fopen($argv[1], 'r');
$mysqli = new mysqli($config['database']['host'], $config['database']['user'], 
  $config['database']['password'], $config['database']['name']);

/* check connection */
if (mysqli_connect_errno()) {
      printf("Connect failed: %s\n", mysqli_connect_error());
          exit();
}

while(($buffer = fgets($csv)) !== false){
  $line = explode('|', $buffer);
  $query = sprintf("INSERT INTO pois (name, lat, lng) VALUES ('%s', %g, %g)", $mysqli->real_escape_string(str_replace("\n", "", $line[4])), $line[2], $line[3]); 

  if(!$mysqli->query($query))
    throw new Exception($mysqli->error);
  print "[#] " . $query . "\n";
}

fclose($csv);

/* close connection */
$mysqli->close();
}catch(Exception $e){
  die($e->getMessage());
}
?>
