"use strict"
window.addEventListener("load", () => {
	const userIdField = document.getElementById("userId");
	const passwdField = document.getElementById("password");
	const loginBtn    = document.getElementById("loginBtn");

	let checkLogin = function() {
		let email = userIdField.value;
		let passwd = passwdField.value;
2
    sendQuery(email, passwd);
    //redirect();
	}

	loginBtn.addEventListener("click", async (e) => {
		let email = userIdField.value;
		let passwd = passwdField.value;

		const payload = {
      		email: userIdField.value, // "Name" acts as email since auth needs email
      		password: passwdField.value,
		};

		try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
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

	  redirect();
    } catch (err) {
      console.error(err);
      alert("Network Error: " + err.message);
    } 
	});

	let redirect = function() {
		window.location.replace("/admin");
	}


	//loginBtn.addEventListener("click", checkLogin);
});
