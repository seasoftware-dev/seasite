import { auth, db } from "./firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    doc,
    setDoc,
    getDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Animation & UI Helpers ---

    // Add visible class styling for animations
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(styleSheet);

    // Function to show/hide loading spinner
    const setLoading = (btn, isLoading, text) => {
        if (isLoading) {
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text}`;
            btn.disabled = true;
            btn.style.opacity = '0.7';
        } else {
            btn.innerHTML = btn.dataset.originalText;
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    };

    // Show error message (You might want to add a dedicated error div in HTML later)
    const showError = (form, message) => {
        alert(message); // Simple alert for now, can be improved to a UI toast
    };

    // --- 2. Authentication Logic ---

    // LOGIN
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = loginForm.querySelector('.auth-btn');
            const email = loginForm.querySelector('input[type="email"]').value; // Note: Changed selector to be safe
            const password = loginForm.querySelector('input[type="password"]').value;

            setLoading(btn, true, 'Authenticating...');

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                // Check if they have redeemed a key
                const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

                if (userDoc.exists() && userDoc.data().hasRedeemedKey) {
                    window.location.href = 'panel.html';
                } else {
                    window.location.href = 'redeem.html';
                }
            } catch (error) {
                console.error(error);
                showError(loginForm, "Login Failed: " + error.message);
                setLoading(btn, false);
            }
        });
    }

    // REGISTER
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = registerForm.querySelector('.auth-btn');
            const username = registerForm.querySelector('input[type="text"]').value;
            const email = registerForm.querySelector('input[type="email"]').value;
            const password = registerForm.querySelector('input[type="password"]').value;

            setLoading(btn, true, 'Creating Account...');

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Create user document in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    username: username,
                    email: email,
                    hasRedeemedKey: false, // Default to false
                    createdAt: new Date()
                });

                window.location.href = 'redeem.html';
            } catch (error) {
                console.error(error);
                showError(registerForm, "Registration Failed: " + error.message);
                setLoading(btn, false);
            }
        });
    }

    // REDEEM KEY
    const redeemForm = document.getElementById('redeemForm');
    if (redeemForm) {
        // Protect this route: user must be logged in
        onAuthStateChanged(auth, (user) => {
            if (!user) {
                window.location.href = 'login.html';
            }
        });

        const keyInput = document.getElementById('licenseKey');
        if (keyInput) {
            keyInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            });
        }

        redeemForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = redeemForm.querySelector('.auth-btn');
            const key = keyInput.value;
            const user = auth.currentUser;

            if (!user) return;

            setLoading(btn, true, 'Verifying Key...');

            try {
                // Check if key exists in 'keys' collection
                // NOTE: You need to manually create a collection called 'keys' and add documents where ID is the key 
                // and contain field { used: false }
                const keyDocRef = doc(db, "keys", key);
                const keyDoc = await getDoc(keyDocRef);

                if (keyDoc.exists() && !keyDoc.data().used) {
                    // Update key as used
                    await updateDoc(keyDocRef, {
                        used: true,
                        usedBy: user.uid,
                        usedAt: new Date()
                    });

                    // Update user as redeemed
                    await updateDoc(doc(db, "users", user.uid), {
                        hasRedeemedKey: true
                    });

                    window.location.href = 'panel.html';
                } else {
                    showError(redeemForm, "Invalid or already used key.");
                    setLoading(btn, false);
                }
            } catch (error) {
                console.error(error);
                showError(redeemForm, "Error: " + error.message);
                setLoading(btn, false);
            }
        });
    }

    // PANEL PROTECTION & LOGIC
    if (document.querySelector('.panel-body')) {
        // Auth Check
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = 'login.html';
            } else {
                // Check if they redeemed a key, if not send to redeem
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists() && !userDoc.data().hasRedeemedKey) {
                    window.location.href = 'redeem.html';
                }

                // Load User Info into Sidebar
                document.querySelector('.user-name').innerText = userDoc.data().username || "User";
            }
        });

        // Logout
        const logoutBtn = document.querySelector('.logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await signOut(auth);
                window.location.href = 'login.html';
            });
        }
    }

    // --- 3. Existing UI Interactions (Executor, etc.) ---
    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Executor Demo Interactivity
    const execBtns = document.querySelectorAll('.exec-btn');
    const codeContent = document.querySelector('.code-content');

    if (execBtns.length > 0) {
        execBtns.forEach(btn => {
            btn.addEventListener('click', function () {
                const originalText = this.innerHTML;

                if (this.innerText.includes('Execute')) {
                    this.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Executing...';
                    setTimeout(() => {
                        this.innerHTML = '<i class="fa-solid fa-check"></i> Executed!';
                        this.style.background = 'var(--success)';
                        console.log("Script executed");
                        setTimeout(() => {
                            this.innerHTML = originalText;
                            this.style.background = '';
                        }, 1500);
                    }, 800);
                } else if (this.innerText.includes('Clear')) {
                    if (codeContent) codeContent.innerText = '';
                } else {
                    this.style.transform = 'scale(0.95)';
                    setTimeout(() => this.style.transform = 'scale(1)', 100);
                }
            });
        });
    }
});
