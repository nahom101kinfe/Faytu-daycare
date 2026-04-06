// Database-backed system (MongoDB)

function showAdminLogin() {
  document.getElementById('adminLogin').style.display = 'block';
}

function goToParent() {
  window.location.href = 'parent.html';
}

function loginAdmin() {
  const pass = document.getElementById('password').value;
  if (pass === '1234') {
    window.location.href = 'admin.html';
  } else {
    alert('Invalid password');
  }
}

async function searchChild() {
  let name = document.getElementById('childName').value.trim();
  if (!name) {
    alert('Please enter a child\'s name');
    return;
  }

  try {
    // Filter attendance
    const attendanceRes = await fetch('/attendance');
    const attendance = await attendanceRes.json();
    let filteredAttendance = attendance.filter(item => item.fullName === name).map(item => item.record);

    let list = document.getElementById('attendanceList');
    list.innerHTML = '';
    filteredAttendance.forEach(item => {
      let li = document.createElement('li');
      li.textContent = item;
      list.appendChild(li);
    });

    // Display monthly payments for the student
    const paymentsRes = await fetch('/payments');
    const payments = await paymentsRes.json();
    const studentPayments = payments.filter(p => p.fullName === name);

    let payList = document.getElementById('monthlyPaymentList');
    payList.innerHTML = '';
    studentPayments.forEach(payment => {
      let li = document.createElement('li');
      li.textContent = payment.month + ': $' + payment.amount;
      payList.appendChild(li);
    });
  } catch (err) {
    console.error('Error fetching data for search', err);
    alert('Failed to search student data');
  }
}

// Admin functions
async function addStudent() {
  let fullName = document.getElementById('fullName').value.trim();
  let motherName = document.getElementById('motherName').value.trim();
  let phone = document.getElementById('phone').value.trim();
  let motherPhone = document.getElementById('motherPhone').value.trim();
  let address = document.getElementById('address').value.trim();
  let dob = document.getElementById('dob').value;
  let allergies = document.getElementById('allergies').value.trim();

  if (!fullName || !motherName || !phone || !motherPhone || !address || !dob) {
    alert('Please fill all required fields');
    return;
  }

  let student = {
    fullName,
    motherName,
    phone,
    motherPhone,
    address,
    dob,
    allergies
  };

  try {
    const res = await fetch('/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(student)
    });
    if (res.ok) {
      // Clear fields
      document.getElementById('fullName').value = '';
      document.getElementById('motherName').value = '';
      document.getElementById('phone').value = '';
      document.getElementById('motherPhone').value = '';
      document.getElementById('address').value = '';
      document.getElementById('dob').value = '';
      document.getElementById('allergies').value = '';

      displayStudents();
      displayAttendanceCheckboxes();
      displayMonthlyPayments();
      // Need to re-trigger loadStudentPayments if the select changed, but simple displays are fine.
      alert('Student added');
    }
  } catch (err) {
    console.error('Error adding student', err);
    alert('Failed to add student');
  }
}

