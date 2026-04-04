<?php
include("../config.php");

if(isset($_POST['submit'])){
  $name = $_POST['name'];
  $mobile = $_POST['mobile'];

  mysqli_query($conn,"INSERT INTO distributor(name,mobile) VALUES('$name','$mobile')");
  echo "Distributor Created";
}
?>

<form method="post">
<input name="name" placeholder="Name">
<input name="mobile" placeholder="Mobile">
<button name="submit">Create</button>
</form>
