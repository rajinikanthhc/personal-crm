/* =========================================================
   PERSONAL CRM
   BACKEND
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
   INCLUDE FILE
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
   COMPANIES SHEET
========================================================= */

function getCompaniesSheet() {

  const sheet =
    getSpreadsheet()
      .getSheetByName('Companies');

  if (!sheet) {

    throw new Error(
      'Companies sheet not found.'
    );

  }

  return sheet;

}


/* =========================================================
   GET COMPANIES
========================================================= */

function getCompanies() {

  const sheet =
    getCompaniesSheet();

  const values =
    sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return [];
  }

  const headers =
    values[0];

  return values
    .slice(1)
    .filter(row =>
      row.some(value => value !== '')
    )
    .map(row => {

      const company = {};

      headers.forEach(
        (header, index) => {

          if (!header) {
            return;
          }

          company[header] =
            row[index];

        }
      );

      return company;

    });

}


/* =========================================================
   GET SETTINGS
========================================================= */

function getSettings() {

  const sheet =
    getSpreadsheet()
      .getSheetByName('Settings');

  if (!sheet) {

    throw new Error(
      'Settings sheet not found.'
    );

  }

  const values =
    sheet.getDataRange().getValues();

  if (values.length <= 1) {
    return {};
  }

  const headers =
    values[0];

  const result = {};

  headers.forEach(
    (header, columnIndex) => {

      if (!header) {
        return;
      }

      result[header] = [];

      for (
        let rowIndex = 1;
        rowIndex < values.length;
        rowIndex++
      ) {

        const value =
          values[rowIndex][columnIndex];

        if (
          value !== '' &&
          value !== null &&
          value !== undefined
        ) {

          result[header]
            .push(String(value));

        }

      }

    }
  );

  return result;

}


/* =========================================================
   GET ALL CRM DATA
========================================================= */

function getCRMData() {

  return {

    companies:
      getCompanies(),

    settings:
      getSettings()

  };

}


/* =========================================================
   GENERATE LOWEST AVAILABLE ID
========================================================= */

function getNextCompanyId() {

  const companies =
    getCompanies();

  const usedNumbers = [];

  companies.forEach(
    company => {

      const id =
        String(
          company['ID'] || ''
        );

      const match =
        id.match(/^C(\d+)$/i);

      if (match) {

        usedNumbers.push(
          Number(match[1])
        );

      }

    }
  );

  let number = 1;

  while (
    usedNumbers.includes(number)
  ) {

    number++;

  }

  return (
    'C' +
    String(number)
      .padStart(3, '0')
  );

}


/* =========================================================
   GET HEADERS
========================================================= */

