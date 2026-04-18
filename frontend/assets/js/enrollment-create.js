"use strict"
window.addEventListener("load", () => {
  // Element Objects of all the fields and buttons in the html
  const studentIdFld   = document.getElementById("studentId");
  const courseIdFld    = document.getElementById("courseId");
  const createBtn = document.getElementById("create");

  // Rest of code here
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!studentIdFld.value || !courseIdFld.value) {
      alert("Please enter both a valid student ID and course ID.");
      return;
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
