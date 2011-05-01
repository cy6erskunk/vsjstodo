<?php
/** Return values
    'OK' - data have been written
    'OK-fuuuuu' - tryed to write data, but fopen failed
    'suxx' - couldn't open file for reading
    'suxx-suxx' - opened file for reading but failed to read
    'FUUUUUUUUUUUuuu' - GET request with empty or absent 'get' param
*/
/** Data manipulation
    All data are transmitted at a once, when reading or writing.
    This may lead to problems if big todo-lists are being saved or opened.
*/
// POST request to save data
if($_SERVER['REQUEST_METHOD'] == 'POST') {
    echo "OK";
    $fp = fopen('./data', 'w') or die('-fuuuuu');
    fwrite($fp, $_POST['data']);
    fclose($fp);
}
// GET request with non-empty 'get' param - to read saved data
elseif($_SERVER['REQUEST_METHOD'] == 'GET' and !empty($_GET['get'])) {
    $fp = fopen('./data', 'r') or die("suxx");
    $data = fread($fp,filesize('./data')) or die("suxx-suxx");
    echo $data;
    fclose($fp);
}
// GET request with empty or absent 'get' param
else {
    echo "FUUUUUUUUUUUuuu";
}
?>
