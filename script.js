const SHEET_NAME = 'Turnos';
const SHEET_ID = '1jFxf2d_SciehD7g9sDwlTOeNvgA-1inHc-CCmmlmGJA'; // tu ID real

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);

    const data = JSON.parse(e.postData.contents);

    if (data.action === 'reserve') {
      return reservarTurno(sheet, data);
    } else if (data.action === 'cancel') {
      return cancelarTurno(sheet, data);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', message: 'Acción inválida' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } finally {
    lock.releaseLock();
  }
}

function reservarTurno(sheet, data) {
  const turnos = sheet.getDataRange().getValues().slice(1);
  const fecha = data.fecha;
  const hora = data.hora;

  const turnosDelDia = turnos.filter(row => row[3] === fecha);
  if (turnosDelDia.length >= 12) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'full', message: 'Día completo' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const turnoExiste = turnosDelDia.some(row => row[4] === hora);
  if (turnoExiste) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'taken', message: 'Hora ocupada' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([new Date(), data.nombre, data.contacto, data.fecha, data.hora, data.motivo]);

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function cancelarTurno(sheet, data) {
  const turnos = sheet.getDataRange().getValues();
  const nombre = data.nombre;
  const contacto = data.contacto;
  const fecha = data.fecha;
  const hora = data.hora;

  for (let i = 1; i < turnos.length; i++) {
    if (
      turnos[i][1] === nombre &&
      turnos[i][2] === contacto &&
      turnos[i][3] === fecha &&
      turnos[i][4] === hora
    ) {
      sheet.deleteRow(i + 1);
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'cancelled' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ result: 'not_found' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  const turnos = [];

  for (let i = 1; i < data.length; i++) {
    const fila = data[i];
    turnos.push({
      date: fila[3],
      time: fila[4],
      contact: fila[2]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(turnos))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader("Access-Control-Allow-Origin", "*"); // <--- IMPORTANTE PARA GITHUB
}
