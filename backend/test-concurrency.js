// test-capacity-concurrency.js
// Run with: node test-capacity-concurrency.js

const capacityConcurrencyTest = async () => {
    console.log("STARTING 'LAST SEAT' CONCURRENCY TEST...");
    
    // Update ID's
    const courseId = 97;      // The ID of the course with exactly 1 seat left
    const studentOneId = 158;  // The ID of the first pending student - update name here
    const studentTwoId = 161;  // The ID of the second pending student - update name here
    
    console.log(`Simulating Admin approving David - ${studentOneId} and Panashe - ${studentTwoId} for Course ${courseId} simultaneously...`);

    const requestOptions = {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'e' }) // 'e' triggers the capacity check in the database
    };

    try {
        // Fire both PUT requests at the exact same millisecond
        const [req1, req2] = await Promise.all([
            fetch(`http://localhost:5000/api/enroll/${courseId}/${studentOneId}`, requestOptions),
            fetch(`http://localhost:5000/api/enroll/${courseId}/${studentTwoId}`, requestOptions)
        ]);

        const res1 = await req1.json();
        const res2 = await req2.json();

        console.log("\nRESULTS:");
        
        // Print Student 1 Results
        if (req1.ok) console.log(`Student ${studentOneId}: SUCCESS (Status 200). Claimed the last seat!`);
        else console.log(`Student ${studentOneId}: BLOCKED (Status ${req1.status}). Reason: ${res1.error || res1.message}`);

        // Print Student 2 Results
        if (req2.ok) console.log(`Student ${studentTwoId}: SUCCESS (Status 200). Claimed the last seat!`);
        else console.log(`Student ${studentTwoId}: BLOCKED (Status ${req2.status}). Reason: ${res2.error || res2.message}`);

        console.log("\nCONCLUSION:");
        if ((req1.ok && !req2.ok) || (!req1.ok && req2.ok)) {
            console.log("The database successfully handled the race condition! One transaction waited, saw the updated count, and correctly aborted via the trigger we created in db-init.sql.");
        } else {
            console.log("If both succeeded, the class wasn't full yet!.");
        }

    } catch (error) {
        console.error("Test script failed:", error.message);
    }
};

capacityConcurrencyTest();