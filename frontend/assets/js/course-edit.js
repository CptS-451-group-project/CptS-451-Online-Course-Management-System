"use strict"
window.addEventListener("load", () => {
  const courseNameFld  = document.getElementById("courseName");
  const descriptionFld = document.getElementById("description");
  
  const termIdFld      = document.getElementById("termId");
  const profIdFld      = document.getElementById("profId");
  const locationFld    = document.getElementById("location");
  const maxStudentsFld = document.getElementById("maxStudents");

  const dayOfWeekFld   = document.getElementById("dayOfWeek");
  const startTimeFld   = document.getElementById("startTime");
  const endTimeFld     = document.getElementById("endTime");

  const createBtn = document.getElementById("create");

  // Safely get courseId from URL if we are in Edit Mode
  const urlParams = new URLSearchParams(window.location.search);
  const courseId = urlParams.get('courseId');

  // --- Fetch terms from database and populate the dropdown ---
  const loadTerms = async () => {
    try {
      console.log("Attempting to fetch terms from backend...");
      const response = await fetch('http://localhost:5000/api/courses/terms', {
          cache: 'no-store' // Force browser to get fresh data
      });
      
      if (!response.ok) throw new Error("Failed to fetch terms. Server responded with status: " + response.status);
      
      const terms = await response.json();
      console.log("Success! Terms fetched:", terms);
      
      // Clear the loading message
      termIdFld.innerHTML = '<option value="">-- Select a Term --</option>';
      
      // Add each term as an option in the dropdown
      terms.forEach(term => {
        const option = document.createElement("option");
        option.value = term.term_id;
        option.textContent = term.term_name; 
        termIdFld.appendChild(option);
      });

      // Auto-populate edit view if editing an existing course after terms load
      if (courseId) {
        fetch('/api/courses')
          .then(res => res.json())
          .then(courses => {
            const course = courses.find(c => c.course_term_id == courseId);
            if (course) {
              courseNameFld.value = course.course_name || "";
              descriptionFld.value = course.description || "";
              profIdFld.value = course.professor_id || "";
              if(course.location) locationFld.value = course.location;
              if(course.max_students) maxStudentsFld.value = course.max_students;
              // Map the loaded term
              if(course.term_id) termIdFld.value = course.term_id;
              
              // Map the raw schedule details
              if(course.raw_day_of_week) dayOfWeekFld.value = course.raw_day_of_week;
              if(course.raw_start_time) startTimeFld.value = course.raw_start_time;
              if(course.raw_end_time) endTimeFld.value = course.raw_end_time;
              
              createBtn.textContent = "Save Changes";
            }
          })
          .catch(err => console.error('Error fetching course for auto-population:', err));
      }
    } catch (err) {
      console.error("Error in loadTerms:", err);
      termIdFld.innerHTML = '<option value="">Error loading terms</option>';
    }
  };

  // Call it immediately on page load
  loadTerms();

  // --- Handle the Create/Edit Button Click ---
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault(); 

    if (!courseNameFld.value || !termIdFld.value || !locationFld.value) {
      alert("Please enter a Course Name, Term, and Location at minimum.");
      return;
    }

    // Existing behavior: if editing, delete the old term first
    if(courseId) {
      try {
        const res = await fetch(`http://localhost:5000/api/courses/${courseId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error("Could not delete old course configuration.");
      } catch (err) {
        console.error(err);
        alert("Network Error: " + err.message);
        return;
      }
    } 

    // Safely parse the Professor ID to allow NULLs
    let parsedProfId = profIdFld.value.trim();
    parsedProfId = parsedProfId ? parseInt(parsedProfId, 10) : null;
    if (isNaN(parsedProfId)) parsedProfId = null;

    const payload = {
      course_name: courseNameFld.value,
      description: descriptionFld.value || "",
      term_id: parseInt(termIdFld.value, 10),
      professor_id: parsedProfId, 
      location: locationFld.value,
      max_students: parseInt(maxStudentsFld.value, 10) || 30,
      
      // Schedule Panel Data
      day_of_week: dayOfWeekFld.value || null,
      start_time: startTimeFld.value ? startTimeFld.value + ":00" : null,
      end_time: endTimeFld.value ? endTimeFld.value + ":00" : null
    };

    try {
      const response = await fetch('http://localhost:5000/api/courses', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        alert("Action Denied by Database: " + (data.message || data.error || "Unknown Error"));
        return;
      }

      window.location.href = '/admin'; // Return to dashboard
      
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
  });

// --- Handle Term Deletion ---
  const deleteTermBtn = document.getElementById("deleteTermBtn");

  deleteTermBtn.addEventListener("click", async (e) => {
    e.preventDefault(); 
    
    const selectedTermId = termIdFld.value;
    
    if (!selectedTermId) {
      alert("Please select a term from the dropdown to delete.");
      return;
    }

    // Get the actual text of the selected term (e.g., "Fall 2026") for the confirmation box
    const termName = termIdFld.options[termIdFld.selectedIndex].text;
    
    if (!confirm(`Are you sure you want to delete the term "${termName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/courses/terms/${selectedTermId}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();

      if (!res.ok) {
        alert("Action Denied by Database: " + (data.error || "Unknown Error"));
        return;
      }

      alert("Term deleted successfully!");
      
      // Automatically refresh the dropdown so the deleted term disappears!
      loadTerms(); 
      
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
  });

  
});