"use strict"
window.addEventListener("load", () => {
  const userName         = document.getElementById("userName");
  const userId           = document.getElementById("userId");
  const coursesTable     = document.getElementById("coursesTable");
  const studentsTable    = document.getElementById("studentsTable");
  const enrollmentsTable = document.getElementById("enrollmentsTable");
  const courseFilterDropdown = document.getElementById("courseFilterDropdown");

  // --- ACTIONS (Delete Functions) ---
  window.deleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");
      loadCourses();
      loadEnrollments();
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  window.deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");
      loadStudents();
      loadEnrollments();
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  window.deleteEnrollment = async (course_term_id, user_id) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/enroll/${course_term_id}/${user_id}`, { method: 'DELETE' });
      const errInfo = await res.json();
      if (!res.ok) throw new Error(errInfo.error || "Unknown Error");
      loadEnrollments();
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  // --- DATA LOADERS ---
  const loadCourses = async (filter = 'all') => {
    console.log("ran");
    try {
      const endpoint = filter === 'high-demand' 
          ? 'http://localhost:5000/api/courses/high-demand' 
          : 'http://localhost:5000/api/courses';
          
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to load courses");
      const courses = await response.json();
      
      coursesTable.innerHTML = `
        <tr>
          <th>Name</th>
          <th>Course Term ID</th>
          <th>Professor ID</th>
          <th>Availability</th>
          <th>Actions</th>
        </tr>
      `;
      console.log(courses);

      courses.forEach(course => {
        const row = document.createElement("tr");
        
        const capacityBadge = filter === 'high-demand' 
            ? ` (${course.currently_enrolled}/${course.max_students} enrolled)` 
            : '';
            
        row.innerHTML = `
          <td>${course.course_name}${capacityBadge}</td>
          <td>${course.course_term_id}</td>
          <td>${course.professor_id}</td>
          <td>${course.availability ? 'Open' : 'Closed'}</td>
          <td>
            <button onclick="window.location.href='/admin/course-edit.html?courseId=${course.course_term_id}'">Edit</button>
            <button onclick="deleteCourse(${course.course_term_id})">Remove</button>
          </td>
        `;
        coursesTable.appendChild(row);
        console.log("ran");
      });
    } catch (err) { console.error(err); }
  };

  const loadStudents = async (filter = 'all') => {
    try {
      const endpoint = filter === 'overloaded'
          ? 'http://localhost:5000/api/users/overloaded'
          : 'http://localhost:5000/api/users';
          
      const response = await fetch(endpoint);
      const users = await response.json();
      
      studentsTable.innerHTML = `
        <tr>
          <th>Student ID</th>
          <th>Email</th>
          <th>Role</th>
          ${filter === 'overloaded' ? '<th>Term</th><th>Enrolled Classes</th>' : ''}
          <th>Actions</th>
        </tr>
      `;

      users.forEach(user => {
        const row = document.createElement("tr");
        
        let extraCols = '';
        if (filter === 'overloaded') {
          extraCols = `
            <td>${user.term_name}</td>
            <td><span style="color:red;">${user.total_enrolled_classes} Classes</span></td>
          `;
        }
        
        row.innerHTML = `
          <td>${user.user_id}</td>
          <td>${user.email}</td>
          <td>${user.role_name}</td>
          ${extraCols}
          <td>
            <button onclick="window.location.href='http://localhost:5000/admin/student-edit.html?studentId=${user.user_id}'">Edit</button>
            <button onclick="deleteUser(${user.user_id})">Remove</button>
          </td>
        `;
        studentsTable.appendChild(row);
      });
    } catch (err) { console.error(err); }
  };

  const loadEnrollments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/enroll');
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

  // --- EVENT LISTENERS ---
  if (courseFilterDropdown) {
    courseFilterDropdown.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'high-demand') {
          loadCourses('high-demand');
          loadStudents('all');
      } else if (val === 'overloaded') {
          loadCourses('all');
          loadStudents('overloaded');
      } else {
          loadCourses('all');
          loadStudents('all');
      }
    });
  }

  // Automatically fetch on page load
  if (coursesTable) loadCourses();
  if (studentsTable) loadStudents();
  if (enrollmentsTable) loadEnrollments();

});
