/* =========================================================
   PERSONAL CRM
   BACKEND - FRESH VERSION
========================================================= */


/* =========================================================
   WEB APP
========================================================= */

function doGet() {

  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Personal CRM')
    .setXFrameOptionsMode(
      HtmlService.XFrameOptionsMode.ALLOWALL
    );

}


/* =========================================================
   INCLUDE HTML FILE
========================================================= */

function include(filename) {

  return HtmlService
    .createHtmlOutputFromFile(filename)
    .getContent();

}


/* =========================================================
   SPREADSHEET
========================================================= */

function getSpreadsheet() {

  return SpreadsheetApp.getActiveSpreadsheet();

}


/* =========================================================
   SHEETS
========================================================= */

function getCompaniesSheet() {

  const sheet =
    getSpreadsheet()
      .getSheetByName('Companies Sheet');

  if (!sheet) {
    throw new Error(
      'Companies Sheet not found.'
    );
  }

  return sheet;

}


function getPeopleSheet() {

  const sheet =
    getSpreadsheet()
      .getSheetByName('People Sheet');

  if (!sheet) {
    throw new Error(
      'People Sheet not found.'
    );
  }

  return sheet;

}


function getSettingsSheet() {

  const sheet =
    getSpreadsheet()
      .getSheetByName('Settings');

  if (!sheet) {
    throw new Error(
      'Settings sheet not found.'
    );
  }

  return sheet;

}


/* =========================================================
   GENERIC SHEET DATA
========================================================= */

function sheetToObjects(sheet) {

  const values =
    sheet.getDataRange().getValues();

  if (!values.length) {
    return [];
  }

  const headers =
    values[0];

  return values
    .slice(1)
    .filter(function(row) {

      return row.some(function(value) {

        return value !== '' &&
               value !== null &&
               value !== undefined;

      });

    })
    .map(function(row) {

      const object = {};

      headers.forEach(function(header, index) {

        if (header) {

          object[String(header)] =
            row[index];

        }

      });

      return object;

    });

}


/* =========================================================
   GET SHEET HEADERS
========================================================= */

function getHeaders(sheet) {

  return sheet
    .getRange(
      1,
      1,
      1,
      sheet.getLastColumn()
    )
    .getValues()[0];

}


/* =========================================================
   COMPANIES
========================================================= */

function getCompanies() {

  return sheetToObjects(
    getCompaniesSheet()
  );

}


/* =========================================================
   PEOPLE
========================================================= */

function getPeople() {

  const people =
    sheetToObjects(
      getPeopleSheet()
    );

  return people.map(function(person) {

    const photo =
      String(
        person['Photo'] || ''
      ).trim();

    person.photoUrl =
      photo
        ? getVisitingCardUrl(photo)
        : '';

    return person;

  });

}


/* =========================================================
   SETTINGS
========================================================= */

function getSettings() {

  const sheet =
    getSettingsSheet();

  const values =
    sheet.getDataRange().getValues();

  if (!values.length) {
    return {};
  }

  const headers =
    values[0];

  const result = {};

  headers.forEach(function(header, columnIndex) {

    if (!header) {
      return;
    }

    result[String(header)] = [];

    for (
      let row = 1;
      row < values.length;
      row++
    ) {

      const value =
        values[row][columnIndex];

      if (
        value !== '' &&
        value !== null &&
        value !== undefined
      ) {

        result[String(header)].push(
          String(value)
        );

      }

    }

  });

  return result;

}


/* =========================================================
   GET COMPLETE CRM DATA
========================================================= */

function getCRMData() {

  return {

    companies:
      getCompanies(),

    people:
      getPeople(),

    settings:
      getSettings()

  };

}


/* =========================================================
   LOWEST AVAILABLE COMPANY ID
========================================================= */

function getNextCompanyId() {

  const companies =
    getCompanies();

  const used = {};

  companies.forEach(function(company) {

    const id =
      String(
        company['ID'] || ''
      ).trim();

    const match =
      id.match(/^C(\d+)$/i);

    if (match) {

      used[
        Number(match[1])
      ] = true;

    }

  });

  let number = 1;

  while (used[number]) {
    number++;
  }

  return (
    'C' +
    String(number).padStart(3, '0')
  );

}


/* =========================================================
   LOWEST AVAILABLE PERSON ID
========================================================= */

