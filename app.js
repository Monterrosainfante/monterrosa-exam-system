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
  apiKey: "AIzaSyDshlcOrBShy1mhAXUoc5-Ppo3GqsbJHbs",
  authDomain: "monterrosa-exam-system.firebaseapp.com",
  projectId: "monterrosa-exam-system",
  storageBucket: "monterrosa-exam-system.firebasestorage.app",
  messagingSenderId: "160412525297",
  appId: "1:160412525297:web:9170ff5a518e6c083e7f50"
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


// 🔥 ================= STUDENT SYSTEM =================

let currentExamId = null;
let timerInterval = null;
let timeLeft = 0;


// 🔥 LOAD AVAILABLE EXAMS
async function loadStudentExams(user) {

  const container = document.getElementById("availableExams");
  if (!container) return;

  container.innerHTML = "";

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

    const resultQuery = query(
      collection(db, "examResults"),
      where("examId", "==", data.examId),
      where("studentId", "==", user.uid)
    );

    const resultSnapshot = await getDocs(resultQuery);

    if (!resultSnapshot.empty) {
      container.innerHTML += `
        <div class="card">
          <p>${data.examId} - Completed ✅</p>
        </div>
      `;
      continue;
    }

    container.innerHTML += `
      <div class="card">
        <p>${data.examId}</p>
        <button onclick="startExam('${data.examId}')">Start</button>
      </div>
    `;
  }
}


// 🔥 START EXAM
window.startExam = async function (examId) {

  const user = auth.currentUser;
  if (!user) return;

  currentExamId = examId;

  const sessionQuery = query(
    collection(db, "examSessions"),
    where("examId", "==", examId),
    where("studentId", "==", user.uid),
    where("status", "==", "in-progress")
  );

  const sessionSnapshot = await getDocs(sessionQuery);

  let endTime;

  if (!sessionSnapshot.empty) {
    endTime = sessionSnapshot.docs[0].data().endTime.toDate();
  } else {

    const durationMinutes = 5;
    const now = new Date();
    endTime = new Date(now.getTime() + durationMinutes * 60000);

    await addDoc(collection(db, "examSessions"), {
      examId,
      studentId: user.uid,
      startTime: serverTimestamp(),
      endTime: endTime,
      status: "in-progress"
    });
  }

  const now = new Date();
  timeLeft = Math.floor((endTime - now) / 1000);

  if (timeLeft <= 0) {
    alert("Time expired.");
    await submitExam();
    return;
  }

  await loadExamContent(examId);
  startTimer();
};


// 🔥 TIMER
function startTimer() {

  const timerDisplay = document.getElementById("timer");

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {

    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;

    timerDisplay.textContent =
      `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

    timeLeft--;

    if (timeLeft < 0) {
      clearInterval(timerInterval);
      autoSubmitExam();
    }

  }, 1000);
}


// 🔥 AUTO SUBMIT
async function autoSubmitExam() {
  alert("Time is up! Submitting automatically.");
  await submitExam();
}


// 🔥 SUBMIT EXAM
async function submitExam() {

  if (!currentExamId) return;

  clearInterval(timerInterval);

  const user = auth.currentUser;

  const examDoc = await getDoc(doc(db, "exams", currentExamId));
  if (!examDoc.exists()) return;

  const examData = examDoc.data();

  let score = 0;

  examData.questions.forEach((q, index) => {

    const selected =
      document.querySelector(`[name="q${index}"]:checked`) ||
      document.querySelector(`[name="q${index}"]`);

    if (!selected) return;

    if (selected.value?.toLowerCase() === q.correctAnswer.toLowerCase()) {
      score++;
    }
  });

  await addDoc(collection(db, "examResults"), {
    examId: currentExamId,
    studentId: user.uid,
    score,
    total: examData.questions.length,
    submittedAt: serverTimestamp()
  });

  // 🔥 Marcar sesión como completada
  const sessionQuery = query(
    collection(db, "examSessions"),
    where("examId", "==", currentExamId),
    where("studentId", "==", user.uid),
    where("status", "==", "in-progress")
  );

  const sessionSnapshot = await getDocs(sessionQuery);

  if (!sessionSnapshot.empty) {
    await updateDoc(
      doc(db, "examSessions", sessionSnapshot.docs[0].id),
      { status: "completed" }
    );
  }

  alert(`Your score: ${score} / ${examData.questions.length}`);

  document.getElementById("examContainer").style.display = "none";
  document.getElementById("submitExamBtn").disabled = true;

  currentExamId = null;
}


// 🔥 LOAD EXAM CONTENT
async function loadExamContent(examId) {

  const examDoc = await getDoc(doc(db, "exams", examId));
  if (!examDoc.exists()) return;

  const examData = examDoc.data();

  const container = document.getElementById("examContainer");
  const questionsDiv = document.getElementById("questionsContainer");
  const title = document.getElementById("examTitle");

  container.style.display = "block";
  questionsDiv.innerHTML = "";
  title.textContent = examData.title;

  examData.questions.forEach((q, index) => {

    let html = `<div class="card"><p><b>${q.question}</b></p>`;

    if (q.type === "multiple") {
      q.options.forEach(option => {
        html += `
          <label>
            <input type="radio" name="q${index}" value="${option}">
            ${option}
          </label><br>
        `;
      });
    }

    if (q.type === "truefalse") {
      html += `
        <label><input type="radio" name="q${index}" value="true"> True</label><br>
        <label><input type="radio" name="q${index}" value="false"> False</label>
      `;
    }

    if (q.type === "short") {
      html += `<input type="text" name="q${index}">`;
    }

    html += `</div>`;
    questionsDiv.innerHTML += html;
  });
}


// 🔥 SUBMIT BUTTON LISTENER
const submitExamBtn = document.getElementById("submitExamBtn");

if (submitExamBtn) {
  submitExamBtn.addEventListener("click", submitExam);
}


// 🔥 ================= LOGOUT =================

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await signOut(auth);
    window.location.href = "index.html";
  });
}
