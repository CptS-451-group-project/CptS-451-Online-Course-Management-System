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

  // used to retrieve data inside the 'All Courses' table
  // selects an endpoint from the backend from (backend/routes/courses.js)
  const loadCourses = async (filter = 'all') => {
    console.log("ran");
    try {
      let endpoint = 'http://localhost:5000/api/courses';
      if (filter === 'high-demand') endpoint = 'http://localhost:5000/api/courses/high-demand';
      else if (filter === 'enrollment-totals') endpoint = 'http://localhost:5000/api/courses/enrollment-totals';
          
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error("Failed to load courses");
      const courses = await response.json();
      
      if (filter === 'enrollment-totals') {
          coursesTable.innerHTML = `
            <tr>
              <th>Course Name</th>
              <th>Term</th>
              <th>Total Enrolled</th>
              <th>Capacity</th>
            </tr>
          `;
          courses.forEach(course => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${course.course_name}</td>
              <td>${course.term_name}</td>
              <td><strong>${course.total_enrolled}</strong> Students</td>
              <td>${course.max_students ? course.max_students : 'Unlimited'}</td>
            `;
            coursesTable.appendChild(row);
          });
      } else {
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
                ? ` (${course.currently_enrolled}/${course.max_students} Full)` 
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
      }
    } catch (err) { console.error(err); }
  };

  // used to retrieve data inside the 'All Students / User' table
  // selects an endpoint from the backend from (backend/routes/users.js)
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


  // used to retrieve data inside the 'All Courses' table
  // selects an endpoint from the backend from (backend/routes/enrollments.js)
  const loadEnrollments = async (filter = 'all') => {
    try {
      let endpoint = 'http://localhost:5000/api/enroll';
      if (filter === 'pending-queue') endpoint = 'http://localhost:5000/api/enroll/pending-queue';
      else if (filter === 'enrollments-by-term') endpoint = 'http://localhost:5000/api/enroll/by-term';
          
      const response = await fetch(endpoint);
      const enrollments = await response.json();
      
      if (filter === 'pending-queue') {
          enrollmentsTable.innerHTML = `
            <tr>
              <th>Course Name</th>
              <th>Term</th>
              <th>Pending Requests</th>
              <th>Actions</th>
            </tr>
          `;
          enrollments.forEach(enroll => {
            const row = document.createElement("tr");
            row.innerHTML = `
              <td>${enroll.course_name}</td>
              <td>${enroll.term_name}</td>
              <td><span style="color:red;">${enroll.pending_requests_count} Students Waiting</span></td>
              <td>
                <button onclick="alert('Redirect to review enrollments for course ID: ${enroll.course_term_id}')">Review</button>
              </td>
            `;
            enrollmentsTable.appendChild(row);
          });
      } else if (filter === 'enrollments-by-term') {
          enrollmentsTable.innerHTML = `
            <tr>
              <th>Term</th>
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
              <td><strong>${enroll.term_name}</strong></td>
              <td>${enroll.course_name}</td>
              <td>${enroll.student_email}</td>
              <td>${statusMap[enroll.status] || enroll.status}</td>
              <td>
                <button onclick="deleteEnrollment(${enroll.course_term_id}, ${enroll.user_id})">Remove</button>
              </td>
            `;
            enrollmentsTable.appendChild(row);
          });
      } else {
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
                <button onclick="deleteEnrollment(${enroll.course_term_id}, ${enroll.user_id})">Unenroll</button>
              </td>
            `;
            enrollmentsTable.appendChild(row);
          });
      }
    } catch (err) { console.error(err); }
  };

  // --- EVENT LISTENERS ---
  if (courseFilterDropdown) {
    courseFilterDropdown.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'high-demand') {
          loadCourses('high-demand');
          loadStudents('all');
          loadEnrollments('all');
      } else if (val === 'overloaded') {
          loadCourses('all');
          loadStudents('overloaded');
          loadEnrollments('all');
      } else if (val === 'pending-queue') {
          loadCourses('all');
          loadStudents('all');
          loadEnrollments('pending-queue');
      } else if (val === 'enrollment-totals') {
          loadCourses('enrollment-totals');
          loadStudents('all');
          loadEnrollments('all');
      } else if (val === 'enrollments-by-term') {
          loadCourses('all');
          loadStudents('all');
          loadEnrollments('enrollments-by-term');
      } else {
          loadCourses('all');
          loadStudents('all');
          loadEnrollments('all');
      }
    });
  }

  // Automatically fetch on page load
  if (coursesTable) loadCourses();
  if (studentsTable) loadStudents();
  if (enrollmentsTable) loadEnrollments();

});