function getCompanyHeaders() {

  const sheet =
    getCompaniesSheet();

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
   FIND ROW BY ID
========================================================= */

function findCompanyRow(companyId) {

  const sheet =
    getCompaniesSheet();

  const data =
    sheet.getDataRange().getValues();

  if (data.length === 0) {
    return -1;
  }

  const headers =
    data[0];

  const idIndex =
    headers.indexOf('ID');

  if (idIndex === -1) {

    throw new Error(
      'ID column not found.'
    );

  }

  for (
    let i = 1;
    i < data.length;
    i++
  ) {

    if (
      String(data[i][idIndex]) ===
      String(companyId)
    ) {

      return i + 1;

    }

  }

  return -1;

}


/* =========================================================
   ADD COMPANY
========================================================= */

function addCompany(
  company,
  imageData
) {

  const sheet =
    getCompaniesSheet();

  const headers =
    getCompanyHeaders();

  const companyId =
    getNextCompanyId();


  /*
     Photo column stores ONLY contact name.
     Example:
     Sandeep M D

     GitHub stores:
     Sandeep_M_D.jpg
  */

  let photoValue =
    String(
      company['Photo'] || ''
    ).trim();


  /* -------------------------------------------------------
     UPLOAD NEW VISITING CARD
  ------------------------------------------------------- */

  if (
    imageData &&
    imageData.base64
  ) {

    const contactName =
      String(
        company['Name'] ||
        company['Company Name'] ||
        ''
      ).trim();


    uploadVisitingCard(
      imageData.base64,
      imageData.mimeType,
      contactName
    );


    photoValue =
      contactName;

  }


  /* -------------------------------------------------------
     CREATE ROW
  ------------------------------------------------------- */

  const row =
    headers.map(header => {

      if (header === 'ID') {

        return companyId;

      }


      if (header === 'Favorite') {

        return (
          company['Favorite'] ||
          'No'
        );

      }


      if (header === 'Photo') {

        return photoValue;

      }


      /*
         IMPORTANT:
         Every field is copied directly from
         the submitted company object.
      */

      return (
        company[header] !== undefined &&
        company[header] !== null
          ? company[header]
          : ''
      );

    });


  sheet.appendRow(row);


  return {

    success: true,

    message:
      'Company added successfully.',

    id:
      companyId

  };

}


/* =========================================================
   UPDATE COMPANY
========================================================= */

function updateCompany(
  company,
  imageData
) {

  const sheet =
    getCompaniesSheet();

  const rowNumber =
    findCompanyRow(
      company['ID']
    );

  if (rowNumber === -1) {

    throw new Error(
      'Company not found.'
    );

  }


  const headers =
    getCompanyHeaders();


  /*
     Read current row first.
     This prevents existing information
     from being accidentally lost.
  */

  const currentRow =
    sheet
      .getRange(
        rowNumber,
        1,
        1,
        headers.length
      )
      .getValues()[0];


  const currentCompany = {};


  headers.forEach(
    (header, index) => {

      currentCompany[header] =
        currentRow[index];

    }
  );


  let photoValue =
    String(
      currentCompany['Photo'] || ''
    ).trim();


  /*
     If a new image is selected,
     upload it and store ONLY the
     contact name in Photo column.
  */

  if (
    imageData &&
    imageData.base64
  ) {

    const oldPhoto =
      photoValue;


    const contactName =
      String(
        company['Name'] ||
        company['Company Name'] ||
        ''
      ).trim();


    uploadVisitingCard(
      imageData.base64,
      imageData.mimeType,
      contactName
    );


    photoValue =
      contactName;


    /*
       If contact name changed and there was
       an old visiting card, remove the old one.
    */

    if (
      oldPhoto &&
      oldPhoto !== photoValue
    ) {

      try {

        deleteVisitingCard(
          oldPhoto
        );

      }

      catch (error) {

        console.log(
          'Old visiting card deletion failed: ' +
          error.message
        );

      }

    }

  }


  /*
     If no new image was selected,
     keep existing photo.
  */

  const row =
    headers.map(
      (header, index) => {

        if (header === 'ID') {

          return company['ID'];

        }


        if (header === 'Photo') {

          return photoValue;

        }


        if (header === 'Favorite') {

          return (
            company['Favorite'] ||
            currentCompany['Favorite'] ||
            'No'
          );

        }


        /*
           IMPORTANT:
           Only replace with submitted value.
           Empty values are intentionally allowed.
        */

        if (
          company[header] !== undefined &&
          company[header] !== null
        ) {

          return company[header];

        }


        /*
           If the field isn't supplied,
           preserve the existing value.
        */

        return currentCompany[header] || '';

      }
    );


  sheet
    .getRange(
      rowNumber,
      1,
      1,
      headers.length
    )
    .setValues([row]);


  return {

    success: true,

    message:
      'Company updated successfully.'

  };

}


/* =========================================================
   DELETE COMPANY
========================================================= */

function deleteCompany(
  companyId
) {

  const sheet =
    getCompaniesSheet();

  const rowNumber =
    findCompanyRow(
      companyId
    );

  if (rowNumber === -1) {

    throw new Error(
      'Company not found.'
    );

  }


  const headers =
    getCompanyHeaders();


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
    headers.indexOf('Photo');


  const photoValue =
    photoIndex >= 0
      ? String(
          row[photoIndex] || ''
        ).trim()
      : '';


  /*
     Delete spreadsheet row first.
  */

  sheet.deleteRow(
    rowNumber
  );


  /*
     Delete GitHub visiting card.
  */

  if (photoValue) {

    try {

      deleteVisitingCard(
        photoValue
      );

    }

    catch (error) {

      console.log(
        'Photo deletion failed: ' +
        error.message
      );

    }

  }


  return {

    success: true,

    message:
      'Company deleted successfully.'

  };

}


/* =========================================================
   TOGGLE FAVORITE
========================================================= */

function toggleFavorite(
  companyId
) {

  const sheet =
    getCompaniesSheet();

  const rowNumber =
    findCompanyRow(
      companyId
    );

  if (rowNumber === -1) {

    throw new Error(
      'Company not found.'
    );

  }


  const headers =
    getCompanyHeaders();

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
      cell.getValue()
    ).toLowerCase();


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