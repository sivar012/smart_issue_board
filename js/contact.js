// d:/issue-tracker/js/contact.js
// Sends the contact form data to a Google Apps Script Web App which appends it to a Google Sheet.
// Replace GOOGLE_APPS_SCRIPT_URL with the URL of your deployed script.

const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYkdWoczHum252rhy6oxtUdPGHENRGH12HKaiKDYgdD86kHN-15jOfc_DsvU_QCUzy/exec";

document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("contact-name").value.trim();
    const email = document.getElementById("contact-email").value.trim();
    const message = document.getElementById("contact-message").value.trim();

    if (!name || !email || !message) {
        alert("Please fill out all fields before sending.");
        return;
    }

    const payload = { name, email, message, timestamp: new Date().toISOString() };

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        if (response.ok) {
            alert("✅ Your message has been sent! We'll get back to you soon.");
        } else {
            alert("❌ Failed to send message. Server responded with status " + response.status);
        }
        // Optionally clear the form
        document.getElementById("contactForm").reset();
    } catch (err) {
        console.error("Error sending contact form:", err);
        alert("❌ Failed to send message. Please try again later.");
    }
});
