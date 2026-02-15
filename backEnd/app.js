import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDoc, doc, onSnapshot, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBizcj2eON6m3Z8Eckbk3wEfOPezyd4_gE",
    authDomain: "potluckio-30b92.firebaseapp.com",
    projectId: "potluckio-30b92",
    storageBucket: "potluckio-30b92.firebasestorage.app",
    messagingSenderId: "643843611690",
    appId: "1:643843611690:web:125e2a8289d13e793cf753"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- PART 1: HOSTING LOGIC ---
const createForm = document.getElementById('createEventForm');
if (createForm) {
    createForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('eventName').value;
        const date = document.getElementById('eventDate').value;
        const slots = [];
        const categories = [{ id: 'mainCount', label: 'Main' }, { id: 'drinkCount', label: 'Drink' }, { id: 'dessertCount', label: 'Dessert' }];

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
                    <div style="background: #f0f0f0; padding: 15px; border-radius: 10px; margin: 20px 0; font-family: monospace; font-size: 18px; border: 2px dashed #ccc;">${docRef.id}</div>
                    <div style="display: flex; gap: 10px; justify-content: center;">
                        <button class="btn-join" onclick="copyEventID('${docRef.id}')" id="copyBtn"><i class="fa-solid fa-copy"></i> Copy ID</button>
                    </div>
                    <br><a href="main.html" style="color: #66B2B2; text-decoration: none; font-weight: bold;">Return Home</a>
                </div>`;
        } catch (error) { console.error(error); }
    });
}

window.copyEventID = (id) => {
    navigator.clipboard.writeText(id).then(() => {
        const btn = document.getElementById('copyBtn');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-copy"></i> Copy ID'; }, 2000);
    });
};

// --- PART 2: CLAIM & MANAGEMENT LOGIC ---
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

            const savedIds = JSON.parse(localStorage.getItem('myHostedEvents') || '[]');
            const isHost = savedIds.includes(eventId);

            data.slots.forEach((slot, index) => {
                const slotDiv = document.createElement('div');
                slotDiv.className = `slot-card ${slot.isClaimed ? 'claimed' : ''}`;
                slotDiv.innerHTML = `
                    <div>
                        <strong>${slot.category}</strong>
                        <p style="font-size: 12px; margin: 0;">${slot.isClaimed ? 'Claimed by ' + slot.guestName : 'Available'}</p>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        ${!slot.isClaimed ? `<button class="claim-btn" onclick="claimSlot(${index})">Claim</button>` : ''}
                        ${isHost ? `<button onclick="removeSlot(${index})" style="background:#ff6b6b; color:white; border:none; border-radius:50%; width:30px; height:30px; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>` : ''}
                    </div>`;
                container.appendChild(slotDiv);
            });

            if (isHost && !document.getElementById('addSlotBtn')) {
                const addBtn = document.createElement('button');
                addBtn.id = "addSlotBtn";
                addBtn.className = "btn-main";
                addBtn.style = "margin-top: 20px; width: 100%; background-color: #FFB766;";
                addBtn.innerHTML = "<i class='fa-solid fa-plus'></i> Add New Category";
                addBtn.onclick = addCustomSlot;
                container.parentNode.appendChild(addBtn);
            }

            const suggestionsList = document.getElementById('publicSuggestionsList');
            if (suggestionsList) {
                const suggestions = data.suggestions || [];
                suggestionsList.innerHTML = suggestions.length > 0 
                    ? suggestions.map(s => `<div class="suggestion-item"><p>${s.text}</p><small>${s.guest} — ${s.timestamp}</small></div>`).join('')
                    : "<p style='color:#ccc;'>No suggestions yet.</p>";
            }
        }
    });
}

window.claimSlot = async (index) => {
    let guestName = prompt("Enter your name to claim this slot:");
    if (!guestName) return;
    
    const eventRef = doc(db, "events", eventId);
    const docSnap = await getDoc(eventRef);
    const slots = docSnap.data().slots;
    slots[index].isClaimed = true;
    slots[index].guestName = guestName;
    await updateDoc(eventRef, { slots: slots });
};

// --- PART 3: MY POTLUCKS LIST LOGIC ---
const listContainer = document.getElementById('myEventsList');
if (listContainer) {
    const renderMyEvents = async () => {
        const savedIds = JSON.parse(localStorage.getItem('myHostedEvents') || '[]');
        if (savedIds.length === 0) {
            listContainer.innerHTML = "<p>No events found.</p>";
            return;
        }
        listContainer.innerHTML = "";
        for (const id of savedIds) {
            const docSnap = await getDoc(doc(db, "events", id));
            if (docSnap.exists()) {
                const data = docSnap.data();
                const item = document.createElement('div');
                item.style = "background: white; padding: 20px; border-radius: 15px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-left: 5px solid #66B2B2;";
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div onclick="window.location.href='claim-event.html?id=${id}'" style="cursor: pointer;">
                            <strong style="font-size: 18px;">${data.eventName}</strong>
                            <p style="color: #666; font-size: 14px;">${data.eventDate}</p>
                        </div>
                        <button onclick="deleteEvent('${id}')" style="background:#ff6b6b; color:white; border:none; border-radius:8px; padding:8px 12px; cursor:pointer;"><i class="fa-solid fa-trash"></i></button>
                    </div>`;
                listContainer.appendChild(item);
            }
        }
    };
    window.deleteEvent = (id) => {
        if (confirm("Remove from your history list?")) {
            let savedIds = JSON.parse(localStorage.getItem('myHostedEvents') || '[]');
            savedIds = savedIds.filter(itemId => itemId !== id);
            localStorage.setItem('myHostedEvents', JSON.stringify(savedIds));
            renderMyEvents();
        }
    };
    renderMyEvents();
}

// --- PART 4: SUGGESTIONS ---
window.sendSuggestion = async () => {
    const text = document.getElementById('suggestionText').value.trim();
    if (!text || !eventId) return;

    const eventRef = doc(db, "events", eventId);
    const docSnap = await getDoc(eventRef);
    const data = docSnap.data();
    
    const currentSuggestions = data.suggestions || [];
    currentSuggestions.push({ 
        text: text, 
        timestamp: new Date().toLocaleTimeString(), 
        guest: "Guest" 
    });
    
    await updateDoc(eventRef, { suggestions: currentSuggestions });
    document.getElementById('suggestionText').value = "";
};

// --- PART 5: HOST MANAGEMENT ---
window.addCustomSlot = async () => {
    const category = prompt("What should be added?");
    if (!category || !eventId) return;
    const eventRef = doc(db, "events", eventId);
    const docSnap = await getDoc(eventRef);
    const slots = docSnap.data().slots || [];
    slots.push({ category: category, isClaimed: false, guestName: "" });
    await updateDoc(eventRef, { slots: slots });
};

window.removeSlot = async (index) => {
    if (!confirm("Remove this requirement?")) return;
    const eventRef = doc(db, "events", eventId);
    const docSnap = await getDoc(eventRef);
    const slots = docSnap.data().slots || [];
    slots.splice(index, 1);
    await updateDoc(eventRef, { slots: slots });
};