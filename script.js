// Variables globales
const MAX_TURNS_PER_DAY = 8;
const TIME_INTERVALS = [
  "09:00", "09:30",
  "10:00", "10:30",
  "11:00", "11:30",
  "12:00", "12:30",
  "13:00", "13:30",
  "14:00"
];

// Setup - llenar select de horarios
window.addEventListener('load', () => {
  setupDateInput();
  fillTimeOptions();
  loadBookedTurns(); // importante!
  checkAvailabilityAndUpdate();
  document.getElementById('date').addEventListener('change', checkAvailabilityAndUpdate);
  document.getElementById('booking-form').addEventListener('submit', submitBooking);
  document.getElementById('cancel-form').addEventListener('submit', cancelBooking);
});

function setupDateInput() {
  const dateInput = document.getElementById('date');
  const today = new Date();
  dateInput.min = formatDate(today);
  dateInput.max = formatDate(addDays(today, 30)); // 30 días para adelante
  dateInput.value = formatDate(today);
  // Solo permitir lunes a viernes
  dateInput.addEventListener('input', () => {
    const day = new Date(dateInput.value).getDay();
    if (day === 0 || day === 6) {
      alert('Solo se permiten días de lunes a viernes');
      dateInput.value = '';
    }
  });
}

function fillTimeOptions() {
  const timeSelect = document.getElementById('time');
  TIME_INTERVALS.forEach(t => {
    const option = document.createElement('option');
    option.value = t;
    option.textContent = t;
    timeSelect.appendChild(option);
  });
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

let bookedTurns = [];

function checkAvailabilityAndUpdate() {
  const dateInput = document.getElementById('date').value;
  if (!dateInput) return;

  const bookedToday = bookedTurns.filter(t => t.date === dateInput);
  if (bookedToday.length >= MAX_TURNS_PER_DAY) {
    alert('Lo sentimos, ya no hay turnos disponibles para este día.');
    disableDate(dateInput);
    return;
  }

  const timeSelect = document.getElementById('time');
  Array.from(timeSelect.options).forEach(option => {
    option.disabled = bookedToday.some(t => t.time === option.value);
  });
}

function disableDate(date) {
  const dateInput = document.getElementById('date');
  if (dateInput.value === date) {
    dateInput.value = '';
  }
}

function submitBooking(e) {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const reason = document.getElementById('reason').value.trim();
  const contact = document.getElementById('contact').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;

  if (!name || !reason || !contact || !date || !time) {
    alert('Por favor, completa todos los campos.');
    return;
  }

  const bookedToday = bookedTurns.filter(t => t.date === date);
  if (bookedToday.length >= MAX_TURNS_PER_DAY) {
    alert('Lo sentimos, ya no hay turnos disponibles para este día.');
    return;
  }
  if (bookedToday.some(t => t.time === time)) {
    alert('Ese horario ya fue reservado. Por favor elige otro.');
    return;
  }

  const data = { name, reason, contact, date, time };
  submitToSheet(data);
}

function submitToSheet(data) {
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzc0bnV_jZ7Hrn8ej_qUaTs0E5NdrLPdbxKdjMxzhkU1HYPmUpz-OeRVbRQDnM45gCV/exec';

  fetch(scriptURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  .then(response => {
    if (response.ok) {
      showMessage(`✅ ¡Listo! Tu turno fue reservado con éxito para el ${data.date} a las ${data.time}.`);
      bookedTurns.push(data);
      checkAvailabilityAndUpdate();
      document.getElementById('booking-form').reset();
    } else {
      throw new Error('Error en la reserva');
    }
  })
  .catch(() => {
    alert('Hubo un error al reservar el turno. Por favor, intentá de nuevo más tarde.');
  });
}


function showMessage(msg) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = msg;
}

function cancelBooking(e) {
  e.preventDefault();
  const contact = document.getElementById('cancel-contact').value.trim();
  if (!contact) {
    alert('Por favor, ingresá tu teléfono o email para cancelar el turno.');
    return;
  }

  const scriptURL = 'https://script.google.com/macros/s/AKfycbzc0bnV_jZ7Hrn8ej_qUaTs0E5NdrLPdbxKdjMxzhkU1HYPmUpz-OeRVbRQDnM45gCV/exec';

  fetch(scriptURL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ cancel: true, contact })
  })
    .then(() => {
      showCancelMessage('✅ Turno cancelado correctamente.');
      bookedTurns = bookedTurns.filter(t => t.contact !== contact);
      checkAvailabilityAndUpdate();
      document.getElementById('cancel-form').reset();
    })
    .catch(() => {
      alert('Hubo un error al cancelar el turno. Por favor, intentá de nuevo más tarde.');
    });
}

function showCancelMessage(msg) {
  const cancelMessageDiv = document.getElementById('cancel-message');
  cancelMessageDiv.textContent = msg;
}

function loadBookedTurns() {
  const scriptURL = 'https://script.google.com/macros/s/AKfycbz2YW0puKneFrVvgwUfSj1jq9LwRtQfm9dctLdLZ7_BFRBU1SS8IXgeM1YgIJ6zKNnr/exec';
  fetch(scriptURL)
    .then(response => response.json())
    .then(data => {
      bookedTurns = data;
      checkAvailabilityAndUpdate();
    })
    .catch(() => {
      alert('No se pudieron cargar los turnos existentes.');
    });
}
