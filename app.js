// 🔥 ================= FIREBASE IMPORTS (SIEMPRE ARRIBA) =================

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
  apiKey: "AIzaSyDshlcOrBShy1mhAXUoc5-Ppo3GqsbJHbs",,
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


// 🔥 ================= AUTH REDIRECTION =================

onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) return;

  const role = userDoc.data().role;

  const path = window.location.pathname;

  // Redirect only from index
  if (path.includes("index.html") || path.endsWith("/")) {

    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "teacher") {
      window.location.href = "teacher.html";
    } else if (role === "student") {
      window.location.href = "student.html";
    }
  }

  // ADMIN PAGE
  if (role === "admin" && path.includes("admin.html")) {
    loadClasses();
    loadStudents();
  }

  // TEACHER PAGE
  if (role === "teacher" && path.includes("teacher.html")) {
    loadTeacherClasses();
  }
});


// 🔥 ================= ADMIN - CREATE CLASS =================

const createClassBtn = document.getElementById("createClassBtn");

if (createClassBtn) {
  createClassBtn.addEventListener("click", async () => {

    const name = document.getElementById("className").value;
    const grade = document.getElementById("classGrade").value;
    const teacherId = document.getElementById("teacherUID").value;

    if (!name || !grade || !teacherId) {
      alert("Complete all fields");
      return;
    }

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


// 🔥 ================= LOAD CLASSES (ADMIN) =================

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
      li.textContent = `${data.name} - Grade ${data.grade}`;
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


// 🔥 ================= LOAD STUDENTS (ADMIN) =================

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


// 🔥 ================= ASSIGN STUDENT TO CLASS =================

const assignStudentBtn = document.getElementById("assignStudentBtn");

if (assignStudentBtn) {
  assignStudentBtn.addEventListener("click", async () => {

    const classId = document.getElementById("classSelect").value;
    const studentId = document.getElementById("studentSelect").value;

    if (!classId || !studentId) {
      alert("Select class and student");
      return;
    }

    await updateDoc(doc(db, "classes", classId), {
      students: arrayUnion(studentId)
    });

    alert("Student assigned successfully!");
  });
}


// 🔥 ================= TEACHER - LOAD OWN CLASSES =================

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


// 🔥 ================= TEACHER - CREATE EXAM =================

document.addEventListener("click", async (e) => {

  if (e.target.id === "createExamBtn") {

    const title = document.getElementById("examTitle").value;
    const classId = document.getElementById("teacherClassSelect")?.value;

    if (!title || !classId) {
      alert("Enter title and select class");
      return;
    }

    await addDoc(collection(db, "exams"), {
      title,
      teacherId: auth.currentUser.uid,
      classId,
      launched: false,
      createdAt: serverTimestamp()
    });

    alert("Exam Created ✅");
  }
});


// 🔥 ================= TEACHER - LAUNCH EXAM =================

const launchExamBtn = document.getElementById("launchExamBtn");

if (launchExamBtn) {
  launchExamBtn.addEventListener("click", async () => {

    const classId = document.getElementById("teacherClassSelect").value;
    const examId = document.getElementById("examSelect").value;

    if (!classId || !examId) {
      alert("Select class and exam");
      return;
    }

    await addDoc(collection(db, "launchedExams"), {
      examId,
      classId,
      teacherId: auth.currentUser.uid,
      status: "active",
      launchedAt: serverTimestamp()
    });

    alert("Exam Launched!");
  });
}


// 🔥 ================= LOGOUT =================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
async function loadStudentExams(user) {

  const container = document.getElementById("availableExams");
  if (!container) return;

  container.innerHTML = "";

  // 1️⃣ Buscar clase del estudiante
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

  // 2️⃣ Buscar exámenes lanzados para esa clase
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
  if (role === "student" && path.includes("student.html")) {
  loadStudentExams(user);
}


  // 3️⃣ Mostrar exámenes
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

