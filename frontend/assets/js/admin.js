"use strict"
window.addEventListener("load", () => {
  const userName         = document.getElementById("userName");
  const userId           = document.getElementById("userId");
  const coursesTable     = document.getElementById("coursesTable");
  const studentsTable    = document.getElementById("studentsTable");
  const enrollmentsTable = document.getElementById("enrollmentsTable");
  const courseFilterDropdown = document.getElementById("courseFilterDropdown");

  // Populate userId field
  const thisUserId = window.location.search.substring(8);
  userId.innerHTML = thisUserId;

  // Populate userId name
  const loadUserName = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/users/' + thisUserId, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();

      console.log(data);

      if (!response.ok) {
        alert("Action Denied by Database: " + (data.message || data.error || "Unknown Error"));
        return;
      }

      userName.innerHTML = data[0].first_name + " " + data[0].last_name;
   }
   catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    } 
  }
  
  if(thisUserId != "") {
    loadUserName();
  }

  // Helper function to get current filter state
  const getCurrentFilter = () => courseFilterDropdown ? courseFilterDropdown.value : 'all';

  // --- ACTIONS ---
  window.deleteCourse = async (id) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Unknown Error");
      loadCourses(getCurrentFilter());
    } catch(err) { alert("Action denied: " + err.message); }
  };

  window.deleteUser = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Unknown Error");
      loadStudents(getCurrentFilter());
    } catch(err) { alert("Action denied: " + err.message); }
  };

  window.deleteEnrollment = async (course_term_id, user_id) => {
    if (!confirm("Are you sure you want to remove this enrollment?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/enroll/${course_term_id}/${user_id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Unknown Error");
      loadEnrollments(getCurrentFilter());
    } catch(err) { alert("Action denied: " + err.message); }
  };

  window.approveEnrollment = async (course_term_id, user_id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/enroll/${course_term_id}/${user_id}`, { 
        method: 'PUT',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'e' }) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown Error");
      
      alert("Enrollment approved successfully!");
      // Reload exactly what the user was looking at!
      loadEnrollments(getCurrentFilter()); 
      loadCourses(getCurrentFilter());     
    } catch(err) {
      alert("Action denied by database: " + err.message);
    }
  };

  // --- DATA LOADERS ---
  const loadCourses = async (filter = 'all') => {
    try {
      let endpoint = 'http://localhost:5000/api/courses';
      if (filter === 'high-demand') endpoint = 'http://localhost:5000/api/courses/high-demand';
      else if (filter === 'enrollment-totals') endpoint = 'http://localhost:5000/api/courses/enrollment-totals';
      else if (filter === 'at-risk') endpoint = 'http://localhost:5000/api/courses/at-risk'; // NEW
          
      const response = await fetch(endpoint);
      const courses = await response.json();
      
      if (filter === 'enrollment-totals') {
          coursesTable.innerHTML = `<tr><th>Course Name</th><th>Term</th><th>Total Enrolled</th><th>Capacity</th></tr>`;
          if(courses.length === 0) coursesTable.innerHTML += `<tr><td colspan="4" style="text-align:center;">No enrollment data found.</td></tr>`;
          
          courses.forEach(course => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${course.course_name}</td><td>${course.term_name}</td><td><strong>${course.total_enrolled}</strong> Students</td><td>${course.max_students ? course.max_students : 'Unlimited'}</td>`;
            coursesTable.appendChild(row);
          });
      } else {
          coursesTable.innerHTML = `<tr><th>Name & Term</th><th>Description</th><th>Location</th><th>Schedule</th><th>Professor</th><th>Availability</th><th>Actions</th></tr>`;
          if(courses.length === 0) coursesTable.innerHTML += `<tr><td colspan="7" style="text-align:center;">No courses match this filter.</td></tr>`;

          courses.forEach(course => {
            let capacityBadge = '';
            const row = document.createElement("tr");
            const profDisplay = course.professor_email ? course.professor_email : '<em>Unassigned</em>';

            // NEW
            if (filter === 'high-demand') {
                capacityBadge = ` <span style="color:red; font-weight:bold;">(${course.currently_enrolled}/${course.max_students} Full)</span>`;
            } else if (filter === 'at-risk') {
                capacityBadge = ` <span style="color:#ff8c00; font-weight:bold;">( Only ${course.currently_enrolled} enrolled)</span>`;
            }
                
            row.innerHTML = `
              <td><strong>${course.course_name}</strong><br><small>${course.term_name || 'No Term'}</small><span style="color:red; font-weight:bold;">${capacityBadge}</span></td>
              <td>${course.description || 'No description'}</td>
              <td>${course.location}</td>
              <td>${course.schedule_times}</td>
              <td>${profDisplay}</td>
              <td>${course.availability ? 'Open' : 'Closed'}</td>
              <td>
                <button onclick="window.location.href='/admin/course-edit.html?courseId=${course.course_term_id}'">Edit</button>
                <button onclick="deleteCourse(${course.course_term_id})">Remove</button>
              </td>
            `;
            coursesTable.appendChild(row);
          });
      }
    } catch (err) { console.error(err); }
  };

  const loadStudents = async (filter = 'all') => {
    try {
      const endpoint = filter === 'overloaded' ? 'http://localhost:5000/api/users/overloaded' : 'http://localhost:5000/api/users';
      const response = await fetch(endpoint);
      const users = await response.json();
      
      studentsTable.innerHTML = `<tr><th>Student ID</th><th>Email</th><th>Role</th>${filter === 'overloaded' ? '<th>Term</th><th>Enrolled Classes</th>' : ''}<th>Actions</th></tr>`;
      
      if(users.length === 0) studentsTable.innerHTML += `<tr><td colspan="6" style="text-align:center;">No overloaded students found!</td></tr>`;

      users.forEach(user => {
        const row = document.createElement("tr");
        let extraCols = filter === 'overloaded' ? `<td>${user.term_name}</td><td><span style="color:red;">${user.total_enrolled_classes} Classes</span></td>` : '';
        
        row.innerHTML = `
          <td>${user.user_id}</td><td>${user.email}</td><td>${user.role_name}</td>${extraCols}
          <td>
            <button onclick="window.location.href='http://localhost:5000/admin/student-edit.html?studentId=${user.user_id}'">Edit</button>
            <button onclick="deleteUser(${user.user_id})">Remove</button>
          </td>
        `;
        studentsTable.appendChild(row);
      });
    } catch (err) { console.error(err); }
  };

  const loadEnrollments = async (filter = 'all') => {
    try {
      let endpoint = 'http://localhost:5000/api/enroll';
      if (filter === 'pending-queue') endpoint = 'http://localhost:5000/api/enroll/pending-queue';
      else if (filter === 'enrollments-by-term') endpoint = 'http://localhost:5000/api/enroll/by-term';
          
      const response = await fetch(endpoint);
      const enrollments = await response.json();
      
      if (filter === 'pending-queue') {
          enrollmentsTable.innerHTML = `<tr><th>Course Name</th><th>Term</th><th>Pending Requests</th><th>Actions</th></tr>`;
          if(enrollments.length === 0) enrollmentsTable.innerHTML += `<tr><td colspan="4" style="text-align:center;">No pending enrollments. You're all caught up!</td></tr>`;
          
          enrollments.forEach(enroll => {
            const row = document.createElement("tr");
            row.innerHTML = `<td>${enroll.course_name}</td><td>${enroll.term_name}</td><td><span style="color:red; font-weight:bold;">${enroll.pending_requests_count} Students Waiting</span></td>
              <td><button onclick="courseFilterDropdown.value='all'; loadEnrollments('all');">Go to Approvals</button></td>`;
            enrollmentsTable.appendChild(row);
          });
      } else if (filter === 'enrollments-by-term') {
          enrollmentsTable.innerHTML = `<tr><th>Term</th><th>Course Name</th><th>Student Email</th><th>Status</th><th>Actions</th></tr>`;
          if(enrollments.length === 0) enrollmentsTable.innerHTML += `<tr><td colspan="5" style="text-align:center;">No enrollments found.</td></tr>`;
          
          enrollments.forEach(enroll => {
            const row = document.createElement("tr");
            const statusMap = { p: 'Pending', e: 'Enrolled', w: 'Waitlist'};
            const approveBtn = enroll.status === 'p' ? `<button onclick="approveEnrollment(${enroll.course_term_id}, ${enroll.user_id})" style="background-color: #4CAF50; color: white; border: none; padding: 5px; margin-right: 5px; cursor: pointer;">Approve</button>` : '';

            row.innerHTML = `<td><strong>${enroll.term_name}</strong></td><td>${enroll.course_name}</td><td>${enroll.student_email}</td><td>${statusMap[enroll.status] || enroll.status}</td>
              <td>${approveBtn}<button onclick="deleteEnrollment(${enroll.course_term_id}, ${enroll.user_id})">Remove</button></td>`;
            enrollmentsTable.appendChild(row);
          });
      } else {
          enrollmentsTable.innerHTML = `<tr><th>Course Name</th><th>Student Email</th><th>Status</th><th>Actions</th></tr>`;
          if(enrollments.length === 0) enrollmentsTable.innerHTML += `<tr><td colspan="4" style="text-align:center;">No enrollments found.</td></tr>`;

          enrollments.forEach(enroll => {
            const row = document.createElement("tr");
            const statusMap = { p: 'Pending', e: 'Enrolled', w: 'Waitlist'};
            const approveBtn = enroll.status === 'p' ? `<button onclick="approveEnrollment(${enroll.course_term_id}, ${enroll.user_id})" style="background-color: #4CAF50; color: white; border: none; padding: 5px; margin-right: 5px; cursor: pointer;">Approve</button>` : '';

            row.innerHTML = `<td>${enroll.course_name}</td><td>${enroll.student_email}</td><td>${statusMap[enroll.status] || enroll.status}</td>
              <td>${approveBtn}<button onclick="deleteEnrollment(${enroll.course_term_id}, ${enroll.user_id})">Unenroll</button></td>`;
            enrollmentsTable.appendChild(row);
          });
      }
    } catch (err) { console.error(err); }
  };

  // --- EVENT LISTENERS ---
  if (courseFilterDropdown) {
    courseFilterDropdown.addEventListener('change', (e) => {
      const val = e.target.value;
      // Pass the selected filter to ONLY the tables it affects, leaving the others on 'all'
      loadCourses(['high-demand', 'enrollment-totals', 'at-risk'].includes(val) ? val : 'all');
      loadStudents(val === 'overloaded' ? val : 'all');
      loadEnrollments(['pending-queue', 'enrollments-by-term'].includes(val) ? val : 'all');
    });
  }

  // Automatically fetch on page load
  if (coursesTable) loadCourses();
  if (studentsTable) loadStudents();
  if (enrollmentsTable) loadEnrollments();
});