function getNextPersonId() {

  const people =
    getPeople();

  const used = {};

  people.forEach(function(person) {

    const id =
      String(
        person['ID'] || ''
      ).trim();

    const match =
      id.match(/^P(\d+)$/i);

    if (match) {

      used[
        Number(match[1])
      ] = true;

    }

  });

  let number = 1;

  while (used[number]) {
    number++;
  }

  return (
    'P' +
    String(number).padStart(3, '0')
  );

}


/* =========================================================
   FIND ROW BY ID
========================================================= */

function findRowById(
  sheet,
  id
) {

  const values =
    sheet.getDataRange().getValues();

  if (values.length < 2) {
    return -1;
  }

  const headers =
    values[0];

  const idIndex =
    headers.indexOf('ID');

  if (idIndex === -1) {

    throw new Error(
      'ID column not found in ' +
      sheet.getName()
    );

  }

  for (
    let i = 1;
    i < values.length;
    i++
  ) {

    if (
      String(values[i][idIndex]) ===
      String(id)
    ) {

      return i + 1;

    }

  }

  return -1;

}


/* =========================================================
   ADD COMPANY
========================================================= */

function addCompany(company) {

  const sheet =
    getCompaniesSheet();

  const headers =
    getHeaders(sheet);

  const companyId =
    getNextCompanyId();

  const row =
    headers.map(function(header) {

      if (header === 'ID') {
        return companyId;
      }

      if (header === 'Favorite') {

        return (
          company['Favorite'] ||
          'No'
        );

      }

      return (
        company[header] ||
        ''
      );

    });

  sheet.appendRow(row);

  return {

    success: true,

    id: companyId

  };

}


/* =========================================================
   UPDATE COMPANY
========================================================= */

function updateCompany(company) {

  const sheet =
    getCompaniesSheet();

  const rowNumber =
    findRowById(
      sheet,
      company['ID']
    );

  if (rowNumber === -1) {

    throw new Error(
      'Company not found.'
    );

  }

  const headers =
    getHeaders(sheet);

  const row =
    headers.map(function(header) {

      if (header === 'ID') {
        return company['ID'];
      }

      if (header === 'Favorite') {

        return (
          company['Favorite'] ||
          'No'
        );

      }

      return (
        company[header] ||
        ''
      );

    });

  sheet
    .getRange(
      rowNumber,
      1,
      1,
      headers.length
    )
    .setValues([row]);

  return {

    success: true

  };

}


/* =========================================================
   DELETE COMPANY
========================================================= */

function deleteCompany(companyId) {

  const companySheet =
    getCompaniesSheet();

  const peopleSheet =
    getPeopleSheet();

  const people =
    getPeople();

  const companyPeople =
    people.filter(function(person) {

      return String(
        person['Company ID']
      ) === String(
        companyId
      );

    });

  /*
     Delete visiting card images
  */

  companyPeople.forEach(function(person) {

    const photo =
      String(
        person['Photo'] || ''
      ).trim();

    if (photo) {

      try {

        deleteVisitingCard(
          photo
        );

      } catch (error) {

        console.log(
          'Photo deletion failed: ' +
          error.message
        );

      }

    }

  });


  /*
     Delete people rows
     from bottom to top
  */

  const peopleRows = [];

  companyPeople.forEach(function(person) {

    const row =
      findRowById(
        peopleSheet,
        person['ID']
      );

    if (row !== -1) {
      peopleRows.push(row);
    }

  });

  peopleRows
    .sort(function(a, b) {
      return b - a;
    })
    .forEach(function(row) {

      peopleSheet.deleteRow(row);

    });


  /*
     Delete company
  */

  const companyRow =
    findRowById(
      companySheet,
      companyId
    );

  if (companyRow === -1) {

    throw new Error(
      'Company not found.'
    );

  }

  companySheet.deleteRow(
    companyRow
  );


  return {

    success: true

  };

}


/* =========================================================
   TOGGLE FAVORITE
========================================================= */

function toggleFavorite(companyId) {

  const sheet =
    getCompaniesSheet();

  const rowNumber =
    findRowById(
      sheet,
      companyId
    );

  if (rowNumber === -1) {

    throw new Error(
      'Company not found.'
    );

  }

  const headers =
    getHeaders(sheet);

  const favoriteIndex =
    headers.indexOf(
      'Favorite'
    );

  if (favoriteIndex === -1) {

    throw new Error(
      'Favorite column not found.'
    );

  }

  const cell =
    sheet.getRange(
      rowNumber,
      favoriteIndex + 1
    );

  const current =
    String(
      cell.getValue() || ''
    )
      .trim()
      .toLowerCase();

  const newValue =
    current === 'yes'
      ? 'No'
      : 'Yes';

  cell.setValue(
    newValue
  );

  return {

    success: true,

    favorite:
      newValue

  };

}


