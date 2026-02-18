// 🔥 ================= FIREBASE IMPORTS =================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  arrayUnion,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


// 🔥 ================= FIREBASE CONFIG =================

const firebaseConfig = {
  apiKey: "TU_API_KEY_AQUI",
  authDomain: "monterrosa-exam-system.firebaseapp.com",
  projectId: "monterrosa-exam-system",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// 🔥 ================= LOGIN / REGISTER =================

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");

if (loginBtn) {
  loginBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("Login successful");
    } catch (error) {
      alert(error.message);
    }
  });
}

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        role: "student",
        createdAt: serverTimestamp()
      });

      alert("User registered!");
    } catch (error) {
      alert(error.message);
    }
  });
}


// 🔥 ================= AUTH STATE =================

onAuthStateChanged(auth, async (user) => {

  const path = window.location.pathname;

  if (!user) {
    if (!path.includes("index.html")) {
      window.location.href = "index.html";
    }
    return;
  }

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return;

  const role = userDoc.data().role;

  // Redirect from index
  if (path.includes("index.html") || path.endsWith("/")) {
    if (role === "admin") window.location.href = "admin.html";
    if (role === "teacher") window.location.href = "teacher.html";
    if (role === "student") window.location.href = "student.html";
  }

  // Admin page
  if (role === "admin" && path.includes("admin.html")) {
    loadClasses();
    loadStudents();
  }

  // Teacher page
  if (role === "teacher" && path.includes("teacher.html")) {
    loadTeacherClasses();
  }

  // Student page
  if (role === "student" && path.includes("student.html")) {
    loadStudentExams(user);
  }
});


// 🔥 ================= ADMIN =================

async function loadClasses() {
  const classList = document.getElementById("classList");
  if (!classList) return;

  classList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "classes"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");
    li.textContent = `${data.name} - Grade ${data.grade}`;
    classList.appendChild(li);
  });
}

async function loadStudents() {
  const studentSelect = document.getElementById("studentSelect");
  if (!studentSelect) return;

  studentSelect.innerHTML = "";

  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (data.role === "student") {
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.email;
      studentSelect.appendChild(option);
    }
  });
}


// 🔥 ================= TEACHER =================

async function loadTeacherClasses() {

  const list = document.getElementById("myClasses");
  const select = document.getElementById("teacherClassSelect");

  if (list) list.innerHTML = "";
  if (select) select.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "classes"),
    where("teacherId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (list) {
      const li = document.createElement("li");
      li.textContent = `${data.name} - Grade ${data.grade}`;
      list.appendChild(li);
    }

    if (select) {
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.name;
      select.appendChild(option);
    }
  });
}


// 🔥 ================= STUDENT =================

async function loadStudentExams(user) {

  const container = document.getElementById("availableExams");
  if (!container) return;

  container.innerHTML = "";

  // Buscar clase del estudiante
  const classQuery = query(
    collection(db, "classes"),
    where("students", "array-contains", user.uid)
  );

  const classSnapshot = await getDocs(classQuery);

  if (classSnapshot.empty) {
    container.innerHTML = "<p>No class assigned.</p>";
    return;
  }

  const classId = classSnapshot.docs[0].id;

  // Buscar exámenes activos
  const examQuery = query(
    collection(db, "launchedExams"),
    where("classId", "==", classId),
    where("status", "==", "active")
  );

  const examSnapshot = await getDocs(examQuery);

  if (examSnapshot.empty) {
    container.innerHTML = "<p>No active exams.</p>";
    return;
  }

  for (const docSnap of examSnapshot.docs) {
    const data = docSnap.data();

    container.innerHTML += `
      <div class="card">
        <p>Exam ID: ${data.examId}</p>
        <button onclick="startExam('${data.examId}')">Start</button>
      </div>
    `;
  }
}

window.startExam = function(examId) {
  alert("Starting exam: " + examId);
};


// 🔥 ================= LOGOUT =================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
