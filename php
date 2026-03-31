<?php
include "db.php";
<?php
include "../db.php";

$name = $_POST['name'];
$mobile = $_POST['mobile'];
$password = $_POST['password'];
$distributor_id = $_POST['distributor_id'];

$query = "INSERT INTO retailers(distributor_id,name,mobile,password,balance) 
VALUES('$distributor_id','$name','$mobile','$password','0')";

if(mysqli_query($conn,$query)){
    echo "Retailer Created Successfully";
}else{
    echo "Error: " . mysqli_error($conn);
}
?>
