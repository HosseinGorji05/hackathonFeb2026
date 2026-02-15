import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyBizcj2eON6m3Z8Eckbk3wEfOPezyd4_gE",
  authDomain: "potluckio-30b92.firebaseapp.com",
  projectId: "potluckio-30b92",
  storageBucket: "potluckio-30b92.firebasestorage.app",
  messagingSenderId: "643843611690",
  appId: "1:643843611690:web:125e2a8289d13e793cf753"
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

            const hostedEvents = JSON.parse(localStorage.getItem('myHostedEvents') || '[]');
            hostedEvents.push(docRef.id);
            localStorage.setItem('myHostedEvents', JSON.stringify(hostedEvents));

            const container = document.querySelector('.form-container') || document.body;
            container.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fa-solid fa-circle-check" style="font-size: 50px; color: #66B2B2; margin-bottom: 20px;"></i>
                    <h2>Event Created!</h2>
                    <p>Share this ID with your guests:</p>
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 10px; margin: 20px 0; font-family: monospace; font-size: 18px; border: 2px dashed #ccc;" id="eventIDDisplay">${docRef.id}</div>
                    <button class="btn-join" onclick="copyEventID('${docRef.id}')" id="copyBtn" style="padding: 10px 20px; cursor: pointer;"><i class="fa-solid fa-copy"></i> Copy ID</button>
                    <br><br>
                    <a href="main.html" style="color: #66B2B2; text-decoration: none; font-weight: bold;">Return Home</a>
                </div>`;
        } catch (error) {
            console.error("Error creating event: ", error);
        }
    });
}

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
                    ${!slot.isClaimed ? `<button class="claim-btn" onclick="claimSlot(${index})">Claim</button>` : ''}`;
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

// --- PART 3: MY POTLUCKS LIST LOGIC (my-potlucks.html) ---
const listContainer = document.getElementById('myEventsList');

if (listContainer) {
    const renderMyEvents = async () => {
        const savedIds = JSON.parse(localStorage.getItem('myHostedEvents') || '[]');
        if (savedIds.length === 0) {
            listContainer.innerHTML = "<p>No events found. Start hosting!</p>";
            return;
        }

        listContainer.innerHTML = "";
        for (const id of savedIds) {
            const docSnap = await getDoc(doc(db, "events", id));
            if (docSnap.exists()) {
                const data = docSnap.data();
                const suggestions = data.suggestions || [];
                
                const item = document.createElement('div');
                item.style = "background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #66B2B2;";
                
                // Build the HTML for the event and its suggestions
                let suggestionsHTML = suggestions.length > 0 
                    ? `<div style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
                        <small style="font-weight: 700; color: #66B2B2;">Guest Suggestions (${suggestions.length}):</small>
                        <ul style="font-size: 13px; color: #555; margin-top: 5px; padding-left: 20px;">
                            ${suggestions.map(s => `<li>"${s.text}" <small style="color:#999;">— ${s.timestamp}</small></li>`).join('')}
                        </ul>
                       </div>`
                    : `<p style="font-size: 12px; color: #999; margin-top: 10px;">No suggestions yet.</p>`;

                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                        <div onclick="window.location.href='claim-event.html?id=${id}'" style="cursor: pointer; flex-grow: 1;">
                            <strong style="font-size: 18px;">${data.eventName}</strong>
                            <p style="color: #666; font-size: 14px; margin: 5px 0;">${data.eventDate}</p>
                            <small style="color: #999;">ID: ${id}</small>
                        </div>
                        <button onclick="deleteEvent('${id}')" style="background: #ff6b6b; color: white; border: none; padding: 8px; border-radius: 8px; cursor: pointer;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                    ${suggestionsHTML}
                `;
                listContainer.appendChild(item);
            }
        }
    };

    window.deleteEvent = (id) => {
        if (confirm("Remove this event from your list?")) {
            let savedIds = JSON.parse(localStorage.getItem('myHostedEvents') || '[]');
            savedIds = savedIds.filter(itemId => itemId !== id);
            localStorage.setItem('myHostedEvents', JSON.stringify(savedIds));
            renderMyEvents();
        }
    };

    renderMyEvents();
}

// --- PART 4: SUGGESTIONS LOGIC (FOR CLAIM-EVENT.HTML) ---
window.toggleSuggestion = () => {
    const content = document.getElementById('suggestionContent');
    const icon = document.querySelector('.suggestion-header i');
    if (content.style.display === "block") {
        content.style.display = "none";
        icon.className = "fa-solid fa-chevron-up";
    } else {
        content.style.display = "block";
        icon.className = "fa-solid fa-chevron-down";
    }
};

window.sendSuggestion = async () => {
    const text = document.getElementById('suggestionText').value.trim();
    const status = document.getElementById('suggestionStatus');
    if (!text || !eventId) return;

    try {
        const eventRef = doc(db, "events", eventId);
        const docSnap = await getDoc(eventRef);
        const data = docSnap.data();
        const currentSuggestions = data.suggestions || [];
        currentSuggestions.push({
            text: text,
            timestamp: new Date().toLocaleTimeString(),
            guest: "Anonymous Guest" 
        });
        await updateDoc(eventRef, { suggestions: currentSuggestions });
        document.getElementById('suggestionText').value = "";
        status.innerText = "✅ Sent to Host!";
        setTimeout(() => { status.innerText = ""; }, 3000);
    } catch (error) {
        console.error("Error sending suggestion:", error);
    }
};