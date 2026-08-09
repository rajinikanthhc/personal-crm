/* =====================================================
   PERSONAL CRM
   Backend - Code.gs
   ===================================================== */


/* =====================================================
   OPEN GOOGLE SHEET
   ===================================================== */

function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}


/* =====================================================
   WEB APP
   ===================================================== */

function doGet() {
  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Personal CRM')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/* =====================================================
   INCLUDE HTML FILES
   ===================================================== */

function include(filename) {
  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();
}


/* =====================================================
   GET COMPANIES
   ===================================================== */

function getCompanies() {

  const sheet = getSpreadsheet().getSheetByName('Companies');

  if (!sheet) {
    throw new Error('Companies sheet not found.');
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  const headers = data[0];

  return data.slice(1).map(function(row) {

    let company = {};

    headers.forEach(function(header, index) {
      company[header] = row[index];
    });

    return company;

  });
}


/* =====================================================
   GET PEOPLE
   ===================================================== */

function getPeople() {

  const sheet = getSpreadsheet().getSheetByName('People');

  if (!sheet) {
    throw new Error('People sheet not found.');
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return [];
  }

  const headers = data[0];

  return data.slice(1).map(function(row) {

    let person = {};

    headers.forEach(function(header, index) {
      person[header] = row[index];
    });

    return person;

  });
}


/* =====================================================
   GET SETTINGS
   ===================================================== */

function getSettings() {

  const sheet = getSpreadsheet().getSheetByName('Settings');

  if (!sheet) {
    throw new Error('Settings sheet not found.');
  }

  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return {};
  }

  const headers = data[0];
  const settings = {};

  headers.forEach(function(header, columnIndex) {

    settings[header] = [];

    for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {

      const value = data[rowIndex][columnIndex];

      if (value !== '' && value !== null) {
        settings[header].push(value);
      }

    }

  });

  return settings;
}


/* =====================================================
   GET ALL CRM DATA
   ===================================================== */

function getCRMData() {

  return {
    companies: getCompanies(),
    people: getPeople(),
    settings: getSettings()
  };

}