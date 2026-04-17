"use strict"
window.addEventListener("load", () => {
	const userIdField = document.getElementById("userId");
	const passwdField = document.getElementById("password");
	const loginBtn    = document.getElementById("loginBtn");

	let checkLogin = function() {
		let userId = userIdField.value;
		let passwd = passwdField.value;

    sendQuery(userId, passwd);
    //redirect();
	}

	let sendQuery = function(userId, passwd) {
    		fetch(`http://localhost:5000/api/auth/login?userId=${encodeURIComponent(userId)}&password=${encodeURIComponent(passwd)}`)
    		.then((res) => {
    	  		if (!res.ok) {
    	    			throw new Error(`Server responded with status ${res.status}`);
    	  		}
    	  		return res.json();
    		})
    		.then((data) => {
      			redirect();
	    	})
   		 .catch((err) => {
      			console.error(err);
      			subtitle.textContent = "Error contacting the server. See console for details.";
		});
  	}

	let redirect = function() {
		window.location.replace("/admin");
	}


	loginBtn.addEventListener("click", checkLogin);
});
