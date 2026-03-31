// Simple localStorage-based system

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

function searchChild() {
  let name = document.getElementById('childName').value.trim();
  if (!name) {
    alert('Please enter a child\'s name');
    return;
  }

  // Filter attendance
  let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
  let filteredAttendance = attendance.filter(item => item.startsWith(name + ' -'));

  let list = document.getElementById('attendanceList');
  list.innerHTML = '';
  filteredAttendance.forEach(item => {
    let li = document.createElement('li');
    li.textContent = item;
    list.appendChild(li);
  });

  // Display monthly payments for the student
  let allPayments = JSON.parse(localStorage.getItem('studentPayments')) || {};
  let studentPayments = allPayments[name] || {};
  let payList = document.getElementById('monthlyPaymentList');
  payList.innerHTML = '';
  for (let month in studentPayments) {
    let li = document.createElement('li');
    li.textContent = month + ': $' + studentPayments[month];
    payList.appendChild(li);
  }
}

// Admin functions
function addStudent() {
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
    fullName: fullName,
    motherName: motherName,
    phone: phone,
    motherPhone: motherPhone,
    address: address,
    dob: dob,
    allergies: allergies
  };

  let students = JSON.parse(localStorage.getItem('students')) || [];
  students.push(student);
  localStorage.setItem('students', JSON.stringify(students));

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
  alert('Student added');
}

function removeStudent(fullName) {
  let students = JSON.parse(localStorage.getItem('students')) || [];
  students = students.filter(student => student.fullName !== fullName);
  localStorage.setItem('students', JSON.stringify(students));

  // Also remove from attendance
  let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
  attendance = attendance.filter(item => !item.startsWith(fullName + ' -'));
  localStorage.setItem('attendance', JSON.stringify(attendance));

  // Remove from payments
  let payments = JSON.parse(localStorage.getItem('payments')) || [];
  payments = payments.filter(item => !item.startsWith(fullName + ' -'));
  localStorage.setItem('payments', JSON.stringify(payments));

  // Remove from studentPayments
  let studentPayments = JSON.parse(localStorage.getItem('studentPayments')) || {};
  delete studentPayments[fullName];
  localStorage.setItem('studentPayments', JSON.stringify(studentPayments));

  displayStudents();
  displayAttendanceCheckboxes();
  displayMonthlyPayments();
  alert('Student removed');
}

function displayStudents() {
  if (document.getElementById('studentList')) {
    let students = JSON.parse(localStorage.getItem('students')) || [];
    students = students.filter(s => typeof s === 'object' && s.fullName); // Filter to valid objects
    let list = document.getElementById('studentList');
    list.innerHTML = '';
    students.forEach(student => {
      let li = document.createElement('li');
      li.textContent = student.fullName + ' ';
      
      let detailsBtn = document.createElement('button');
      detailsBtn.innerHTML = '&#128712;'; // Info icon
      detailsBtn.onclick = () => toggleDetails(student.fullName);
      
      let removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => removeStudent(student.fullName);
      
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
  }
}

function displayAttendanceCheckboxes() {
  if (document.getElementById('attendanceCheckboxes')) {
    let students = JSON.parse(localStorage.getItem('students')) || [];
    students = students.filter(s => typeof s === 'object' && s.fullName); // Filter to valid objects
    let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
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
      let alreadyMarked = attendance.some(item => item === student.fullName + ' - Present - ' + today);
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
  }
}

function displayMonthlyPayments() {
  let students = JSON.parse(localStorage.getItem('students')) || [];
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
}

function loadStudentPayments() {
  let selectedStudent = document.getElementById('paymentStudentSelect').value;
  if (!selectedStudent) {
    document.getElementById('studentPayments').innerHTML = '';
    return;
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let currentMonthIndex = new Date().getMonth();
  let currentMonth = months[currentMonthIndex];
  let allPayments = JSON.parse(localStorage.getItem('studentPayments')) || {};
  let payments = allPayments[selectedStudent] || {};
  let container = document.getElementById('studentPayments');
  container.innerHTML = '';
  let div = document.createElement('div');
  div.style.margin = '5px 0';
  let label = document.createElement('label');
  label.textContent = currentMonth + ': $';
  let input = document.createElement('input');
  input.type = 'number';
  input.value = payments[currentMonth] || '';
  input.placeholder = '0';
  input.id = 'payment-' + selectedStudent + '-' + currentMonth;
  label.appendChild(input);
  div.appendChild(label);
  container.appendChild(div);
}

function recordStudentPayments() {
  let selectedStudent = document.getElementById('paymentStudentSelect').value;
  if (!selectedStudent) {
    alert('Please select a student');
    return;
  }
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let currentMonthIndex = new Date().getMonth();
  let currentMonth = months[currentMonthIndex];
  let allPayments = JSON.parse(localStorage.getItem('studentPayments')) || {};
  let payments = allPayments[selectedStudent] || {};
  let input = document.getElementById('payment-' + selectedStudent + '-' + currentMonth);
  let amount = parseFloat(input.value) || 0;
  if (amount > 0) {
    payments[currentMonth] = amount;
  } else {
    delete payments[currentMonth];
  }
  allPayments[selectedStudent] = payments;
  localStorage.setItem('studentPayments', JSON.stringify(allPayments));
  alert('Payment recorded for ' + selectedStudent + ' for ' + currentMonth);
}

function viewStudentPayments() {
  let selectedStudent = document.getElementById('viewStudentSelect').value;
  let list = document.getElementById('viewPaymentsList');
  list.innerHTML = '';
  if (!selectedStudent) {
    return;
  }
  let allPayments = JSON.parse(localStorage.getItem('studentPayments')) || {};
  let payments = allPayments[selectedStudent] || {};
  for (let month in payments) {
    let li = document.createElement('li');
    li.textContent = month + ': $' + payments[month];
    list.appendChild(li);
  }
}

function markAttendance() {
  let checkboxes = document.querySelectorAll('#attendanceCheckboxes input[type="checkbox"]:checked:not(:disabled)');
  let attendance = JSON.parse(localStorage.getItem('attendance')) || [];
  let date = new Date().toLocaleDateString();
  checkboxes.forEach(cb => {
    attendance.push(cb.value + ' - Present - ' + date);
  });
  localStorage.setItem('attendance', JSON.stringify(attendance));
  // Uncheck all enabled
  document.querySelectorAll('#attendanceCheckboxes input[type="checkbox"]:not(:disabled)').forEach(cb => cb.checked = false);
  displayAttendanceCheckboxes(); // Refresh to show disabled
  alert('Attendance marked');
}

function addPayment() {
  let name = document.getElementById('paymentName').value;
  let payments = JSON.parse(localStorage.getItem('payments')) || [];
  payments.push(name + ' - Paid');
  localStorage.setItem('payments', JSON.stringify(payments));
  alert('Payment added');
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

// Parent page load data
window.onload = function () {
  // Admin page load
  displayStudents();
  displayAttendanceCheckboxes();
  displayMonthlyPayments();
};
