# REST Firebase

[![Build Status](https://travis-ci.org/dinoboff/rest-firebase.svg?branch=master)](https://travis-ci.org/dinoboff/rest-firebase)

REST client for Firebase. Mainly use for e2e tests when you might need to send
concurrent requests from different users.

Note that if the oauth token enable debugging, the firebase rules debug message
will be logged.


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
ref.get({shallow: true}).then(value => {
  // do something with value
});
```