/* =========================================================
   ADD PERSON
========================================================= */

function addPerson(
  companyId,
  person,
  imageData
) {

  const company =
    getCompanies()
      .find(function(item) {

        return String(
          item['ID']
        ) === String(
          companyId
        );

      });

  if (!company) {

    throw new Error(
      'Company not found.'
    );

  }

  const sheet =
    getPeopleSheet();

  const headers =
    getHeaders(sheet);

  const personId =
    getNextPersonId();

  let photoName = '';


  /*
     Upload visiting card
  */

  if (
    imageData &&
    imageData.base64
  ) {

    if (
      !person['Name']
    ) {

      throw new Error(
        'Contact name is required for photo upload.'
      );

    }

    photoName =
      uploadVisitingCard(
        imageData.base64,
        imageData.mimeType,
        person['Name']
      );

  }


  const row =
    headers.map(function(header) {

      if (header === 'ID') {
        return personId;
      }

      if (
        header === 'Company ID'
      ) {

        return companyId;

      }

      if (
        header === 'Photo'
      ) {

        return photoName;

      }

      return (
        person[header] ||
        ''
      );

    });

  sheet.appendRow(row);

  return {

    success: true,

    id: personId

  };

}


/* =========================================================
   UPDATE PERSON
========================================================= */

function updatePerson(
  person,
  imageData
) {

  const sheet =
    getPeopleSheet();

  const rowNumber =
    findRowById(
      sheet,
      person['ID']
    );

  if (rowNumber === -1) {

    throw new Error(
      'Contact not found.'
    );

  }

  const headers =
    getHeaders(sheet);

  const oldRow =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .getValues()[0];

  const photoIndex =
    headers.indexOf(
      'Photo'
    );

  let oldPhoto = '';

  if (photoIndex !== -1) {

    oldPhoto =
      String(
        oldRow[photoIndex] || ''
      ).trim();

  }

  let photoName =
    oldPhoto;


  /*
     Upload replacement photo
  */

  if (
    imageData &&
    imageData.base64
  ) {

    if (
      !person['Name']
    ) {

      throw new Error(
        'Contact name is required for photo upload.'
      );

    }

    photoName =
      uploadVisitingCard(
        imageData.base64,
        imageData.mimeType,
        person['Name']
      );

  }


  const row =
    headers.map(function(header) {

      if (header === 'ID') {
        return person['ID'];
      }

      if (header === 'Company ID') {
        return person['Company ID'];
      }

      if (header === 'Photo') {
        return photoName;
      }

      return (
        person[header] ||
        ''
      );

    });

  sheet
    .getRange(
      rowNumber,
      1,
      1,
      headers.length
    )
    .setValues([row]);


  /*
     Remove old image if
     a replacement was uploaded
  */

  if (
    imageData &&
    imageData.base64 &&
    oldPhoto &&
    oldPhoto !== photoName
  ) {

    try {

      deleteVisitingCard(
        oldPhoto
      );

    } catch (error) {

      console.log(
        'Old photo deletion failed: ' +
        error.message
      );

    }

  }


  return {

    success: true

  };

}


/* =========================================================
   DELETE PERSON
========================================================= */

function deletePerson(
  personId
) {

  const sheet =
    getPeopleSheet();

  const rowNumber =
    findRowById(
      sheet,
      personId
    );

  if (rowNumber === -1) {

    throw new Error(
      'Contact not found.'
    );

  }

  const headers =
    getHeaders(sheet);

  const row =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .getValues()[0];

  const photoIndex =
    headers.indexOf(
      'Photo'
    );

  if (photoIndex !== -1) {

    const photo =
      String(
        row[photoIndex] || ''
      ).trim();

    if (photo) {

      try {

        deleteVisitingCard(
          photo
        );

      } catch (error) {

        console.log(
          'Photo deletion failed: ' +
          error.message
        );

      }

    }

  }

  sheet.deleteRow(
    rowNumber
  );

  return {

    success: true

  };

}