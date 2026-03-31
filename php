<?php
include "db.php";

$name = $_POST['name'];
$mobile = $_POST['mobile'];
$password = $_POST['password'];

$query = "INSERT INTO distributors(name,mobile,password,balance) 
VALUES('$name','$mobile','$password','0')";

if(mysqli_query($conn,$query)){
    echo "Distributor Created Successfully";
}else{
    echo mysqli_error($conn);
}
