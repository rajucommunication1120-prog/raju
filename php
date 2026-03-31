<?php
include "db.php";

$name = $_POST['name'];
$mobile = $_POST['mobile'];
$password = $_POST['password'];

mysqli_query($conn, "INSERT INTO distributors(name,mobile,password,balance) VALUES('$name','$mobile','$password','0')");

echo "Distributor Created";
?>
