/* =========================================================
   PERSONAL CRM
   GITHUB VISITING CARD STORAGE
========================================================= */


/* =========================================================
   GITHUB CONFIGURATION
========================================================= */

const GITHUB_OWNER =
  'rajinikanthhc';

const GITHUB_REPO =
  'images';

const GITHUB_FOLDER =
  'visiting-cards';

const GITHUB_BRANCH =
  'main';


/* =========================================================
   GET GITHUB TOKEN
========================================================= */

function getGitHubToken() {

  const token =
    PropertiesService
      .getScriptProperties()
      .getProperty(
        'GITHUB_TOKEN'
      );


  if (!token) {

    throw new Error(
      'GITHUB_TOKEN is not configured in Apps Script Project Settings → Script Properties.'
    );

  }


  return token;

}


/* =========================================================
   CREATE SAFE FILE NAME
========================================================= */

function createPhotoFileName(
  name,
  mimeType
) {

  let cleanName =
    String(
      name || 'Visiting_Card'
    )
      .trim()
      .replace(
        /\s+/g,
        '_'
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      );


  if (!cleanName) {

    cleanName =
      'Visiting_Card';

  }


  let extension =
    '.jpg';


  if (
    mimeType ===
    'image/png'
  ) {

    extension =
      '.png';

  }

  else if (
    mimeType ===
    'image/webp'
  ) {

    extension =
      '.webp';

  }

  else if (
    mimeType ===
    'image/jpeg'
  ) {

    extension =
      '.jpg';

  }


  return (
    cleanName +
    extension
  );

}


/* =========================================================
   BUILD GITHUB API URL
========================================================= */

function getGitHubFileApiUrl(
  fileName
) {

  return (
    'https://api.github.com/repos/' +
    GITHUB_OWNER +
    '/' +
    GITHUB_REPO +
    '/contents/' +
    encodeURIComponent(
      GITHUB_FOLDER
    ) +
    '/' +
    encodeURIComponent(
      fileName
    )
  );

}


/* =========================================================
   COMMON GITHUB HEADERS
========================================================= */

function getGitHubHeaders() {

  return {

    Authorization:
      'Bearer ' +
      getGitHubToken(),

    Accept:
      'application/vnd.github+json',

    'X-GitHub-Api-Version':
      '2022-11-28'

  };

}


/* =========================================================
   UPLOAD / REPLACE VISITING CARD
========================================================= */

function uploadVisitingCard(
  base64,
  mimeType,
  contactName
) {

  if (!base64) {

    throw new Error(
      'Visiting card image is empty.'
    );

  }


  if (!contactName) {

    throw new Error(
      'Contact name is required for the visiting card image.'
    );

  }


  const fileName =
    createPhotoFileName(
      contactName,
      mimeType
    );


  const apiUrl =
    getGitHubFileApiUrl(
      fileName
    );


  const payload = {

    message:
      'Update visiting card - ' +
      fileName,

    content:
      base64,

    branch:
      GITHUB_BRANCH

  };


  /*
     Check whether file already exists.
  */

  let existingSha =
    null;


  try {

    const existingResponse =
      UrlFetchApp.fetch(
        apiUrl +
        '?ref=' +
        encodeURIComponent(
          GITHUB_BRANCH
        ),
        {

          method:
            'get',

          headers:
            getGitHubHeaders(),

          muteHttpExceptions:
            true

        }
      );


    if (
      existingResponse
        .getResponseCode() ===
      200
    ) {

      const existing =
        JSON.parse(
          existingResponse
            .getContentText()
        );


      existingSha =
        existing.sha;

    }

  }

  catch (error) {

    console.log(
      'Existing GitHub file check failed: ' +
      error.message
    );

  }


  if (existingSha) {

    payload.sha =
      existingSha;

  }


  /*
     Upload.
  */

  const response =
    UrlFetchApp.fetch(
      apiUrl,
      {

        method:
          'put',

        contentType:
          'application/json',

        headers:
          getGitHubHeaders(),

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true

      }
    );


  const responseCode =
    response.getResponseCode();


  if (
    responseCode !== 200 &&
    responseCode !== 201
  ) {

    throw new Error(
      'GitHub upload failed (' +
      responseCode +
      '): ' +
      response.getContentText()
    );

  }


  /*
     IMPORTANT:
     This function returns the actual GitHub
     filename internally.

     Code.gs stores ONLY the contact name
     in the Photo column.
  */

  return fileName;

}


