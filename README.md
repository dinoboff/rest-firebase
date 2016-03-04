# REST Firebase

REST client for Firebase. Mainly use for e2e tests when you might need to send
concurrent requests from different users.

## Install

```
npm install rest-firebase
```

## Usage

```
const restFirebase = require('rest-firebase');
const firebase = restFirebase.factory('some-id');
const ref = firebase({paths: 'some/path', auth: 'some-oauth-token'});

// ref.toString() === 'https://some-id.firebaseio.com/some/path.json'

// you can pass parameters
// (see https://www.firebase.com/docs/rest/api/#section-query-parameters)
ref.get({shallow: true}).then(
  resp => {
    // Access the value with `resp.body`,
    // and the firebase rules debug message (when enabled) with `resp.authDebug`
  },
  err => {
    // Access the firebase rules debug message (when enabled) with `err.authDebug`
  }
);
```
