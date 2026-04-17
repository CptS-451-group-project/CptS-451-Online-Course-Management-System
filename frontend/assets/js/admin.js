"use strict"
window.addEventListener("load", () => {
  const userName         = document.getElementById("userName");
  const userId           = document.getElementById("userId");
  const coursesTable     = document.getElementById("coursesTable");
  const studentsTable    = document.getElementById("studentsTable");
  const enrollmentsTable = document.getElementById("enrollmentsTable");

  // --- ACTIONS (Delete Functions) ---
  window.deleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");
      alert("Course deleted!");
      loadCourses();
      loadEnrollments();
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  window.deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");
      alert("User deleted!");
      loadStudents();
      loadEnrollments();
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  window.deleteEnrollment = async (course_term_id, user_id) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;
    try {
      const res = await fetch(`/api/enroll/${course_term_id}/${user_id}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");
      alert("Enrollment removed!");
      loadEnrollments();
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  // --- DATA LOADERS ---
  const loadCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error("Failed to load courses");
      const courses = await response.json();
      
      coursesTable.innerHTML = `
        <tr>
          <th>Name</th>
          <th>Course Term ID</th>
          <th>Times</th>
          <th>Availability</th>
          <th>Actions</th>
        </tr>
      `;

      courses.forEach(course => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${course.course_name}</td>
          <td>${course.course_term_id}</td>
          <td>${course.class_times}</td>
          <td>${course.availability ? 'Open' : 'Closed'}</td>
          <td>
            <button onclick="window.location.href='/frontend/admin/course-edit.html'">Edit</button>
            <button onclick="deleteCourse(${course.course_term_id})">Remove</button>
          </td>
        `;
        coursesTable.appendChild(row);
      });
    } catch (err) { console.error(err); }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/users');
      const users = await response.json();
      
      studentsTable.innerHTML = `
        <tr>
          <th>Student ID</th>
          <th>Email</th>
          <th>Role</th>
          <th>Actions</th>
        </tr>
      `;

      users.forEach(user => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${user.user_id}</td>
          <td>${user.email}</td>
          <td>${user.role_name}</td>
          <td>
            <button onclick="window.location.href='/frontend/admin/student-edit.html'">Edit</button>
            <button onclick="deleteUser(${user.user_id})">Remove</button>
          </td>
        `;
        studentsTable.appendChild(row);
      });
    } catch (err) { console.error(err); }
  };

  const loadEnrollments = async () => {
    try {
      const response = await fetch('/api/enroll');
      const enrollments = await response.json();
      
      enrollmentsTable.innerHTML = `
        <tr>
          <th>Course Name</th>
          <th>Student Email</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      `;

      enrollments.forEach(enroll => {
        const row = document.createElement("tr");
        const statusMap = { p: 'Pending', e: 'Enrolled', w: 'Waitlist'};
        row.innerHTML = `
          <td>${enroll.course_name}</td>
          <td>${enroll.student_email}</td>
          <td>${statusMap[enroll.status] || enroll.status}</td>
          <td>
            <button onclick="deleteEnrollment(${enroll.course_term_id}, ${enroll.user_id})">Remove</button>
          </td>
        `;
        enrollmentsTable.appendChild(row);
      });
    } catch (err) { console.error(err); }
  };

  // Automatically fetch on page load
  if (coursesTable) loadCourses();
  if (studentsTable) loadStudents();
  if (enrollmentsTable) loadEnrollments();

});
