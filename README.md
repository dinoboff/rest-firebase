# REST Firebase

[![Build Status](https://travis-ci.org/dinoboff/rest-firebase.svg?branch=master)](https://travis-ci.org/dinoboff/rest-firebase)

REST client for Firebase. Mainly use for e2e tests when you might need to send
concurrent requests from different users.

Note that if the oauth token enable debugging, the firebase rules debug message
will be logged.


## Install

```bash
npm install rest-firebase
```

## Usage

```javascript
const restFirebase = require('rest-firebase');
const firebase = restFirebase.factory('some-id');
const ref = firebase({paths: 'some/path', auth: 'some-oauth-token'});

// ref.toString() === 'https://some-id.firebaseio.com/some/path.json'

// you can pass parameters
// (see https://www.firebase.com/docs/rest/api/#section-query-parameters)
ref.get({shallow: true}).then(value => {
  // do something with value
}).then(
  // Set value of the branch
  () => ref.set({foo: 1})
).then(
  // patch some children of the branch
  () => ref.update({bar: 2})
).then(
  // push new child
  ()=> ref.push(3)
).then(
  // delete branch
  () => ref.remove()
);
```

It can also be used to retrieve or set the DB security rules:
```javascript
const restFirebase = require('rest-firebase');
const firebase = restFirebase.factory('some-id');
const ref = firebase({paths: 'some/path', auth: 'firebase-secret...'});
const newRules = '{"rules": {}}';


ref.rules().then(
  rules => console.log('old rules: %s', rules)
).then(
  () => ref.rules(newRules)
)
```
