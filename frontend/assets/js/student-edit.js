"use strict"
window.addEventListener("load", () => {
  // Element Objects of all the fields and buttons in the html
  const studentIdFld   = document.getElementById("studentId");
  const studentNameFld = document.getElementById("studentName");
  const studentEmailFld = document.getElementById("studentEmail");
  const newPasswordFld = document.getElementById("newPassword");

  const createBtn = document.getElementById("create");

  // Get studentId if providedstudentId
  const studentId = window.location.search.substring(11);
  studentIdFld.value = studentId;


  // Disable userId field
  studentIdFld.disabled = true;

  // Rest of code here
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!studentNameFld.value || !newPasswordFld.value) {
      alert("Please enter both a student name (email) and password.");
      return;
    }

    // Remove user if they already exist (modify not a method in backend yet)
    if(studentId != "") {
      try {
      const res = await fetch(`http://localhost:5000/api/users/${studentId}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");

      console.log("here!");
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
    } 

    const payload = {
      email: studentEmailFld.value, // "Name" acts as email since auth needs email
      password: newPasswordFld.value,
      role_name: "Student" // default role for this form
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
