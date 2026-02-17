import { addDoc, collection, serverTimestamp, getDocs } from "firebase/firestore";

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
async function loadClasses() {
  const classList = document.getElementById("classList");
  if (!classList) return;

  classList.innerHTML = "";

  const snapshot = await getDocs(collection(db, "classes"));

  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const li = document.createElement("li");

    li.textContent = data.name + " - Grade " + data.grade;
    classList.appendChild(li);
 if (window.location.pathname.includes("admin.html")) {
  loadClasses();
}
const classSelect = document.getElementById("classSelect");
if (classSelect) {
  classSelect.innerHTML = "";
}
if (classSelect) {
  const option = document.createElement("option");
  option.value = docSnap.id;
  option.textContent = data.name;
  classSelect.appendChild(option);
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
    if (window.location.pathname.includes("admin.html")) {
  loadClasses();
  loadStudents();
}
import { updateDoc, doc, arrayUnion } from "firebase/firestore";

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
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
  if (role === "teacher") {
  loadTeacherClasses();
}

} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDshlcOrBShy1mhAXUoc5-Ppo3GqsbJHbs",
  authDomain: "monterrosa-exam-system.firebaseapp.com",
  projectId: "monterrosa-exam-system",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
    onAuthStateChanged(auth, async (user) => {

  if (!user) return;

  const userDoc = await getDoc(doc(db, "users", user.uid));

  if (!userDoc.exists()) return;

  const role = userDoc.data().role;

  if (window.location.pathname.includes("index.html") || window.location.pathname.endsWith("/")) {

    if (role === "admin") {
      window.location.href = "admin.html";
    } else if (role === "teacher") {
      window.location.href = "teacher.html";
    } else if (role === "student") {
      window.location.href = "student.html";
    }

  }
});
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

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


