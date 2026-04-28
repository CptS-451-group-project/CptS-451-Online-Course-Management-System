"use strict"
window.addEventListener("load", () => {
  const termNameFld = document.getElementById("termName");
  const startDateFld = document.getElementById("startDate");
  const endDateFld = document.getElementById("endDate");
  const createTermBtn = document.getElementById("createTermBtn");

  createTermBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!termNameFld.value || !startDateFld.value || !endDateFld.value) {
      alert("Please fill out all fields.");
      return;
    }

    const payload = {
      term_name: termNameFld.value,
      start_date: startDateFld.value,
      end_date: endDateFld.value
    };

    try {
      const response = await fetch('http://localhost:5000/api/courses/terms', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Action Denied: " + (data.error || "Unknown Error"));
        return;
      }

      alert("Term created successfully!");
      // Send them back to the course creation page so they can use their new term!
      window.location.href = '/admin/course-edit.html'; 
      
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
  });
});