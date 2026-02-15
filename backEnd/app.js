import { getDoc, doc, onSnapshot, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- PART 2: THE CLAIM VIEW LOGIC ---
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get('id');

if (eventId && document.getElementById('slotsContainer')) {
    const eventRef = doc(db, "events", eventId);

    // Real-time listener: updates the UI automatically when someone claims a slot
    onSnapshot(eventRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            document.getElementById('displayEventName').innerText = data.eventName;
            document.getElementById('displayEventDate').innerText = data.eventDate;

            const container = document.getElementById('slotsContainer');
            container.innerHTML = ""; // Clear current list

            data.slots.forEach((slot, index) => {
                const slotDiv = document.createElement('div');
                slotDiv.className = `slot-card ${slot.isClaimed ? 'claimed' : ''}`;
                
                slotDiv.innerHTML = `
                    <div>
                        <strong>${slot.category}</strong>
                        <p style="font-size: 12px;">${slot.isClaimed ? 'Claimed by ' + slot.guestName : 'Available'}</p>
                    </div>
                    ${!slot.isClaimed ? `<button class="claim-btn" onclick="claimSlot(${index})">Claim</button>` : ''}
                `;
                container.appendChild(slotDiv);
            });
        }
    });
}

// Global function so the button can find it
window.claimSlot = async (index) => {
    const guestName = prompt("Enter your name to claim this slot:");
    if (!guestName) return;

    const eventRef = doc(db, "events", eventId);
    const docSnap = await getDoc(eventRef);
    const slots = docSnap.data().slots;

    // Update the specific slot
    slots[index].isClaimed = true;
    slots[index].guestName = guestName;

    await updateDoc(eventRef, { slots: slots });
};