/* =========================================================
   FIND FILE FROM PERSON NAME
========================================================= */

function findVisitingCardFile(
  photoValue
) {

  if (!photoValue) {
    return '';
  }


  const value =
    String(
      photoValue
    ).trim();


  if (!value) {
    return '';
  }


  /*
     If Photo already contains a filename,
     support it for older records.
  */

  if (
    /\.(jpg|jpeg|png|webp)$/i
      .test(value)
  ) {

    return value;

  }


  /*
     Photo column normally contains:
     
     Sandeep M D

     Convert to:
     
     Sandeep_M_D
  */

  const baseName =
    value
      .replace(
        /\s+/g,
        '_'
      )
      .replace(
        /[^a-zA-Z0-9_-]/g,
        ''
      );


  if (!baseName) {
    return '';
  }


  const extensions = [

    '.jpg',
    '.jpeg',
    '.png',
    '.webp'

  ];


  /*
     Find which extension exists.
  */

  for (
    let i = 0;
    i < extensions.length;
    i++
  ) {

    const candidate =
      baseName +
      extensions[i];


    try {

      const response =
        UrlFetchApp.fetch(
          getGitHubFileApiUrl(
            candidate
          ) +
          '?ref=' +
          encodeURIComponent(
            GITHUB_BRANCH
          ),
          {

            method:
              'get',

            headers:
              getGitHubHeaders(),

            muteHttpExceptions:
              true

          }
        );


      if (
        response
          .getResponseCode() ===
        200
      ) {

        return candidate;

      }

    }

    catch (error) {

      console.log(
        'GitHub image check failed: ' +
        error.message
      );

    }

  }


  return '';

}


/* =========================================================
   GET VISITING CARD URL BY PHOTO VALUE
========================================================= */

function getVisitingCardUrl(
  photoValue
) {

  if (!photoValue) {
    return '';
  }


  const fileName =
    findVisitingCardFile(
      photoValue
    );


  if (!fileName) {
    return '';
  }


  return (
    'https://raw.githubusercontent.com/' +
    GITHUB_OWNER +
    '/' +
    GITHUB_REPO +
    '/' +
    GITHUB_BRANCH +
    '/' +
    GITHUB_FOLDER +
    '/' +
    encodeURIComponent(
      fileName
    )
  );

}


/* =========================================================
   DELETE VISITING CARD
========================================================= */

function deleteVisitingCard(
  photoValue
) {

  if (!photoValue) {
    return;
  }


  const fileName =
    findVisitingCardFile(
      photoValue
    );


  if (!fileName) {
    return;
  }


  const apiUrl =
    getGitHubFileApiUrl(
      fileName
    );


  const existingResponse =
    UrlFetchApp.fetch(
      apiUrl +
      '?ref=' +
      encodeURIComponent(
        GITHUB_BRANCH
      ),
      {

        method:
          'get',

        headers:
          getGitHubHeaders(),

        muteHttpExceptions:
          true

      }
    );


  const responseCode =
    existingResponse
      .getResponseCode();


  if (
    responseCode === 404
  ) {

    return;

  }


  if (
    responseCode !== 200
  ) {

    throw new Error(
      'Unable to find GitHub visiting card: ' +
      existingResponse.getContentText()
    );

  }


  const existing =
    JSON.parse(
      existingResponse
        .getContentText()
    );


  const payload = {

    message:
      'Delete visiting card - ' +
      fileName,

    sha:
      existing.sha,

    branch:
      GITHUB_BRANCH

  };


  const response =
    UrlFetchApp.fetch(
      apiUrl,
      {

        method:
          'delete',

        contentType:
          'application/json',

        headers:
          getGitHubHeaders(),

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true

      }
    );


  const deleteCode =
    response.getResponseCode();


  if (
    deleteCode !== 200
  ) {

    throw new Error(
      'GitHub delete failed (' +
      deleteCode +
      '): ' +
      response.getContentText()
    );

  }

}


/* =========================================================
   AUTHORIZE GITHUB
========================================================= */

function authorizeGitHub() {

  const response =
    UrlFetchApp.fetch(
      'https://api.github.com',
      {

        method:
          'get',

        headers: {

          Accept:
            'application/vnd.github+json'

        },

        muteHttpExceptions:
          true

      }
    );


  console.log(
    'GitHub authorization successful. HTTP ' +
    response.getResponseCode()
  );

}