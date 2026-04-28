"use strict"
window.addEventListener("load", () => {
  const studentIdFld   = document.getElementById("studentId");
  const courseIdFld    = document.getElementById("courseId");
  const createBtn      = document.getElementById("create");

  // --- 1. Fetch and Populate Students Dropdown ---
  const loadStudents = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users', { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch students");
      
      const users = await res.json();
      
      studentIdFld.innerHTML = '<option value="">-- Select a Student --</option>';
      
      // Filter out admins/professors, only show students
      const students = users.filter(u => u.role_name === 'Student');

      students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.user_id;
        // Display their email to make it easy for the admin
        option.textContent = `${student.email} (ID: ${student.user_id})`;
        studentIdFld.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      studentIdFld.innerHTML = '<option value="">Error loading students</option>';
    }
  };

  // --- 2. Fetch and Populate Courses Dropdown ---
  const loadCourses = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courses', { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to fetch courses");
      
      const courses = await res.json();

      courseIdFld.innerHTML = '<option value="">-- Select a Course --</option>';

      courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course.course_term_id;
        // Display Course Name and Term to make it easy for the admin
        option.textContent = `${course.course_name} - ${course.term_name || 'No Term'}`;
        courseIdFld.appendChild(option);
      });
    } catch (err) {
      console.error(err);
      courseIdFld.innerHTML = '<option value="">Error loading courses</option>';
    }
  };

  // Initialize the dropdowns immediately
  loadStudents();
  loadCourses();

  // --- 3. Handle Submit Button ---
  createBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!studentIdFld.value || !courseIdFld.value) {
      alert("Please select both a Student and a Course from the dropdown menus.");
      return;
    }

    const payload = {
      course_term_id: parseInt(courseIdFld.value, 10),
      user_id: parseInt(studentIdFld.value, 10),
    };

    try {
      const response = await fetch('http://localhost:5000/api/enroll', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();

      if (!response.ok) {
        alert("Action Denied by Database: " + (data.message || data.error || "Unknown Error"));
        return;
      }

      alert("Enrollment submitted successfully!");
      window.location.href = '/admin'; // Send back to dashboard
      
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    }
  });

});