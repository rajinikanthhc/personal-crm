/* =========================================================
   PERSONAL CRM
   GITHUB VISITING CARD STORAGE
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
      'GITHUB_TOKEN is not configured in Script Properties.'
    );

  }

  return token;

}


/* =========================================================
   CREATE FILE NAME
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

  } else if (
    mimeType ===
    'image/webp'
  ) {

    extension =
      '.webp';

  }

  return (
    cleanName +
    extension
  );

}


/* =========================================================
   GITHUB API URL
========================================================= */

function getGitHubFileUrl(
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
   UPLOAD VISITING CARD
========================================================= */

function uploadVisitingCard(
  base64,
  mimeType,
  contactName
) {

  const token =
    getGitHubToken();

  const fileName =
    createPhotoFileName(
      contactName,
      mimeType
    );

  const apiUrl =
    getGitHubFileUrl(
      fileName
    );


  /*
     Check existing file
  */

  let sha = null;

  const checkResponse =
    UrlFetchApp.fetch(
      apiUrl +
      '?ref=' +
      encodeURIComponent(
        GITHUB_BRANCH
      ),
      {

        method: 'get',

        headers: {

          Authorization:
            'Bearer ' + token,

          Accept:
            'application/vnd.github+json'

        },

        muteHttpExceptions:
          true

      }
    );


  if (
    checkResponse
      .getResponseCode() ===
    200
  ) {

    const existing =
      JSON.parse(
        checkResponse
          .getContentText()
      );

    sha =
      existing.sha;

  }


  const payload = {

    message:
      'Visiting card - ' +
      fileName,

    content:
      base64,

    branch:
      GITHUB_BRANCH

  };


  if (sha) {
    payload.sha =
      sha;
  }


  const response =
    UrlFetchApp.fetch(
      apiUrl,
      {

        method: 'put',

        contentType:
          'application/json',

        headers: {

          Authorization:
            'Bearer ' + token,

          Accept:
            'application/vnd.github+json'

        },

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true

      }
    );


  const code =
    response.getResponseCode();


  if (
    code !== 200 &&
    code !== 201
  ) {

    throw new Error(
      'GitHub upload failed: ' +
      response.getContentText()
    );

  }


  /*
     IMPORTANT:
     Only filename goes to Sheet
  */

  return fileName;

}


/* =========================================================
   DELETE VISITING CARD
========================================================= */

function deleteVisitingCard(
  fileName
) {

  if (!fileName) {
    return;
  }

  const token =
    getGitHubToken();

  const apiUrl =
    getGitHubFileUrl(
      fileName
    );


  const checkResponse =
    UrlFetchApp.fetch(
      apiUrl +
      '?ref=' +
      encodeURIComponent(
        GITHUB_BRANCH
      ),
      {

        method: 'get',

        headers: {

          Authorization:
            'Bearer ' + token,

          Accept:
            'application/vnd.github+json'

        },

        muteHttpExceptions:
          true

      }
    );


  if (
    checkResponse
      .getResponseCode() !==
    200
  ) {

    return;

  }


  const existing =
    JSON.parse(
      checkResponse
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

        method: 'delete',

        contentType:
          'application/json',

        headers: {

          Authorization:
            'Bearer ' + token,

          Accept:
            'application/vnd.github+json'

        },

        payload:
          JSON.stringify(
            payload
          ),

        muteHttpExceptions:
          true

      }
    );


  if (
    response.getResponseCode() !==
    200
  ) {

    throw new Error(
      'GitHub delete failed: ' +
      response.getContentText()
    );

  }

}


/* =========================================================
   PUBLIC IMAGE URL
========================================================= */

function getVisitingCardUrl(
  fileName
) {

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