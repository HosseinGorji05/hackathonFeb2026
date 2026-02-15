import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. YOUR FIREBASE CONFIG (Paste the keys you got from the Firebase Console here)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- PART 1: THE HOSTING LOGIC (create-event.html) ---
const createForm = document.getElementById('createEventForm');

if (createForm) {
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('eventName').value;
        const date = document.getElementById('eventDate').value;
        const slots = [];

        // Logic to build the slot objects based on counts
        const categories = [
            { id: 'mainCount', label: 'Main' },
            { id: 'drinkCount', label: 'Drink' },
            { id: 'dessertCount', label: 'Dessert' }
        ];

        categories.forEach(cat => {
            const count = parseInt(document.getElementById(cat.id).value) || 0;
            for (let i = 0; i < count; i++) {
                slots.push({ category: cat.label, isClaimed: false, guestName: "" });
            }
        });

        try {
            const docRef = await addDoc(collection(db, "events"), {
                eventName: name,
                eventDate: date,
                slots: slots,
                createdAt: new Date()
            });

            // Update UI to show the Copy ID screen
            const container = document.querySelector('.form-container') || document.body;
            container.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-circle-check" style="font-size: 50px; color: #66B2B2; margin-bottom: 20px;"></i>
                    <h2>Event Created!</h2>
                    <p>Share this ID with your guests:</p>
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 10px; margin: 20px 0; font-family: monospace; font-size: 18px; border: 2px dashed #ccc;" id="eventIDDisplay">
                        ${docRef.id}
                    </div>
                    <button class="btn-join" onclick="copyEventID('${docRef.id}')" id="copyBtn" style="padding: 10px 20px; cursor: pointer;">
                        <i class="fa-solid fa-copy"></i> Copy ID
                    </button>
                    <br><br>
                    <a href="main.html" style="color: #66B2B2; text-decoration: none; font-weight: bold;">Return Home</a>
                </div>
            `;
        } catch (error) {
            console.error("Error creating event: ", error);
            alert("Failed to create event. Check console.");
        }
    });
}

// Global Copy ID function
window.copyEventID = (id) => {
    navigator.clipboard.writeText(id).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy ID'; }, 2000);
    });
};

// --- PART 2: THE CLAIM VIEW LOGIC (claim-event.html) ---
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (eventId && document.getElementById('slotsContainer')) {
    const eventRef = doc(db, "events", eventId);

    onSnapshot(eventRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('displayEventName').innerText = data.eventName;
            document.getElementById('displayEventDate').innerText = data.eventDate;

            const container = document.getElementById('slotsContainer');
            container.innerHTML = ""; 

            data.slots.forEach((slot, index) => {
                const slotDiv = document.createElement('div');
                slotDiv.className = `slot-card ${slot.isClaimed ? 'claimed' : ''}`;
                slotDiv.style = "display: flex; justify-content: space-between; padding: 15px; border-bottom: 1px solid #eee; background: white; margin-bottom: 10px; border-radius: 10px;";
                
                slotDiv.innerHTML = `
                    <div>
                        <strong>${slot.category}</strong>
                        <p style="font-size: 12px; margin: 0;">${slot.isClaimed ? 'Claimed by ' + slot.guestName : 'Available'}</p>
                    </div>
                    ${!slot.isClaimed ? `<button class="claim-btn" onclick="claimSlot(${index})">Claim</button>` : ''}
                `;
                container.appendChild(slotDiv);
            });
        }
    });
}

window.claimSlot = async (index) => {
    const guestName = prompt("Enter your name to claim this slot:");
    if (!guestName) return;

    const eventRef = doc(db, "events", eventId);
    const docSnap = await getDoc(eventRef);
    const slots = docSnap.data().slots;

    slots[index].isClaimed = true;
    slots[index].guestName = guestName;

    await updateDoc(eventRef, { slots: slots });
};