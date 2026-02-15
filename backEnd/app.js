import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 1. Paste your specific config here from the Firebase console
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

// 2. Logic to handle the form submission
const form = document.getElementById('createEventForm');

if (form) {
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Gather basic info
        const name = document.getElementById('eventName').value;
        const date = document.getElementById('eventDate').value;

        // Generate the slots based on counts
        const slots = [];
        const categories = [
            { id: 'mainCount', label: 'Main' },
            { id: 'drinkCount', label: 'Drink' },
            { id: 'dessertCount', label: 'Dessert' }
        ];

        categories.forEach(cat => {
            const count = parseInt(document.getElementById(cat.id).value) || 0;
            for (let i = 0; i < count; i++) {
                slots.push({
                    category: cat.label,
                    isClaimed: false,
                    guestName: ""
                });
            }
        });

        try {
            // Push to Firestore
            const docRef = await addDoc(collection(db, "events"), {
                eventName: name,
                eventDate: date,
                slots: slots,
                createdAt: new Date()
            });

            // Redirect or show the ID
            alert("Event Created! Your Event ID is: " + docRef.id);
            // window.location.href = `event-view.html?id=${docRef.id}`; 
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    });
}