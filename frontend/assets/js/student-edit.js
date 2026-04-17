"use strict"
window.addEventListener("load", () => {
  // Element Objects of all the fields and buttons in the html
  const studentIdFld   = document.getElementById("studentId");
  const studentNameFld = document.getElementById("studentName");
  const newPasswordFld = document.getElementById("newPassword");

  const createBtn = document.getElementById("create");

  // Rest of code here
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!studentNameFld.value || !newPasswordFld.value) {
      alert("Please enter both a student name (email) and password.");
      return;
    }

    const payload = {
      email: studentNameFld.value, // "Name" acts as email since auth needs email
      password: newPasswordFld.value,
      role_name: "Student" // default role for this form
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        alert("Action Denied by Database: " + (data.message || data.error || "Unknown Error"));
        return;
      }

      alert("Success! Student created.");
      window.location.href = '/frontend/admin/index.html';
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
  });

});