async function removeStudent(fullName) {
  try {
    const res = await fetch(`/students/${encodeURIComponent(fullName)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      displayStudents();
      displayAttendanceCheckboxes();
      displayMonthlyPayments();
      alert('Student removed');
    }
  } catch (err) {
    console.error('Error removing student', err);
    alert('Failed to remove student');
  }
}

async function displayStudents() {
  if (document.getElementById('studentList')) {
    try {
      const res = await fetch('/students');
      let students = await res.json();
      students = students.filter(s => typeof s === 'object' && s.fullName); // Filter to valid objects
      let list = document.getElementById('studentList');
      list.innerHTML = '';
      students.forEach(student => {
        let li = document.createElement('li');
        li.textContent = student.fullName + ' ';
        
        let detailsBtn = document.createElement('button');
        detailsBtn.innerHTML = '&#128712;'; // Info icon
        detailsBtn.addEventListener('click', () => toggleDetails(student.fullName));
        
        let removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => removeStudent(student.fullName));
        
        li.appendChild(detailsBtn);
        li.appendChild(removeBtn);
        
        let detailsDiv = document.createElement('div');
        detailsDiv.id = 'details-' + student.fullName.replace(/[^a-zA-Z0-9]/g, '-');
        detailsDiv.style.display = 'none';
        detailsDiv.innerHTML = `<strong>Mother's Name:</strong> ${student.motherName}<br>
                                <strong>Phone:</strong> ${student.phone}<br>
                                <strong>Mother's Phone:</strong> ${student.motherPhone}<br>
                                <strong>Address:</strong> ${student.address}<br>
                                <strong>Date of Birth:</strong> ${student.dob}<br>
                                <strong>Allergies:</strong> ${student.allergies || 'None'}`;
        
        li.appendChild(detailsDiv);
        list.appendChild(li);
      });
    } catch (err) {
      console.error('Error fetching students', err);
    }
  }
}

async function displayAttendanceCheckboxes() {
  if (document.getElementById('attendanceCheckboxes')) {
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        fetch('/students'),
        fetch('/attendance')
      ]);
      let students = await studentsRes.json();
      students = students.filter(s => typeof s === 'object' && s.fullName);
      
      let attendanceInfo = await attendanceRes.json();
      let today = new Date().toLocaleDateString();
      let container = document.getElementById('attendanceCheckboxes');
      container.innerHTML = '';
      
      students.forEach(student => {
        let label = document.createElement('label');
        label.style.display = 'block';
        label.style.margin = '5px 0';
        
        let nameSpan = document.createElement('span');
        nameSpan.textContent = student.fullName + ' ';
        label.appendChild(nameSpan);
        
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = student.fullName;
        
        // Check if already marked today
        let recordStr = student.fullName + ' - Present - ' + today;
        let alreadyMarked = attendanceInfo.some(item => item.record === recordStr);
        if (alreadyMarked) {
          checkbox.checked = true;
          checkbox.disabled = true;
          nameSpan.textContent += '(Already checked)';
        } else {
          checkbox.onchange = () => {
            if (checkbox.checked) {
              label.style.backgroundColor = 'lightgreen';
            } else {
              label.style.backgroundColor = '';
            }
          };
        }
        
        label.appendChild(checkbox);
        container.appendChild(label);
      });
    } catch (err) {
      console.error('Error fetching attendance data', err);
    }
  }
}

async function displayMonthlyPayments() {
  try {
    const res = await fetch('/students');
    let students = await res.json();
    students = students.filter(s => typeof s === 'object' && s.fullName);
    
    // For payment select
    if (document.getElementById('paymentStudentSelect')) {
      let select = document.getElementById('paymentStudentSelect');
      select.innerHTML = '<option value="">Select Student</option>';
      students.forEach(student => {
        let option = document.createElement('option');
        option.value = student.fullName;
        option.textContent = student.fullName;
        select.appendChild(option);
      });
    }
    
    // For view select
    if (document.getElementById('viewStudentSelect')) {
      let select = document.getElementById('viewStudentSelect');
      select.innerHTML = '<option value="">Select Student</option>';
      students.forEach(student => {
        let option = document.createElement('option');
        option.value = student.fullName;
        option.textContent = student.fullName;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error('Error fetching students for payment selectors', err);
  }
}

async function loadStudentPayments() {
  let selectedStudent = document.getElementById('paymentStudentSelect').value;
  if (!selectedStudent) {
    document.getElementById('studentPayments').innerHTML = '';
    return;
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let currentMonthIndex = new Date().getMonth();
  let currentMonth = months[currentMonthIndex];
  
  try {
    const res = await fetch('/payments');
    const allPayments = await res.json();
    // find payment for this student and month
    const payment = allPayments.find(p => p.fullName === selectedStudent && p.month === currentMonth);
    const amount = payment ? payment.amount : '';
    
    let container = document.getElementById('studentPayments');
    container.innerHTML = '';
    let div = document.createElement('div');
    div.style.margin = '5px 0';
    let label = document.createElement('label');
    label.textContent = currentMonth + ': $';
    let input = document.createElement('input');
    input.type = 'number';
    input.value = amount;
    input.placeholder = '0';
    input.id = 'payment-' + selectedStudent + '-' + currentMonth;
    label.appendChild(input);
    div.appendChild(label);
    container.appendChild(div);
  } catch (err) {
    console.error('Error loading student payments', err);
  }
}

async function recordStudentPayments() {
  let selectedStudent = document.getElementById('paymentStudentSelect').value;
  if (!selectedStudent) {
    alert('Please select a student');
    return;
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let currentMonthIndex = new Date().getMonth();
  let currentMonth = months[currentMonthIndex];
  
  let input = document.getElementById('payment-' + selectedStudent + '-' + currentMonth);
  let amount = parseFloat(input.value) || 0;
  
  if (amount > 0) {
    try {
      const res = await fetch('/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: selectedStudent, month: currentMonth, amount: amount })
      });
      if (res.ok) {
        alert('Payment recorded for ' + selectedStudent + ' for ' + currentMonth);
      }
    } catch (err) {
      console.error('Error recording payment', err);
      alert('Failed to record payment');
    }
  } else {
    alert('Please enter a valid amount');
  }
}

async function viewStudentPayments() {
  let selectedStudent = document.getElementById('viewStudentSelect').value;
  let list = document.getElementById('viewPaymentsList');
  list.innerHTML = '';
  if (!selectedStudent) {
    return;
  }
  
  try {
    const res = await fetch('/payments');
    const allPayments = await res.json();
    const studentPayments = allPayments.filter(p => p.fullName === selectedStudent);
    
    studentPayments.forEach(payment => {
      let li = document.createElement('li');
      li.textContent = payment.month + ': $' + payment.amount;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error viewing payments', err);
  }
}

async function markAttendance() {
  let checkboxes = document.querySelectorAll('#attendanceCheckboxes input[type="checkbox"]:checked:not(:disabled)');
  if (checkboxes.length === 0) return;
  
  let date = new Date().toLocaleDateString();
  let records = [];
  checkboxes.forEach(cb => {
    records.push({
      fullName: cb.value,
      date: date,
      record: cb.value + ' - Present - ' + date
    });
  });
  
  try {
    const res = await fetch('/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records)
    });
    
    if (res.ok) {
      document.querySelectorAll('#attendanceCheckboxes input[type="checkbox"]:not(:disabled)').forEach(cb => cb.checked = false);
      displayAttendanceCheckboxes(); // Refresh to show disabled
      alert('Attendance marked');
    }
  } catch (err) {
    console.error('Error marking attendance', err);
    alert('Failed to mark attendance');
  }
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = 'index.html';
  }
}

function toggleDetails(fullName) {
  let detailsDiv = document.getElementById('details-' + fullName.replace(/[^a-zA-Z0-9]/g, '-'));
  if (detailsDiv.style.display === 'none') {
    detailsDiv.style.display = 'block';
  } else {
    detailsDiv.style.display = 'none';
  }
}

// Page load data
window.onload = function () {
  // Admin page load
  if (document.getElementById('studentList')) { displayStudents(); }
  if (document.getElementById('attendanceCheckboxes')) { displayAttendanceCheckboxes(); }
  if (document.getElementById('paymentStudentSelect') || document.getElementById('viewStudentSelect')) { displayMonthlyPayments(); }
};

// Add event listeners
if (document.getElementById('adminBtn')) {
  document.getElementById('adminBtn').addEventListener('click', showAdminLogin);
}
if (document.getElementById('parentBtn')) {
  document.getElementById('parentBtn').addEventListener('click', goToParent);
}
if (document.getElementById('loginBtn')) {
  document.getElementById('loginBtn').addEventListener('click', loginAdmin);
}
if (document.getElementById('addStudentBtn')) {
  document.getElementById('addStudentBtn').addEventListener('click', addStudent);
}
if (document.getElementById('markAttendanceBtn')) {
  document.getElementById('markAttendanceBtn').addEventListener('click', markAttendance);
}
if (document.getElementById('recordPaymentBtn')) {
  document.getElementById('recordPaymentBtn').addEventListener('click', recordStudentPayments);
}
if (document.getElementById('paymentStudentSelect')) {
  document.getElementById('paymentStudentSelect').addEventListener('change', loadStudentPayments);
}
if (document.getElementById('viewStudentSelect')) {
  document.getElementById('viewStudentSelect').addEventListener('change', viewStudentPayments);
}
if (document.getElementById('searchBtn')) {
  document.getElementById('searchBtn').addEventListener('click', searchChild);
}
if (document.getElementById('logoutBtn')) {
  document.getElementById('logoutBtn').addEventListener('click', logout);
}
