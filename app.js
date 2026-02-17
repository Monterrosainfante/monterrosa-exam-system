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


