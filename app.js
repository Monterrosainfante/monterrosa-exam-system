// 🔥 FIREBASE IMPORTS (SIEMPRE ARRIBA)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
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


// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDshlcOrBShy1mhAXUoc5-Ppo3GqsbJHbs",
  authDomain: "monterrosa-exam-system.firebaseapp.com",
  projectId: "monterrosa-exam-system",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);



// ================= LOGIN / REGISTER =================

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



// ================= AUTH REDIRECTION =================

onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return;

  const role = userDoc.data().role;

  // Redirigir solo desde index
  if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {

    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "teacher") {
      window.location.href = "teacher.html";
    } else if (role === "student") {
      window.location.href = "student.html";
    }
  }

  // Si estamos en admin
  if (role === "admin" && window.location.pathname.includes("admin.html")) {
    loadClasses();
    loadStudents();
  }

  // Si estamos en teacher
  if (role === "teacher" && window.location.pathname.includes("teacher.html")) {
    loadTeacherClasses();
  }
});



// ================= ADMIN - CREATE CLASS =================

const createClassBtn = document.getElementById("createClassBtn");

if (createClassBtn) {
  createClassBtn.addEventListener("click", async () => {

    const name = document.getElementById("className").value;
    const grade = document.getElementById("classGrade").value;
    const teacherId = document.getElementById("teacherUID").value;

    await addDoc(collection(db, "classes"), {
      name,
      grade,
      teacherId,
      students: [],
      createdAt: serverTimestamp()
    });

    alert("Class created!");
    loadClasses();
  });
}



// ================= LOAD CLASSES (ADMIN) =================

async function loadClasses() {

  const classList = document.getElementById("classList");
  const classSelect = document.getElementById("classSelect");

  if (classList) classList.innerHTML = "";
  if (classSelect) classSelect.innerHTML = "";

  const snapshot = await getDocs(collection(db, "classes"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    if (classList) {
      const li = document.createElement("li");
      li.textContent = data.name + " - Grade " + data.grade;
      classList.appendChild(li);
    }

    if (classSelect) {
      const option = document.createElement("option");
      option.value = docSnap.id;
      option.textContent = data.name;
      classSelect.appendChild(option);
    }
  });
}



// ================= LOAD STUDENTS (ADMIN) =================

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



// ================= ASSIGN STUDENT =================

const assignStudentBtn = document.getElementById("assignStudentBtn");

if (assignStudentBtn) {
  assignStudentBtn.addEventListener("click", async () => {

    const classId = document.getElementById("classSelect").value;
    const studentId = document.getElementById("studentSelect").value;

    await updateDoc(doc(db, "classes", classId), {
      students: arrayUnion(studentId)
    });

    alert("Student assigned successfully!");
  });
}



// ================= TEACHER - LOAD OWN CLASSES =================

async function loadTeacherClasses() {

  const list = document.getElementById("myClasses");
  if (!list) return;

  list.innerHTML = "";

  const user = auth.currentUser;
  if (!user) return;

  const q = query(
    collection(db, "classes"),
    where("teacherId", "==", user.uid)
  );

  const snapshot = await getDocs(q);

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();

    const li = document.createElement("li");
    li.textContent = data.name + " - Grade " + data.grade;
    list.appendChild(li);
  });
}

import { signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}

