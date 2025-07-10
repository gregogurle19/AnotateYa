// Variables globales
const MAX_TURNS_PER_DAY = 12;
const TIME_INTERVALS = {
  morning: [
    "09:00", "09:30",
    "10:00", "10:30",
    "11:00", "11:30",
    "12:00", "12:30"
  ],
  evening: [
    "16:30", "17:00",
    "17:30", "18:00",
    "18:30", "19:00",
    "19:30", "20:00"
  ]
};

// Setup
window.addEventListener('load', () => {
  setupDateInput();
  fillTimeOptions();
  loadBookedTurns();
  checkAvailabilityAndUpdate();
  document.getElementById('date').addEventListener('change', () => {
    fillTimeOptions();
    checkAvailabilityAndUpdate();
  });
  document.getElementById('booking-form').addEventListener('submit', submitBooking);
  document.getElementById('cancel-form').addEventListener('submit', cancelBooking);
});

function setupDateInput() {
  const dateInput = document.getElementById('date');
  const today = new Date();
  dateInput.min = formatDate(today);
  dateInput.max = formatDate(addDays(today, 30));
  dateInput.value = formatDate(today);

  dateInput.addEventListener('input', () => {
    const day = new Date(dateInput.value).getDay();
    if (![1, 2, 3, 4, 5].includes(day)) {
      alert('Solo se permiten turnos de lunes a viernes.');
      dateInput.value = '';
    }
    fillTimeOptions();
    checkAvailabilityAndUpdate();
  });
}

function fillTimeOptions() {
  const timeSelect = document.getElementById('time');
  timeSelect.innerHTML = "";

  const selectedDate = document.getElementById('date').value;
  if (!selectedDate) return;

  const day = new Date(selectedDate).getDay();
  let intervals = [];

  if ([1, 3, 5].includes(day)) {
    intervals = TIME_INTERVALS.morning; // Lunes, Miércoles, Viernes
  } else if ([2, 4].includes(day)) {
    intervals = TIME_INTERVALS.evening; // Martes, Jueves
  }

  intervals.forEach(t => {
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

  const data = {
    action: "reserve",
    nombre: name,
    motivo: reason,
    contacto: contact,
    fecha: date,
    hora: time
  };

  submitToSheet(data);
}

function submitToSheet(data) {
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzXcdQAfSE7U-BDD8nMXahYW-9lsslri0BWB6-ZUH59rfcZ_TK-Mb8wnuRxchQLIl-E/exec';

  fetch(scriptURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (response.ok) {
        showMessage(`✅ ¡Listo! Tu turno fue reservado con éxito para el ${data.fecha} a las ${data.hora}.`);
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

function cancelBooking(e) {
  e.preventDefault();
  const name = document.getElementById('cancel-name').value.trim();
  const contact = document.getElementById('cancel-contact').value.trim();
  const date = document.getElementById('cancel-date').value;
  const time = document.getElementById('cancel-time').value;

  if (!name || !contact || !date || !time) {
    alert('Por favor, completá todos los datos para cancelar el turno.');
    return;
  }

  const data = {
    action: "cancel",
    nombre: name,
    contacto: contact,
    fecha: date,
    hora: time
  };

  const scriptURL = 'https://script.google.com/macros/s/AKfycbzXcdQAfSE7U-BDD8nMXahYW-9lsslri0BWB6-ZUH59rfcZ_TK-Mb8wnuRxchQLIl-E/exec';

  fetch(scriptURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
    .then(response => {
      if (response.ok) {
        showCancelMessage('✅ Turno cancelado correctamente.');
        bookedTurns = bookedTurns.filter(t => !(t.contacto === contact && t.fecha === date && t.hora === time));
        checkAvailabilityAndUpdate();
        document.getElementById('cancel-form').reset();
      } else {
        throw new Error('Error al cancelar');
      }
    })
    .catch(() => {
      alert('Hubo un error al cancelar el turno. Por favor, intentá de nuevo más tarde.');
    });
}

function showMessage(msg) {
  const messageDiv = document.getElementById('message');
  messageDiv.textContent = msg;
}

function showCancelMessage(msg) {
  const cancelMessageDiv = document.getElementById('cancel-message');
  cancelMessageDiv.textContent = msg;
}

function loadBookedTurns() {
  const scriptURL = 'https://script.google.com/macros/s/AKfycbzXcdQAfSE7U-BDD8nMXahYW-9lsslri0BWB6-ZUH59rfcZ_TK-Mb8wnuRxchQLIl-E/exec';

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

