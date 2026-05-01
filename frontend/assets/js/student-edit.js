"use strict"
window.addEventListener("load", () => {
  // Element Objects of all the fields and buttons in the html
  const userIdFld        = document.getElementById("userId");
  const roleFld          = document.getElementById("role");
  const firstNameFld     = document.getElementById("firstName");
  const middleInitialFld = document.getElementById("middleInitial");
  const lastNameFld      = document.getElementById("lastName");
  const emailFld         = document.getElementById("email");
  const newPasswordFld   = document.getElementById("newPassword");

  const createBtn   = document.getElementById("create");

  // Get studentId if providedstudentId
  const userId = window.location.search.substring(11);
  userIdFld.value = userId;

  // Disable userId field
  userIdFld.disabled = true;

  // Student is the default role
  roleFld.value = "Student" 

  // Autopopulate
  const loadUser = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/' + userId, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        alert("Action Denied by Database: " + (data.message || data.error || "Unknown Error"));
        return;
      }

      roleFld.value          = data[0].role_name;
      firstNameFld.value     = data[0].first_name;
      middleInitialFld.value = data[0].middle_initial;
      lastNameFld.value      = data[0].last_name;
      emailFld.value         = data[0].email;
   }
   catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    } 
  }
  
  if(userId != "") {
    loadUser();
  }

  // Rest of code here
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!firstNameFld.value || !roleFld.value || !newPasswordFld.value) {
      alert("Please enter both a user first name, role, and password.");
      return;
    }

    // Remove user if they already exist (modify not a method in backend yet)
    if(userId != "") {
      try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");

      console.log("here!");
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
    } 

    const payload = {
      email: emailFld.value, // "Name" acts as email since auth needs email
      password: newPasswordFld.value,
      role_name: roleFld.value,
      first_name: firstNameFld.value,
      middle_initial: middleInitialFld.value,
      last_name: lastNameFld.value
    };

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      console.log("here!");

      if (!response.ok) {
        alert("Action Denied by Database: " + (data.message || data.error || "Unknown Error"));
        return;
      }

      window.location.href = '/admin';
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
  });

});
